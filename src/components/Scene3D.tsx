import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
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
}

export interface Scene3DHandle {
  removeAllBodies: () => void;
  reset: () => void;
  loadPreset: (preset: Preset) => void;
}

export const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(
  ({ mass, timeScale, showTrails, isPaused, interactionMode }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    // Inicjalizacja sceny Three.js
    const { scene, camera, renderer } = useThreeScene({
      canvasRef,
      interactionMode,
    });

    // Konfiguracja symulacji
    const config: Partial<SimulationConfig> = {
      timeScale,
      collisionsEnabled: true,
    };

    // Hook symulacji
    const { addBody, removeAllBodies, reset } = useSimulation({
      scene,
      renderer,
      camera,
      config,
      isPaused,
      showTrails,
    });

    // Callback dla tworzenia nowych ciał
    const handleBodyCreate = useCallback(
      (params: { position: THREE.Vector3; velocity: THREE.Vector3; mass: number }) => {
        addBody(params);
      },
      [addBody]
    );

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
    useImperativeHandle(
      ref,
      () => ({
        removeAllBodies: () => {
          removeAllBodies();
        },
        reset: () => {
          reset();
        },
        loadPreset: (preset: Preset) => {
          // Clear existing bodies
          removeAllBodies();

          // Add all bodies from preset
          preset.bodies.forEach((bodyParams) => {
            addBody({
              position: new THREE.Vector3(
                bodyParams.position.x,
                bodyParams.position.y,
                bodyParams.position.z
              ),
              velocity: new THREE.Vector3(
                bodyParams.velocity.x,
                bodyParams.velocity.y,
                bodyParams.velocity.z
              ),
              mass: bodyParams.mass,
              color: bodyParams.color,
            });
          });
        },
      }),
      [removeAllBodies, reset, addBody]
    );

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
  }
);

Scene3D.displayName = 'Scene3D';
