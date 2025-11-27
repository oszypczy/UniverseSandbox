import React from 'react';
import type { InteractionMode, Preset } from '../types';
import { PRESETS } from '../utils/presets';
import './ControlPanel.css';

interface ControlPanelProps {
  timeScale: number;
  onTimeScaleChange: (value: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  showTrails: boolean;
  onShowTrailsChange: (value: boolean) => void;
  showVelocityVectors: boolean;
  onShowVelocityVectorsChange: (value: boolean) => void;
  onClearAll: () => void;
  interactionMode: InteractionMode;
  onInteractionModeChange: (mode: InteractionMode) => void;
  onLoadPreset: (preset: Preset, presetKey: string) => void;
  currentPreset: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  timeScale,
  onTimeScaleChange,
  isPaused,
  onTogglePause,
  showTrails,
  onShowTrailsChange,
  showVelocityVectors,
  onShowVelocityVectorsChange,
  onClearAll,
  interactionMode,
  onInteractionModeChange,
  onLoadPreset,
  currentPreset,
}) => {
  return (
    <div className="control-panel">
      <h2>Kontrola Symulacji</h2>

      <div className="control-section mode-section">
        <label>Tryb interakcji:</label>
        <div className="mode-buttons">
          <button
            onClick={() => onInteractionModeChange('edit')}
            className={`mode-btn ${interactionMode === 'edit' ? 'mode-btn-active' : ''}`}
          >
            Edycja
          </button>
          <button
            onClick={() => onInteractionModeChange('camera')}
            className={`mode-btn ${interactionMode === 'camera' ? 'mode-btn-active' : ''}`}
          >
            Kamera
          </button>
        </div>
      </div>

      <div className="control-section preset-section">
        <label>Scenariusze:</label>
        <select
          className="preset-dropdown"
          onChange={(e) => {
            const presetKey = e.target.value;
            if (presetKey && PRESETS[presetKey]) {
              onLoadPreset(PRESETS[presetKey], presetKey);
            }
          }}
          value={currentPreset || ''}
        >
          <option value="">Wybierz scenariusz...</option>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      <div className="control-section">
        <div className="pause-control">
          <button onClick={onTogglePause} className={`btn pause-btn ${isPaused ? 'paused' : ''}`}>
            {isPaused ? 'Wznów' : 'Pauza'}
          </button>
        </div>
        <label>
          Szybkość czasu: <strong>{timeScale.toFixed(1)}x</strong>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(Number(e.target.value))}
            className="slider"
            disabled={isPaused}
          />
          <div className="slider-labels">
            <span>0.0x</span>
            <span>10.0x</span>
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

      <div className="control-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showVelocityVectors}
            onChange={(e) => onShowVelocityVectorsChange(e.target.checked)}
          />
          <span>Pokaż wektory prędkości</span>
        </label>
      </div>

      <div className="control-section buttons">
        <button onClick={onClearAll} className="btn btn-danger">
          Usuń wszystkie
        </button>
      </div>
    </div>
  );
};
