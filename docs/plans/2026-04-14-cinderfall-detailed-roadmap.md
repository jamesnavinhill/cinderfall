# Cinderfall Detailed Roadmap

Date: 2026-04-14

Status: Active roadmap for preproduction and first implementation

## Progress Snapshot

Completed on 2026-04-14:

- Phase 0: Preproduction Lock
- Phase 1: Project Bootstrap
- Phase 2: Board Graph and Navigation

Current focus:

- Phase 3: Card Turn System

Implemented so far:

- Vite + TypeScript + three.js app foundation
- modular app, render, board, game, debug, input, and UI layers
- full camera movement with reset support
- `F1` debug visibility toggle
- graybox `Mount Cinder` scene and authored board graph
- clickable node picking
- legal route preview
- deterministic navigation move resolution
- occupancy rule with shared dock/start behavior
- danger-space volcano meter gain on move end

## Planning Defaults

This roadmap assumes the following project direction is now active:

- Theme: `mythic volcano danger`
- Players: `4`
- Priority: `gameplay feel first`, with obvious seams for later assets
- Interaction tone: `chaotic but funny`
- Multiplayer: `important from the start`
- AI opponents: `supported`
- AI service design: `agnostic model router`

## Roadmap Goal

Build `Cinderfall` as a robust 3D browser board game with:

- strong graybox gameplay
- clean multiplayer-ready state systems
- asset-ready rendering architecture
- minimal UI
- debug tooling hidden with `F1`
- room for both deterministic bots and model-routed AI personalities later

## Design Pillars

The roadmap should protect these pillars:

- The board must feel dangerous, vertical, and legible
- The turn loop must stay fast and satisfying
- Hazards must create drama, not unreadable noise
- The project must be modular enough to accept real art without rewrite
- Multiplayer concerns must shape architecture early, even if online play lands later than local play

## Core Product Direction

### Theme and Tone

`Cinderfall` should feel like a mythic volcanic scramble, not a parody and not a grim survival game.

Target tone:

- molten danger
- ancient cursed mountain energy
- theatrical disasters
- funny reversals and betrayals
- readable, toy-like spectacle

That means the world can be dramatic without becoming visually muddy or mechanically cruel.

### Rules Direction

The first playable remains:

- 4-player turn-based board game
- card-driven movement
- shared volcano meter
- authored `Ember Boulder` hazard lanes
- race to claim the `Heartstone` and escape at `Smuggler's Dock`

### Multiplayer Direction

We should architect for multiplayer immediately, even if the earliest playable is local-only.

That means:

- authoritative shared game state model
- deterministic action resolution
- replayable turn log
- serialized actions and state snapshots
- presentation cleanly separated from rules

### AI Direction

There should be two AI layers over time:

1. `Bot AI`
   This is the real gameplay AI for reliable opponents, testing, and offline play.

2. `Model-routed personality AI`
   This is optional flavor on top: decision commentary, style profiles, streamer-like reactions, or experimental move proposals through a provider-agnostic router.

Important rule:

LLM-backed AI should not be required for the game to function well.

The game must stand on deterministic systems first.

## Architecture Roadmap

## Layer 1: Game Core

This layer owns:

- rules
- turn order
- card resolution
- board graph
- hazard resolution
- win conditions
- action validation
- state serialization

Requirements:

- pure TypeScript logic
- no renderer coupling
- deterministic outputs from identical inputs
- testable without a browser scene

### Layer 2: Presentation

This layer owns:

- three.js scene setup
- camera
- materials
- placeholder geometry
- animation timing
- HUD
- VFX hooks
- audio hooks later

Requirements:

- reads from game state
- emits player intent
- never owns rules truth

### Layer 3: Session and Networking

This layer owns:

- local match setup
- turn submission
- multiplayer transport later
- state sync
- reconnect flow
- spectators and replay later

Requirements:

- action-based sync first, state snapshot fallback
- transport-agnostic API shape
- clean path from local hotseat to online room play

### Layer 4: AI

This layer owns:

- deterministic bot heuristics
- simulation-based move scoring later
- model-router integration for optional AI personalities
- AI turn time budgets

Requirements:

- AI consumes public game state, not renderer internals
- AI outputs legal game actions only
- provider/model details hidden behind a router interface

## Technical Recommendations

### Frontend Stack

Recommended:

- `Vite`
- `TypeScript`
- `three.js`
- `WebGLRenderer` first
- DOM/CSS overlays for HUD

### Data Contracts

We should define these early:

- `BoardDefinition`
- `NodeId`
- `EdgeId`
- `CardId`
- `PlayerAction`
- `GameState`
- `TurnEvent`
- `HazardLaneDefinition`
- `MatchConfig`

These contracts should become the backbone of the project.

### Asset Seams

Since gameplay feel comes first but assets matter later, the code should include obvious replacement seams from day one:

- pawn visuals are swappable render components
- board geometry can be upgraded from graybox mesh to authored island assets
- hazard visuals can swap from spheres to production effects
- materials, VFX, and audio are hooks, not hardwired hacks

## Delivery Phases

### Phase 0: Preproduction Lock

Status: Complete

Goal:

Lock enough structure to build without thrashing.

Deliverables:

- roadmap report
- architecture outline
- package/app layout
- code conventions
- naming conventions for game systems
- decision log for locked terms

Exit criteria:

- we know what first playable is
- we know what not to build yet
- we know how multiplayer and AI fit into the shape

### Phase 1: Project Bootstrap

Status: Complete

Goal:

Create the clean app shell and engineering foundation.

Deliverables:

- `apps/web` fresh install
- TypeScript config
- Vite setup
- three.js boot scene
- app lifecycle shell
- input layer shell
- debug toggle system with `F1`
- baseline docs in `operations`

Exit criteria:

- app boots reliably
- camera can move
- debug overlays can be fully hidden
- file structure reflects intended architecture

### Phase 2: Board Graph and Navigation

Status: Complete

Goal:

Make the island traversable as a real game space.

Deliverables:

- logical board graph
- node metadata
- route preview system
- occupancy rules
- shortcut support
- board-space triggers
- graybox island mesh aligned to graph

Exit criteria:

- player can select movement legally
- route readability feels good
- shortcuts and choke points are visible and testable

### Phase 3: Card Turn System

Status: Next

Goal:

Make turns actually fun.

Deliverables:

- deck/pool definitions
- hand size and draw rules
- card play flow
- movement resolution
- card effects framework
- starter 12-card set
- turn event log

Exit criteria:

- full turn resolves end to end
- hand management feels quick
- every card resolves cleanly and predictably

### Phase 4: Volcano Meter and Ember Boulder Hazards

Goal:

Bring the board to life with real tension.

Deliverables:

- volcano meter logic
- danger-space rules
- hazard trigger flow
- authored hazard lanes
- knockback system
- drop-on-hit `Heartstone` rules
- hazard debug visualizer

Exit criteria:

- eruptions are exciting and understandable
- hazard results are consistent enough to tune
- getting hit is funny and dramatic, not confusing

### Phase 5: Objective and Escape Loop

Goal:

Complete the core game loop.

Deliverables:

- `Heartstone` pickup
- `Heartstone` steal logic
- `Heartstone` drop and recovery rules
- `Smuggler's Dock` win check
- 4-player turn rotation
- match reset flow

Exit criteria:

- full match can be played from start to win
- comeback moments exist
- objective race feels tense

### Phase 6: Multiplayer Foundation

Goal:

Make the rules architecture genuinely multiplayer-capable.

Deliverables:

- action serialization
- deterministic replay
- state snapshot schema
- local hotseat mode
- local multi-input simulation support
- network-ready session interfaces

Exit criteria:

- one match can be replayed from logged actions
- state desync points are visible
- future online transport can plug in without reworking game rules

### Phase 7: Bot AI

Goal:

Ship reliable opponents and support internal testing.

Deliverables:

- heuristic move evaluator
- route danger scoring
- objective pressure scoring
- hazard timing heuristics
- difficulty profiles
- automated AI-vs-AI test matches

Exit criteria:

- AI can finish complete matches legally
- AI exposes weak spots in board and card balance
- AI is fun enough for solo graybox testing

### Phase 8: Model Router and Personality AI

Goal:

Add optional AI character and provider flexibility without compromising gameplay reliability.

Deliverables:

- model router interface
- provider-agnostic adapter contract
- prompt-safe game state summaries
- legal action gating
- optional personality packs
- AI chatter on a strict rate budget

Important scope boundary:

Model-backed AI may suggest moves, explain moves, or add character, but final execution must still pass legal deterministic validation.

Exit criteria:

- providers can be swapped without touching core game logic
- LLM failures do not break matches
- personality adds flavor without slowing turns too much

### Phase 9: Asset Pipeline and Visual Upgrade

Goal:

Replace graybox without destabilizing systems.

Deliverables:

- glTF import conventions
- asset folder standards
- pawn replacement pipeline
- board mesh replacement pipeline
- hazard VFX upgrade path
- animation hook points
- lighting style pass

Exit criteria:

- graybox objects can be swapped cleanly
- production assets do not require rules rewrites
- readability survives visual complexity

### Phase 10: Online Multiplayer

Goal:

Support real remote play.

Deliverables:

- room lifecycle
- host/authority model
- turn submission protocol
- reconnect support
- spectator/replay hooks later
- error handling for dropped clients

Exit criteria:

- remote 4-player match is stable
- turn order and state remain authoritative
- reconnect does not corrupt the match

## Milestone Order Summary

Recommended order of work:

1. Preproduction lock
2. Bootstrap
3. Board graph
4. Card turn system
5. Volcano meter and hazards
6. Objective and escape loop
7. Multiplayer foundation
8. Bot AI
9. Model router layer
10. Asset upgrade
11. Online multiplayer

## Testing Strategy

We should test at three levels:

### Rules Tests

- card resolution
- legal move validation
- knockback and drop logic
- win conditions
- replay determinism

### Graybox Playtests

- route clarity
- hazard drama
- turn pacing
- frustration spikes
- kingmaking risk

### AI Simulation

- repeated bot matches
- edge-case scenario runs
- board balance heatmaps later

## Risks and Controls

### Risk: Multiplayer Retrofits Become Painful

Control:

Make all turns action-driven and replayable from the start.

### Risk: AI Scope Bloats The Project

Control:

Build deterministic bots first. Treat model-routed AI as optional flavor, not required core logic.

### Risk: Graybox Feels Too Dry

Control:

Use strong camera framing, good timing, punchy placeholder VFX, and dramatic hazard events even before real art.

### Risk: Theme Gets Too Serious

Control:

Keep the animation timing, knockback outcomes, and card interactions slightly playful and theatrical.

### Risk: Assets Force Rewrites Later

Control:

Keep rendering adapters separate from board and rules logic.

## Recommended Immediate Next Steps

The next concrete documents or tasks should be:

1. replace the temporary navigation sandbox move budget with card-driven movement
2. define card data contracts and a starter deck/pool module
3. implement hand draw, play, and discard flow
4. connect movement resolution to played card values
5. add turn event history in a form that can evolve into replay/state sync

## Bottom Line

`Cinderfall` is ready for a real roadmap.

The smartest path is to build a deterministic multiplayer-capable core, a graybox-first 3D presentation layer, strong authored hazard systems, and AI in two tiers: dependable bots first, model-routed personality second.
