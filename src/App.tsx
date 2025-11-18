import { useState, useRef } from 'react';
import { Scene3D } from './components/Scene3D';
import type { Scene3DHandle } from './components/Scene3D';
import type { InteractionMode, Preset } from './types';
import { ControlPanel } from './components/ControlPanel';
import { PresetBar } from './components/PresetBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UI_CONSTANTS } from './utils/constants';
import './App.css';

function App() {
  const [mass, setMass] = useState(UI_CONSTANTS.DEFAULT_MASS);
  const [timeScale, setTimeScale] = useState(UI_CONSTANTS.DEFAULT_TIME_SCALE);
  const [showTrails, setShowTrails] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('edit');

  const scene3DRef = useRef<Scene3DHandle>(null);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    scene3DRef.current?.reset();
    setIsPaused(false);
    setMass(UI_CONSTANTS.DEFAULT_MASS);
    setTimeScale(UI_CONSTANTS.DEFAULT_TIME_SCALE);
    setShowTrails(true);
  };

  const handleClearAll = () => {
    scene3DRef.current?.removeAllBodies();
  };

  const handleLoadPreset = (preset: Preset) => {
    scene3DRef.current?.loadPreset(preset);
    setIsPaused(false);
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <Scene3D
          ref={scene3DRef}
          mass={mass}
          timeScale={timeScale}
          showTrails={showTrails}
          isPaused={isPaused}
          interactionMode={interactionMode}
        />
        <ControlPanel
          mass={mass}
          onMassChange={setMass}
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          showTrails={showTrails}
          onShowTrailsChange={setShowTrails}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onReset={handleReset}
          onClearAll={handleClearAll}
          interactionMode={interactionMode}
          onInteractionModeChange={setInteractionMode}
        />
        <PresetBar onLoadPreset={handleLoadPreset} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
