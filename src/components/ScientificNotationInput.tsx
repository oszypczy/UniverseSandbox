import React, { useState, useEffect } from 'react';
import './ScientificNotationInput.css';

interface ScientificNotationInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

// Konwertuj liczbę na notację naukową
function toScientific(value: number): { mantissa: number; exponent: number } {
  if (value === 0) return { mantissa: 0, exponent: 0 };

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exponent);

  return { mantissa, exponent };
}

// Konwertuj notację naukową na liczbę
function fromScientific(mantissa: number, exponent: number): number {
  return mantissa * Math.pow(10, exponent);
}

export const ScientificNotationInput: React.FC<ScientificNotationInputProps> = ({
  value,
  onChange,
  label,
  min = 1,
  max = 1e50,
}) => {
  const [mantissa, setMantissa] = useState(1);
  const [exponent, setExponent] = useState(0);

  // Aktualizuj lokalne wartości gdy value się zmienia
  useEffect(() => {
    const scientific = toScientific(value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMantissa(Number(scientific.mantissa.toFixed(2)));
    setExponent(scientific.exponent);
  }, [value]);

  const handleMantissaChange = (newMantissa: number) => {
    setMantissa(newMantissa);
    const newValue = fromScientific(newMantissa, exponent);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleExponentChange = (newExponent: number) => {
    setExponent(newExponent);
    const newValue = fromScientific(mantissa, newExponent);
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="scientific-notation-input">
      {label && <label className="scientific-label">{label}</label>}
      <div className="scientific-input-group">
        <input
          type="number"
          value={mantissa.toFixed(2)}
          onChange={(e) => handleMantissaChange(Number(e.target.value))}
          step="0.01"
          min="0.01"
          max="9.99"
          className="mantissa-input"
        />
        <span className="times-symbol">×10</span>
        <input
          type="number"
          value={exponent}
          onChange={(e) => handleExponentChange(Number(e.target.value))}
          step="1"
          min="0"
          max="50"
          className="exponent-input"
        />
      </div>
      <div className="scientific-hint">= {value.toExponential(2)} kg</div>
    </div>
  );
};
