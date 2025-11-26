import type { Preset } from '../types';
import { PHYSICS_CONSTANTS } from './constants';

// Masy w jednostkach wizualizacyjnych (nie kg)
// Proste wartości dla testowania stabilnych orbit

const SUN_MASS = 1000;
const EARTH_MASS = 10;
const MOON_MASS = 0.2;

// Użyj stałej grawitacyjnej z PHYSICS_CONSTANTS dla spójności
const G = PHYSICS_CONSTANTS.G;

// Funkcja obliczająca prędkość orbitalną: v = sqrt(G * M / r)
function orbitalVelocity(centralMass: number, radius: number): number {
  return Math.sqrt((G * centralMass) / radius);
}

// Funkcja konwertująca HSL na HEX dla kolorów
function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);

  return (red << 16) | (green << 8) | blue;
}

// Funkcja pomocnicza do tworzenia księżyca orbitującego planetę
function createMoon(
  moonMass: number,
  planetPosition: { x: number; y: number; z: number },
  planetVelocity: { x: number; y: number; z: number },
  planetMass: number,
  distanceFromPlanet: number,
  angle: number, // kąt w radianach dla różnych pozycji startowych
  color?: number // opcjonalny kolor księżyca
) {
  // Pozycja księżyca = pozycja planety + offset w płaszczyźnie orbity
  const offsetX = Math.cos(angle) * distanceFromPlanet;
  const offsetZ = Math.sin(angle) * distanceFromPlanet;

  // Prędkość orbitalna wokół planety (prostopadła do wektora pozycji)
  const orbitalSpeed = orbitalVelocity(planetMass, distanceFromPlanet);
  const orbitalVelX = -Math.sin(angle) * orbitalSpeed;
  const orbitalVelZ = Math.cos(angle) * orbitalSpeed;

  return {
    mass: moonMass,
    position: {
      x: planetPosition.x + offsetX,
      y: planetPosition.y,
      z: planetPosition.z + offsetZ,
    },
    velocity: {
      x: planetVelocity.x + orbitalVelX,
      y: planetVelocity.y,
      z: planetVelocity.z + orbitalVelZ,
    },
    color,
  };
}

export const PRESETS: Record<string, Preset> = {
  EARTH_MOON: {
    name: 'Ziemia + Księżyc',
    description: 'Ziemia z Księżycem orbitująca wokół Słońca',
    bodies: (() => {
      const sun = {
        mass: SUN_MASS,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        color: 0xffdd44, // Jasno-żółte słońce
      };

      const earth = {
        mass: EARTH_MASS,
        position: { x: 30, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: orbitalVelocity(SUN_MASS, 30) },
        color: 0x2233ff, // Niebieska Ziemia
      };

      // Księżyc orbitujący Ziemię - bliżej dla stabilnej orbity
      const moon = createMoon(
        MOON_MASS * 2.5,
        earth.position,
        earth.velocity,
        EARTH_MASS,
        1.5,
        0,
        0x888888 // Szary Księżyc
      );

      return [sun, earth, moon];
    })(),
  },

  THREE_BODY_LAGRANGE: {
    name: "Trójkąt Lagrange'a",
    description:
      "Trzy równe masy w układzie trójkąta równobocznego - stabilna konfiguracja punktów Lagrange'a",
    bodies: (() => {
      // Parametry układu
      const BODY_MASS = 50;
      const TRIANGLE_SIDE = 20; // bok trójkąta równobocznego (odległość między ciałami)

      // Promień okręgu opisanego na trójkącie (odległość od środka do wierzchołka)
      const radius = TRIANGLE_SIDE / Math.sqrt(3);

      // Prędkość orbitalna dla układu trzech równych mas w trójkącie równobocznym:
      // Każde ciało odczuwa grawitację od dwóch pozostałych w odległości TRIANGLE_SIDE
      // Wypadkowa siła grawitacyjna skierowana do centrum: F = G*m²*√3/d²
      // Warunek równowagi: F = m*v²/r → v = sqrt(G*m/d)
      const orbitalSpeed = Math.sqrt((G * BODY_MASS) / TRIANGLE_SIDE);

      // Ciało 1 - na osi X
      const body1 = {
        mass: BODY_MASS,
        position: { x: radius, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: orbitalSpeed },
        color: 0xff3333, // Czerwone
      };

      // Ciało 2 - w lewo i do góry (120° od pierwszego)
      const angle2 = (2 * Math.PI) / 3; // 120°
      const body2 = {
        mass: BODY_MASS,
        position: {
          x: radius * Math.cos(angle2),
          y: 0,
          z: radius * Math.sin(angle2),
        },
        velocity: {
          x: -orbitalSpeed * Math.sin(angle2),
          y: 0,
          z: orbitalSpeed * Math.cos(angle2),
        },
        color: 0x33ff33, // Zielone
      };

      // Ciało 3 - w lewo i w dół (240° od pierwszego)
      const angle3 = (4 * Math.PI) / 3; // 240°
      const body3 = {
        mass: BODY_MASS,
        position: {
          x: radius * Math.cos(angle3),
          y: 0,
          z: radius * Math.sin(angle3),
        },
        velocity: {
          x: -orbitalSpeed * Math.sin(angle3),
          y: 0,
          z: orbitalSpeed * Math.cos(angle3),
        },
        color: 0x3333ff, // Niebieskie
      };

      return [body1, body2, body3];
    })(),
  },

  THREE_BODY_FIGURE8: {
    name: 'Ósemka (Figure-8)',
    description:
      "Trzy równe masy poruszające się po tej samej trajektorii w kształcie ósemki - słynne rozwiązanie Moore'a",
    bodies: (() => {
      // Parametry układu - znane warunki początkowe dla figure-8 orbit
      // Odkryte przez Cristophe Moore'a w 1993, udowodnione przez Chenciner i Montgomery'ego w 2000
      const BODY_MASS = 50;

      // Współczynnik skalowania dla lepszej wizualizacji
      const scale = 10;

      // Warunki początkowe dla G=1, przeskalowane dla naszego G=0.5
      // Wartości z literatury naukowej
      const vScale = Math.sqrt((G * BODY_MASS) / scale);

      // Ciało 1 - lewy koniec
      const body1 = {
        mass: BODY_MASS,
        position: { x: -scale, y: 0, z: 0 },
        velocity: { x: 0.347111 * vScale, y: 0, z: 0.532728 * vScale },
        color: 0xff3333, // Czerwone
      };

      // Ciało 2 - prawy koniec (symetryczne do ciała 1)
      const body2 = {
        mass: BODY_MASS,
        position: { x: scale, y: 0, z: 0 },
        velocity: { x: 0.347111 * vScale, y: 0, z: 0.532728 * vScale },
        color: 0x33ff33, // Zielone
      };

      // Ciało 3 - środek (kompensuje pęd dwóch pozostałych)
      const body3 = {
        mass: BODY_MASS,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: -0.694222 * vScale, y: 0, z: -1.065456 * vScale },
        color: 0x3333ff, // Niebieskie
      };

      return [body1, body2, body3];
    })(),
  },

  SPIRAL_GALAXY: {
    name: 'Mini Galaktyka',
    description: 'Galaktyka spiralna z centralną czarną dziurą i orbitującymi gwiazdami',
    bodies: (() => {
      const bodies = [];

      // Centralna czarna dziura
      const blackHole = {
        mass: 2000,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        color: 0x000000, // Czarna
      };
      bodies.push(blackHole);

      // Generuj gwiazdy w spirali
      const NUM_ARMS = 3; // Liczba ramion spirali
      const STARS_PER_ARM = 8;
      const ARM_SPREAD = Math.PI * 2; // Pełny obrót

      for (let arm = 0; arm < NUM_ARMS; arm++) {
        const armAngleOffset = (arm * Math.PI * 2) / NUM_ARMS;

        for (let i = 0; i < STARS_PER_ARM; i++) {
          const radius = 20 + i * 6; // Odległość od centrum (20 do 62)
          const angle = armAngleOffset + (i * ARM_SPREAD) / STARS_PER_ARM;

          // Pozycja w spirali
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          // Prędkość orbitalna + mały szum dla realizmu
          const orbitalSpeed = orbitalVelocity(blackHole.mass, radius);
          const velocityX = -Math.sin(angle) * orbitalSpeed * 0.9; // 0.9 dla efektu spirali
          const velocityZ = Math.cos(angle) * orbitalSpeed * 0.9;

          // Masa gwiazdy z wariacją
          const mass = 2 + Math.random() * 4;

          // Kolor w zależności od pozycji w ramieniu
          const colorHue = (i / STARS_PER_ARM) * 360;
          const color = hslToHex(colorHue, 70, 60);

          bodies.push({
            mass,
            position: { x, y: 0, z },
            velocity: { x: velocityX, y: 0, z: velocityZ },
            color,
          });
        }
      }

      return bodies;
    })(),
  },
};
