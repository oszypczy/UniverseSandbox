import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useThreeScene } from '../hooks/useThreeScene';
import { useSimulation } from '../hooks/useSimulation';
import { useMouseInteraction } from '../hooks/useMouseInteraction';
import type { SimulationConfig, InteractionMode } from '../types';

interface Scene3DProps {
  mass: number;
  timeScale: number;
  showTrails: boolean;
  isPaused: boolean;
  interactionMode: InteractionMode;
  onBodyCountChange?: (count: number) => void;
}

export interface Scene3DHandle {
  removeAllBodies: () => void;
  reset: () => void;
}

export const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(({
  mass,
  timeScale,
  showTrails,
  isPaused,
  interactionMode,
  onBodyCountChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  // Inicjalizacja sceny Three.js
  const { scene, camera, renderer, controls } = useThreeScene({
    canvasRef,
    interactionMode,
  });

  // Konfiguracja symulacji
  const config: Partial<SimulationConfig> = {
    timeScale,
    collisionsEnabled: true,
  };

  // Hook symulacji
  const { addBody, removeAllBodies, reset, getBodyCount } = useSimulation({
    scene,
    renderer,
    camera,
    config,
    isPaused,
    showTrails,
  });

  // Callback dla tworzenia nowych ciał
  const handleBodyCreate = useCallback((params: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    mass: number;
  }) => {
    addBody(params);
    
    // Aktualizuj licznik obiektów
    if (onBodyCountChange) {
      setTimeout(() => {
        onBodyCountChange(getBodyCount());
      }, 0);
    }
  }, [addBody, getBodyCount, onBodyCountChange]);

  // Hook interakcji myszą (tylko w trybie edit)
  useMouseInteraction({
    canvasRef,
    camera,
    scene,
    enabled: !isPaused && interactionMode === 'edit',
    onBodyCreate: handleBodyCreate,
    mass,
  });

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    removeAllBodies: () => {
      removeAllBodies();
      if (onBodyCountChange) {
        onBodyCountChange(0);
      }
    },
    reset: () => {
      reset();
      if (onBodyCountChange) {
        onBodyCountChange(0);
      }
    },
  }), [removeAllBodies, reset, onBodyCountChange]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        cursor: isPaused
          ? 'default'
          : interactionMode === 'edit'
            ? 'crosshair'
            : 'grab',
      }}
    />
  );
});

Scene3D.displayName = 'Scene3D';