# Cinderfall Asset Sourcing and Format Guide

Date: 2026-04-14

Status: Reference guide for later asset acquisition and Phase 9 pipeline work

## Purpose

This report expands the current asset recommendations for `Cinderfall` and saves them in one place for later.

We are not acting on this yet. Systems, rules, and graybox readability still come first.

The goal of this document is to make sure that when we do start sourcing production assets, we buy or download formats that fit a browser-first `three.js` game instead of collecting a pile of beautiful files that fight the runtime.

## Current Technical Context

Right now the project is:

- a `Vite + TypeScript + three.js` web client
- using `MeshStandardMaterial`-style real-time materials
- graybox-driven, with authored board logic and placeholder geometry
- not yet wired for model, environment, or audio asset loading

Local workstation note:

- `Blender` is installed locally at `C:\Program Files\Blender Foundation\Blender 5.0\blender.exe`
- `gltf-transform` is installed globally through `npm` and resolves from `C:\Users\james\AppData\Roaming\npm`
- `gltfpack.exe` is installed in `C:\Users\james\.local\bin`
- `toktx.exe` is installed in `C:\Users\james\.local\bin`

That gives us a practical local asset-prep stack right now:

- `Blender` for cleanup, export, retopo, rig fixes, material cleanup, and one-off conversion work
- `gltf-transform` for glTF inspection, transforms, and packing-oriented workflow steps
- `gltfpack` for mesh optimization and compression-oriented packaging
- `toktx` for KTX texture generation and compression work

That means the important question is not only "what looks good on Fab or Sketchfab?"

It is also:

- what loads cleanly in a browser
- what keeps file sizes sane
- what preserves animation and material data
- what can be swapped in later without rewriting rules or presentation systems

## Shopping Rule Versus Runtime Rule

These are not always the same.

### What We Should Prefer When Shopping

- Character and prop models: `GLB` or `glTF` first
- Animation sources: `FBX` is acceptable, especially from `Mixamo`
- Texture packs: standard PBR maps in `PNG`, `JPG`, or sometimes `TGA`
- Skies: `HDR`, `EXR`, or stylized cubemap image sets
- SFX and music packs: `WAV` masters plus compressed delivery files such as `MP3` or `OGG`

### What We Should Aim To Ship At Runtime

- Models: `GLB`
- Textures: `KTX2` where worth the setup, with `PNG` or `JPG` acceptable during early integration
- Skies: `HDR` or `EXR` for environment lighting, or optimized cubemap textures for a stylized sky
- Audio: `MP3` as the safe default, optionally paired with `OGG`

Practical note:

Very few marketplaces are going to hand us perfectly optimized `KTX2` textures for web runtime. The smarter approach is to buy clean source textures and convert/optimize them later once the art direction is stable.

## Bottom Line

If we want the shortest useful answer for future asset shopping, it is this:

- characters and props: look for `GLB` first
- animations: `FBX` is fine as a source format, especially from `Mixamo`
- terrain materials: look for standard PBR texture sets, not engine-locked packages
- skies: `HDR` or `EXR` for realistic lighting, or stylized painted sky assets if we stay toy-like and theatrical
- SFX and music: keep `WAV` masters, ship `MP3`, optionally include `OGG`
- UI and icons: `SVG`
- VFX flipbooks, masks, decals, and sprite sheets: `PNG` or `WebP`

## Character Models

### Preferred Formats

- `GLB`
- `glTF`

### Acceptable Source Formats

- `FBX`
- `BLEND`, only if the asset is otherwise strong and exportable

### What We Should Look For

- rigged characters
- game-ready topology
- clean material setup
- PBR-compatible textures
- a manageable number of materials per character
- readable silhouettes from a board-game camera distance

### What We Should Avoid

- `OBJ` for characters
- cinematic hero assets with extreme polycounts
- packs with many tiny materials on one model
- assets that only ship as engine-native packages like `unitypackage` or `.uasset`
- characters that look great in close-up but become unreadable from a pulled-back camera

### Recommendation For This Game

Because `Cinderfall` is a node-based, board-like game with exaggerated spectacle, we should prioritize:

- strong silhouettes
- stylized readability
- bold color separation between players
- clean carry, stumble, hit, and victory poses

Photoreal detail matters less here than instant legibility.

## Character Animation

### Best Source

`Mixamo` is a strong source for placeholder or intermediate animation coverage.

### Preferred Animation Direction

- in-place locomotion clips
- clear idle, walk, run, hit-react, fall, recover, pickup, carry, steal, celebrate, and defeat clips
- consistent skeletons across packs

### Why In-Place Matters Here

Based on the current game architecture, movement is node-to-node and rules-driven, not freeform character-controller movement.

That makes in-place animation the safer default. The rules system can own the actual pawn movement while the animation simply sells the motion.

### Format Guidance

- `FBX` is fine for ingest
- convert finalized animation content into `GLB` for runtime if possible

## Terrain, Board Meshes, and Props

### Preferred Format

- `GLB`

### What We Should Look For

- modular volcanic rock pieces
- bridges, cave entrances, docks, shrine pieces, lava props, charred wood, ruins, banners, and scatter props
- clean collision-friendly shapes
- materials that hold up under stylized warm lighting
- meshes that can support readable route and hazard presentation

### Terrain Recommendation

The island itself should likely become a curated authored board mesh, not a giant marketplace environment dropped in wholesale.

Marketplace assets will probably help most with:

- cliff and rock kits
- dock and bridge kits
- summit shrine pieces
- lava props
- cave props
- dressing and atmosphere props

That is safer than trying to force a full premade volcano scene to match our board graph.

## Terrain Materials and Textures

### Preferred Material Style

Standard PBR texture sets that work with `MeshStandardMaterial`.

### Most Useful Texture Maps

- base color or albedo
- normal
- roughness
- metallic
- ambient occlusion
- emissive for lava or magical elements
- height, only when it is actually useful

### Source Formats To Accept

- `PNG`
- `JPG`
- `TGA` when necessary

### Runtime Direction

- start with `PNG` and `JPG` during early integration if needed
- convert stable production textures to `KTX2` later for web delivery optimization

### Recommendation For This Theme

We should especially look for:

- volcanic rock
- cooled basalt
- ash
- scorched earth
- charred wood
- lava crust
- glowing ember cracks
- worn stone shrine surfaces

### What To Avoid

- giant `8K` texture sets by default
- muddy photoreal surfaces that hide gameplay readability
- material packs that only work inside one engine's shader graph

## Skies, Atmosphere, and Environment Lighting

There are two viable directions.

### Direction 1: Stylized Sky

This is probably the stronger fit if `Cinderfall` stays theatrical, toy-like, and readable.

Look for:

- painted volcanic dusk skies
- warm sunset gradients
- smoke and ash layers with strong shape language
- sky domes or cubemap-style sky sets

### Direction 2: Realistic Environment Map

This is better if we want more grounded lighting and reflections.

Look for:

- `HDR`
- `EXR`
- warm sunset or dramatic overcast volcanic environments

### Recommendation

The current graybox scene already leans stylized and warm. That makes a stylized sky pass more likely to preserve the intended game feel than a fully photoreal HDRI-first look.

That said, a single good `HDR` or `EXR` can still be valuable for lighting tests even if the final visible sky stays stylized.

## Sound Effects

### Source Formats

- `WAV` masters are ideal
- `AIFF` is acceptable if needed

### Runtime Formats

- `MP3` as the safest baseline
- optionally `OGG` as an additional format

### What We Will Need Later

- UI hover, confirm, and error sounds
- card play sounds
- token movement and landing sounds
- shove, steal, pickup, and drop sounds
- lava bubbling and vent ambience
- rumble, launch, bounce, hit, and near-miss hazard sounds
- win, loss, and match-end stingers

### Recommendation

For this project, short readable one-shots matter more than giant cinematic libraries.

We should especially value packs with:

- clean transient design
- layered impact sounds
- believable rumble loops
- light comic exaggeration without becoming parody

## Soundtrack

### Source And Delivery Guidance

- keep `WAV` masters and stems
- ship `MP3` as the safe default
- optionally keep an `OGG` companion if we want alternate browser sources

### What We Should Look For

- seamless loops
- tension-building variations
- short stingers
- stems if adaptive music becomes important later

### Likely Music Needs

- title or menu loop
- core match loop
- higher-tension volcano or summit variation
- victory sting
- loss or collapse sting

### Recommendation

Avoid overbuying soundtrack too early.

One strong core loop, one tension layer, and a few stingers will get us much farther than a giant album we do not yet know how to deploy.

## UI, VFX, and Other Asset Classes

These are easy to overlook, but they may matter more than high-end characters in the first visual upgrade pass.

### UI

- `SVG` for icons and scalable interface art
- `PNG` for occasional painted panels or decorative frames

### VFX

- `PNG` or `WebP` sprite sheets
- decal masks
- stylized smoke, sparks, ash, glow, and ember elements

### Useful Production Categories

- lava burst sprites
- ember shower sprites
- smoke puffs
- dust impacts
- magic objective glows
- route highlight decals

## Source-By-Source Guidance

### Mixamo

Best use:

- placeholder animation coverage
- quick humanoid rigging
- filling gaps in a future animation set

Use it as:

- a source pipeline tool

Do not treat it as:

- the final runtime format or final content organization

### Fab

Best use:

- props
- environment kits
- texture sets
- materials
- occasional stylized characters

Shopping filters we should prefer:

- `glTF` or `GLB` included
- game ready
- PBR
- rigged or animated where relevant

### Sketchfab

Best use:

- stylized props
- creatures
- environmental set pieces
- occasional full characters if the file package is clean

Be careful about:

- download format availability
- texture resolution bloat
- messy material counts
- unclear licensing terms

### Itch.io

Best use:

- SFX
- soundtrack
- UI packs
- VFX sprite sheets
- stylized experimental art packs

Less dependable for:

- polished production 3D character pipelines

## Red Flags To Reject Early

We should usually pass on assets that have any of these traits unless there is a very strong reason:

- engine-locked packaging with no raw exports
- `OBJ`-only animated character content
- no license clarity for commercial redistribution
- many `4K` or `8K` textures for small gameplay assets
- huge polycounts without LODs or clean optimization paths
- unreadable silhouettes
- baked lighting that fights our scene lighting
- root-motion-only animation sets when we really need in-place

## Later Implementation Notes For Phase 9

When we finally turn this into code and pipeline work, the likely loader stack should include:

- `GLTFLoader`
- `DRACOLoader`
- `KTX2Loader`
- `EXRLoader` or another sky/environment loader path
- `AudioLoader`

Because we already have local authoring and conversion tooling available through `Blender`, `gltf-transform`, `gltfpack`, and `toktx`, Phase 9 should assume an offline prep step instead of requiring every sourced asset to arrive in runtime-perfect form.

That means we can be more flexible about buying or downloading:

- source `FBX` animation files that need conversion
- raw PBR texture packs that need optimization
- marketplace meshes that need cleanup, decimation, or material consolidation

Before Phase 9 starts in earnest, we should document the exact local command recipes for:

- source model cleanup and export from `Blender`
- mesh compression and optimization with `gltfpack`
- texture compression and format conversion with `toktx`
- final `GLB` transforms and packaging rules with `gltf-transform`

Recommended later runtime asset layout:

```text
apps/web/public/assets/
  characters/
  board/
  props/
  textures/
  skies/
  audio/
    sfx/
    music/
  vfx/
```

Recommended source-asset rule:

Keep raw downloads, masters, working `FBX`, and untouched audio stems outside the shipped runtime folder so we do not accidentally bloat the web app with source-only files.

## Asset Shopping Checklist

Before we keep any purchased or downloaded asset, we should be able to answer yes to most of these:

- Does it fit the visual tone of `mythic volcano danger`?
- Is the license clear for the way we plan to use it?
- Does it include raw files we can actually export or convert?
- Is the model format `GLB` or at least cleanly convertible?
- Are the textures standard PBR maps?
- Is the polycount reasonable for a browser game?
- Are the materials limited and manageable?
- Is the animation setup compatible with a game-ready rig?
- Will it still read clearly from a pulled-back board camera?

## Final Recommendation

Future asset sourcing for `Cinderfall` should optimize for browser runtime reality, not just marketplace beauty.

That means:

- `GLB` for final runtime models
- `FBX` accepted mainly as an animation or ingest format
- standard PBR texture sets acquired as source assets, then optimized later
- `HDR` or `EXR` for environment-lighting experiments
- `MP3` as the baseline audio delivery format, with `WAV` preserved as source
- strong preference for readability, stylization, and clean integration over maximum visual complexity

If we stay disciplined here, Phase 9 can become a controlled upgrade pass instead of a format-conversion rescue mission.

## Research Sources

- [Three.js GLTFLoader docs](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js DRACOLoader docs](https://threejs.org/docs/pages/DRACOLoader.html)
- [Three.js KTX2Loader docs](https://threejs.org/docs/pages/KTX2Loader.html)
- [Three.js CubeTextureLoader docs](https://threejs.org/docs/pages/CubeTextureLoader.html)
- [Three.js HDRCubeTextureLoader docs](https://threejs.org/docs/pages/HDRCubeTextureLoader.html)
- [Three.js EXRLoader docs](https://threejs.org/docs/pages/EXRLoader.html)
- [Three.js AudioLoader docs](https://threejs.org/docs/pages/AudioLoader.html)
- [Khronos glTF overview](https://www.khronos.org/gltf/)
- [Khronos glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [MDN audio codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs)
- [MDN cross-browser audio basics](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/Cross-browser_audio_basics)
