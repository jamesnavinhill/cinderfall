# Fireball Island 3D Browser Game Feasibility Report

Date: 2026-04-14

Status: Feasible, with one major non-technical caveat: IP/licensing

## Executive Summary

This project is very doable as a modern browser game.

The strongest technical direction is:

- `three.js` over raw `WebGL`
- `WebGLRenderer` first, with a renderer wrapper so we can evaluate `WebGPU` later without rewriting the game layer
- `TypeScript + Vite` for the client foundation
- `glTF/GLB` as the runtime asset format
- A logical board graph layered onto a 3D island, instead of a literal visible square grid
- A hybrid fireball system: authored hazard lanes and branch logic, with selective physics where it actually adds drama

The biggest real risk is not browser rendering. It is getting the board logic, camera readability, and fireball feel right while keeping the game unmistakably Fireball Island. The other major blocker is legal: the property is actively branded, and the Restoration Games rulebook explicitly says `Fireball Island` is a registered trademark of Longshore, Ltd. and used with permission. That means an internal prototype or homage is one thing; a public or commercial release is a separate licensing conversation.

## What We Need To Preserve

The original 1986 game DNA is clear:

- Players roll and move along trails toward the jewel at Vul-Kar Point.
- The first player to capture the jewel races for the Dock.
- Other players chase to steal it.
- Rolling a `1` triggers a fireball instead of normal movement.
- Caves and bridges create shortcut and choke-point behavior.

The 2018 Restoration Games version modernized the structure:

- The island became a network of paths instead of mostly one race track.
- Movement shifted from pure die-roll turns to action-card-driven turns.
- Fireballs became more directed and readable through Vul-Kar lane control.
- Win condition broadened to treasures, snapshots, and an extraction phase with the Hello-Copter.

That gives us a really useful design takeaway:

The spectacle is the brand, but the better version of the game is the one that gives players more agency over route choice, hazard timing, and escape pressure.

## Recommendation

### Use `three.js`, not raw `WebGL`

`WebGL` itself is the low-level graphics API. `three.js` sits above it and gives us the scene graph, cameras, materials, lights, shadows, loaders, and interaction primitives we actually need. The official three.js docs are very direct about this: three.js exists to make 3D on the web practical, while raw WebGL is extremely low-level. The three.js manual also makes an important point for us: three.js is a 3D library, not a complete game engine, so we still need to build the game systems ourselves.

That is exactly the sweet spot for this project.

Why this is the right fit:

- We want a custom board-game rules stack, not a one-size-fits-all engine abstraction.
- We need full camera movement, ray-based picking, asset loading, lighting, and eventual production models.
- We do **not** need to spend months building renderer basics that three.js already solves well.

### Start on `WebGLRenderer`, keep the door open for `WebGPU`

three.js currently supports both `WebGLRenderer` and `WebGPURenderer`. The docs note that the WebGPU renderer is the newer alternative and can fall back to a WebGL 2 backend, but for this project the safest production start is still `WebGLRenderer`.

Reason:

- Best browser compatibility and fewer surprises
- Mature tooling and docs
- More than enough visual capability for a stylized 3D board game

Recommended rule:

Keep rendering behind a thin app-facing layer so we can experiment with WebGPU later, but do not make WebGPU a milestone gate for first playable.

### Use `TypeScript + Vite`

For a clean browser-game codebase, `TypeScript + Vite` is the best foundation. Vite gives us a very fast dev server and HMR, and TypeScript helps keep the board rules, authored content, hazard definitions, and camera/config systems sane as the project grows.

### Use `glTF/GLB` as the asset contract

This is a very strong fit for the eventual "real assets later" requirement.

Why:

- three.js has first-party `GLTFLoader` support
- glTF is designed as a runtime delivery format, not just an authoring format
- It is efficient, interoperable, and built for real-time scenes, materials, animations, and hierarchy

That means we can graybox now, then later replace placeholders with real island pieces, players, hazards, and props without reworking the whole runtime.

## Feasibility Verdict By Area

### 1. Rendering and Camera

Feasibility: High

Full camera movement is easy enough technically. The challenge is not "can the browser do it?" but "can the camera stay readable during a small, vertical, obstacle-heavy board game?"

Recommended camera model:

- Free orbit camera for exploration and board awareness
- Smart focus target that snaps to active pawn, hazard lane, or destination
- Limited pitch and collision handling so the camera never buries itself in terrain
- Optional quick-focus hotkeys for active player and Vul-Kar
- Minimal cinematic moments only for major fireball launches or knockdowns

This should feel like a premium toy board viewed in 3D, not like a third-person action game.

### 2. Board Movement

Feasibility: High

Even though we called it "grid based," the best technical interpretation is not a visible square grid. Fireball Island is path-based. So the board should use a **logical graph**:

- Nodes: legal standing spaces
- Edges: legal movement connections
- Metadata per node: elevation, tags, occupancy, cave entry, bridge, hazard exposure, camera hint
- Metadata per edge: movement cost, one-way restrictions, hazard lane crossing, scripted transitions

This gives us all the upside of a grid-based system:

- deterministic movement
- easy rules evaluation
- clean turn previews
- robust AI or hint support later

while still matching the actual feel of the board.

### 3. Fireball Simulation

Feasibility: Medium-High

This is the make-or-break system.

A fully free rigid-body marble simulation rolling across a detailed island sounds cool, but it is not the best first target if we want readable, controllable, replayable gameplay. The real board game works because the mountain and channels heavily shape the outcome.

Recommended approach: hybrid hazard simulation

- Author explicit fireball lanes and branch points
- Allow weighted routing at forks
- Simulate travel along guides/splines/guide volumes
- Use collision checks against player hit volumes and trigger zones
- Use selective rigid-body or bounce behavior only where it improves spectacle

Why this is better than "real physics everywhere":

- Easier tuning
- More faithful to the board-game feel
- Better for multiplayer determinism later
- Easier to telegraph to the player
- Much easier to test

If we want extra chaos, we can add "loose" behavior in defined sections after the lane system is already solid.

### 4. Asset Readiness

Feasibility: High

This project is a strong match for placeholder-first production:

- Graybox the island in simple modular geometry
- Use primitive or low-poly stand-ins for pawns, hazards, props
- Lock the rules, movement, camera, and hazard systems
- Swap in production assets later through `glTF/GLB`

That is exactly how we should build this. Systems first, assets second.

### 5. UI

Feasibility: High

Minimal overlays are a feature, not a constraint.

Recommended UI stack:

- DOM/CSS overlays for HUD, menus, and settings
- Keep the 3D view dominant
- No heavy in-scene UI unless it earns its place

Required rule from day one:

- All developer overlays hidden with `F1`

That includes:

- perf stats
- debug labels
- nav graph view
- collision shapes
- spawn/hazard editors
- input traces

This should be centralized behind one debug visibility service, not scattered toggle code.

### 6. Multiplayer

Feasibility: High for turn-based, Medium for polished online presentation

Because the underlying game is turn-based, online play is much easier than for an action game.

Recommended order:

- local hotseat / same-screen first
- deterministic turn/state model second
- async or live online multiplayer later

We should not let networking become the first foundation milestone.

## Recommended Technical Shape

### Core Runtime Principles

- Data-driven board definition
- Deterministic turn resolution
- Strict separation between game state and presentation
- Graybox-friendly systems
- Asset loaders and materials isolated from rules logic
- Debug tooling built in, but hidden behind `F1`

### Suggested Initial Repository Shape

The repo now has the doc structure in place and a reserved `apps/web` install target.

Recommended implementation shape once development starts:

```text
apps/
  web/
    src/
      app/          # bootstrapping, shell, lifecycle
      game/         # turn flow, rules, win conditions
      board/        # nodes, edges, occupancy, authored board data
      render/       # scene setup, lighting, cameras, materials, loaders
      hazards/      # fireballs, bridge events, knockdowns, triggers
      entities/     # pawns, props, interactables
      input/        # mouse, keyboard, touch, selection
      ui/           # minimal overlays and menus
      debug/        # all dev-only visualizations and toggles
      content/      # JSON/TS board definitions and tuning values
```

### Systems We Should Build Early

1. App shell and update loop
2. Board graph and movement rules
3. Camera controller
4. Selection and path preview
5. Fireball lane prototype
6. Pawn knockdown / recovery rules
7. Minimal HUD
8. Saveable debug scenarios

## Gameplay Direction Recommendation

For the very first playable, do **not** try to implement every historical rule from every edition.

Instead, build around this high-confidence loop:

1. Start on the island edge / staging zone
2. Move along authored board nodes
3. Climb, risk shortcuts, and contest choke points
4. Trigger or survive fireballs
5. Claim the objective at the mountain
6. Escape via extraction route

That keeps the "escape Fireball Island" fantasy intact while we evaluate which classic mechanics deserve to stay, which restoration-era ideas improve agency, and where we want our own house rules.

## Risks

### 1. IP / Licensing Risk

Highest risk outside engineering.

This should be treated as:

- safe enough for internal prototype exploration
- not safe to assume for public commercial release without rights clarity

### 2. Camera Readability Risk

A free camera can actually hurt a board game if it obscures routes, distances, or hazard lanes. Camera rules matter as much as camera freedom.

### 3. Physics Feel Risk

If fireballs are too scripted, they feel fake. If they are too physical, they become unreadable and impossible to balance. The hybrid system is the right compromise, but it will need tuning.

### 4. Scope Creep Risk

Because the board is so toy-like, it will be tempting to add lots of dynamic props, reactive set pieces, character abilities, destructibles, weather, cinematics, and online features too early.

We should resist that until the base loop is fun in graybox.

## Recommended Milestone Order

### Phase 0: Rules Capture

- Document the original and restoration mechanics we care about
- Decide the first playable ruleset
- Define the "must feel like Fireball Island" checklist

### Phase 1: Graybox Foundation

- Install `apps/web`
- Build renderer shell, camera, board graph, selection, movement preview
- Build debug views and `F1` overlay toggle

### Phase 2: Hazard Prototype

- Implement Vul-Kar fireball launcher logic
- Implement branchable hazard lanes
- Implement knockdown, steal/drop, and reset rules

### Phase 3: First Complete Escape Loop

- Objective capture
- Escape route
- Turn flow
- HUD
- Win/loss conditions

### Phase 4: Asset-Ready Production Pass

- glTF pipeline
- placeholder replacement rules
- lighting/material conventions
- content authoring standards

### Phase 5: Expanded Play

- extra routes
- additional hazards
- house-rule variants
- online turn sync if wanted

## Final Recommendation

We should move forward.

The project is technically feasible, browser-appropriate, and a very good fit for a `three.js` production approach. The right way to build it is:

- discrete board logic under the hood
- rich 3D presentation on top
- hybrid authored hazard simulation
- minimal UI
- strong debug tooling
- asset-pipeline discipline from the start

If we stay disciplined about scope and treat the board as a data-driven system instead of a one-off scene, this can become a very strong browser game foundation and remain ready for real models, textures, and polish later.

## Research Sources

- [Three.js Fundamentals](https://threejs.org/manual/en/fundamentals.html)
- [Three.js: Making a Game](https://threejs.org/manual/en/game.html)
- [Three.js WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js WebGPURenderer docs](https://threejs.org/docs/pages/WebGPURenderer.html)
- [Three.js GLTFLoader docs](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js OrbitControls docs](https://threejs.org/docs/pages/OrbitControls.html)
- [Three.js Raycaster docs](https://threejs.org/docs/pages/Raycaster.html)
- [Three.js InstancedMesh docs](https://threejs.org/docs/pages/InstancedMesh.html)
- [MDN WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [Khronos glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [Rapier official site](https://rapier.rs/)
- [Original Fireball Island rules PDF (Hasbro)](https://www.hasbro.com/common/instruct/Fireball_Island.pdf)
- [Restoration Games main rulebook PDF](https://restorationgames.com/wp-content/uploads/2018/09/Fireball_Island-MainGame_Rules-two-page.pdf)
- [Restoration Games design diary: Wild Fire](https://restorationgames.com/wild-fire/)
- [Restoration Games design diary: Pack Your Bags (and Sign the Waiver)](https://restorationgames.com/pack-bags-sign-waiver/)
- [Restoration Games design diary: Say Goodbye to the Hello-Copter](https://restorationgames.com/say-goodbye-hello-copter/)
- [Restoration Games product page](https://restorationgames.com/shop/fireball-island-the-curse-of-vul-kar/)
