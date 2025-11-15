// Stałe fizyczne symulacji
export const PHYSICS_CONSTANTS = {
  G: 0.5,                      // Stała grawitacyjna (dostosowana dla wizualizacji)
  MIN_DISTANCE: 0.5,           // Minimalna odległość (unikanie singularności)
  COLLISION_THRESHOLD: 2.0,    // Próg kolizji
  MAX_TRAIL_LENGTH: 100,       // Max punktów trajektorii
  TIME_STEP: 0.016,            // Delta czasu (60 FPS)
  MAX_BODIES: 100,             // Maksymalna liczba ciał
};

// Stałe UI
export const UI_CONSTANTS = {
  MIN_MASS: 1,
  MAX_MASS: 1000,
  DEFAULT_MASS: 100,
  MIN_TIME_SCALE: 0.1,
  MAX_TIME_SCALE: 2.0,
  DEFAULT_TIME_SCALE: 1.0,
};

// Kolory dla wizualizacji
export const COLORS = {
  BACKGROUND: 0x000011,
  SMALL_MASS: 0x4488ff,    // Niebieski
  MEDIUM_MASS: 0xffff44,   // Żółty
  LARGE_MASS: 0xff4444,    // Czerwony
  TRAIL_OPACITY: 0.6,
};