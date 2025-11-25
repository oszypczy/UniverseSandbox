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
  showTrails: boolean;
  showVelocityVectors: boolean;
}

export function useSimulation({
  scene,
  renderer,
  camera,
  config,
  showTrails,
  showVelocityVectors,
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

          // Pobierz kolor z materiału
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

  // Funkcja aktualizacji wektorów prędkości
  const updateVelocityVectors = useCallback(
    (bodies: Body[]) => {
      if (!scene) return;

      bodies.forEach((body) => {
        if (showVelocityVectors) {
          const velocityMagnitude = body.velocity.length();

          // Skalowanie długości strzałki (min 2, max 15)
          const arrowLength = Math.min(15, Math.max(2, velocityMagnitude * 2));

          // Kierunek strzałki (znormalizowany wektor prędkości)
          const direction = body.velocity.clone().normalize();

          // Kolor strzałki - od zielonego (wolno) do czerwonego (szybko)
          const speedRatio = Math.min(1, velocityMagnitude / 10);
          const color = new THREE.Color(speedRatio, 1 - speedRatio * 0.5, 0);

          // Usuń starą strzałkę jeśli istnieje
          if (body.velocityArrow) {
            scene.remove(body.velocityArrow);
            body.velocityArrow.dispose();
          }

          // Stwórz nową strzałkę
          if (velocityMagnitude > 0.1) {
            // Nie pokazuj dla bardzo małych prędkości
            body.velocityArrow = new THREE.ArrowHelper(
              direction,
              body.position,
              arrowLength,
              color,
              arrowLength * 0.2, // Długość stożka
              arrowLength * 0.15 // Szerokość stożka
            );
            scene.add(body.velocityArrow);
          }
        } else {
          // Usuń strzałkę jeśli wizualizacja jest wyłączona
          if (body.velocityArrow) {
            scene.remove(body.velocityArrow);
            body.velocityArrow.dispose();
            body.velocityArrow = undefined;
          }
        }
      });
    },
    [scene, showVelocityVectors]
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

      // Aktualizuj animację gwiazd (subtelne pulsowanie)
      const time = Date.now() / 1000;
      bodies.forEach((body) => {
        if (body.mesh.userData.isStar) {
          const material = body.mesh.material as THREE.MeshPhongMaterial;
          const pulseSpeed = 0.5;
          const pulseAmplitude = 0.1;
          const baseIntensity = 1.0;

          // Subtelne pulsowanie świecenia
          material.emissiveIntensity =
            baseIntensity + Math.sin(time * pulseSpeed + body.id.length) * pulseAmplitude;

          // Lekkie pulsowanie światła
          const light = body.mesh.children.find(
            (child) => child instanceof THREE.PointLight
          ) as THREE.PointLight;
          if (light) {
            light.intensity = 5 + Math.sin(time * pulseSpeed * 0.8 + body.id.length) * 0.5;
          }
        }
      });

      // Aktualizuj flash effects
      flashEffectsRef.current.forEach((effect, bodyId) => {
        const body = bodies.find((b) => b.id === bodyId);
        if (body) {
          const material = body.mesh.material;

          // Flash effects tylko dla MeshPhongMaterial (planety)
          if (material instanceof THREE.MeshPhongMaterial) {
            material.emissiveIntensity = 0.2 + effect.intensity * 1.5;
          }

          effect.intensity -= deltaTime / effect.duration;

          if (effect.intensity <= 0) {
            if (material instanceof THREE.MeshPhongMaterial) {
              material.emissiveIntensity = 0.2;
            }
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

      // Tylko aktualizuj fizykę gdy timeScale > 0
      const timeScale = config.timeScale ?? 1.0;
      if (timeScale > 0) {
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
            if (body.velocityArrow) {
              scene.remove(body.velocityArrow);
              body.velocityArrow.dispose();
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

      // Aktualizuj wektory prędkości (zawsze, nawet gdy wstrzymane, żeby były widoczne)
      updateVelocityVectors(engineRef.current.getBodies());

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
      config.timeScale,
      showTrails,
      updateTrails,
      updateVelocityVectors,
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
      if (body.velocityArrow) {
        scene.remove(body.velocityArrow);
        body.velocityArrow.dispose();
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

  const getBodyById = useCallback((id: string) => {
    return engineRef.current?.getBodyById(id);
  }, []);

  const updateBody = useCallback(
    (id: string, updates: { mass?: number; velocity?: THREE.Vector3 }) => {
      if (!engineRef.current) return;
      engineRef.current.updateBody(id, updates);
    },
    []
  );

  const removeBody = useCallback(
    (id: string) => {
      if (!engineRef.current || !scene) return;

      const body = engineRef.current.getBodyById(id);
      if (body) {
        scene.remove(body.mesh);
        if (body.trail) {
          scene.remove(body.trail);
        }
        if (body.velocityArrow) {
          scene.remove(body.velocityArrow);
          body.velocityArrow.dispose();
        }
      }

      engineRef.current.removeBody(id);
    },
    [scene]
  );

  return {
    addBody,
    removeAllBodies,
    reset,
    getBodies,
    getBodyCount,
    getTotalEnergy,
    getBodyById,
    updateBody,
    removeBody,
  };
}
