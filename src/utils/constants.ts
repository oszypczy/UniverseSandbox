// Stałe fizyczne symulacji
export const PHYSICS_CONSTANTS = {
  // Stała grawitacyjna dostosowana do wizualizacyjnej skali mas
  // Testowanie wartości dla stabilnych orbit
  G: 1, // Stała grawitacyjna (dostosowywana iteracyjnie)
  MIN_DISTANCE: 0.5, // Minimalna odległość (unikanie singularności)
  COLLISION_THRESHOLD: 2.0, // Próg kolizji
  MAX_TRAIL_LENGTH: 100, // Max punktów trajektorii
  TIME_STEP: 0.016, // Delta czasu (60 FPS)
  MAX_BODIES: 100, // Maksymalna liczba ciał
};

// Stałe UI
export const UI_CONSTANTS = {
  MIN_MASS: 0.1, // Minimalna masa (mały księżyc)
  MAX_MASS: 1000, // Maksymalna masa (gwiazda)
  DEFAULT_MASS: 10, // Domyślna masa (planeta typu Ziemia)
  MIN_TIME_SCALE: 0.0, // Pauza
  MAX_TIME_SCALE: 10.0, // 10x prędkość
  DEFAULT_TIME_SCALE: 1.0,
};

// Progi mas dla różnych typów ciał (jednostki wizualizacyjne)
export const MASS_THRESHOLDS = {
  STAR_THRESHOLD: 500, // Próg klasyfikacji jako gwiazda
  SUPERGIANT_THRESHOLD: 5000, // Superolbrzymy
  SUN_MASS: 1000, // Masa Słońca (gwiazda typu G)
  JUPITER_MASS: 100, // Masa Jowisza (największa planeta)
  EARTH_MASS: 10, // Masa Ziemi (planeta skalista)
  MERCURY_MASS: 0.5, // Masa Merkurego (najmniejsza planeta)
};

// Kolory dla wizualizacji
export const COLORS = {
  BACKGROUND: 0x000011,
  SMALL_MASS: 0x4488ff, // Niebieski (planety)
  MEDIUM_MASS: 0xffff44, // Żółty (gazowe olbrzymy)
  LARGE_MASS: 0xff4444, // Czerwony (brązowe karły)
  TRAIL_OPACITY: 0.6,

  // Kolory gwiazd wg temperatury (klasyfikacja gwiazdowa)
  STAR_O: 0x9bb0ff, // Bardzo gorące (O-type) - niebiesko-białe
  STAR_B: 0xaabfff, // Gorące (B-type) - niebiesko-białe
  STAR_A: 0xcad7ff, // Białe (A-type)
  STAR_F: 0xf8f7ff, // Żółtawo-białe (F-type)
  STAR_G: 0xfff4ea, // Żółte (G-type) - jak Słońce
  STAR_K: 0xffd2a1, // Pomarańczowe (K-type)
  STAR_M: 0xffcc6f, // Czerwone (M-type) - chłodne
  STAR_SUPERGIANT: 0xff3333, // Czerwone nadolbrzymy
};
