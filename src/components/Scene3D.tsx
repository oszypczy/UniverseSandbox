import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useThreeScene } from '../hooks/useThreeScene';
import { useSimulation } from '../hooks/useSimulation';
import { useMouseInteraction } from '../hooks/useMouseInteraction';
import type { SimulationConfig, InteractionMode, Preset } from '../types';

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
  loadPreset: (preset: Preset) => void;
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
    enabled: interactionMode === 'edit',
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
    loadPreset: (preset: Preset) => {
      // Clear existing bodies
      removeAllBodies();

      // Add all bodies from preset
      preset.bodies.forEach(bodyParams => {
        addBody({
          position: new THREE.Vector3(bodyParams.position.x, bodyParams.position.y, bodyParams.position.z),
          velocity: new THREE.Vector3(bodyParams.velocity.x, bodyParams.velocity.y, bodyParams.velocity.z),
          mass: bodyParams.mass,
          color: bodyParams.color,
        });
      });

      // Update body count
      if (onBodyCountChange) {
        setTimeout(() => {
          onBodyCountChange(getBodyCount());
        }, 0);
      }
    },
  }), [removeAllBodies, reset, addBody, getBodyCount, onBodyCountChange]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        cursor: interactionMode === 'edit' ? 'crosshair' : 'grab',
      }}
    />
  );
});

Scene3D.displayName = 'Scene3D';