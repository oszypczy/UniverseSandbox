import React, { useEffect, useState, useCallback } from 'react';
import './Tutorial.css';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Witaj w symulacji N-body! 🌌',
      content: (
        <>
          <p>
            Stwórz własne układy planetarne i obserwuj jak grawitacja wpływa na ruch ciał
            niebieskich.
          </p>
          <p>Ta krótka instrukcja pokaże Ci podstawy obsługi symulacji.</p>
        </>
      ),
    },
    {
      title: 'Tworzenie ciał 🪐',
      content: (
        <>
          <p>
            <strong>Przeciągnij i upuść:</strong> Kliknij i przeciągnij aby stworzyć ciało z
            prędkością początkową. Długość przeciągnięcia = prędkość.
          </p>
          <p>
            <strong>Podwójne kliknięcie:</strong> Szybko kliknij dwa razy aby stworzyć stacjonarne
            ciało.
          </p>
          <p>
            <strong>Kliknięcie na ciało:</strong> Wybierz ciało aby edytować jego masę i prędkość.
          </p>
        </>
      ),
    },
    {
      title: 'Tryby interakcji 🎮',
      content: (
        <>
          <p>
            <strong>Tryb Edycji (Edit):</strong> Twórz nowe ciała i edytuj istniejące. Możesz
            obracać kamerę prawym przyciskiem myszy.
          </p>
          <p>
            <strong>Tryb Kamery (Camera):</strong> Pełna kontrola kamery bez ryzyka stworzenia
            nowych ciał. Przełączaj się przyciskiem w panelu kontrolnym.
          </p>
        </>
      ),
    },
    {
      title: 'Panel kontrolny ⚙️',
      content: (
        <>
          <p>
            <strong>Prędkość czasu:</strong> Przyśpiesz lub spowolnij symulację (0.1x - 10x).
          </p>
          <p>
            <strong>Trajektorie:</strong> Pokaż/ukryj ścieżki ruchu ciał.
          </p>
          <p>
            <strong>Wektory prędkości:</strong> Wyświetl strzałki pokazujące kierunek i wielkość
            prędkości.
          </p>
          <p>
            <strong>Presety:</strong> Wypróbuj gotowe scenariusze (Ziemia+Księżyc, Układ Podwójny,
            Trójkąt Lagrange'a, Ósemka, Ziemia+Satelity).
          </p>
        </>
      ),
    },
    {
      title: 'Skróty klawiszowe ⌨️',
      content: (
        <>
          <p>
            <strong>R:</strong> Reset symulacji lub wybranego presetu
          </p>
          <p>
            <strong>Delete/Backspace:</strong> Usuń wybrane ciało
          </p>
          <p>
            <strong>Tab:</strong> Przełącz tryb Edit/Camera
          </p>
          <p>
            <strong>Escape:</strong> Zamknij edytor ciał
          </p>
          <p>
            <strong>H:</strong> Ukryj/pokaż HUD ze statystykami
          </p>
          <p className="keyboard-hint">💡 Skróty nie działają gdy piszesz w polach tekstowych</p>
        </>
      ),
    },
    {
      title: 'Gotowe do zabawy! 🚀',
      content: (
        <>
          <p>Teraz znasz podstawy! Oto kilka pomysłów na eksperymentowanie:</p>
          <ul>
            <li>Spróbuj stworzyć stabilny układ planetarny</li>
            <li>Zobacz co się stanie gdy dwa duże ciała zderzą się</li>
            <li>Eksperymentuj z różnymi masami i prędkościami</li>
            <li>Załaduj preset i zmodyfikuj go dodając nowe ciała</li>
          </ul>
          <p>
            <strong>Wskazówka:</strong> Możesz otworzyć tę instrukcję ponownie klikając przycisk "?"
            w prawym górnym rogu.
          </p>
        </>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = useCallback(() => {
    localStorage.setItem('tutorial_completed', 'true');
    onClose();
  }, [onClose]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('tutorial_completed', 'true');
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <button className="tutorial-close" onClick={handleSkip} aria-label="Zamknij">
          ✕
        </button>

        <div className="tutorial-header">
          <h2>{steps[currentStep].title}</h2>
          <div className="tutorial-progress">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${
                  index < currentStep ? 'completed' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="tutorial-content">{steps[currentStep].content}</div>

        <div className="tutorial-footer">
          <div className="tutorial-step-counter">
            Krok {currentStep + 1} z {steps.length}
          </div>
          <div className="tutorial-buttons">
            {currentStep > 0 && (
              <button className="btn btn-secondary" onClick={handlePrevious}>
                ← Wstecz
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <>
                <button className="btn btn-ghost" onClick={handleSkip}>
                  Pomiń
                </button>
                <button className="btn btn-primary" onClick={handleNext}>
                  Dalej →
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleComplete}>
                Rozpocznij! 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button className="help-button" onClick={onClick} aria-label="Pomoc" title="Pomoc">
      ?
    </button>
  );
};
