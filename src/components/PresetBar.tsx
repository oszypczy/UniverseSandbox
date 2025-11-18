import React from 'react';
import type { Preset } from '../types';
import { PRESETS } from '../utils/presets';
import './PresetBar.css';

interface PresetBarProps {
  onLoadPreset: (preset: Preset) => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({ onLoadPreset }) => {
  return (
    <div className="preset-bar">
      <span className="preset-bar-label">Predefiniowane scenariusze:</span>
      <div className="preset-bar-buttons">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onLoadPreset(preset)}
            className="preset-bar-btn"
            title={preset.description}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};
