import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

interface UseMouseInteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null;
  enabled: boolean;
  onBodyCreate: (params: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    mass: number;
  }) => void;
  onBodySelect?: (bodyId: string | null) => void;
  defaultMass: number;
}

export function useMouseInteraction({
  canvasRef,
  camera,
  scene,
  enabled,
  onBodyCreate,
  onBodySelect,
  defaultMass,
}: UseMouseInteractionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPointRef = useRef<THREE.Vector3 | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const velocityArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const previewSphereRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const wasDraggingRef = useRef(false);
  const [isOverBody, setIsOverBody] = useState(false);

  // Zwiększ threshold dla łatwiejszego klikania w ciała
  useEffect(() => {
    raycasterRef.current.params.Points = { threshold: 2 };
  }, []);

  // Konwersja współrzędnych 2D (ekran) -> 3D (świat)
  const screenTo3D = useCallback(
    (screenX: number, screenY: number): THREE.Vector3 | null => {
      if (!camera || !canvasRef.current) return null;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Normalized device coordinates (-1 to +1)
      const x = ((screenX - rect.left) / rect.width) * 2 - 1;
      const y = -((screenY - rect.top) / rect.height) * 2 + 1;

      // Rzutowanie na płaszczyznę z=0
      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Płaszczyzna prostopadła do kamery, przechodząca przez (0,0,0)
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersect = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, intersect);

      return intersect;
    },
    [camera, canvasRef]
  );

  // Mouse down - rozpocznij przeciąganie
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Sprawdź czy kliknięto na ciało - jeśli tak, NIE rozpoczynaj przeciągania
      const bodies = scene.children.filter(
        (obj) => obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry
      );

      const intersects = raycasterRef.current.intersectObjects(bodies, false);

      // Jeśli kliknięto na ciało, nie rozpoczynaj przeciągania
      if (intersects.length > 0) {
        return;
      }

      // Sprawdź także odległość do ciał
      const ray = raycasterRef.current.ray;
      for (const body of bodies) {
        const mesh = body as THREE.Mesh;
        const distance = ray.distanceToPoint(mesh.position);
        const radius = (mesh.geometry as THREE.SphereGeometry).parameters.radius;

        if (distance < radius * 2.5) {
          return; // Kliknięto blisko ciała, nie rozpoczynaj przeciągania
        }
      }

      const position = screenTo3D(event.clientX, event.clientY);
      if (!position) return;

      setIsDragging(true);
      wasDraggingRef.current = false; // Reset flagi
      startPointRef.current = position;
      startPositionRef.current = { x: event.clientX, y: event.clientY };

      // Wizualizacja punktu startowego
      const geometry = new THREE.SphereGeometry(0.5, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
      });
      previewSphereRef.current = new THREE.Mesh(geometry, material);
      previewSphereRef.current.position.copy(position);
      scene.add(previewSphereRef.current);
    },
    [enabled, camera, scene, screenTo3D, canvasRef]
  );

  // Mouse move - pokazuj prędkość
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !startPointRef.current || !scene || !camera) return;

      wasDraggingRef.current = true; // Oznacz że nastąpił ruch

      const currentPoint = screenTo3D(event.clientX, event.clientY);
      if (!currentPoint) return;

      // Oblicz wektor prędkości
      const velocityVector = new THREE.Vector3()
        .subVectors(currentPoint, startPointRef.current)
        .multiplyScalar(2); // Skalowanie dla lepszej wizualizacji

      // Usuń stary arrow
      if (velocityArrowRef.current) {
        scene.remove(velocityArrowRef.current);
        velocityArrowRef.current.dispose();
      }

      // Stwórz nowy arrow
      if (velocityVector.length() > 0.1) {
        const direction = velocityVector.clone().normalize();
        const length = Math.min(velocityVector.length(), 20);

        velocityArrowRef.current = new THREE.ArrowHelper(
          direction,
          startPointRef.current,
          length,
          0x00ff00,
          length * 0.2,
          length * 0.15
        );
        scene.add(velocityArrowRef.current);
      }
    },
    [isDragging, scene, camera, screenTo3D]
  );

  // Mouse up - stwórz ciało
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !startPointRef.current || !scene) return;

      const endPoint = screenTo3D(event.clientX, event.clientY);

      if (endPoint) {
        // Oblicz prędkość początkową
        const velocity = new THREE.Vector3()
          .subVectors(endPoint, startPointRef.current)
          .multiplyScalar(2);

        // Stwórz ciało
        onBodyCreate({
          position: startPointRef.current.clone(),
          velocity,
          mass: defaultMass,
        });
      }

      // Cleanup
      setIsDragging(false);
      startPointRef.current = null;
      startPositionRef.current = null;

      // Usuń wizualizacje
      if (previewSphereRef.current) {
        scene.remove(previewSphereRef.current);
        previewSphereRef.current.geometry.dispose();
        (previewSphereRef.current.material as THREE.Material).dispose();
        previewSphereRef.current = null;
      }

      if (velocityArrowRef.current) {
        scene.remove(velocityArrowRef.current);
        velocityArrowRef.current.dispose();
        velocityArrowRef.current = null;
      }
    },
    [isDragging, scene, onBodyCreate, defaultMass, screenTo3D]
  );

  // Single click - select body or deselect
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene || !onBodySelect) return;

      // Nie obsługuj kliknięcia jeśli było przeciąganie
      if (wasDraggingRef.current) {
        wasDraggingRef.current = false;
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Znajdź wszystkie meshe w scenie (wykluczając trails i pomocnicze obiekty)
      const bodies = scene.children.filter(
        (obj) => obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry
      );

      const intersects = raycasterRef.current.intersectObjects(bodies, false);

      if (intersects.length > 0) {
        // Kliknięto na ciało - znajdź jego ID
        const clickedMesh = intersects[0].object;
        // ID ciała jest przechowywane w userData meshu
        const bodyId = clickedMesh.userData.bodyId;
        if (bodyId) {
          onBodySelect(bodyId);
        }
      } else {
        // Kliknięto poza ciałem - zamknij edytor
        onBodySelect(null);
      }
    },
    [enabled, camera, scene, onBodySelect, canvasRef]
  );

  // Double click - create stationary body
  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Sprawdź czy kliknięto na ciało - jeśli tak, NIE twórz nowego ciała
      const bodies = scene.children.filter(
        (obj) => obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry
      );

      const intersects = raycasterRef.current.intersectObjects(bodies, false);

      // Jeśli kliknięto na ciało, przerwij
      if (intersects.length > 0) {
        return;
      }

      // Sprawdź także odległość do ciał (zwiększony obszar)
      const ray = raycasterRef.current.ray;
      for (const body of bodies) {
        const mesh = body as THREE.Mesh;
        const distance = ray.distanceToPoint(mesh.position);
        const radius = (mesh.geometry as THREE.SphereGeometry).parameters.radius;

        if (distance < radius * 2.5) {
          return; // Kliknięto blisko ciała, nie twórz nowego
        }
      }

      const position = screenTo3D(event.clientX, event.clientY);
      if (!position) return;

      // Stwórz nieruchome ciało (velocity = 0)
      onBodyCreate({
        position,
        velocity: new THREE.Vector3(0, 0, 0),
        mass: defaultMass,
      });
    },
    [enabled, camera, scene, onBodyCreate, defaultMass, screenTo3D, canvasRef]
  );

  // Hover detection - check if mouse is over a body
  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !camera || !scene || isDragging) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Zwiększ threshold dla łatwiejszego wykrywania
      const bodies = scene.children.filter(
        (obj) => obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry
      );

      const intersects = raycasterRef.current.intersectObjects(bodies, false);

      // Dodaj większy margines wykrywania poprzez sprawdzenie odległości do środka kuli
      let foundBody = false;
      if (intersects.length > 0) {
        foundBody = true;
      } else {
        // Sprawdź czy kursor jest blisko któregoś ciała
        const ray = raycasterRef.current.ray;
        for (const body of bodies) {
          const mesh = body as THREE.Mesh;
          const distance = ray.distanceToPoint(mesh.position);
          const radius = (mesh.geometry as THREE.SphereGeometry).parameters.radius;

          // Zwiększony obszar wykrywania (2x większy niż faktyczny promień)
          if (distance < radius * 2.5) {
            foundBody = true;
            break;
          }
        }
      }

      setIsOverBody(foundBody);
    },
    [enabled, camera, scene, isDragging, canvasRef]
  );

  // Podłącz event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('mousemove', handleHover);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('mousemove', handleHover);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    canvasRef,
    enabled,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDoubleClick,
    handleHover,
  ]);

  // Cleanup przy unmount
  useEffect(() => {
    return () => {
      if (scene) {
        if (previewSphereRef.current) {
          scene.remove(previewSphereRef.current);
          previewSphereRef.current.geometry.dispose();
          (previewSphereRef.current.material as THREE.Material).dispose();
        }
        if (velocityArrowRef.current) {
          scene.remove(velocityArrowRef.current);
          velocityArrowRef.current.dispose();
        }
      }
    };
  }, [scene]);

  return { isDragging, isOverBody };
}
