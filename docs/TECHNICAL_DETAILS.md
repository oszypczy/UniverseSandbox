# 🔧 Szczegóły Techniczne Implementacji

## 📐 Definicje TypeScript

### types/index.ts

```typescript
import * as THREE from 'three';

// ===== Podstawowe typy =====

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BodyParams {
  mass: number;
  position: Vector3D;
  velocity: Vector3D;
  color?: number;
}

export interface Body {
  id: string;
  mass: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mesh: THREE.Mesh;
  trail?: THREE.Line;
  trailPoints: THREE.Vector3[];
}

// ===== Konfiguracja symulacji =====

export interface SimulationConfig {
  G: number;                    // Stała grawitacyjna
  timeScale: number;            // Mnożnik szybkości czasu
  maxBodies: number;            // Limit obiektów
  collisionsEnabled: boolean;   // Czy włączone kolizje
  minDistance: number;          // Min odległość dla obliczeń
}

export interface SimulationState {
  isPaused: boolean;
  bodies: Body[];
  totalEnergy: number;
  timeElapsed: number;
}

// ===== UI State =====

export interface UIState {
  mass: number;
  timeScale: number;
  showTrails: boolean;
  isPaused: boolean;
  selectedPreset?: string;
}

// ===== Mouse Interaction =====

export interface DragState {
  isDragging: boolean;
  startPoint: THREE.Vector3 | null;
  currentPoint: THREE.Vector3 | null;
  startPosition2D: { x: number; y: number } | null;
}

// ===== Presety =====

export interface Preset {
  name: string;
  description: string;
  bodies: BodyParams[];
}
```

---

## 🎮 Silnik Fizyczny

### engine/PhysicsEngine.ts

```typescript
import * as THREE from 'three';
import { Body, SimulationConfig } from '../types';

export class PhysicsEngine {
  private bodies: Body[] = [];
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  // ===== Zarządzanie ciałami =====

  addBody(params: {
    mass: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color?: number;
  }): Body {
    const id = `body-${Date.now()}-${Math.random()}`;
    
    // Geometria - rozmiar zależy od masy
    const radius = this.calculateRadius(params.mass);
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    
    // Materiał - kolor zależy od masy
    const color = params.color ?? this.getColorByMass(params.mass);
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      shininess: 30,
      specular: 0x555555,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(params.position);
    
    const body: Body = {
      id,
      mass: params.mass,
      position: params.position.clone(),
      velocity: params.velocity.clone(),
      acceleration: new THREE.Vector3(0, 0, 0),
      mesh,
      trailPoints: [],
    };
    
    this.bodies.push(body);
    return body;
  }

  removeBody(id: string): void {
    const index = this.bodies.findIndex(b => b.id === id);
    if (index !== -1) {
      const body = this.bodies[index];
      
      // Cleanup Three.js resources
      body.mesh.geometry.dispose();
      (body.mesh.material as THREE.Material).dispose();
      if (body.trail) {
        body.trail.geometry.dispose();
        (body.trail.material as THREE.Material).dispose();
      }
      
      this.bodies.splice(index, 1);
    }
  }

  removeAllBodies(): void {
    const bodyIds = this.bodies.map(b => b.id);
    bodyIds.forEach(id => this.removeBody(id));
  }

  getBodies(): Body[] {
    return this.bodies;
  }

  // ===== Główna pętla symulacji =====

  update(deltaTime: number): void {
    const dt = deltaTime * this.config.timeScale;
    
    // Reset przyspieszenia
    this.bodies.forEach(body => {
      body.acceleration.set(0, 0, 0);
    });
    
    // Oblicz siły grawitacyjne
    this.calculateGravitationalForces();
    
    // Aktualizuj pozycje i prędkości
    this.bodies.forEach(body => {
      this.integrateMotion(body, dt);
    });
    
    // Sprawdź kolizje
    if (this.config.collisionsEnabled) {
      this.handleCollisions();
    }
    
    // Aktualizuj meshe
    this.bodies.forEach(body => {
      body.mesh.position.copy(body.position);
    });
  }

  // ===== Obliczenia fizyczne =====

  private calculateGravitationalForces(): void {
    const { G, minDistance } = this.config;
    
    // Dla każdej pary ciał
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];
        
        // Wektor różnicy pozycji
        const delta = new THREE.Vector3().subVectors(
          bodyB.position,
          bodyA.position
        );
        
        // Odległość
        let distance = delta.length();
        
        // Zapobieganie singularności (dzielenie przez 0)
        if (distance < minDistance) {
          distance = minDistance;
        }
        
        // Siła grawitacyjna: F = G * m1 * m2 / r^2
        const forceMagnitude = (G * bodyA.mass * bodyB.mass) / (distance * distance);
        
        // Kierunek siły (znormalizowany wektor)
        const forceDirection = delta.normalize();
        
        // Siła jako wektor
        const force = forceDirection.multiplyScalar(forceMagnitude);
        
        // F = m * a => a = F / m
        // Dodaj przyspieszenie do obu ciał (III prawo Newtona)
        const accelA = force.clone().divideScalar(bodyA.mass);
        const accelB = force.clone().divideScalar(bodyB.mass).negate();
        
        bodyA.acceleration.add(accelA);
        bodyB.acceleration.add(accelB);
      }
    }
  }

  private integrateMotion(body: Body, dt: number): void {
    // Metoda Eulera (prosta, ale wystarczająca)
    // v_new = v_old + a * dt
    body.velocity.addScaledVector(body.acceleration, dt);
    
    // p_new = p_old + v * dt
    body.position.addScaledVector(body.velocity, dt);
  }

  private handleCollisions(): void {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];
        
        const distance = bodyA.position.distanceTo(bodyB.position);
        const radiusA = this.calculateRadius(bodyA.mass);
        const radiusB = this.calculateRadius(bodyB.mass);
        
        // Kolizja wykryta
        if (distance < radiusA + radiusB) {
          this.mergeCollision(bodyA, bodyB);
          return; // Wychodzimy, żeby nie iterować po zmodyfikowanej tablicy
        }
      }
    }
  }

  private mergeCollision(bodyA: Body, bodyB: Body): void {
    // Zachowanie pędu: p_total = m1*v1 + m2*v2
    const totalMass = bodyA.mass + bodyB.mass;
    const newVelocity = new THREE.Vector3()
      .addScaledVector(bodyA.velocity, bodyA.mass)
      .addScaledVector(bodyB.velocity, bodyB.mass)
      .divideScalar(totalMass);
    
    // Nowa pozycja (środek masy)
    const newPosition = new THREE.Vector3()
      .addScaledVector(bodyA.position, bodyA.mass)
      .addScaledVector(bodyB.position, bodyB.mass)
      .divideScalar(totalMass);
    
    // Usuń oba ciała
    this.removeBody(bodyA.id);
    this.removeBody(bodyB.id);
    
    // Dodaj nowe połączone ciało
    this.addBody({
      mass: totalMass,
      position: newPosition,
      velocity: newVelocity,
    });
  }

  // ===== Funkcje pomocnicze =====

  private calculateRadius(mass: number): number {
    // Rozmiar proporcjonalny do log(masa) dla lepszej wizualizacji
    return Math.max(0.5, Math.log(mass + 1) * 0.3);
  }

  private getColorByMass(mass: number): number {
    // Gradient: małe masy = niebieski, duże = czerwony
    const normalized = Math.min(1, Math.log(mass + 1) / Math.log(1000));
    
    const blue = 0x4488ff;
    const yellow = 0xffff44;
    const red = 0xff4444;
    
    if (normalized < 0.5) {
      return this.lerpColor(blue, yellow, normalized * 2);
    } else {
      return this.lerpColor(yellow, red, (normalized - 0.5) * 2);
    }
  }

  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return (r << 16) | (g << 8) | b;
  }

  // ===== Konfiguracja =====

  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }
}
```

---

## 🎬 Hook Symulacji

### hooks/useSimulation.ts

```typescript
import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import { SimulationConfig, Body } from '../types';

interface UseSimulationProps {
  scene: THREE.Scene | null;
  config: SimulationConfig;
  isPaused: boolean;
  showTrails: boolean;
}

export function useSimulation({
  scene,
  config,
  isPaused,
  showTrails,
}: UseSimulationProps) {
  const engineRef = useRef<PhysicsEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Inicjalizacja silnika
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PhysicsEngine(config);
    }
  }, []);

  // Aktualizacja konfiguracji
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config);
    }
  }, [config]);

  // Główna pętla animacji
  const animate = useCallback((time: number) => {
    if (!engineRef.current || !scene || isPaused) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Oblicz deltaTime
    const deltaTime = lastTimeRef.current === 0 
      ? 0.016 
      : (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    // Aktualizuj fizykę
    engineRef.current.update(Math.min(deltaTime, 0.1)); // Cap at 100ms

    // Aktualizuj trajektorie
    if (showTrails) {
      updateTrails(engineRef.current.getBodies());
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [scene, isPaused, showTrails]);

  // Start/stop animacji
  useEffect(() => {
    if (scene) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scene, animate]);

  // Funkcja aktualizacji trajektorii
  const updateTrails = useCallback((bodies: Body[]) => {
    if (!scene) return;

    bodies.forEach(body => {
      // Dodaj aktualną pozycję do historii
      body.trailPoints.push(body.position.clone());

      // Ogranicz długość śladu
      const maxPoints = 100;
      if (body.trailPoints.length > maxPoints) {
        body.trailPoints.shift();
      }

      // Usuń stary trail jeśli istnieje
      if (body.trail) {
        scene.remove(body.trail);
        body.trail.geometry.dispose();
        (body.trail.material as THREE.Material).dispose();
      }

      // Stwórz nowy trail jeśli są punkty
      if (body.trailPoints.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(body.trailPoints);
        const material = new THREE.LineBasicMaterial({
          color: (body.mesh.material as THREE.MeshPhongMaterial).color,
          transparent: true,
          opacity: 0.6,
          linewidth: 1,
        });
        
        body.trail = new THREE.Line(geometry, material);
        scene.add(body.trail);
      }
    });
  }, [scene]);

  // API funkcje
  const addBody = useCallback((params: {
    mass: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color?: number;
  }) => {
    if (!engineRef.current || !scene) return;

    const body = engineRef.current.addBody(params);
    scene.add(body.mesh);
  }, [scene]);

  const removeAllBodies = useCallback(() => {
    if (!engineRef.current || !scene) return;

    const bodies = engineRef.current.getBodies();
    bodies.forEach(body => {
      scene.remove(body.mesh);
      if (body.trail) {
        scene.remove(body.trail);
      }
    });

    engineRef.current.removeAllBodies();
  }, [scene]);

  const reset = useCallback(() => {
    removeAllBodies();
    lastTimeRef.current = 0;
  }, [removeAllBodies]);

  return {
    addBody,
    removeAllBodies,
    reset,
    getBodies: () => engineRef.current?.getBodies() || [],
  };
}
```

---

## 🖱️ Interakcje Myszą

### hooks/useMouseInteraction.ts

```typescript
import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

interface UseMouseInteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  camera: THREE.Camera | null;
  scene: THREE.Scene | null;
  enabled: boolean;
  onBodyCreate: (params: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    mass: number;
  }) => void;
  mass: number;
}

export function useMouseInteraction({
  canvasRef,
  camera,
  scene,
  enabled,
  onBodyCreate,
  mass,
}: UseMouseInteractionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPointRef = useRef<THREE.Vector3 | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const velocityArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());

  // Konwersja współrzędnych 2D (ekran) -> 3D (świat)
  const screenTo3D = useCallback((screenX: number, screenY: number): THREE.Vector3 | null => {
    if (!camera || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Normalized device coordinates (-1 to +1)
    const x = ((screenX - rect.left) / rect.width) * 2 - 1;
    const y = -((screenY - rect.top) / rect.height) * 2 + 1;

    // Rzutowanie na płaszczyznę z=0
    const mouse = new THREE.Vector2(x, y);
    raycasterRef.current.setFromCamera(mouse, camera);

    // Płaszczyzna prostopadła do kamery, przechodząca przez (0,0,0)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersect = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(plane, intersect);

    return intersect;
  }, [camera, canvasRef]);

  // Mouse down - rozpocznij przeciąganie
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!enabled || !camera || !scene) return;

    const position = screenTo3D(event.clientX, event.clientY);
    if (!position) return;

    setIsDragging(true);
    startPointRef.current = position;
    startPositionRef.current = { x: event.clientX, y: event.clientY };

    // Wizualizacja punktu startowego
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.name = 'preview-sphere';
    scene.add(sphere);
  }, [enabled, camera, scene, screenTo3D]);

  // Mouse move - pokazuj prędkość
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !startPointRef.current || !scene || !camera) return;

    const currentPoint = screenTo3D(event.clientX, event.clientY);
    if (!currentPoint) return;

    // Oblicz wektor prędkości
    const velocityVector = new THREE.Vector3()
      .subVectors(currentPoint, startPointRef.current)
      .multiplyScalar(2); // Skalowanie dla lepszej wizualizacji

    // Usuń stary arrow
    if (velocityArrowRef.current) {
      scene.remove(velocityArrowRef.current);
      velocityArrowRef.current.dispose();
    }

    // Stwórz nowy arrow
    if (velocityVector.length() > 0.1) {
      const direction = velocityVector.clone().normalize();
      const length = Math.min(velocityVector.length(), 20);
      
      velocityArrowRef.current = new THREE.ArrowHelper(
        direction,
        startPointRef.current,
        length,
        0x00ff00,
        length * 0.2,
        length * 0.15
      );
      scene.add(velocityArrowRef.current);
    }
  }, [isDragging, scene, camera, screenTo3D]);

  // Mouse up - stwórz ciało
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isDragging || !startPointRef.current || !scene) return;

    const endPoint = screenTo3D(event.clientX, event.clientY);
    
    if (endPoint) {
      // Oblicz prędkość początkową
      const velocity = new THREE.Vector3()
        .subVectors(endPoint, startPointRef.current)
        .multiplyScalar(2);

      // Stwórz ciało
      onBodyCreate({
        position: startPointRef.current.clone(),
        velocity,
        mass,
      });
    }

    // Cleanup
    setIsDragging(false);
    startPointRef.current = null;
    startPositionRef.current = null;

    // Usuń wizualizacje
    const previewSphere = scene.getObjectByName('preview-sphere');
    if (previewSphere) {
      scene.remove(previewSphere);
      (previewSphere as THREE.Mesh).geometry.dispose();
      ((previewSphere as THREE.Mesh).material as THREE.Material).dispose();
    }

    if (velocityArrowRef.current) {
      scene.remove(velocityArrowRef.current);
      velocityArrowRef.current.dispose();
      velocityArrowRef.current = null;
    }
  }, [isDragging, scene, onBodyCreate, mass, screenTo3D]);

  // Podłącz event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, enabled, handleMouseDown, handleMouseMove, handleMouseUp]);

  return { isDragging };
}
```

---

## 🎨 Komponenty UI

### components/ControlPanel.tsx

```typescript
import React from 'react';
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
}) => {
  return (
    <div className="control-panel">
      <h2>🎮 Kontrola Symulacji</h2>
      
      <div className="control-section">
        <label>
          Masa obiektu: {mass}
          <input
            type="range"
            min="1"
            max="1000"
            value={mass}
            onChange={(e) => onMassChange(Number(e.target.value))}
            className="slider"
          />
        </label>
      </div>

      <div className="control-section">
        <label>
          Szybkość czasu: {timeScale.toFixed(1)}x
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(Number(e.target.value))}
            className="slider"
          />
        </label>
      </div>

      <div className="control-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showTrails}
            onChange={(e) => onShowTrailsChange(e.target.checked)}
          />
          Pokaż trajektorie
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
        <p>💡 Kliknij i przeciągnij, aby dodać obiekt z prędkością</p>
      </div>
    </div>
  );
};
```

### components/ControlPanel.css

```css
.control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(20, 20, 40, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.control-panel h2 {
  margin: 0 0 20px 0;
  font-size: 1.3rem;
  text-align: center;
  color: #fff;
}

.control-section {
  margin-bottom: 20px;
}

.control-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #ccc;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #4a5568, #667eea);
  outline: none;
  margin-top: 8px;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn:active {
  transform: translateY(0);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.info-section {
  margin-top: 20px;
  padding: 15px;
  background: rgba(102, 126, 234, 0.1);
  border-left: 3px solid #667eea;
  border-radius: 6px;
}

.info-section p {
  margin: 0;
  font-size: 0.85rem;
  color: #e0e0e0;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .control-panel {
    width: calc(100% - 40px);
    top: auto;
    bottom: 20px;
    right: 20px;
    left: 20px;
  }
}
```

---

## 📦 Konfiguracja package.json

```json
{
  "name": "gravitational-sandbox",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/three": "^0.160.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.1.0"
  }
}
```

---

## 🔧 Konfiguracja tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 🎯 Predefiniowane Scenariusze

### utils/presets.ts

```typescript
import { Preset } from '../types';

export const PRESETS: Record<string, Preset> = {
  BINARY_SYSTEM: {
    name: 'Układ Binarny',
    description: 'Dwa obiekty orbitujące wokół wspólnego środka masy',
    bodies: [
      {
        mass: 500,
        position: { x: -10, y: 0, z: 0 },
        velocity: { x: 0, y: 3, z: 0 },
      },
      {
        mass: 500,
        position: { x: 10, y: 0, z: 0 },
        velocity: { x: 0, y: -3, z: 0 },
      },
    ],
  },
  
  SOLAR_SYSTEM: {
    name: 'Mini Układ Słoneczny',
    description: 'Centralna gwiazda z planetami na orbitach',
    bodies: [
      {
        mass: 1000,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        color: 0xffff00,
      },
      {
        mass: 50,
        position: { x: 15, y: 0, z: 0 },
        velocity: { x: 0, y: 4, z: 0 },
        color: 0x4488ff,
      },
      {
        mass: 30,
        position: { x: 25, y: 0, z: 0 },
        velocity: { x: 0, y: 3, z: 0 },
        color: 0xff8844,
      },
    ],
  },
  
  THREE_BODY: {
    name: 'Problem Trzech Ciał',
    description: 'Klasyczny chaotyczny układ trzech ciał',
    bodies: [
      {
        mass: 300,
        position: { x: 0, y: 10, z: 0 },
        velocity: { x: 2, y: 0, z: 0 },
      },
      {
        mass: 300,
        position: { x: -8, y: -5, z: 0 },
        velocity: { x: -1, y: 2, z: 0 },
      },
      {
        mass: 300,
        position: { x: 8, y: -5, z: 0 },
        velocity: { x: -1, y: -2, z: 0 },
      },
    ],
  },
  
  GALAXY: {
    name: 'Mini Galaktyka',
    description: 'Wiele małych obiektów orbitujących wokół dużej masy',
    bodies: [
      {
        mass: 2000,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        color: 0xffffff,
      },
      ...Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 15 + Math.random() * 10;
        const speed = Math.sqrt(0.5 * 2000 / radius);
        
        return {
          mass: 10 + Math.random() * 20,
          position: {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: (Math.random() - 0.5) * 5,
          },
          velocity: {
            x: -Math.sin(angle) * speed,
            y: Math.cos(angle) * speed,
            z: 0,
          },
        };
      }),
    ],
  },
};
```

---

## 🎓 Przykład Użycia w App.tsx

```typescript
import React, { useState } from 'react';
import { Scene3D } from './components/Scene3D';
import { ControlPanel } from './components/ControlPanel';
import './App.css';

function App() {
  const [mass, setMass] = useState(100);
  const [timeScale, setTimeScale] = useState(1);
  const [showTrails, setShowTrails] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="app">
      <Scene3D
        mass={mass}
        timeScale={timeScale}
        showTrails={showTrails}
        isPaused={isPaused}
      />
      <ControlPanel
        mass={mass}
        onMassChange={setMass}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        showTrails={showTrails}
        onShowTrailsChange={setShowTrails}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onReset={() => {/* Implementacja */}}
        onClearAll={() => {/* Implementacja */}}
      />
    </div>
  );
}

export default App;
```

Dokument zawiera wszystkie kluczowe implementacje i może służyć jako przewodnik podczas kodowania! 🚀