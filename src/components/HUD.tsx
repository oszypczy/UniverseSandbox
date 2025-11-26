import React, { useEffect, useState } from 'react';
import './HUD.css';

interface HUDProps {
  fps: number;
  bodyCount: number;
  totalEnergy?: number;
}

export const HUD: React.FC<HUDProps> = ({ fps, bodyCount, totalEnergy }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Allow toggling HUD with H key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <div className="hud-toggle" title="Pokaż HUD (H)">
        <button onClick={() => setIsVisible(true)}>📊</button>
      </div>
    );
  }

  // Get FPS color based on performance
  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return '#4ade80'; // Green
    if (fps >= 30) return '#fbbf24'; // Yellow
    return '#f87171'; // Red
  };

  // Get body count color based on quantity
  const getBodyCountColor = (count: number): string => {
    if (count < 20) return '#60a5fa'; // Blue
    if (count < 50) return '#fbbf24'; // Yellow
    return '#f87171'; // Red (approaching limit)
  };

  // Format energy in scientific notation if needed
  const formatEnergy = (energy: number | undefined): string => {
    if (energy === undefined) return 'N/A';
    if (Math.abs(energy) < 1000) return energy.toFixed(2);
    return energy.toExponential(2);
  };

  return (
    <div className="hud">
      <div className="hud-header">
        <span className="hud-title">Status</span>
        <button className="hud-close" onClick={() => setIsVisible(false)} title="Ukryj HUD (H)">
          ✕
        </button>
      </div>

      <div className="hud-stats">
        <div className="hud-stat">
          <span className="hud-stat-label">FPS</span>
          <span className="hud-stat-value" style={{ color: getFPSColor(fps) }}>
            {Math.round(fps)}
          </span>
        </div>

        <div className="hud-stat">
          <span className="hud-stat-label">Ciała</span>
          <span className="hud-stat-value" style={{ color: getBodyCountColor(bodyCount) }}>
            {bodyCount}
          </span>
        </div>

        {totalEnergy !== undefined && (
          <div className="hud-stat">
            <span className="hud-stat-label">Energia</span>
            <span className="hud-stat-value" style={{ color: '#a78bfa' }}>
              {formatEnergy(totalEnergy)}
            </span>
          </div>
        )}
      </div>

      <div className="hud-hint">Naciśnij H aby ukryć</div>
    </div>
  );
};
