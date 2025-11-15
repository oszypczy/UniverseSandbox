import * as THREE from 'three';
import type { Body, SimulationConfig } from '../types';
import { PHYSICS_CONSTANTS } from '../utils/constants';
import { calculateRadius, getColorByMass, generateId } from '../utils/helpers';

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
  }): Body {
    const id = generateId();
    
    // Geometria - rozmiar zależy od masy
    const radius = calculateRadius(params.mass);
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    
    // Materiał - kolor zależy od masy
    const color = params.color ?? getColorByMass(params.mass);
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      shininess: 30,
      specular: 0x555555,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(params.position);
    
    const body: Body = {
      id,
      mass: params.mass,
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
    const index = this.bodies.findIndex(b => b.id === id);
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
    const bodyIds = this.bodies.map(b => b.id);
    bodyIds.forEach(id => this.removeBody(id));
  }

  getBodies(): Body[] {
    return this.bodies;
  }

  getBodyCount(): number {
    return this.bodies.length;
  }

  // ===== Główna pętla symulacji =====

  update(deltaTime: number): void {
    const dt = deltaTime * this.config.timeScale;
    
    // Reset przyspieszenia
    this.bodies.forEach(body => {
      body.acceleration.set(0, 0, 0);
    });
    
    // Oblicz siły grawitacyjne
    this.calculateGravitationalForces();
    
    // Aktualizuj pozycje i prędkości
    this.bodies.forEach(body => {
      this.integrateMotion(body, dt);
    });
    
    // Sprawdź kolizje
    if (this.config.collisionsEnabled) {
      this.handleCollisions();
    }
    
    // Aktualizuj meshe
    this.bodies.forEach(body => {
      body.mesh.position.copy(body.position);
    });
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
        const delta = new THREE.Vector3().subVectors(
          bodyB.position,
          bodyA.position
        );
        
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

  private integrateMotion(body: Body, dt: number): void {
    // Metoda Eulera (prosta, ale wystarczająca)
    // v_new = v_old + a * dt
    body.velocity.addScaledVector(body.acceleration, dt);
    
    // p_new = p_old + v * dt
    body.position.addScaledVector(body.velocity, dt);
  }

  private handleCollisions(): void {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];
        
        const distance = bodyA.position.distanceTo(bodyB.position);
        const radiusA = calculateRadius(bodyA.mass);
        const radiusB = calculateRadius(bodyB.mass);
        
        // Kolizja wykryta
        if (distance < radiusA + radiusB) {
          this.mergeCollision(bodyA, bodyB);
          return; // Wychodzimy, żeby nie iterować po zmodyfikowanej tablicy
        }
      }
    }
  }

  private mergeCollision(bodyA: Body, bodyB: Body): void {
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
    
    // Usuń oba ciała
    this.removeBody(bodyA.id);
    this.removeBody(bodyB.id);
    
    // Dodaj nowe połączone ciało
    this.addBody({
      mass: totalMass,
      position: newPosition,
      velocity: newVelocity,
    });
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
    this.bodies.forEach(body => {
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