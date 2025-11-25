import React, { useState, useEffect, useRef } from 'react';
import type { Body } from '../types';
import './BodyEditor.css';

interface BodyEditorProps {
  body: Body | null;
  onUpdate: (
    bodyId: string,
    updates: { mass?: number; velocity?: { x: number; y: number; z: number } }
  ) => void;
  onDelete: (bodyId: string) => void;
  onClose: () => void;
}

export const BodyEditor: React.FC<BodyEditorProps> = ({ body, onUpdate, onDelete, onClose }) => {
  const [mass, setMass] = useState(0);
  const [velocityX, setVelocityX] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [velocityZ, setVelocityZ] = useState(0);

  // Draggable state
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Lewy górny róg
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (body) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMass(body.mass);
      setVelocityX(body.velocity.x);
      setVelocityY(body.velocity.y);
      setVelocityZ(body.velocity.z);
    }
  }, [body]);

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
            type="number"
            value={mass.toFixed(2)}
            onChange={(e) => {
              const newMass = Number(e.target.value);
              setMass(newMass);
              if (body) {
                onUpdate(body.id, { mass: newMass });
              }
            }}
            min={0.1}
            max={1000}
            step="0.1"
            className="mass-input"
          />
        </div>

        <div className="editor-field">
          <label>Prędkość:</label>
          <div className="velocity-inputs-vertical">
            <div className="velocity-input-group">
              <label className="velocity-label">X:</label>
              <input
                type="number"
                value={velocityX.toFixed(2)}
                onChange={(e) => {
                  const newX = Number(e.target.value);
                  setVelocityX(newX);
                  if (body) {
                    onUpdate(body.id, {
                      velocity: { x: newX, y: velocityY, z: velocityZ },
                    });
                  }
                }}
                step="0.1"
                className="velocity-input"
              />
            </div>
            <div className="velocity-input-group">
              <label className="velocity-label">Y:</label>
              <input
                type="number"
                value={velocityY.toFixed(2)}
                onChange={(e) => {
                  const newY = Number(e.target.value);
                  setVelocityY(newY);
                  if (body) {
                    onUpdate(body.id, {
                      velocity: { x: velocityX, y: newY, z: velocityZ },
                    });
                  }
                }}
                step="0.1"
                className="velocity-input"
              />
            </div>
            <div className="velocity-input-group">
              <label className="velocity-label">Z:</label>
              <input
                type="number"
                value={velocityZ.toFixed(2)}
                onChange={(e) => {
                  const newZ = Number(e.target.value);
                  setVelocityZ(newZ);
                  if (body) {
                    onUpdate(body.id, {
                      velocity: { x: velocityX, y: velocityY, z: newZ },
                    });
                  }
                }}
                step="0.1"
                className="velocity-input"
              />
            </div>
          </div>
        </div>

        <div className="editor-buttons">
          <button className="btn btn-danger" onClick={handleDelete}>
            🗑️ Usuń ciało
          </button>
        </div>
      </div>
    </div>
  );
};
