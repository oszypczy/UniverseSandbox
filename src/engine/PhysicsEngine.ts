import * as THREE from 'three';
import type { Body, SimulationConfig } from '../types';
import { PHYSICS_CONSTANTS } from '../utils/constants';
import { calculateRadius, getColorByMass, generateId, isStar } from '../utils/helpers';

export class PhysicsEngine {
  private bodies: Body[] = [];
  private config: SimulationConfig;

  constructor(config?: Partial<SimulationConfig>) {
    this.config = {
      G: PHYSICS_CONSTANTS.G,
      timeScale: 1.0,
      maxBodies: PHYSICS_CONSTANTS.MAX_BODIES,
      collisionsEnabled: true,
      minDistance: PHYSICS_CONSTANTS.MIN_DISTANCE,
      ...config,
    };
  }

  // ===== Zarządzanie ciałami =====

  addBody(params: {
    mass: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color?: number;
    radius?: number;
  }): Body {
    const id = generateId();

    // Geometria - rozmiar z parametru lub obliczony z masy
    const radius = params.radius ?? calculateRadius(params.mass);
    const geometry = new THREE.SphereGeometry(radius, 32, 32);

    // Materiał - kolor zależy od masy, gwiazdy świecą
    const color = params.color ?? getColorByMass(params.mass);
    const isStarBody = isStar(params.mass);

    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: isStarBody ? 1.0 : 0.2, // Gwiazdy świecą mocno
      shininess: isStarBody ? 100 : 30,
      specular: isStarBody ? 0xffffff : 0x555555,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(params.position);
    mesh.userData.bodyId = id;
    mesh.userData.isStar = isStarBody;

    // Planety i księżyce rzucają i odbierają cienie
    if (!isStarBody) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    // Dodaj point light dla gwiazd
    let starLight: THREE.PointLight | undefined;
    if (isStarBody) {
      starLight = new THREE.PointLight(color, 5, 200); // Mocne światło z dużym zasięgiem
      starLight.castShadow = true; // Włącz cienie

      // Konfiguracja shadow map
      starLight.shadow.mapSize.width = 2048;
      starLight.shadow.mapSize.height = 2048;
      starLight.shadow.camera.near = 0.5;
      starLight.shadow.camera.far = 200;

      mesh.add(starLight); // Dodaj light jako child meshu
    }

    const body: Body = {
      id,
      mass: params.mass,
      radius,
      position: params.position.clone(),
      velocity: params.velocity.clone(),
      acceleration: new THREE.Vector3(0, 0, 0),
      mesh,
      trailPoints: [],
    };

    this.bodies.push(body);
    return body;
  }

  removeBody(id: string): void {
    const index = this.bodies.findIndex((b) => b.id === id);
    if (index !== -1) {
      const body = this.bodies[index];

      // Cleanup Three.js resources
      body.mesh.geometry.dispose();
      (body.mesh.material as THREE.Material).dispose();
      if (body.trail) {
        body.trail.geometry.dispose();
        (body.trail.material as THREE.Material).dispose();
      }

      this.bodies.splice(index, 1);
    }
  }

  removeAllBodies(): void {
    const bodyIds = this.bodies.map((b) => b.id);
    bodyIds.forEach((id) => this.removeBody(id));
  }

  getBodies(): Body[] {
    return this.bodies;
  }

  getBodyCount(): number {
    return this.bodies.length;
  }

  getBodyById(id: string): Body | undefined {
    return this.bodies.find((b) => b.id === id);
  }

  updateBody(
    id: string,
    updates: { mass?: number; velocity?: THREE.Vector3; radius?: number }
  ): void {
    const body = this.getBodyById(id);
    if (!body) return;

    // Track if we need to update geometry
    let needsGeometryUpdate = false;
    let newRadius = body.radius;

    // Aktualizuj radius (niezależnie od masy)
    if (updates.radius !== undefined && updates.radius !== body.radius) {
      body.radius = updates.radius;
      newRadius = updates.radius;
      needsGeometryUpdate = true;
    }

    // Aktualizuj masę
    if (updates.mass !== undefined && updates.mass !== body.mass) {
      const oldMass = body.mass;
      body.mass = updates.mass;

      const wasStarBefore = isStar(oldMass);
      const isStarNow = isStar(updates.mass);

      // Zaktualizuj kolor meshu
      const newColor = getColorByMass(updates.mass);

      // Update material properties
      const material = body.mesh.material as THREE.MeshPhongMaterial;
      material.color.setHex(newColor);
      material.emissive.setHex(newColor);
      material.emissiveIntensity = isStarNow ? 0.8 : 0.2;
      material.shininess = isStarNow ? 100 : 30;
      material.specular.setHex(isStarNow ? 0xffffff : 0x555555);

      // Aktualizuj userData
      body.mesh.userData.isStar = isStarNow;

      // Obsłuż zmianę typu (planeta → gwiazda lub odwrotnie)
      if (!wasStarBefore && isStarNow) {
        // Stało się gwiazdą - dodaj point light
        const starLight = new THREE.PointLight(newColor, 2, 100);
        starLight.position.set(0, 0, 0); // Relative to mesh
        body.mesh.add(starLight);
      } else if (wasStarBefore && !isStarNow) {
        // Przestało być gwiazdą - usuń point light
        const light = body.mesh.children.find((child) => child instanceof THREE.PointLight);
        if (light) {
          body.mesh.remove(light);
          (light as THREE.PointLight).dispose();
        }
        // Zresetuj scale
        body.mesh.scale.set(1, 1, 1);
      } else if (isStarNow) {
        // Nadal gwiazda - zaktualizuj kolor lightu
        const light = body.mesh.children.find(
          (child) => child instanceof THREE.PointLight
        ) as THREE.PointLight;
        if (light) {
          light.color.setHex(newColor);
        }
      }
    }

    // Update geometry if radius changed
    if (needsGeometryUpdate) {
      body.mesh.geometry.dispose();
      body.mesh.geometry = new THREE.SphereGeometry(newRadius, 32, 32);
    }

    // Aktualizuj prędkość
    if (updates.velocity !== undefined) {
      body.velocity.copy(updates.velocity);
    }
  }

  // ===== Główna pętla symulacji =====

  update(
    deltaTime: number
  ): Array<{ position: THREE.Vector3; mass: number; removedBodies: Body[]; newBody: Body }> {
    const dt = deltaTime * this.config.timeScale;

    // Adaptive substepping - dziel duże kroki na mniejsze dla stabilności
    const maxSubstep = 0.016; // Maksymalny bezpieczny krok (60 FPS)
    const substeps = Math.ceil(dt / maxSubstep);
    const substepDt = dt / substeps;

    const allCollisionEvents: Array<{
      position: THREE.Vector3;
      mass: number;
      removedBodies: Body[];
      newBody: Body;
    }> = [];

    // Wykonaj kilka małych kroków zamiast jednego dużego
    for (let step = 0; step < substeps; step++) {
      // Krok 1: Zapisz stare przyspieszenia dla Velocity Verlet
      this.bodies.forEach((body) => {
        if (!body.prevAcceleration) {
          body.prevAcceleration = new THREE.Vector3();
        }
        body.prevAcceleration.copy(body.acceleration);
      });

      // Krok 2: Aktualizuj pozycje używając starego przyspieszenia
      this.bodies.forEach((body) => {
        // x(t + dt) = x(t) + v(t) * dt + 0.5 * a(t) * dt^2
        body.position.addScaledVector(body.velocity, substepDt);
        body.position.addScaledVector(body.acceleration, 0.5 * substepDt * substepDt);
      });

      // Krok 3: Oblicz nowe przyspieszenia z nowych pozycji
      this.bodies.forEach((body) => {
        body.acceleration.set(0, 0, 0);
      });
      this.calculateGravitationalForces();

      // Krok 4: Aktualizuj prędkości używając średniej przyspieszeń
      this.bodies.forEach((body) => {
        // v(t + dt) = v(t) + 0.5 * (a(t) + a(t + dt)) * dt
        if (body.prevAcceleration) {
          const avgAcceleration = new THREE.Vector3()
            .addVectors(body.prevAcceleration, body.acceleration)
            .multiplyScalar(0.5);
          body.velocity.addScaledVector(avgAcceleration, substepDt);
        } else {
          // Fallback dla pierwszego kroku
          body.velocity.addScaledVector(body.acceleration, substepDt);
        }
      });

      // Sprawdź kolizje
      if (this.config.collisionsEnabled) {
        const collisionEvents = this.handleCollisions();
        allCollisionEvents.push(...collisionEvents);
      }
    }

    // Aktualizuj meshe (tylko raz na końcu)
    this.bodies.forEach((body) => {
      body.mesh.position.copy(body.position);
    });

    return allCollisionEvents;
  }

  // ===== Obliczenia fizyczne =====

  private calculateGravitationalForces(): void {
    const { G, minDistance } = this.config;

    // Dla każdej pary ciał
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        // Wektor różnicy pozycji
        const delta = new THREE.Vector3().subVectors(bodyB.position, bodyA.position);

        // Odległość
        let distance = delta.length();

        // Zapobieganie singularności (dzielenie przez 0)
        if (distance < minDistance) {
          distance = minDistance;
        }

        // Siła grawitacyjna: F = G * m1 * m2 / r^2
        const forceMagnitude = (G * bodyA.mass * bodyB.mass) / (distance * distance);

        // Kierunek siły (znormalizowany wektor)
        const forceDirection = delta.normalize();

        // Siła jako wektor
        const force = forceDirection.multiplyScalar(forceMagnitude);

        // F = m * a => a = F / m
        // Dodaj przyspieszenie do obu ciał (III prawo Newtona)
        const accelA = force.clone().divideScalar(bodyA.mass);
        const accelB = force.clone().divideScalar(bodyB.mass).negate();

        bodyA.acceleration.add(accelA);
        bodyB.acceleration.add(accelB);
      }
    }
  }

  private handleCollisions(): Array<{
    position: THREE.Vector3;
    mass: number;
    removedBodies: Body[];
    newBody: Body;
  }> {
    const collisionEvents: Array<{
      position: THREE.Vector3;
      mass: number;
      removedBodies: Body[];
      newBody: Body;
    }> = [];
    const toMerge: Array<[Body, Body]> = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        // Skip if either body is already part of a collision
        if (processedIds.has(bodyA.id) || processedIds.has(bodyB.id)) {
          continue;
        }

        const distance = bodyA.position.distanceTo(bodyB.position);

        // Kolizja wykryta - używamy radius z body
        if (distance < bodyA.radius + bodyB.radius) {
          toMerge.push([bodyA, bodyB]);
          processedIds.add(bodyA.id);
          processedIds.add(bodyB.id);
        }
      }
    }

    // Process all collisions
    toMerge.forEach(([bodyA, bodyB]) => {
      const collisionPosition = new THREE.Vector3()
        .addScaledVector(bodyA.position, bodyA.mass)
        .addScaledVector(bodyB.position, bodyB.mass)
        .divideScalar(bodyA.mass + bodyB.mass);

      const newBody = this.mergeCollision(bodyA, bodyB);

      collisionEvents.push({
        position: collisionPosition,
        mass: bodyA.mass + bodyB.mass,
        removedBodies: [bodyA, bodyB],
        newBody: newBody,
      });
    });

    return collisionEvents;
  }

  private mergeCollision(bodyA: Body, bodyB: Body): Body {
    // Zachowanie pędu: p_total = m1*v1 + m2*v2
    const totalMass = bodyA.mass + bodyB.mass;
    const newVelocity = new THREE.Vector3()
      .addScaledVector(bodyA.velocity, bodyA.mass)
      .addScaledVector(bodyB.velocity, bodyB.mass)
      .divideScalar(totalMass);

    // Nowa pozycja (środek masy)
    const newPosition = new THREE.Vector3()
      .addScaledVector(bodyA.position, bodyA.mass)
      .addScaledVector(bodyB.position, bodyB.mass)
      .divideScalar(totalMass);

    // Nowy radius z sumy objętości: V = 4/3 * π * r³
    // V_total = V_A + V_B → r_new = ∛(r_A³ + r_B³)
    const newRadius = Math.cbrt(Math.pow(bodyA.radius, 3) + Math.pow(bodyB.radius, 3));

    // Usuń oba ciała
    this.removeBody(bodyA.id);
    this.removeBody(bodyB.id);

    // Dodaj nowe połączone ciało
    const newBody = this.addBody({
      mass: totalMass,
      position: newPosition,
      velocity: newVelocity,
      radius: newRadius,
    });

    return newBody;
  }

  // ===== Konfiguracja =====

  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  // ===== Obliczenia energii (diagnostyka) =====

  calculateTotalEnergy(): number {
    let kineticEnergy = 0;
    let potentialEnergy = 0;

    // Energia kinetyczna: E_k = 0.5 * m * v^2
    this.bodies.forEach((body) => {
      const v2 = body.velocity.lengthSq();
      kineticEnergy += 0.5 * body.mass * v2;
    });

    // Energia potencjalna: E_p = -G * m1 * m2 / r
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];
        const distance = bodyA.position.distanceTo(bodyB.position);

        if (distance > this.config.minDistance) {
          potentialEnergy -= (this.config.G * bodyA.mass * bodyB.mass) / distance;
        }
      }
    }

    return kineticEnergy + potentialEnergy;
  }
}
