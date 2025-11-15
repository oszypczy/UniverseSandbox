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

export type InteractionMode = 'edit' | 'camera';

export interface UIState {
  mass: number;
  timeScale: number;
  showTrails: boolean;
  isPaused: boolean;
  interactionMode: InteractionMode;
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