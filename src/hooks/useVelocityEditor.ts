import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { Body } from '../types';

interface UseVelocityEditorProps {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  body: Body | null;
  isEditing: boolean;
  onVelocityChange: (velocity: THREE.Vector3) => void;
}

export function useVelocityEditor({
  scene,
  camera,
  canvasRef,
  body,
  isEditing,
  onVelocityChange,
}: UseVelocityEditorProps) {
  const velocityArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowEndSphereRef = useRef<THREE.Mesh | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverHandle, setIsOverHandle] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());

  // Stwórz lub zaktualizuj arrow - teraz widoczny zawsze gdy body istnieje
  useEffect(() => {
    if (!scene || !body) {
      // Usuń arrow jeśli istnieje
      if (velocityArrowRef.current) {
        scene?.remove(velocityArrowRef.current);
        velocityArrowRef.current.dispose();
        velocityArrowRef.current = null;
      }
      if (arrowEndSphereRef.current) {
        scene?.remove(arrowEndSphereRef.current);
        arrowEndSphereRef.current.geometry.dispose();
        (arrowEndSphereRef.current.material as THREE.Material).dispose();
        arrowEndSphereRef.current = null;
      }
      return;
    }

    // Usuń stary arrow
    if (velocityArrowRef.current) {
      scene.remove(velocityArrowRef.current);
      velocityArrowRef.current.dispose();
    }
    if (arrowEndSphereRef.current) {
      scene.remove(arrowEndSphereRef.current);
      arrowEndSphereRef.current.geometry.dispose();
      (arrowEndSphereRef.current.material as THREE.Material).dispose();
    }

    // Stwórz nowy arrow
    const velocity = body.velocity.clone();
    const length = velocity.length();

    if (length > 0.01) {
      const direction = velocity.clone().normalize();
      const arrowLength = Math.max(length, 1); // Minimum 1 dla widoczności

      velocityArrowRef.current = new THREE.ArrowHelper(
        direction,
        body.position.clone(),
        arrowLength,
        0x00ff00, // Zielony
        arrowLength * 0.2,
        arrowLength * 0.15
      );
      scene.add(velocityArrowRef.current);

      // Dodaj sferę na końcu dla łatwiejszego chwytania (widoczna tylko w trybie edycji)
      const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7,
      });
      arrowEndSphereRef.current = new THREE.Mesh(sphereGeometry, sphereMaterial);
      const endPosition = body.position.clone().add(velocity);
      arrowEndSphereRef.current.position.copy(endPosition);
      arrowEndSphereRef.current.userData.isVelocityHandle = true;

      // Sfera widoczna tylko w trybie edycji myszką
      arrowEndSphereRef.current.visible = isEditing;
      scene.add(arrowEndSphereRef.current);
    }
  }, [scene, body, isEditing]);

  // Aktualizuj widoczność sfery gdy zmienia się tryb edycji
  useEffect(() => {
    if (arrowEndSphereRef.current) {
      arrowEndSphereRef.current.visible = isEditing;
    }
  }, [isEditing]);

  // Aktualizuj arrow podczas symulacji
  useEffect(() => {
    if (!scene || !body || !velocityArrowRef.current || isDragging) return;

    const updateArrow = () => {
      if (!velocityArrowRef.current || !arrowEndSphereRef.current || !body) return;

      const velocity = body.velocity.clone();
      const length = velocity.length();

      if (length > 0.01) {
        const direction = velocity.clone().normalize();
        const arrowLength = Math.max(length, 1);

        // Aktualizuj pozycję arrow
        velocityArrowRef.current.position.copy(body.position);
        velocityArrowRef.current.setDirection(direction);
        velocityArrowRef.current.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.15);

        // Aktualizuj pozycję sfery
        const endPosition = body.position.clone().add(velocity);
        arrowEndSphereRef.current.position.copy(endPosition);
      }
    };

    const interval = setInterval(updateArrow, 50); // Update co 50ms

    return () => clearInterval(interval);
  }, [scene, body, isDragging]);

  // Konwersja współrzędnych 2D (ekran) -> 3D (świat)
  const screenTo3D = useCallback(
    (screenX: number, screenY: number): THREE.Vector3 | null => {
      if (!camera || !canvasRef.current) return null;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const x = ((screenX - rect.left) / rect.width) * 2 - 1;
      const y = -((screenY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Płaszczyzna prostopadła do kamery, przechodząca przez pozycję ciała
      if (!body) return null;

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -body.position.z);
      const intersect = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, intersect);

      return intersect;
    },
    [camera, canvasRef, body]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!isEditing || !camera || !scene || !body || !arrowEndSphereRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      // Sprawdź czy kliknięto na sferę uchwytu
      const intersects = raycasterRef.current.intersectObject(arrowEndSphereRef.current);

      if (intersects.length > 0) {
        setIsDragging(true);
        event.stopPropagation();
      }
    },
    [isEditing, camera, scene, body, canvasRef]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !body) return;

      const newPosition = screenTo3D(event.clientX, event.clientY);
      if (!newPosition) return;

      // Oblicz nową prędkość jako wektor od pozycji ciała do pozycji kursora
      const newVelocity = new THREE.Vector3().subVectors(newPosition, body.position);

      // Aktualizuj wektor
      onVelocityChange(newVelocity);

      // Aktualizuj wizualizację
      if (velocityArrowRef.current && arrowEndSphereRef.current) {
        const length = newVelocity.length();
        if (length > 0.01) {
          const direction = newVelocity.clone().normalize();
          const arrowLength = Math.max(length, 1);

          velocityArrowRef.current.position.copy(body.position);
          velocityArrowRef.current.setDirection(direction);
          velocityArrowRef.current.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.15);

          arrowEndSphereRef.current.position.copy(newPosition);
        }
      }
    },
    [isDragging, body, screenTo3D, onVelocityChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Hover detection dla uchwytu (tylko w trybie edycji)
  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (
        !isEditing ||
        !camera ||
        !arrowEndSphereRef.current ||
        !arrowEndSphereRef.current.visible ||
        isDragging
      ) {
        setIsOverHandle(false);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const mouse = new THREE.Vector2(x, y);
      raycasterRef.current.setFromCamera(mouse, camera);

      const intersects = raycasterRef.current.intersectObject(arrowEndSphereRef.current);
      setIsOverHandle(intersects.length > 0);
    },
    [isEditing, camera, isDragging, canvasRef]
  );

  // Dodaj event listeners - tylko w trybie edycji myszką
  useEffect(() => {
    if (!isEditing || !body) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleHover);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleHover);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEditing, canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, handleHover]);

  return { isDraggingVelocity: isDragging, isOverHandle };
}
