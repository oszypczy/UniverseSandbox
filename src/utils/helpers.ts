import { COLORS } from './constants';

/**
 * Oblicza rozmiar kuli na podstawie masy
 * Używa logarytmu dla lepszej wizualizacji
 */
export function calculateRadius(mass: number): number {
  return Math.max(0.5, Math.log(mass + 1) * 0.3);
}

/**
 * Oblicza kolor na podstawie masy
 * Gradient: małe masy = niebieski, duże = czerwony
 */
export function getColorByMass(mass: number): number {
  const normalized = Math.min(1, Math.log(mass + 1) / Math.log(1000));
  
  if (normalized < 0.5) {
    return lerpColor(COLORS.SMALL_MASS, COLORS.MEDIUM_MASS, normalized * 2);
  } else {
    return lerpColor(COLORS.MEDIUM_MASS, COLORS.LARGE_MASS, (normalized - 0.5) * 2);
  }
}

/**
 * Interpolacja liniowa między dwoma kolorami
 */
export function lerpColor(color1: number, color2: number, t: number): number {
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

/**
 * Generuje losowy identyfikator
 */
export function generateId(): string {
  return `body-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ogranicza wartość do zakresu [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}