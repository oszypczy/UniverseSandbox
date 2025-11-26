import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useThreeScene } from '../hooks/useThreeScene';
import { useSimulation } from '../hooks/useSimulation';
import { useMouseInteraction } from '../hooks/useMouseInteraction';
import type { SimulationConfig, InteractionMode, Preset } from '../types';

interface Scene3DProps {
  timeScale: number;
  showTrails: boolean;
  showVelocityVectors: boolean;
  interactionMode: InteractionMode;
  onBodySelect?: (bodyId: string | null) => void;
  defaultMass: number;
  selectedBodyId: string | null;
}

export interface Scene3DHandle {
  removeAllBodies: () => void;
  reset: () => void;
  loadPreset: (preset: Preset) => void;
  getBodyById: (
    id: string
  ) => { id: string; mass: number; velocity: { x: number; y: number; z: number } } | undefined;
  updateBody: (id: string, updates: { mass?: number; velocity?: THREE.Vector3 }) => void;
  removeBody: (id: string) => void;
  getBodyCount: () => number;
  getTotalEnergy: () => number;
}

export const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(
  (
    { timeScale, showTrails, showVelocityVectors, interactionMode, onBodySelect, defaultMass },
    ref
  ) => {
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
    const {
      addBody,
      removeAllBodies,
      reset,
      getBodyById,
      updateBody,
      removeBody,
      getBodyCount,
      getTotalEnergy,
    } = useSimulation({
      scene,
      renderer,
      camera,
      config,
      showTrails,
      showVelocityVectors,
    });

    // Callback dla tworzenia nowych ciał
    const handleBodyCreate = useCallback(
      (params: { position: THREE.Vector3; velocity: THREE.Vector3; mass: number }) => {
        addBody(params);
      },
      [addBody]
    );

    // Hook interakcji myszą (tylko w trybie edit)
    const { isOverBody } = useMouseInteraction({
      canvasRef,
      camera,
      scene,
      enabled: interactionMode === 'edit',
      onBodyCreate: handleBodyCreate,
      onBodySelect,
      defaultMass,
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
        getBodyById: (id: string) => {
          return getBodyById(id);
        },
        updateBody: (id: string, updates: { mass?: number; velocity?: THREE.Vector3 }) => {
          updateBody(id, updates);
        },
        removeBody: (id: string) => {
          removeBody(id);
        },
        getBodyCount: () => {
          return getBodyCount();
        },
        getTotalEnergy: () => {
          return getTotalEnergy();
        },
      }),
      [
        removeAllBodies,
        reset,
        addBody,
        getBodyById,
        updateBody,
        removeBody,
        getBodyCount,
        getTotalEnergy,
      ]
    );

    // Określ kursor na podstawie kontekstu
    const getCursor = () => {
      if (interactionMode === 'camera') return 'grab';
      if (isOverBody) return 'pointer';
      return 'crosshair';
    };

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh',
          cursor: getCursor(),
        }}
      />
    );
  }
);

Scene3D.displayName = 'Scene3D';
