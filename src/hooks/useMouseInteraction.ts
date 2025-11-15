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
  mass: number;
}

export function useMouseInteraction({
  canvasRef,
  camera,
  scene,
  enabled,
  onBodyCreate,
  mass,
}: UseMouseInteractionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPointRef = useRef<THREE.Vector3 | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const velocityArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const previewSphereRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());

  // Konwersja współrzędnych 2D (ekran) -> 3D (świat)
  const screenTo3D = useCallback((screenX: number, screenY: number): THREE.Vector3 | null => {
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
  }, [camera, canvasRef]);

  // Mouse down - rozpocznij przeciąganie
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!enabled || !camera || !scene) return;

    const position = screenTo3D(event.clientX, event.clientY);
    if (!position) return;

    setIsDragging(true);
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
  }, [enabled, camera, scene, screenTo3D]);

  // Mouse move - pokazuj prędkość
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !startPointRef.current || !scene || !camera) return;

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
  }, [isDragging, scene, camera, screenTo3D]);

  // Mouse up - stwórz ciało
  const handleMouseUp = useCallback((event: MouseEvent) => {
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
        mass,
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
  }, [isDragging, scene, onBodyCreate, mass, screenTo3D]);

  // Podłącz event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, enabled, handleMouseDown, handleMouseMove, handleMouseUp]);

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

  return { isDragging };
}