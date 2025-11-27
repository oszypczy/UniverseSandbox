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
        <button onClick={() => setIsVisible(true)}>Stats</button>
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

  // Determine if system is bound based on total energy
  const getSystemStatus = (energy: number | undefined): { text: string; color: string } => {
    if (energy === undefined) return { text: 'N/A', color: '#888' };
    if (energy < 0) return { text: 'Związany', color: '#4ade80' }; // Green - bound
    return { text: 'Niezwiązany', color: '#f87171' }; // Red - unbound
  };

  const systemStatus = getSystemStatus(totalEnergy);

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

        {totalEnergy !== undefined && bodyCount >= 2 && (
          <div className="hud-stat">
            <span className="hud-stat-label">Układ</span>
            <span className="hud-stat-value status" style={{ color: systemStatus.color }}>
              {systemStatus.text}
            </span>
          </div>
        )}
      </div>

      <div className="hud-hint">Naciśnij H aby ukryć</div>
    </div>
  );
};
