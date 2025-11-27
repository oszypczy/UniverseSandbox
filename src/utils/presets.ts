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
    name: 'Układ Słońce-Ziemia-Księżyc',
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

  BINARY_STAR_PLANET: {
    name: 'Układ Podwójny (Tatooine)',
    description: 'Dwie gwiazdy orbitujące wspólny środek masy z planetą na orbicie zewnętrznej',
    bodies: (() => {
      const bodies = [];

      // Parametry układu binarnego
      const STAR1_MASS = 400; // Większa gwiazda (pomarańczowa)
      const STAR2_MASS = 200; // Mniejsza gwiazda (niebieska)
      const TOTAL_MASS = STAR1_MASS + STAR2_MASS;
      const BINARY_SEPARATION = 8; // Odległość między gwiazdami

      // Środek masy jest w (0, 0, 0)
      // Oblicz odległości od środka masy
      const r1 = (STAR2_MASS / TOTAL_MASS) * BINARY_SEPARATION; // 2.67
      const r2 = (STAR1_MASS / TOTAL_MASS) * BINARY_SEPARATION; // 5.33

      // Prędkość kątowa układu binarnego
      const omega = Math.sqrt((G * TOTAL_MASS) / Math.pow(BINARY_SEPARATION, 3));

      // Prędkości liniowe gwiazd (w kierunku Z dla orbity w płaszczyźnie XZ)
      const v1 = omega * r1;
      const v2 = omega * r2;

      // Gwiazda 1 (większa, pomarańczowa) - po lewej
      const star1 = {
        mass: STAR1_MASS,
        position: { x: -r1, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: v1 },
        color: 0xffa500, // Pomarańczowa
      };
      bodies.push(star1);

      // Gwiazda 2 (mniejsza, niebieska) - po prawej
      const star2 = {
        mass: STAR2_MASS,
        position: { x: r2, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: -v2 }, // Przeciwny kierunek
        color: 0x4488ff, // Niebiesko-biała
      };
      bodies.push(star2);

      // Planeta orbitująca cały układ (orbita circumstellar)
      const PLANET_MASS = 8;
      const PLANET_RADIUS = 20; // Musi być daleko od gwiazd dla stabilności

      // Prędkość orbitalna planety wokół środka masy
      const planetOrbitalVel = orbitalVelocity(TOTAL_MASS, PLANET_RADIUS);

      // Planeta startuje na osi Z
      const planet = {
        mass: PLANET_MASS,
        position: { x: 0, y: 0, z: PLANET_RADIUS },
        velocity: { x: planetOrbitalVel, y: 0, z: 0 },
        color: 0xcc8844, // Piaskowa (jak Tatooine!)
      };
      bodies.push(planet);

      return bodies;
    })(),
  },

  EARTH_SATELLITES: {
    name: 'Ziemia + Satelity',
    description: 'Ziemia otoczona wieloma satelitami na różnych orbitach (LEO, MEO, GEO)',
    bodies: (() => {
      const bodies = [];

      // Ziemia w centrum
      const EARTH_MASS = 500;
      const earth = {
        mass: EARTH_MASS,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        color: 0x2288ff, // Niebieska
      };
      bodies.push(earth);

      // Satelity na różnych orbitach
      const SATELLITE_MASS = 0.001; // Ultra mikroskopijnie mała masa - zero wpływu między sobą

      // LEO (Low Earth Orbit) - niska orbita, szybkie satelity
      const LEO_RADIUS_BASE = 12;
      const LEO_COUNT = 8;
      for (let i = 0; i < LEO_COUNT; i++) {
        // Równomierne rozmieszczenie z małą losową perturbacją
        const angle = (i / LEO_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        // Różne nachylenia orbit (0-60 stopni)
        const inclination = (Math.random() * 60 * Math.PI) / 180;
        // Większa wariacja promienia (±2.0) dla lepszej separacji
        const radius = LEO_RADIUS_BASE + (Math.random() - 0.5) * 4.0;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius * Math.cos(inclination);
        const y = Math.sin(angle) * radius * Math.sin(inclination);

        const orbitalVel = orbitalVelocity(EARTH_MASS, radius);

        // Prędkość prostopadła do wektora pozycji
        const velocityX = -Math.sin(angle) * orbitalVel * Math.cos(inclination);
        const velocityZ = Math.cos(angle) * orbitalVel * Math.cos(inclination);
        const velocityY = Math.cos(angle) * orbitalVel * Math.sin(inclination);

        bodies.push({
          mass: SATELLITE_MASS,
          position: { x, y, z },
          velocity: { x: velocityX, y: velocityY, z: velocityZ },
          color: 0xff6666, // Czerwone (LEO)
        });
      }

      // MEO (Medium Earth Orbit) - średnia orbita
      const MEO_RADIUS_BASE = 23;
      const MEO_COUNT = 8;
      for (let i = 0; i < MEO_COUNT; i++) {
        const angle = (i / MEO_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const inclination = (Math.random() * 70 * Math.PI) / 180;
        const radius = MEO_RADIUS_BASE + (Math.random() - 0.5) * 6.0;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius * Math.cos(inclination);
        const y = Math.sin(angle) * radius * Math.sin(inclination);

        const orbitalVel = orbitalVelocity(EARTH_MASS, radius);

        const velocityX = -Math.sin(angle) * orbitalVel * Math.cos(inclination);
        const velocityZ = Math.cos(angle) * orbitalVel * Math.cos(inclination);
        const velocityY = Math.cos(angle) * orbitalVel * Math.sin(inclination);

        bodies.push({
          mass: SATELLITE_MASS,
          position: { x, y, z },
          velocity: { x: velocityX, y: velocityY, z: velocityZ },
          color: 0x66ff66, // Zielone (MEO)
        });
      }

      // GEO (Geostationary-like Orbit) - wysoka orbita, wolniejsze satelity
      const GEO_RADIUS_BASE = 38;
      const GEO_COUNT = 6;
      for (let i = 0; i < GEO_COUNT; i++) {
        const angle = (i / GEO_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        // GEO zwykle na równiku (małe nachylenie)
        const inclination = (Math.random() * 20 * Math.PI) / 180;
        const radius = GEO_RADIUS_BASE + (Math.random() - 0.5) * 7.0;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius * Math.cos(inclination);
        const y = Math.sin(angle) * radius * Math.sin(inclination);

        const orbitalVel = orbitalVelocity(EARTH_MASS, radius);

        const velocityX = -Math.sin(angle) * orbitalVel * Math.cos(inclination);
        const velocityZ = Math.cos(angle) * orbitalVel * Math.cos(inclination);
        const velocityY = Math.cos(angle) * orbitalVel * Math.sin(inclination);

        bodies.push({
          mass: SATELLITE_MASS,
          position: { x, y, z },
          velocity: { x: velocityX, y: velocityY, z: velocityZ },
          color: 0xffaa44, // Pomarańczowe (GEO)
        });
      }

      return bodies;
    })(),
  },
};
