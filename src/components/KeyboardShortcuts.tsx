import React, { useState, useEffect } from 'react';
import './KeyboardShortcuts.css';

const SHORTCUTS = [
  { key: 'Space', description: 'Pauza/Wznów' },
  { key: 'R', description: 'Reset symulacji' },
  { key: 'Del', description: 'Usuń wybrane ciało' },
  { key: 'Tab', description: 'Tryb Edycja/Kamera' },
  { key: 'Esc', description: 'Zamknij edytor' },
  { key: 'H', description: 'Pokaż/ukryj HUD' },
  { key: '?', description: 'Pokaż/ukryj skróty' },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Toggle with ? key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '?') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <div className="shortcuts-toggle" title="Pokaż skróty klawiszowe (?)">
        <button onClick={() => setIsVisible(true)}>?</button>
      </div>
    );
  }

  return (
    <div className="keyboard-shortcuts">
      <div className="shortcuts-header">
        <span className="shortcuts-title">Skróty</span>
        <button
          className="shortcuts-close"
          onClick={() => setIsVisible(false)}
          title="Ukryj skróty (?)"
        >
          ✕
        </button>
      </div>

      <div className="shortcuts-list">
        {SHORTCUTS.map(({ key, description }) => (
          <div key={key} className="shortcut-item">
            <kbd className="shortcut-key">{key}</kbd>
            <span className="shortcut-desc">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
