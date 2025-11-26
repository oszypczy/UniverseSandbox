import { useEffect, useState, useRef } from 'react';

/**
 * Hook to track FPS (frames per second)
 * Updates FPS every 500ms based on frame count
 */
export function useFPS(): number {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    // Initialize lastTimeRef on mount
    lastTimeRef.current = performance.now();

    let animationFrameId: number;

    const updateFPS = () => {
      frameCountRef.current++;

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;

      // Update FPS every 500ms
      if (deltaTime >= 500) {
        const currentFps = (frameCountRef.current / deltaTime) * 1000;
        setFps(currentFps);

        // Reset counters
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return fps;
}
