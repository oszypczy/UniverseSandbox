import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import type { SimulationConfig, Body } from '../types';
import { PHYSICS_CONSTANTS, COLORS } from '../utils/constants';

interface UseSimulationProps {
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  config: Partial<SimulationConfig>;
  isPaused: boolean;
  showTrails: boolean;
}

export function useSimulation({
  scene,
  renderer,
  camera,
  config,
  isPaused,
  showTrails,
}: UseSimulationProps) {
  const engineRef = useRef<PhysicsEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Inicjalizacja silnika
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PhysicsEngine(config);
    }
  }, []);

  // Aktualizacja konfiguracji
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config);
    }
  }, [config]);

  // Funkcja aktualizacji trajektorii
  const updateTrails = useCallback((bodies: Body[]) => {
    if (!scene) return;

    bodies.forEach(body => {
      // Dodaj aktualną pozycję do historii
      body.trailPoints.push(body.position.clone());

      // Ogranicz długość śladu
      const maxPoints = PHYSICS_CONSTANTS.MAX_TRAIL_LENGTH;
      if (body.trailPoints.length > maxPoints) {
        body.trailPoints.shift();
      }

      // Usuń stary trail jeśli istnieje
      if (body.trail) {
        scene.remove(body.trail);
        body.trail.geometry.dispose();
        (body.trail.material as THREE.Material).dispose();
      }

      // Stwórz nowy trail jeśli są punkty
      if (body.trailPoints.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(body.trailPoints);
        const material = new THREE.LineBasicMaterial({
          color: (body.mesh.material as THREE.MeshPhongMaterial).color,
          transparent: true,
          opacity: COLORS.TRAIL_OPACITY,
        });
        
        body.trail = new THREE.Line(geometry, material);
        scene.add(body.trail);
      }
    });
  }, [scene]);

  // Główna pętla animacji
  const animate = useCallback((time: number) => {
    if (!engineRef.current || !scene || !renderer || !camera) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Tylko aktualizuj fizykę gdy nie jest wstrzymane
    if (!isPaused) {
      // Oblicz deltaTime
      const deltaTime = lastTimeRef.current === 0
        ? 0.016
        : Math.min((time - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms
      lastTimeRef.current = time;

      // Aktualizuj fizykę
      engineRef.current.update(deltaTime);

      // Aktualizuj trajektorie
      if (showTrails) {
        updateTrails(engineRef.current.getBodies());
      } else {
        // Usuń trajektorie jeśli są wyłączone
        engineRef.current.getBodies().forEach(body => {
          if (body.trail) {
            scene.remove(body.trail);
            body.trail.geometry.dispose();
            (body.trail.material as THREE.Material).dispose();
            body.trail = undefined;
          }
          body.trailPoints = [];
        });
      }
    }

    // Renderuj scenę ZAWSZE (nawet gdy wstrzymane) aby camera controls działały
    renderer.render(scene, camera);

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [scene, renderer, camera, isPaused, showTrails, updateTrails]);

  // Start/stop animacji
  useEffect(() => {
    if (scene && renderer && camera) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scene, renderer, camera, animate]);

  // API funkcje
  const addBody = useCallback((params: {
    mass: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color?: number;
  }) => {
    if (!engineRef.current || !scene) return;

    const body = engineRef.current.addBody(params);
    scene.add(body.mesh);
    return body;
  }, [scene]);

  const removeAllBodies = useCallback(() => {
    if (!engineRef.current || !scene) return;

    const bodies = engineRef.current.getBodies();
    bodies.forEach(body => {
      scene.remove(body.mesh);
      if (body.trail) {
        scene.remove(body.trail);
      }
    });

    engineRef.current.removeAllBodies();
  }, [scene]);

  const reset = useCallback(() => {
    removeAllBodies();
    lastTimeRef.current = 0;
  }, [removeAllBodies]);

  const getBodies = useCallback(() => {
    return engineRef.current?.getBodies() || [];
  }, []);

  const getBodyCount = useCallback(() => {
    return engineRef.current?.getBodyCount() || 0;
  }, []);

  const getTotalEnergy = useCallback(() => {
    return engineRef.current?.calculateTotalEnergy() || 0;
  }, []);

  return {
    addBody,
    removeAllBodies,
    reset,
    getBodies,
    getBodyCount,
    getTotalEnergy,
  };
}