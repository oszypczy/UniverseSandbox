# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive gravitational N-body simulation built with React, TypeScript, Three.js, and Vite. Users can create celestial bodies by clicking and dragging in a 3D space, and watch them interact under gravitational forces with visual effects including collision particles and flash effects.

## Custom Commands

This project includes professional Git workflow automation commands:

- **`/commit`**: Creates professional commits following Conventional Commits specification
- **`/pr`**: Creates feature branches and pull requests with detailed descriptions
- **`/review-structure`**: Reviews frontend architecture and code quality

See `.claude/commands/README.md` for detailed usage and examples.

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

## Deployment

The project is deployed to GitHub Pages automatically on push to `main` branch.

**Live URL**: https://oszypczy.github.io/UniverseSandbox/

**Configuration**:

- `vite.config.ts`: `base: '/UniverseSandbox/'` for correct asset paths
- `.github/workflows/deploy.yml`: GitHub Actions workflow for automated deployment

## Architecture

### Core Components

**PhysicsEngine** (`src/engine/PhysicsEngine.ts`): The heart of the simulation

- Manages all celestial bodies and their physics calculations
- Uses Newton's law of gravitation: F = G \* m1 \* m2 / r²
- **Velocity Verlet integration method** with **adaptive substepping** for accurate motion updates
- Handles collisions by merging bodies (conservation of momentum)
- Returns collision events for visual effects rendering
- Key methods: `addBody()`, `update()`, `calculateGravitationalForces()`, `handleCollisions()`
- **Recent improvements**: Multi-collision handling, event propagation system, Velocity Verlet integration

**useSimulation** (`src/hooks/useSimulation.ts`): React hook bridging physics and rendering

- Owns the PhysicsEngine instance
- Drives the animation loop with requestAnimationFrame
- Manages trail visualization for bodies
- Handles collision visual effects (flash effects, particle explosions)
- Exposes API: `addBody()`, `removeAllBodies()`, `reset()`, `getBodyCount()`, `notifyBodyCountChange()`
- **Recent improvements**: Collision event handling, particle system management, body count callbacks

**Scene3D** (`src/components/Scene3D.tsx`): Three.js scene management

- Initializes and owns the Three.js scene, camera, renderer
- Uses OrbitControls for camera manipulation
- Integrates mouse interaction for creating bodies
- Implements two interaction modes: 'edit' (create bodies) and 'camera' (pan/rotate view)

**useMouseInteraction** (`src/hooks/useMouseInteraction.ts`): User input handling

- Converts 2D screen coordinates to 3D world space via raycasting
- **Click-and-drag interaction**: starting point = position, drag distance = radius (size)
- **Double-click**: creates stationary body with default size at clicked position
- **Single click on body**: selects body for editing (opens BodyEditor)
- Shows visual feedback (wireframe preview sphere showing size)
- Raycasting for body selection in 3D space
- Plane for body placement is always perpendicular to camera direction (works from any angle)

**App.tsx**: Top-level state coordinator

- Manages UI state (timeScale, isPaused, showTrails, showVelocityVectors, interactionMode, selectedBodyId)
- Coordinates Scene3D, ControlPanel, BodyEditor, HUD, and KeyboardShortcuts
- Exposes reset and clear operations via Scene3DHandle ref
- Handles body selection and updates
- Keyboard shortcuts handling (Space, R, Tab, Escape, H, ?)
- Wrapped in ErrorBoundary for graceful error handling

**BodyEditor** (`src/components/BodyEditor.tsx`): Interactive body editing component

- Draggable panel for editing selected celestial bodies
- Real-time mass, radius, and velocity adjustment (independent controls)
- Values update in real-time during simulation (except when field is focused)
- Delete functionality for individual bodies
- Text inputs with apply-on-blur for better UX

**KeyboardShortcuts** (`src/components/KeyboardShortcuts.tsx`): Keyboard shortcuts overlay

- Displays available shortcuts in bottom-right corner
- Toggle visibility with ? key
- Shows: Space (pause), R (reset), Del (delete), Tab (mode), Esc (close), H (HUD), ? (shortcuts)

**ErrorBoundary** (`src/components/ErrorBoundary.tsx`): Error handling component

- Catches rendering errors from Three.js or React components
- Displays user-friendly error message with technical details
- Provides reload functionality for recovery
- **New addition**: Improves app stability and user experience

### Data Flow

**Body Creation:**

1. User drags in canvas → `useMouseInteraction` captures mouse events
2. On release → calculates position and velocity → calls `onBodyCreate`
3. `Scene3D` → calls simulation's `addBody()`
4. `useSimulation` → forwards to `PhysicsEngine.addBody()` → creates body with mesh
5. Mesh added to Three.js scene
6. `notifyBodyCountChange()` called to update UI

**Animation Loop:**

1. `useSimulation.animate()` called via requestAnimationFrame
2. `PhysicsEngine.update()` → calculates forces → updates positions → detects collisions
3. Returns collision events array
4. For each collision event:
   - Remove old body meshes from scene
   - Add new merged body mesh to scene
   - Create flash effect on new body
   - Spawn particle explosion at collision point
5. Update trails if enabled
6. Update visual effects (flash, particles)
7. Sync all body mesh positions with physics
8. Render scene

### Key Files

**Types & Interfaces:**

- `src/types/index.ts`: All TypeScript interfaces (Body, PhysicsBody, SimulationConfig, Preset, ParticleSystem)
  - **ParticleSystem**: New interface for collision particle effects (extends THREE.Points)

**Utilities:**

- `src/utils/constants.ts`: Physics constants (G=0.5, MIN_DISTANCE, MAX_TRAIL_LENGTH)
- `src/utils/helpers.ts`: Utility functions (calculateRadius, getColorByMass, color interpolation)
- `src/utils/presets.ts`: Predefined scenarios (binary systems, solar system, three-body problem)

**Commands:**

- `.claude/commands/commit.md`: Automated professional git commits
- `.claude/commands/pr.md`: Automated pull request creation
- `.claude/commands/review-structure.md`: Architecture review
- `.claude/commands/README.md`: Complete command documentation

## Physics Details

**Gravitational constant**: `G = 0.5` (scaled for visualization, not real-world physics)

**Integration method**: Velocity Verlet with adaptive substepping

- More accurate than Euler method, preserves energy better
- Adaptive timestep: divides large timesteps into smaller substeps for stability
- Acceleration: `a = F / m`
- Position: `p_new = p_old + v * dt + 0.5 * a * dt²`
- Velocity: `v_new = v_old + 0.5 * (a_old + a_new) * dt`
- Substeps used when bodies are close or moving fast

**Collision detection**: Multi-collision handling with event system

- Distance check between all pairs: `distance < radius_A + radius_B`
- Handles multiple simultaneous collisions in single frame
- Prevents duplicate collision processing via ID tracking
- Returns collision events with old/new body information

**Collision response**:

- New mass: `m_total = m1 + m2`
- New velocity: conserves momentum `v = (m1*v1 + m2*v2) / m_total`
- New position: center of mass
- New radius: calculated from sum of volumes `r_new = ∛(r1³ + r2³)`

**Visual effects**:

- Body radius is independent from mass (can be set separately)
- Default radius calculated from `log(mass)` when not specified
- Color gradient: blue (small mass) → yellow (medium) → red (large)
- **Star glow effect**: Pulsating emissive glow for larger bodies
- Trails: max 100 points, stored per-body, rendered as Three.js Line (can be toggled on/off)
- **Velocity vectors**: Optional arrows showing velocity magnitude and direction (toggle in UI)
- **Collision flash**: Glowing effect on merged body (0.5s duration)
- **Particle explosion**: Orange particles with physics (gravity, fade-out) at collision point
- Particles: 50 max, spherical emission, 1-second lifetime
- **Selected body highlight**: Visual feedback when body is selected for editing

## Interaction Modes

**Edit mode** ('edit'): Default, allows creating and editing bodies

- **Click and drag**: Create a body - drag distance sets radius (size)
- **Double-click**: Create stationary body with default size at clicked position
- **Single click on body**: Select body for editing (opens BodyEditor panel)
- OrbitControls disabled during drag
- Can still rotate camera when not dragging
- Bodies can be placed from any camera angle (plane perpendicular to view direction)

**Camera mode** ('camera'): Pure navigation

- Body creation and selection disabled
- Full OrbitControls enabled (pan, rotate, zoom)
- Use for exploring large simulations without accidental body creation

Toggle between modes via ControlPanel (Edit/Camera button) or Tab key

## Keyboard Shortcuts

- **Space**: Pause/Resume simulation
- **R**: Reset simulation (reload preset or clear all)
- **Delete/Backspace**: Delete selected body
- **Tab**: Toggle Edit/Camera mode
- **Escape**: Close body editor
- **H**: Toggle HUD visibility
- **?**: Toggle keyboard shortcuts panel

## Common Development Patterns

**When adding new physics features:**

1. Modify `PhysicsEngine.ts` calculation methods
2. Update constants in `src/utils/constants.ts` if needed
3. Ensure `PhysicsEngine.update()` loop remains performant (O(n²) for forces)
4. If visual effects needed, handle in `useSimulation` collision event loop

**When adding UI controls:**

1. Add state to `App.tsx`
2. Pass props to `ControlPanel.tsx`
3. If affects simulation, pass through to `Scene3D` → `useSimulation` → `PhysicsEngine.updateConfig()`
4. Use callbacks for state updates (not setTimeout hacks)

**When adding presets:**

1. Define in `src/utils/presets.ts` following `Preset` interface
2. Add UI in ControlPanel to load preset
3. Use `removeAllBodies()` then add each body from preset

**When adding visual effects:**

1. Define types in `src/types/index.ts` (e.g., ParticleSystem)
2. Add refs to `useSimulation` for effect tracking
3. Create effect functions (createEffect, updateEffect)
4. Integrate into animation loop
5. Clean up in `removeAllBodies()`

**Git workflow:**

1. Use `/commit` command for professional commits (follows Conventional Commits)
2. Use `/pr` command to create feature branch and pull request
3. Commit types: feat, fix, refactor, chore, docs, style, perf, test
4. Branch naming: feat/description, fix/description, etc.

## Performance Considerations

- Gravitational force calculation is O(n²) - performance degrades with many bodies
- Current limit: MAX_BODIES = 100
- Trail rendering: each body draws a Three.js Line with up to 100 points
- Consider using instanced rendering if creating many similar bodies
- Delta time capped at 0.1s to prevent physics explosions on lag spikes

## Code Style

- TypeScript strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- React 19 with hooks (no class components)
- Three.js manual setup (not using React Three Fiber)
- All units are dimensionless (scaled for visualization)
- Comments use Polish in documentation files, but code/comments in implementation are mixed
- **Type safety**: No `any` types - use proper interfaces (e.g., `ParticleSystem`)
- **Error handling**: ErrorBoundary wraps main app for graceful failures

## Recent Improvements (2025)

### Code Quality & Type Safety

- ✅ Removed all `any` types, replaced with proper interfaces
- ✅ Fixed unused variable/import TypeScript errors
- ✅ Added `ParticleSystem` interface for type-safe particle effects
- ✅ Eliminated `setTimeout` hacks, replaced with proper callbacks

### Architecture & Stability

- ✅ Added `ErrorBoundary` component for graceful error handling
- ✅ Implemented proper state management via callbacks (`notifyBodyCountChange`)
- ✅ Refactored collision system to use event propagation
- ✅ Multi-collision handling (prevents duplicate processing)

### Visual Effects

- ✅ Collision flash effects (glowing merged bodies)
- ✅ Particle explosion system at collision points
- ✅ Proper cleanup of visual effects on reset
- ✅ Fixed ghost body rendering bug
- ✅ Velocity vectors visualization (toggleable)
- ✅ Star glow effect with pulsation
- ✅ Selected body highlighting

### User Experience

- ✅ Interactive body editor (BodyEditor component)
- ✅ Real-time mass and velocity adjustment
- ✅ Body selection by clicking
- ✅ Double-click to create stationary bodies
- ✅ Improved interaction modes (Edit/Camera)

### Physics Improvements

- ✅ Upgraded to Velocity Verlet integration method
- ✅ Adaptive substepping for stability
- ✅ Better energy conservation
- ✅ More accurate orbital mechanics

### Developer Experience

- ✅ Added `/commit` command for automated professional commits
- ✅ Added `/pr` command for automated pull request creation
- ✅ Added `/review-structure` for architecture reviews
- ✅ Comprehensive command documentation
- ✅ Fixed all TypeScript build errors

## Known Limitations

- Gravitational calculations are O(n²), performance degrades with >50 bodies
- No spatial partitioning (quadtree/octree) for collision optimization
- Delta time capped at 0.1s may cause issues with very low framerates
- No Web Workers for physics calculations
- Large bundle size (745KB) due to Three.js - consider code splitting for production
- Only 3 preset scenarios available

## Future Development Roadmap

### Phase 1: Enhanced UX (Completed)

- ✅ **Tutorial/Help overlay** - First-time user guidance
- ✅ **HUD component** - FPS counter, body count, bound/unbound system status
- ✅ **Keyboard shortcuts** - Space (pause), R (reset), Delete (remove), Tab (mode switch), H (HUD), ? (shortcuts)
- ✅ **Keyboard shortcuts panel** - Visual overlay showing all available shortcuts
- ✅ **Pause functionality** - Space key and button to pause/resume simulation
- ✅ **Independent radius control** - Body size separate from mass
- ✅ **Real-time value updates** - BodyEditor shows live values during simulation
- ✅ **GitHub Pages deployment** - Automated deployment via GitHub Actions
- 🚧 **More presets** - Solar system (8 planets), Binary system, Spiral galaxy

### Phase 2: Gamification (Planned)

- 🎯 **Challenge system** - Missions with objectives (e.g., "Create stable 3-body orbit")
- 🎯 **Statistics tracking** - Longest simulation, most collisions, highest energy
- 🎯 **Achievement system** - Unlock new colors, effects, or presets
- 🎯 **Gravity Golf mode** - Hit targets using gravitational assists
- 🎯 **Survival mode** - Dodge incoming asteroids
- 🎯 **Save/load system** - localStorage-based scenario gallery

### Phase 3: Advanced Features (Future)

- ⚡ **Barnes-Hut optimization** - O(n log n) gravity calculations for 500+ bodies
- ⚡ **Web Workers** - Physics calculations in separate thread
- ⚡ **Instanced rendering** - Efficient rendering for thousands of asteroids
- 🎨 **Advanced visuals** - Comet tails, planetary rings, atmospheres, gravitational lensing
- 🎨 **Skybox backgrounds** - Space environments, nebulae, galaxies
- 🎨 **Planetary textures** - Rocky, gaseous, icy body types
- 🔊 **Sound effects** - Optional audio for collisions and interactions (toggleable)
- 📊 **Energy graph** - Real-time plot of total energy over time
- 🌌 **Scenario editor** - Visual tool for creating custom presets

### Phase 4: Performance & Polish (Future)

- 🔧 **Code splitting** - Reduce initial bundle size
- 🔧 **Level of Detail (LOD)** - Simplified meshes for distant objects
- 🔧 **Octree collision detection** - Faster collision checks
- 🔧 **Mobile support** - Touch controls and responsive UI
- 🔧 **Internationalization** - Multiple language support

**Legend**: ✅ Completed | 🚧 In Progress | 🎯 Planned | ⚡ Performance | 🎨 Visual | 🔊 Audio | 📊 Data | 🌌 Tools | 🔧 Technical
