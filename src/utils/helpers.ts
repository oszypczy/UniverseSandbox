import { COLORS, MASS_THRESHOLDS } from './constants';

/**
 * Oblicza rozmiar kuli na podstawie masy
 * Używa logarytmu dla lepszej wizualizacji z jednostkami wizualizacyjnymi
 */
export function calculateRadius(mass: number): number {
  // Dla prostych jednostek wizualizacyjnych (0.1 - 1000)
  // Używamy logarytmu dla lepszej skali wizualnej
  const logMass = Math.log10(mass + 1); // +1 żeby uniknąć log(0)

  // Skalowanie: małe ciała 0.3-0.8, duże planety 1-2, gwiazdy 3-5
  const normalizedRadius = logMass * 0.6;

  // Gwiazdy znacznie większe wizualnie (dla efektu)
  const baseSize = isStar(mass) ? 3.5 : 1;

  return Math.max(0.3, normalizedRadius * baseSize);
}

/**
 * Sprawdza czy ciało jest gwiazdą na podstawie masy
 */
export function isStar(mass: number): boolean {
  return mass >= MASS_THRESHOLDS.STAR_THRESHOLD;
}

/**
 * Oblicza kolor gwiazdy na podstawie masy (klasyfikacja gwiazdowa)
 * Im większa masa, tym gorętsza gwiazda i bardziej niebieska
 */
export function getStarColor(mass: number): number {
  // Superolbrzymy (czerwone)
  if (mass >= MASS_THRESHOLDS.SUPERGIANT_THRESHOLD) {
    return COLORS.STAR_SUPERGIANT;
  }

  // Proporcja względem masy Słońca
  const solarMasses = mass / MASS_THRESHOLDS.SUN_MASS;

  // Klasyfikacja na podstawie mas słonecznych:
  // < 0.4: M (czerwone karły)
  // 0.4-0.7: K (pomarańczowe)
  // 0.7-1.0: G (żółte, jak Słońce)
  // 1.0-1.5: F (żółto-białe)
  // 1.5-2.5: A (białe)
  // 2.5-16: B (niebiesko-białe)
  // > 16: O (bardzo gorące, niebieskie)

  if (solarMasses >= 16) return COLORS.STAR_O;
  if (solarMasses >= 2.5) return COLORS.STAR_B;
  if (solarMasses >= 1.5) return COLORS.STAR_A;
  if (solarMasses >= 1.0) return COLORS.STAR_F;
  if (solarMasses >= 0.7) return COLORS.STAR_G;
  if (solarMasses >= 0.4) return COLORS.STAR_K;
  return COLORS.STAR_M;
}

/**
 * Oblicza kolor na podstawie masy
 * Gwiazdy mają specjalne kolory, planety używają gradientu
 */
export function getColorByMass(mass: number): number {
  // Jeśli to gwiazda, użyj kolorów gwiazdowych
  if (isStar(mass)) {
    return getStarColor(mass);
  }

  // Dla planet używamy logarytmicznej skali (1e4 - 1e7)
  const normalized = Math.min(1, Math.log(mass / 1e4) / Math.log(1e3));

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
