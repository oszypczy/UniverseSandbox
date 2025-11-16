# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive gravitational N-body simulation built with React, TypeScript, Three.js, and Vite. Users can create celestial bodies by clicking and dragging in a 3D space, and watch them interact under gravitational forces.

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production (runs TypeScript compiler then Vite build)
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Architecture

### Core Components

**PhysicsEngine** (`src/engine/PhysicsEngine.ts`): The heart of the simulation
- Manages all celestial bodies and their physics calculations
- Uses Newton's law of gravitation: F = G * m1 * m2 / r²
- Euler integration method for motion updates
- Handles collisions by merging bodies (conservation of momentum)
- Key methods: `addBody()`, `update()`, `calculateGravitationalForces()`, `handleCollisions()`

**useSimulation** (`src/hooks/useSimulation.ts`): React hook bridging physics and rendering
- Owns the PhysicsEngine instance
- Drives the animation loop with requestAnimationFrame
- Manages trail visualization for bodies
- Exposes API: `addBody()`, `removeAllBodies()`, `reset()`, `getBodyCount()`

**Scene3D** (`src/components/Scene3D.tsx`): Three.js scene management
- Initializes and owns the Three.js scene, camera, renderer
- Uses OrbitControls for camera manipulation
- Integrates mouse interaction for creating bodies
- Implements two interaction modes: 'edit' (create bodies) and 'camera' (pan/rotate view)

**useMouseInteraction** (`src/hooks/useMouseInteraction.ts`): User input handling
- Converts 2D screen coordinates to 3D world space via raycasting
- Click-and-drag interaction: starting point = position, drag vector = initial velocity
- Shows visual feedback (preview sphere, velocity arrow)

**App.tsx**: Top-level state coordinator
- Manages UI state (mass, timeScale, showTrails, isPaused)
- Coordinates Scene3D and ControlPanel
- Exposes reset and clear operations via Scene3DHandle ref

### Data Flow

1. User drags in canvas → `useMouseInteraction` captures mouse events
2. On release → calculates position and velocity → calls `onBodyCreate`
3. `Scene3D` → calls simulation's `addBody()`
4. `useSimulation` → forwards to `PhysicsEngine.addBody()` → adds mesh to Three.js scene
5. Animation loop → `PhysicsEngine.update()` → calculates forces → updates positions
6. Meshes sync with physics positions → renderer draws frame

### Key Files

- `src/types/index.ts`: All TypeScript interfaces (Body, SimulationConfig, Preset, etc.)
- `src/utils/constants.ts`: Physics constants (G=0.5, MIN_DISTANCE, MAX_TRAIL_LENGTH)
- `src/utils/helpers.ts`: Utility functions (calculateRadius, getColorByMass, color interpolation)
- `src/utils/presets.ts`: Predefined scenarios (binary systems, solar system, three-body problem)

## Physics Details

**Gravitational constant**: `G = 0.5` (scaled for visualization, not real-world physics)

**Integration method**: Semi-implicit Euler
- Acceleration: `a = F / m`
- Velocity: `v_new = v_old + a * dt`
- Position: `p_new = p_old + v * dt`

**Collision detection**: Simple distance check between all pairs
- If `distance < radius_A + radius_B` → merge bodies
- New mass: `m_total = m1 + m2`
- New velocity: conserves momentum `v = (m1*v1 + m2*v2) / m_total`
- New position: center of mass

**Visual details**:
- Body radius scales with `log(mass)` for better visualization
- Color gradient: blue (small mass) → yellow (medium) → red (large)
- Trails: max 100 points, stored per-body, rendered as Three.js Line

## Interaction Modes

**Edit mode** ('edit'): Default, allows creating bodies
- Click and drag to create a body with initial velocity
- OrbitControls disabled during drag

**Camera mode** ('camera'): Pure navigation
- Body creation disabled
- Full OrbitControls enabled (pan, rotate, zoom)

Toggle between modes via ControlPanel

## Common Development Patterns

When adding new physics features:
1. Modify `PhysicsEngine.ts` calculation methods
2. Update constants in `src/utils/constants.ts` if needed
3. Ensure `PhysicsEngine.update()` loop remains performant (O(n²) for forces)

When adding UI controls:
1. Add state to `App.tsx`
2. Pass props to `ControlPanel.tsx`
3. If affects simulation, pass through to `Scene3D` → `useSimulation` → `PhysicsEngine.updateConfig()`

When adding presets:
1. Define in `src/utils/presets.ts` following `Preset` interface
2. Add UI in ControlPanel to load preset
3. Use `removeAllBodies()` then add each body from preset

## Performance Considerations

- Gravitational force calculation is O(n²) - performance degrades with many bodies
- Current limit: MAX_BODIES = 100
- Trail rendering: each body draws a Three.js Line with up to 100 points
- Consider using instanced rendering if creating many similar bodies
- Delta time capped at 0.1s to prevent physics explosions on lag spikes

## Code Style

- TypeScript strict mode enabled
- React 19 with hooks (no class components)
- Three.js manual setup (not using React Three Fiber)
- All units are dimensionless (scaled for visualization)
- Comments use Polish in documentation files, but code/comments in implementation are mixed
