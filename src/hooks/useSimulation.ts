import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import type { SimulationConfig, Body, ParticleSystem } from '../types';
import { PHYSICS_CONSTANTS, COLORS } from '../utils/constants';

interface UseSimulationProps {
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  config: Partial<SimulationConfig>;
  isPaused: boolean;
  showTrails: boolean;
  onBodyCountChange?: (count: number) => void;
}

export function useSimulation({
  scene,
  renderer,
  camera,
  config,
  isPaused,
  showTrails,
  onBodyCountChange,
}: UseSimulationProps) {
  const engineRef = useRef<PhysicsEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const flashEffectsRef = useRef<Map<string, { intensity: number; duration: number }>>(new Map());
  const particleSystemsRef = useRef<ParticleSystem[]>([]);

  // Inicjalizacja silnika
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PhysicsEngine(config);
    }
  }, [config]);

  // Aktualizacja konfiguracji
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config);
    }
  }, [config]);

  // Funkcja aktualizacji trajektorii
  const updateTrails = useCallback(
    (bodies: Body[]) => {
      if (!scene) return;

      bodies.forEach((body) => {
        // Dodaj aktualną pozycję do historii
        body.trailPoints.push(body.position.clone());

        // Ogranicz długość śladu
        const maxPoints = PHYSICS_CONSTANTS.MAX_TRAIL_LENGTH;
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
            opacity: COLORS.TRAIL_OPACITY,
          });

          body.trail = new THREE.Line(geometry, material);
          scene.add(body.trail);
        }
      });
    },
    [scene]
  );

  // Funkcja tworzenia efektu flash
  const createFlashEffect = useCallback((body: Body) => {
    flashEffectsRef.current.set(body.id, {
      intensity: 1.0,
      duration: 0.5, // 0.5 seconds
    });
  }, []);

  // Funkcja tworzenia cząsteczek kolizji
  const createCollisionParticles = useCallback(
    (position: THREE.Vector3, mass: number) => {
      if (!scene) return;

      const particleCount = Math.min(50, Math.floor(mass / 2));
      const positions = new Float32Array(particleCount * 3);
      const velocities: THREE.Vector3[] = [];

      // Generuj cząsteczki w sferze wokół punktu kolizji
      for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.random() * 2;

        positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = position.z + radius * Math.cos(phi);

        // Losowa prędkość wyrzutu
        const speed = 5 + Math.random() * 10;
        velocities.push(
          new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
          )
        );
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.5,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(geometry, material) as unknown as ParticleSystem;
      particles.velocities = velocities;
      particles.lifeTime = 0;
      particles.maxLifeTime = 1.0; // 1 second

      scene.add(particles);
      particleSystemsRef.current.push(particles);
    },
    [scene]
  );

  // Funkcja aktualizacji efektów wizualnych
  const updateEffects = useCallback(
    (deltaTime: number, bodies: Body[]) => {
      if (!scene) return;

      // Aktualizuj flash effects
      flashEffectsRef.current.forEach((effect, bodyId) => {
        const body = bodies.find((b) => b.id === bodyId);
        if (body) {
          const material = body.mesh.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = 0.2 + effect.intensity * 1.5;

          effect.intensity -= deltaTime / effect.duration;

          if (effect.intensity <= 0) {
            material.emissiveIntensity = 0.2;
            flashEffectsRef.current.delete(bodyId);
          }
        } else {
          flashEffectsRef.current.delete(bodyId);
        }
      });

      // Aktualizuj cząsteczki
      const particlesToRemove: ParticleSystem[] = [];

      particleSystemsRef.current.forEach((particles) => {
        const velocities = particles.velocities;
        const positions = particles.geometry.attributes.position.array as Float32Array;
        const material = particles.material as THREE.PointsMaterial;

        particles.lifeTime += deltaTime;
        const lifeProgress = particles.lifeTime / particles.maxLifeTime;

        if (lifeProgress >= 1.0) {
          particlesToRemove.push(particles);
          return;
        }

        // Aktualizuj pozycje i opacity
        for (let i = 0; i < velocities.length; i++) {
          positions[i * 3] += velocities[i].x * deltaTime;
          positions[i * 3 + 1] += velocities[i].y * deltaTime;
          positions[i * 3 + 2] += velocities[i].z * deltaTime;

          // Grawitacja
          velocities[i].y -= 5 * deltaTime;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        material.opacity = 1.0 - lifeProgress;
      });

      // Usuń wygasłe cząsteczki
      particlesToRemove.forEach((particles) => {
        scene.remove(particles);
        particles.geometry.dispose();
        (particles.material as THREE.Material).dispose();

        const index = particleSystemsRef.current.indexOf(particles);
        if (index > -1) {
          particleSystemsRef.current.splice(index, 1);
        }
      });
    },
    [scene]
  );

  // Główna pętla animacji
  const animateRef = useRef<((time: number) => void) | null>(null);

  const animate = useCallback(
    (time: number) => {
      if (!engineRef.current || !scene || !renderer || !camera) {
        animationFrameRef.current = requestAnimationFrame(animateRef.current!);
        return;
      }

      // Oblicz deltaTime
      const deltaTime =
        lastTimeRef.current === 0 ? 0.016 : Math.min((time - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms
      lastTimeRef.current = time;

      // Tylko aktualizuj fizykę gdy nie jest wstrzymane
      if (!isPaused) {
        // Aktualizuj fizykę i zbierz zdarzenia kolizji
        const collisionEvents = engineRef.current.update(deltaTime);

        // Obsłuż zdarzenia kolizji
        collisionEvents.forEach((event) => {
          // Usuń stare ciała z sceny
          event.removedBodies.forEach((body) => {
            scene.remove(body.mesh);
            if (body.trail) {
              scene.remove(body.trail);
            }
          });

          // Dodaj nowe ciało do sceny
          scene.add(event.newBody.mesh);

          // Utwórz efekty wizualne
          createFlashEffect(event.newBody);
          createCollisionParticles(event.position, event.mass);
        });

        // Aktualizuj trajektorie
        if (showTrails) {
          updateTrails(engineRef.current.getBodies());
        } else {
          // Usuń trajektorie jeśli są wyłączone
          engineRef.current.getBodies().forEach((body) => {
            if (body.trail) {
              scene.remove(body.trail);
              body.trail.geometry.dispose();
              (body.trail.material as THREE.Material).dispose();
              body.trail = undefined;
            }
            body.trailPoints = [];
          });
        }
      }

      // Aktualizuj efekty wizualne (zawsze, nawet gdy wstrzymane)
      updateEffects(deltaTime, engineRef.current.getBodies());

      // Renderuj scenę ZAWSZE (nawet gdy wstrzymane) aby camera controls działały
      renderer.render(scene, camera);

      animationFrameRef.current = requestAnimationFrame(animateRef.current!);
    },
    [
      scene,
      renderer,
      camera,
      isPaused,
      showTrails,
      updateTrails,
      createFlashEffect,
      createCollisionParticles,
      updateEffects,
    ]
  );

  // Aktualizuj referencję do animate
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  // Start/stop animacji
  useEffect(() => {
    if (scene && renderer && camera) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scene, renderer, camera, animate]);

  // API funkcje
  const addBody = useCallback(
    (params: {
      mass: number;
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      color?: number;
    }) => {
      if (!engineRef.current || !scene) return;

      const body = engineRef.current.addBody(params);
      scene.add(body.mesh);
      return body;
    },
    [scene]
  );

  const removeAllBodies = useCallback(() => {
    if (!engineRef.current || !scene) return;

    const bodies = engineRef.current.getBodies();
    bodies.forEach((body) => {
      scene.remove(body.mesh);
      if (body.trail) {
        scene.remove(body.trail);
      }
    });

    engineRef.current.removeAllBodies();

    // Wyczyść efekty kolizji
    flashEffectsRef.current.clear();

    // Usuń wszystkie cząsteczki
    particleSystemsRef.current.forEach((particles) => {
      scene.remove(particles);
      particles.geometry.dispose();
      (particles.material as THREE.Material).dispose();
    });
    particleSystemsRef.current = [];
  }, [scene]);

  const reset = useCallback(() => {
    removeAllBodies();
    lastTimeRef.current = 0;
  }, [removeAllBodies]);

  const getBodies = useCallback(() => {
    return engineRef.current?.getBodies() || [];
  }, []);

  const getBodyCount = useCallback(() => {
    return engineRef.current?.getBodyCount() || 0;
  }, []);

  const getTotalEnergy = useCallback(() => {
    return engineRef.current?.calculateTotalEnergy() || 0;
  }, []);

  // Notify body count changes via callback
  const notifyBodyCountChange = useCallback(() => {
    if (onBodyCountChange && engineRef.current) {
      onBodyCountChange(engineRef.current.getBodyCount());
    }
  }, [onBodyCountChange]);

  return {
    addBody,
    removeAllBodies,
    reset,
    getBodies,
    getBodyCount,
    getTotalEnergy,
    notifyBodyCountChange,
  };
}
