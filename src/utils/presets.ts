import type { Preset } from '../types';

export const PRESETS: Record<string, Preset> = {
  BINARY_SYSTEM: {
    name: 'Układ Binarny',
    description: 'Dwa obiekty orbitujące wokół wspólnego środka masy',
    bodies: [
      {
        mass: 500,
        position: { x: -10, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 3 },
      },
      {
        mass: 500,
        position: { x: 10, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: -3 },
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
        velocity: { x: 0, y: 0, z: 4 },
        color: 0x4488ff,
      },
      {
        mass: 30,
        position: { x: 25, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 3 },
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
        position: { x: 0, y: 0, z: 10 },
        velocity: { x: 2, y: 0, z: 0 },
      },
      {
        mass: 300,
        position: { x: -8, y: 0, z: -5 },
        velocity: { x: -1, y: 0, z: 2 },
      },
      {
        mass: 300,
        position: { x: 8, y: 0, z: -5 },
        velocity: { x: -1, y: 0, z: -2 },
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
        const speed = Math.sqrt((0.5 * 2000) / radius);

        return {
          mass: 10 + Math.random() * 20,
          position: {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius,
          },
          velocity: {
            x: -Math.sin(angle) * speed,
            y: 0,
            z: Math.cos(angle) * speed,
          },
        };
      }),
    ],
  },
};
