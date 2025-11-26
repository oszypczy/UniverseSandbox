import { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Scene3D } from './components/Scene3D';
import type { Scene3DHandle } from './components/Scene3D';
import type { InteractionMode, Preset } from './types';
import { ControlPanel } from './components/ControlPanel';
import { BodyEditor } from './components/BodyEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Tutorial, HelpButton } from './components/Tutorial';
import { HUD } from './components/HUD';
import { useFPS } from './hooks/useFPS';
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [bodyCount, setBodyCount] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState<number | undefined>(undefined);

  const scene3DRef = useRef<Scene3DHandle>(null);
  const fps = useFPS();

  // Check if user has completed tutorial before
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  // Update body count and total energy periodically
  useEffect(() => {
    const updateStats = () => {
      if (scene3DRef.current) {
        setBodyCount(scene3DRef.current.getBodyCount());
        setTotalEnergy(scene3DRef.current.getTotalEnergy());
      }
    };

    // Update every 100ms
    const intervalId = setInterval(updateStats, 100);

    return () => clearInterval(intervalId);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          // Reset simulation
          if (currentPreset) {
            handleResetPreset();
          } else {
            handleClearAll();
          }
          break;

        case 'delete':
        case 'backspace':
          // Delete selected body
          if (selectedBodyId) {
            handleBodyDelete(selectedBodyId);
          }
          break;

        case 'tab':
          // Toggle interaction mode
          e.preventDefault(); // Prevent default tab behavior
          setInteractionMode((prev) => (prev === 'edit' ? 'camera' : 'edit'));
          break;

        case 'escape':
          // Close body editor
          if (selectedBodyId) {
            setSelectedBodyId(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPreset, selectedBodyId, handleResetPreset, handleClearAll, handleBodyDelete]);

  const handleClearAll = useCallback(() => {
    scene3DRef.current?.removeAllBodies();
    setSelectedBodyId(null);
    setCurrentPreset(null);
  }, []);

  const handleLoadPreset = (preset: Preset, presetKey: string) => {
    scene3DRef.current?.loadPreset(preset);
    setSelectedBodyId(null);
    setCurrentPreset(presetKey);
  };

  const handleResetPreset = useCallback(() => {
    if (currentPreset) {
      // Save the current preset key before clearing
      const presetKey = currentPreset;

      // Clear bodies but don't reset currentPreset
      scene3DRef.current?.removeAllBodies();
      setSelectedBodyId(null);

      // Wait a frame to ensure cleanup is complete
      requestAnimationFrame(async () => {
        const { PRESETS } = await import('./utils/presets');
        const preset = PRESETS[presetKey];
        if (preset) {
          scene3DRef.current?.loadPreset(preset);
          // Keep the preset loaded
          setCurrentPreset(presetKey);
        }
      });
    }
  }, [currentPreset]);

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

  const handleBodyDelete = useCallback((bodyId: string) => {
    scene3DRef.current?.removeBody(bodyId);
    setSelectedBodyId(null);
  }, []);

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
      const body = scene3DRef.current.getBodyById(selectedBodyId);
      setSelectedBody(body || null);
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
        <HUD fps={fps} bodyCount={bodyCount} totalEnergy={totalEnergy} />
        <HelpButton onClick={() => setShowTutorial(true)} />
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
