Original prompt: We want to recreate Fireball Island in 3D as a browser game, rebrand it into something original, keep the UI minimal, keep all dev overlay hidden with F1, organize the repo cleanly with docs/reports, docs/plans, docs/operations, and build robust reusable systems that are ready for real assets later.

2026-04-14
- Phase 1 and Phase 2 were completed before this handoff: Vite + TypeScript + three.js bootstrap, camera shell, board graph, interactive node navigation, HUD, and F1 debug overlay.
- Phase 3 is now implemented: starter card pool, per-player hands/decks/discard, card selection flow, movement resolution, card effect hooks, and roadmap updates marking cards as complete.
- Added browser testing seams this pass: deterministic stepping via `window.advanceTime`, text-state export via `window.render_game_to_text`, and a small `window.__cinderfallTestApi__` for automated card/move checks without bloating the player-facing UI.
- Verified the card loop in-browser: selected `Dash`, confirmed reachable nodes, moved to `central-spur`, observed turn handoff to `Bram`, and confirmed no browser console errors during the scripted flow.

TODO
- Phase 4: implement Heartstone pickup, drop, steal resolution, dock win check, and authored Ember Boulder lane release.
- Card follow-through still pending for `Clamber` and `Shortcut`; both exist as future hooks only.
- Improve default board readability further once hazard lanes and Heartstone interactions are in, especially around lower-route visibility beneath the hand panel.
