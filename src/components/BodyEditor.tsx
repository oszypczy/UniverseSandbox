import React, { useState, useEffect, useRef } from 'react';
import './BodyEditor.css';

interface BodyData {
  id: string;
  mass: number;
  radius: number;
  velocity: { x: number; y: number; z: number };
}

interface BodyEditorProps {
  body: BodyData | null;
  onUpdate: (
    bodyId: string,
    updates: { mass?: number; radius?: number; velocity?: { x: number; y: number; z: number } }
  ) => void;
  onDelete: (bodyId: string) => void;
  onClose: () => void;
}

export const BodyEditor: React.FC<BodyEditorProps> = ({ body, onUpdate, onDelete, onClose }) => {
  // Use string state for inputs to allow free editing
  const [massStr, setMassStr] = useState('');
  const [radiusStr, setRadiusStr] = useState('');
  const [velXStr, setVelXStr] = useState('');
  const [velYStr, setVelYStr] = useState('');
  const [velZStr, setVelZStr] = useState('');

  // Track which field is being edited (has focus)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Draggable state
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync string state when body changes (real-time updates)
  // This is intentional - we want to sync external body data to local string state
  useEffect(() => {
    if (body) {
      // Only update fields that are not currently being edited
      /* eslint-disable react-hooks/set-state-in-effect */
      if (focusedField !== 'mass') setMassStr(body.mass.toFixed(2));
      if (focusedField !== 'radius') setRadiusStr(body.radius.toFixed(2));
      if (focusedField !== 'velX') setVelXStr(body.velocity.x.toFixed(2));
      if (focusedField !== 'velY') setVelYStr(body.velocity.y.toFixed(2));
      if (focusedField !== 'velZ') setVelZStr(body.velocity.z.toFixed(2));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [body, focusedField]);

  // Apply value on blur or Enter
  const applyMass = () => {
    const val = parseFloat(massStr);
    if (!isNaN(val) && val > 0 && body) {
      onUpdate(body.id, { mass: val });
    } else if (body) {
      setMassStr(body.mass.toFixed(2)); // Reset to current value if invalid
    }
  };

  const applyRadius = () => {
    const val = parseFloat(radiusStr);
    if (!isNaN(val) && val > 0 && body) {
      onUpdate(body.id, { radius: val });
    } else if (body) {
      setRadiusStr(body.radius.toFixed(2)); // Reset to current value if invalid
    }
  };

  const applyVelocity = (axis: 'x' | 'y' | 'z') => {
    if (!body) return;
    const xVal = parseFloat(velXStr);
    const yVal = parseFloat(velYStr);
    const zVal = parseFloat(velZStr);

    const newVel = {
      x: isNaN(xVal) ? body.velocity.x : xVal,
      y: isNaN(yVal) ? body.velocity.y : yVal,
      z: isNaN(zVal) ? body.velocity.z : zVal,
    };

    onUpdate(body.id, { velocity: newVel });

    // Reset invalid inputs
    if (axis === 'x' && isNaN(xVal)) setVelXStr(body.velocity.x.toFixed(2));
    if (axis === 'y' && isNaN(yVal)) setVelYStr(body.velocity.y.toFixed(2));
    if (axis === 'z' && isNaN(zVal)) setVelZStr(body.velocity.z.toFixed(2));
  };

  const handleKeyDown = (e: React.KeyboardEvent, applyFn: () => void) => {
    if (e.key === 'Enter') {
      applyFn();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.body-editor-header')) {
      setIsDragging(true);
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!body) return null;

  const handleDelete = () => {
    onDelete(body.id);
    onClose();
  };

  return (
    <div
      ref={editorRef}
      className="body-editor"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="body-editor-header">
        <h3>Edycja ciała</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="body-editor-content">
        <div className="editor-field">
          <label>Masa:</label>
          <input
            type="text"
            inputMode="decimal"
            value={massStr}
            onChange={(e) => setMassStr(e.target.value)}
            onFocus={() => setFocusedField('mass')}
            onBlur={() => {
              setFocusedField(null);
              applyMass();
            }}
            onKeyDown={(e) => handleKeyDown(e, applyMass)}
            className="mass-input"
          />
        </div>

        <div className="editor-field">
          <label>Rozmiar:</label>
          <input
            type="text"
            inputMode="decimal"
            value={radiusStr}
            onChange={(e) => setRadiusStr(e.target.value)}
            onFocus={() => setFocusedField('radius')}
            onBlur={() => {
              setFocusedField(null);
              applyRadius();
            }}
            onKeyDown={(e) => handleKeyDown(e, applyRadius)}
            className="mass-input"
          />
        </div>

        <div className="editor-field">
          <label>Prędkość:</label>
          <div className="velocity-inputs-vertical">
            <div className="velocity-input-group">
              <label className="velocity-label">X:</label>
              <input
                type="text"
                inputMode="decimal"
                value={velXStr}
                onChange={(e) => setVelXStr(e.target.value)}
                onFocus={() => setFocusedField('velX')}
                onBlur={() => {
                  setFocusedField(null);
                  applyVelocity('x');
                }}
                onKeyDown={(e) => handleKeyDown(e, () => applyVelocity('x'))}
                className="velocity-input"
              />
            </div>
            <div className="velocity-input-group">
              <label className="velocity-label">Y:</label>
              <input
                type="text"
                inputMode="decimal"
                value={velYStr}
                onChange={(e) => setVelYStr(e.target.value)}
                onFocus={() => setFocusedField('velY')}
                onBlur={() => {
                  setFocusedField(null);
                  applyVelocity('y');
                }}
                onKeyDown={(e) => handleKeyDown(e, () => applyVelocity('y'))}
                className="velocity-input"
              />
            </div>
            <div className="velocity-input-group">
              <label className="velocity-label">Z:</label>
              <input
                type="text"
                inputMode="decimal"
                value={velZStr}
                onChange={(e) => setVelZStr(e.target.value)}
                onFocus={() => setFocusedField('velZ')}
                onBlur={() => {
                  setFocusedField(null);
                  applyVelocity('z');
                }}
                onKeyDown={(e) => handleKeyDown(e, () => applyVelocity('z'))}
                className="velocity-input"
              />
            </div>
          </div>
        </div>

        <div className="editor-buttons">
          <button className="btn btn-danger" onClick={handleDelete}>
            Usuń ciało
          </button>
        </div>
      </div>
    </div>
  );
};
