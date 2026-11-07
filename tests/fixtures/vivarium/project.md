# Vivarium 3D Pet Generator — Engineering Blueprint (Single File)

This document is a complete PTB v0.2 blueprint for **Step 1: the generation core** of a
deterministic, procedural 3D pet creature engine. It is intended to be parsed by ProjectsTimeline
without AI assistance: every structured record is a top-level `ptb` JSON fence followed by plain
Markdown narrative.

```ptb
{"ptb":"0.2","kind":"project","id":"proj.vivarium-3d-pet-generator","title":"Vivarium 3D Pet Generator","goal":"Generate a deterministic, visually varied 3D pet from a compact DNA seed: parametric anatomy and procedural coat patterns, viewable, tweakable, and reproducible in the browser, with a shareable DNA code and portrait snapshot architected so 3D model export can be added later."}
```

## Project purpose

Vivarium is the first milestone of a larger pet-collection game. This step solves one concrete
problem: turn a compact, serializable **DNA** value into a unique, reproducible 3D pet whose
anatomy and coat are both procedurally generated. Everything else (breeding, rarity, economy,
activities) is deliberately deferred so this milestone can be built, verified, and understood on
its own.

The intended users are (a) the solo developer, who needs a stable, well-typed foundation to grow
later, and (b) an eventual player, who will design pets in the browser and share them as a DNA
code. There is no backend in this step; the app is local-first and runs from a static host.

## Components

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.dna","title":"DNA schema and codec","project":"proj.vivarium-3d-pet-generator"}
```

Owns the `PetDNA` type, per-field defaults, clamp/sanitize bounds, and the compact string codec
that maps a DNA value to a shareable code and back. This is the single source of truth for what a
pet *is*.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.state","title":"DNA store and change notification","project":"proj.vivarium-3d-pet-generator"}
```

Holds the current DNA and exposes `updateDNA(patch)` plus a subscriber list. The UI and renderer
communicate only through this store, which is what keeps them decoupled.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.anatomy","title":"Procedural anatomy generation","project":"proj.vivarium-3d-pet-generator"}
```

Turns anatomy parameters into a manifold `BufferGeometry`. The pipeline is designed to be
rig-compatible from the start even though Step 1 is static, so locomotion can be added without a
rewrite.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.anatomy.body","title":"Body silhouette and proportions","project":"proj.vivarium-3d-pet-generator","parent":"cmp.anatomy"}
```

Nested under anatomy. Responsible for the body silhouette, chubbiness, and overall proportions that
make different DNA values produce visibly different creatures.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.coat","title":"Coat shading and materials","project":"proj.vivarium-3d-pet-generator"}
```

Owns the `ShaderMaterial` that shades the pet surface: root-to-tip gradient, lighting, and tone
mapping. It consumes pattern parameters but delegates pattern *shape* to the nested pattern
component.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.coat.pattern","title":"Procedural coat patterns","project":"proj.vivarium-3d-pet-generator","parent":"cmp.coat"}
```

Nested under coat. Produces the procedural pattern families (solid, spotted, brindled) in GLSL,
seeded deterministically from the DNA.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.render","title":"Renderer, scene, and camera","project":"proj.vivarium-3d-pet-generator"}
```

Wraps the Three.js renderer, scene, perspective camera, orbit controls, and the render loop. It has
no knowledge of the DOM beyond its own canvas.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.ui","title":"Parameter control panel","project":"proj.vivarium-3d-pet-generator"}
```

Builds the DOM control panel (sliders, color pickers, randomize). It emits `updateDNA` patches and
never touches Three.js objects directly.

```ptb
{"ptb":"0.2","kind":"component","id":"cmp.export","title":"DNA code and portrait export","project":"proj.vivarium-3d-pet-generator"}
```

Produces the shareable DNA code and a PNG portrait snapshot behind a common export interface, so a
GLB target can be added later without changing anatomy or coat code.

## Features

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.dna-schema","title":"Pet DNA schema","project":"proj.vivarium-3d-pet-generator","component":"cmp.dna"}
```

Defines every field that makes a pet: anatomy parameters, coat colors, and pattern parameters. The
schema is the contract between the UI, the store, and the generator.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.deterministic-seed","title":"Deterministic seeded generation","project":"proj.vivarium-3d-pet-generator","component":"cmp.dna"}
```

Guarantees the same DNA always produces the same pet. All procedural variation is routed through a
seeded PRNG derived from the DNA string, never `Math.random`.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.procedural-anatomy","title":"Procedural anatomy","project":"proj.vivarium-3d-pet-generator","component":"cmp.anatomy"}
```

Builds the pet mesh from anatomy parameters so different DNA values produce visibly distinct
silhouettes, proportions, ears, and tails.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.coat-patterns","title":"Procedural coat patterns","project":"proj.vivarium-3d-pet-generator","component":"cmp.coat"}
```

Renders a root-to-tip gradient plus procedural pattern families (solid, spotted, brindled) driven by
DNA and seeded noise in-shader.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.param-ui","title":"Parameter control UI","project":"proj.vivarium-3d-pet-generator","component":"cmp.ui"}
```

Provides sliders, color pickers, and a randomize action over the DNA. The UI is fully decoupled from
the renderer.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.local-persistence","title":"Local persistence","project":"proj.vivarium-3d-pet-generator","component":"cmp.state"}
```

Saves the current DNA to localStorage and restores it on reload, with validation and a safe fallback
to defaults.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.dna-export","title":"DNA code and portrait export","project":"proj.vivarium-3d-pet-generator","component":"cmp.export"}
```

Produces a copyable DNA code and a PNG portrait snapshot, behind an interface that will later accept
a GLB target.

## Requirements

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.dna-completeness","title":"DNA captures every visual parameter","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema"],"type":"functional","acceptance":["Every visual parameter exposed in the UI is present in the DNA schema","The DNA schema defines explicit defaults for every field","Out-of-range values are clamped to documented bounds"]}
```

The DNA must be the complete description of a pet. If a slider or color picker exists, the value it
controls must exist in the schema; otherwise a pet cannot be reproduced from its code.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.deterministic-reproducibility","title":"Identical DNA yields an identical pet","project":"proj.vivarium-3d-pet-generator","features":["feat.deterministic-seed","feat.dna-schema","feat.procedural-anatomy","feat.coat-patterns"],"type":"functional","acceptance":["Generating twice from the same DNA string produces geometrically identical meshes","The rendered snapshot for a given DNA string is pixel-identical across reloads","No Math.random or wall-clock time influences the generated pet geometry"]}
```

This is a cross-cutting requirement: determinism spans the schema, the seeded RNG, anatomy, and coat
patterns. It is the property that makes a DNA code meaningful as a shareable identity.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.anatomy-variety","title":"Anatomy parameters produce visible variety","project":"proj.vivarium-3d-pet-generator","features":["feat.procedural-anatomy"],"type":"functional","acceptance":["Moving proportion parameters across their range produces visibly distinct silhouettes","Multiple distinct body archetypes are reachable from DNA values","Every parameter change updates the mesh without a full page reload"]}
```

Variety is the point of the generator. A parameter that does not visibly change the creature is a
design failure.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.pattern-rendering","title":"Coat patterns render correctly","project":"proj.vivarium-3d-pet-generator","features":["feat.coat-patterns"],"type":"functional","acceptance":["Each supported pattern family renders with a correct root-to-tip gradient","Pattern parameters (colors, scale, density) visibly affect the coat","Changing pattern family swaps the generated pattern deterministically"]}
```

Coat patterns are a core part of the visual identity, so their correctness is a functional
requirement, not merely a polish item.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.serialize-roundtrip","title":"DNA code round-trips losslessly","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema","feat.dna-export"],"type":"functional","acceptance":["A DNA code deserializes to the exact original parameter values","serialize(deserialize(code)) yields the same code","The codec rejects malformed or unknown codes without throwing"]}
```

The DNA code is the only external representation of a pet, so it must round-trip without loss.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.realtime-performance","title":"Sustained real-time performance","project":"proj.vivarium-3d-pet-generator","features":["feat.param-ui","feat.procedural-anatomy","feat.coat-patterns"],"type":"quality","acceptance":["The app sustains 60 FPS at 2x DPR on a mid-tier GPU","Parameter changes and regeneration complete within one frame budget","The render loop performs no per-frame heap allocations"]}
```

Interactive regeneration must not visibly hitch; the loop is written to avoid per-frame allocations.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.visual-consistency","title":"Seam-free, smooth visuals","project":"proj.vivarium-3d-pet-generator","features":["feat.coat-patterns"],"type":"quality","acceptance":["Patterns show no visible UV seams or banding","Gradients and pattern density are smooth across the surface","Colors render in linear space with consistent tone mapping"]}
```

Procedural patterns are prone to seams and banding; this requirement makes smoothness explicit.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.local-first","title":"Local-first, offline-capable","project":"proj.vivarium-3d-pet-generator","features":["feat.local-persistence","feat.dna-export"],"type":"constraint","acceptance":["The app runs from a static host with no backend requests","All state is stored in localStorage","No network access is required for generation, saving, or export"]}
```

Step 1 is single-player and offline by design; a future economy layer must not require retrofitting
the core.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.clean-room","title":"Original, clean-room implementation","project":"proj.vivarium-3d-pet-generator","features":["feat.procedural-anatomy","feat.coat-patterns","feat.dna-schema"],"type":"constraint","acceptance":["All source is original and not copied from the reference project","Shader and geometry code is authored from the specification, not pasted","No third-party runtime assets or code are bundled"]}
```

The project is inspired by, but implemented independently from, an existing fur demo. Techniques are
fair game; specific code is not.

```ptb
{"ptb":"0.2","kind":"requirement","id":"req.export-extensibility","title":"Export surface is extensible","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-export"],"type":"constraint","acceptance":["The export module exposes a stable interface for adding new export targets","Adding a GLB exporter does not require changes to anatomy or coat code","The DNA code and PNG snapshot are produced through the same export interface"]}
```

GLB model export is deferred but must be additive, so the export surface is designed as an interface
from day one.

## Development scope

```ptb
{"ptb":"0.2","kind":"scope","id":"scope.step1-generation-core","title":"Step 1 - Generation Core","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema","feat.deterministic-seed","feat.procedural-anatomy","feat.coat-patterns","feat.param-ui","feat.local-persistence","feat.dna-export"],"workflow":{"stages":[{"key":"design","title":"Design"},{"key":"foundation","title":"Foundation"},{"key":"implementation","title":"Implementation"},{"key":"verification","title":"Verification"}]}}
```

A single development scope with four ordered stages. Design fixes the schema and interfaces;
Foundation delivers the DNA, store, and seeded RNG; Implementation delivers anatomy, coat, UI,
export, and persistence; Verification confirms determinism, round-trip, and performance.

## Actions

```ptb
{"ptb":"0.2","kind":"action","id":"act.define-dna-schema","title":"Define the PetDNA schema and codec","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema"],"requirements":["req.dna-completeness","req.serialize-roundtrip"],"scope":"scope.step1-generation-core","stage":"design","action_type":"implementation","instructions":"Define the PetDNA TypeScript type, per-field defaults, clamp/sanitize bounds, and the compact string codec. Document the field list and ranges in dna.ts.","definition_of_done":"dna.ts compiles under strict TypeScript; every field has a default, clamp bounds, and a stable position in the serialized code; round-trip unit tests are specified."}
```

Design-stage implementation that fixes the contract everything else builds on.

```ptb
{"ptb":"0.2","kind":"action","id":"act.implement-seeded-rng","title":"Implement the deterministic seeded PRNG","project":"proj.vivarium-3d-pet-generator","features":["feat.deterministic-seed"],"requirements":["req.deterministic-reproducibility"],"scope":"scope.step1-generation-core","stage":"foundation","action_type":"implementation","instructions":"Implement a deterministic hash-based PRNG whose state derives solely from the DNA string. Route all procedural variation (anatomy jitter, pattern noise) through it.","definition_of_done":"The PRNG produces identical sequences for identical seeds; a fixture of 1,000 seeds reproduces exactly; no Math.random is used in geometry or pattern generation."}
```

Foundation-stage work that makes reproducibility possible.

```ptb
{"ptb":"0.2","kind":"action","id":"act.implement-dna-store","title":"Implement the DNA store and subscriptions","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema"],"requirements":["req.dna-completeness"],"scope":"scope.step1-generation-core","stage":"foundation","action_type":"implementation","instructions":"Implement the mutable DNA store with updateDNA(patch) and a subscriber list. The renderer and UI must communicate only through this store.","definition_of_done":"updateDNA notifies subscribers synchronously; the UI holds no direct reference to Three.js objects; the store holds no DOM references."}
```

This store is the decoupling seam between UI and renderer.

```ptb
{"ptb":"0.2","kind":"action","id":"act.build-anatomy","title":"Build the procedural anatomy generator","project":"proj.vivarium-3d-pet-generator","features":["feat.procedural-anatomy"],"requirements":["req.anatomy-variety","req.clean-room"],"scope":"scope.step1-generation-core","stage":"implementation","action_type":"implementation","instructions":"Implement buildGeometry(dna) producing a rig-compatible BufferGeometry from anatomy parameters (body, proportions, ears, tail, face). Keep the vertex layout skinned-mesh-ready.","definition_of_done":"Changing anatomy parameters regenerates a visibly distinct, manifold mesh; the geometry uses a bone-influence-ready vertex layout from the start."}
```

```ptb
{"ptb":"0.2","kind":"action","id":"act.build-coat-shaders","title":"Build the procedural coat shaders","project":"proj.vivarium-3d-pet-generator","features":["feat.coat-patterns"],"requirements":["req.pattern-rendering","req.visual-consistency","req.clean-room"],"scope":"scope.step1-generation-core","stage":"implementation","action_type":"implementation","instructions":"Implement the coat ShaderMaterial: root-to-tip gradient plus procedural pattern families (solid, spotted, brindled) driven by DNA and seeded noise. Author GLSL from scratch.","definition_of_done":"Each pattern family renders with no seams; color and density parameters visibly change the coat; shaders are original."}
```

```ptb
{"ptb":"0.2","kind":"action","id":"act.build-ui","title":"Build the parameter control UI","project":"proj.vivarium-3d-pet-generator","features":["feat.param-ui"],"requirements":["req.realtime-performance"],"scope":"scope.step1-generation-core","stage":"implementation","action_type":"implementation","instructions":"Build the DOM control panel: sliders, color pickers, a randomize button, and orbit camera wiring. The UI emits updateDNA patches only.","definition_of_done":"Every DNA field is editable; randomize produces a valid in-range DNA; the UI never mutates renderer objects directly."}
```

```ptb
{"ptb":"0.2","kind":"action","id":"act.build-export","title":"Build the DNA code and PNG export","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-export"],"requirements":["req.serialize-roundtrip","req.export-extensibility","req.local-first"],"scope":"scope.step1-generation-core","stage":"implementation","action_type":"implementation","instructions":"Implement the export module behind a common interface: emit the DNA code (copyable string) and a PNG portrait snapshot from the current camera. Structure it so a GLB target is additive.","definition_of_done":"Copying the DNA code and reproducing it yields the identical pet; PNG export captures the framed pet; the interface accepts an additional target without touching anatomy or coat code."}
```

```ptb
{"ptb":"0.2","kind":"action","id":"act.build-persistence","title":"Build local persistence","project":"proj.vivarium-3d-pet-generator","features":["feat.local-persistence"],"requirements":["req.local-first"],"scope":"scope.step1-generation-core","stage":"implementation","action_type":"implementation","instructions":"Persist the current DNA to localStorage on change and restore it on load, validating against the schema with a safe fallback to defaults.","definition_of_done":"Reloading restores the last pet exactly; corrupt or missing storage falls back to defaults without error."}
```

```ptb
{"ptb":"0.2","kind":"action","id":"act.verify-determinism","title":"Verify deterministic reproducibility","project":"proj.vivarium-3d-pet-generator","features":["feat.deterministic-seed"],"requirements":["req.deterministic-reproducibility"],"scope":"scope.step1-generation-core","stage":"verification","action_type":"verification","instructions":"Run the automated determinism checks: generate the same DNA twice and diff geometry hashes and PNG snapshots across reloads.","definition_of_done":"All determinism checks pass; a written summary records the hash comparison method and results."}
```

```ptb
{"ptb":"0.2","kind":"action","id":"act.document-dna-format","title":"Document the DNA codec format","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema","feat.dna-export"],"requirements":["req.serialize-roundtrip"],"action_type":"documentation","instructions":"Write a short human-readable spec of the DNA codec (field order, ranges, encoding) so a pet can be re-derived from a code by other tools or engines without reading the TypeScript.","definition_of_done":"A Markdown spec exists beside dna.ts; a reader can reconstruct the field list and ranges from it alone."}
```

This action is deliberately unscoped: it is lightweight documentation work that does not belong to a
development stage.

## Decisions

```ptb
{"ptb":"0.2","kind":"decision","id":"dec.stack-choice","title":"Use TypeScript, Three.js (WebGL2), Vite, and vanilla DOM","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-schema","feat.param-ui"],"requirements":["req.local-first"],"rationale":"TypeScript gives the DNA schema a compile-time contract; Three.js on WebGL2 runs anywhere with no install and is sufficient for stylized fur; Vite provides a zero-friction dev loop; vanilla DOM keeps the UI dependency-free. No backend keeps Step 1 local-first.","alternatives":["Raw WebGL2 (too much boilerplate for camera and orbit)","Babylon.js (heavier; its abstractions get in the way of custom shaders)","WebGPU (deferred; adds friction without benefit at this stage)","React or Svelte UI (unnecessary state complexity for sliders and pickers)"]}
```

```ptb
{"ptb":"0.2","kind":"decision","id":"dec.seeded-rng","title":"Deterministic seeded PRNG instead of Math.random","project":"proj.vivarium-3d-pet-generator","features":["feat.deterministic-seed"],"requirements":["req.deterministic-reproducibility"],"rationale":"A deterministic hash-based PRNG seeded from the DNA guarantees reproducibility and makes rarity and provenance auditable later. Math.random would break identical regeneration and shareable codes.","alternatives":["Math.random (non-deterministic, breaks reproducibility)","A noise npm package (adds a dependency for something trivial to author)"]}
```

```ptb
{"ptb":"0.2","kind":"decision","id":"dec.rig-compatible-geometry","title":"Build geometry rig-compatible from day one","project":"proj.vivarium-3d-pet-generator","features":["feat.procedural-anatomy"],"requirements":["req.anatomy-variety","req.clean-room"],"rationale":"The pet must eventually walk and jump (Step 2), so the vertex layout and bone-influence structure are designed now even though Step 1 is static. This avoids a full geometry rebuild later.","alternatives":["Static one-off sculpt (fast now, requires a full rebuild for animation)"]}
```

```ptb
{"ptb":"0.2","kind":"decision","id":"dec.export-interface","title":"DNA code and PNG now, GLB additive later","project":"proj.vivarium-3d-pet-generator","features":["feat.dna-export"],"requirements":["req.export-extensibility"],"rationale":"Shipping DNA code and PNG snapshot behind a common export interface satisfies the immediate share-and-reproduce need while making GLB model export an additive target rather than a rearchitecture.","alternatives":["Build GLB export now (more work before the core is proven)","No export (blocks sharing and reproducibility)"]}
```

## Planned checks

```ptb
{"ptb":"0.2","kind":"check","id":"check.determinism","title":"Deterministic reproducibility check","project":"proj.vivarium-3d-pet-generator","requirements":["req.deterministic-reproducibility"],"method":"automated","expected":["Two generations from the same DNA string produce identical geometry hashes","PNG snapshots are pixel-identical across reloads"],"instructions":"Script generates each DNA twice and compares vertex buffers and rendered framebuffers."}
```

```ptb
{"ptb":"0.2","kind":"check","id":"check.dna-roundtrip","title":"DNA code round-trip check","project":"proj.vivarium-3d-pet-generator","requirements":["req.serialize-roundtrip"],"method":"automated","expected":["serialize(deserialize(code)) equals code for a fixture of codes","Malformed codes are rejected without throwing"],"instructions":"Unit tests iterate a fixture set of DNA codes."}
```

```ptb
{"ptb":"0.2","kind":"check","id":"check.anatomy-variety","title":"Anatomy variety check","project":"proj.vivarium-3d-pet-generator","requirements":["req.anatomy-variety"],"method":"manual","expected":["Sweeping each proportion slider produces clearly different silhouettes","No parameter leaves the mesh visually unchanged across its range"],"instructions":"A human sweeps sliders and confirms visible change for each parameter."}
```

```ptb
{"ptb":"0.2","kind":"check","id":"check.performance","title":"Real-time performance check","project":"proj.vivarium-3d-pet-generator","requirements":["req.realtime-performance"],"method":"automated","expected":["60 FPS sustained at 2x DPR on a mid-tier GPU","Frame times remain within budget during regeneration"],"instructions":"Instrument the loop with a frame-time histogram and run on a reference device."}
```

```ptb
{"ptb":"0.2","kind":"check","id":"check.pattern-seams","title":"Coat pattern seam check","project":"proj.vivarium-3d-pet-generator","requirements":["req.visual-consistency"],"method":"manual","expected":["No UV seams or banding across any pattern family","Gradients are smooth under orbit"],"instructions":"A human orbits the pet and inspects each pattern family for seams and banding."}
```
