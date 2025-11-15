import { useState, useRef } from 'react';
import { Scene3D } from './components/Scene3D';
import type { Scene3DHandle } from './components/Scene3D';
import type { InteractionMode } from './types';
import { ControlPanel } from './components/ControlPanel';
import { UI_CONSTANTS } from './utils/constants';
import './App.css';

function App() {
  const [mass, setMass] = useState(UI_CONSTANTS.DEFAULT_MASS);
  const [timeScale, setTimeScale] = useState(UI_CONSTANTS.DEFAULT_TIME_SCALE);
  const [showTrails, setShowTrails] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [bodyCount, setBodyCount] = useState(0);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('edit');
  
  const scene3DRef = useRef<Scene3DHandle>(null);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    scene3DRef.current?.reset();
    setBodyCount(0);
    setIsPaused(false);
    setMass(UI_CONSTANTS.DEFAULT_MASS);
    setTimeScale(UI_CONSTANTS.DEFAULT_TIME_SCALE);
    setShowTrails(true);
  };

  const handleClearAll = () => {
    scene3DRef.current?.removeAllBodies();
    setBodyCount(0);
  };

  return (
    <div className="app">
      <Scene3D
        ref={scene3DRef}
        mass={mass}
        timeScale={timeScale}
        showTrails={showTrails}
        isPaused={isPaused}
        interactionMode={interactionMode}
        onBodyCountChange={setBodyCount}
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
        bodyCount={bodyCount}
        interactionMode={interactionMode}
        onInteractionModeChange={setInteractionMode}
      />
      <div className="app-title">
        <h1>Symulator Grawitacyjny</h1>
        <p>Interaktywna wizualizacja problemu N-ciał</p>
      </div>
    </div>
  );
}

export default App;
