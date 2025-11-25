import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Scene3D } from './components/Scene3D';
import type { Scene3DHandle } from './components/Scene3D';
import type { InteractionMode, Preset } from './types';
import { ControlPanel } from './components/ControlPanel';
import { BodyEditor } from './components/BodyEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UI_CONSTANTS } from './utils/constants';
import './App.css';

const DEFAULT_MASS = UI_CONSTANTS.DEFAULT_MASS;

function App() {
  const [timeScale, setTimeScale] = useState(UI_CONSTANTS.DEFAULT_TIME_SCALE);
  const [showTrails, setShowTrails] = useState(true);
  const [showVelocityVectors, setShowVelocityVectors] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('edit');
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);

  const scene3DRef = useRef<Scene3DHandle>(null);

  const handleClearAll = () => {
    scene3DRef.current?.removeAllBodies();
    setSelectedBodyId(null);
    setCurrentPreset(null);
  };

  const handleLoadPreset = (preset: Preset, presetKey: string) => {
    scene3DRef.current?.loadPreset(preset);
    setSelectedBodyId(null);
    setCurrentPreset(presetKey);
  };

  const handleResetPreset = () => {
    if (currentPreset) {
      // Reload the current preset by clearing and reloading
      handleClearAll();
      // Wait a frame to ensure cleanup is complete
      requestAnimationFrame(async () => {
        const { PRESETS } = await import('./utils/presets');
        const preset = PRESETS[currentPreset];
        if (preset) {
          scene3DRef.current?.loadPreset(preset);
        }
      });
    }
  };

  const handleBodySelect = (bodyId: string | null) => {
    setSelectedBodyId(bodyId);
  };

  const handleBodyUpdate = (
    bodyId: string,
    updates: { mass?: number; velocity?: { x: number; y: number; z: number } }
  ) => {
    if (!scene3DRef.current) return;

    const updatedData: { mass?: number; velocity?: THREE.Vector3 } = {};

    if (updates.mass !== undefined) {
      updatedData.mass = updates.mass;
    }

    if (updates.velocity) {
      updatedData.velocity = new THREE.Vector3(
        updates.velocity.x,
        updates.velocity.y,
        updates.velocity.z
      );
    }

    scene3DRef.current.updateBody(bodyId, updatedData);
  };

  const handleBodyDelete = (bodyId: string) => {
    scene3DRef.current?.removeBody(bodyId);
    setSelectedBodyId(null);
  };

  const handleCloseEditor = () => {
    setSelectedBodyId(null);
  };

  const [selectedBody, setSelectedBody] = useState<{
    id: string;
    mass: number;
    velocity: { x: number; y: number; z: number };
  } | null>(null);

  useEffect(() => {
    if (selectedBodyId && scene3DRef.current) {
      setSelectedBody(scene3DRef.current.getBodyById(selectedBodyId));
    } else {
      setSelectedBody(null);
    }
  }, [selectedBodyId]);

  return (
    <ErrorBoundary>
      <div className="app">
        <Scene3D
          ref={scene3DRef}
          timeScale={timeScale}
          showTrails={showTrails}
          showVelocityVectors={showVelocityVectors}
          interactionMode={interactionMode}
          onBodySelect={handleBodySelect}
          defaultMass={DEFAULT_MASS}
          selectedBodyId={selectedBodyId}
        />
        <ControlPanel
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          showTrails={showTrails}
          onShowTrailsChange={setShowTrails}
          showVelocityVectors={showVelocityVectors}
          onShowVelocityVectorsChange={setShowVelocityVectors}
          onClearAll={handleClearAll}
          interactionMode={interactionMode}
          onInteractionModeChange={setInteractionMode}
          onLoadPreset={handleLoadPreset}
          onResetPreset={handleResetPreset}
          currentPreset={currentPreset}
        />
        {selectedBody && (
          <BodyEditor
            body={selectedBody}
            onUpdate={handleBodyUpdate}
            onDelete={handleBodyDelete}
            onClose={handleCloseEditor}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
