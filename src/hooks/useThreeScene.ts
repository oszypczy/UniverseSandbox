import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { InteractionMode } from '../types';
import { COLORS } from '../utils/constants';

interface UseThreeSceneReturn {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
}

interface UseThreeSceneProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  interactionMode: InteractionMode;
}

export function useThreeScene({
  canvasRef,
  interactionMode,
}: UseThreeSceneProps): UseThreeSceneReturn {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);

  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // ===== Scena =====
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(COLORS.BACKGROUND);

    // ===== Pole gwiazdowe =====
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Generuj losowe pozycje gwiazd
    const starsCount = 5000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;

      // Losowa pozycja w sferze
      const radius = 300 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Losowy kolor gwiazdy (odcienie bieli/niebieskiego)
      const colorVariation = 0.8 + Math.random() * 0.2;
      colors[i3] = colorVariation;
      colors[i3 + 1] = colorVariation;
      colors[i3 + 2] = 0.9 + Math.random() * 0.1; // Lekko niebieskawa
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starField = new THREE.Points(starsGeometry, starsMaterial);
    newScene.add(starField);

    // Mgła dla efektu głębi
    newScene.fog = new THREE.FogExp2(COLORS.BACKGROUND, 0.0005);

    // ===== Kamera =====
    const aspect = window.innerWidth / window.innerHeight;
    const newCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    newCamera.position.set(0, 30, 50);
    newCamera.lookAt(0, 0, 0);

    // ===== Renderer =====
    const newRenderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ===== Oświetlenie =====

    // Minimalne światło otoczenia - większość światła pochodzi od Słońca
    const ambientLight = new THREE.AmbientLight(0x111122, 0.15);
    newScene.add(ambientLight);

    // ===== Kontrole kamery (OrbitControls) =====
    const newControls = new OrbitControls(newCamera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.minDistance = 10;
    newControls.maxDistance = 500;
    newControls.enablePan = true;
    newControls.panSpeed = 1.0;
    newControls.screenSpacePanning = true;

    // Kontrole są aktywne tylko w trybie camera
    newControls.enabled = interactionMode === 'camera';

    // ===== Siatka pomocnicza (opcjonalna) =====
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    gridHelper.position.y = -20;
    newScene.add(gridHelper);

    // ===== Handle window resize =====
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      newCamera.aspect = width / height;
      newCamera.updateProjectionMatrix();

      newRenderer.setSize(width, height);
      newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // ===== Animation loop dla controls =====
    const animate = () => {
      newControls.update();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Set state
    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);
    setControls(newControls);

    // ===== Cleanup =====
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      newControls.dispose();
      newRenderer.dispose();

      // Cleanup scene
      newScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    };
  }, [canvasRef]);

  // Dynamiczne przełączanie OrbitControls gdy zmienia się tryb
  useEffect(() => {
    if (controls) {
      // eslint-disable-next-line react-hooks/immutability
      controls.enabled = interactionMode === 'camera';
    }
  }, [controls, interactionMode]);

  return { scene, camera, renderer, controls };
}
