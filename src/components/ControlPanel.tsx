import React from 'react';
import type { InteractionMode } from '../types';
import './ControlPanel.css';

interface ControlPanelProps {
  mass: number;
  onMassChange: (value: number) => void;
  timeScale: number;
  onTimeScaleChange: (value: number) => void;
  showTrails: boolean;
  onShowTrailsChange: (value: boolean) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onClearAll: () => void;
  bodyCount?: number;
  interactionMode: InteractionMode;
  onInteractionModeChange: (mode: InteractionMode) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mass,
  onMassChange,
  timeScale,
  onTimeScaleChange,
  showTrails,
  onShowTrailsChange,
  isPaused,
  onTogglePause,
  onReset,
  onClearAll,
  bodyCount = 0,
  interactionMode,
  onInteractionModeChange,
}) => {
  return (
    <div className="control-panel">
      <h2>🎮 Kontrola Symulacji</h2>
      
      <div className="control-section mode-section">
        <label>Tryb interakcji:</label>
        <div className="mode-buttons">
          <button
            onClick={() => onInteractionModeChange('edit')}
            className={`mode-btn ${interactionMode === 'edit' ? 'mode-btn-active' : ''}`}
          >
            ✏️ Edycja
          </button>
          <button
            onClick={() => onInteractionModeChange('camera')}
            className={`mode-btn ${interactionMode === 'camera' ? 'mode-btn-active' : ''}`}
          >
            📷 Kamera
          </button>
        </div>
      </div>
      
      <div className="control-section">
        <label>
          Masa obiektu: <strong>{mass}</strong>
          <input
            type="range"
            min="1"
            max="1000"
            value={mass}
            onChange={(e) => onMassChange(Number(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>1</span>
            <span>1000</span>
          </div>
        </label>
      </div>

      <div className="control-section">
        <label>
          Szybkość czasu: <strong>{timeScale.toFixed(1)}x</strong>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(Number(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>0.1x</span>
            <span>2.0x</span>
          </div>
        </label>
      </div>

      <div className="control-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showTrails}
            onChange={(e) => onShowTrailsChange(e.target.checked)}
          />
          <span>Pokaż trajektorie</span>
        </label>
      </div>

      <div className="control-section buttons">
        <button
          onClick={onTogglePause}
          className={`btn ${isPaused ? 'btn-success' : 'btn-warning'}`}
        >
          {isPaused ? '▶️ Start' : '⏸️ Pauza'}
        </button>
        
        <button onClick={onReset} className="btn btn-primary">
          🔄 Reset
        </button>
        
        <button onClick={onClearAll} className="btn btn-danger">
          🗑️ Usuń wszystkie
        </button>
      </div>

      <div className="info-section">
        <div className="info-row">
          <span>Liczba obiektów:</span>
          <strong>{bodyCount}</strong>
        </div>
        <p className="info-text">
          {interactionMode === 'edit'
            ? '✏️ Tryb edycji: Kliknij i przeciągnij, aby dodać obiekt z prędkością'
            : '📷 Tryb kamery: Przeciągaj myszą aby obracać kamerę, scroll aby przybliżać'
          }
        </p>
      </div>
    </div>
  );
};