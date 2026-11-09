# Multi-format engineering ingestion — design boundary

2026-11-07 · **Consolidated proposal; no new importer, schema, AI runtime, MCP or format initialization.** [Experience/VD3](v3-product-experience-contract.md) · [review corrections](v3-consolidated-review.md) · [adoption/merge policy](blueprint-adoption-merge-policy.md).

The [final V3a1a source review](v3a1a-final-design-review.md) revises the proposed first schema: source bindings attach to permanent projects, source-native IDs are captured provenance, and metadata keys are bounded storage with a PTB-only main allowlist. No project-wide source limit, generic adapter registry or runtime adapter loading. Another adapter/update first needs a reviewed source/entity crosswalk and native assertion/source/version policy; nullable native IDs/hash avoid inventing PTB identifiers/semantic graphs for ordinary documents. This is an evolution path, not implemented compatibility.

## One capture boundary, format-specific meaning

User-selected input → main-owned bounded capture → explicitly selected/versioned adapter → candidate definitions + native links + diagnostics/source anchors → reviewed typed development application → shared project queries → Overview / Map / Development / History. Optional AI produces a separate review queue, never a required parsing step or an authoritative graph.

Keep the existing PTB acquisition/parser/graph/session as the **PTB path**. Reuse its security/capture patterns, not a rewrite into an all-purpose parser. Define a small adapter result only when a second format is authorized: adapter/format version and declared capabilities; immutable documents; recognized typed definition candidates with native identities; explicit relationship assertions with exact anchors; unrecognized content; diagnostics. No generic workflow execution engine or catch-all JSON graph as the durable domain authority.

| Input | Deterministic interpretation allowed | Must not silently become |
| --- | --- | --- |
| PTB v0.2 | Existing explicit JSON blocks, kinds/typed links, authored stages, exact narrative | Accepted work/decisions, actual results, task dependencies from prose |
| Ordinary Markdown | Documents, headings/source sections and explicit links, rendered inert | Components/features/requirements merely because a heading sounds like one; link = runtime dependency |
| Obsidian (future) | After a separate vault grant, note identities and declared supported wiki-links/anchors with broken-link diagnostics | Whole-vault blanket access, accepted decisions or inferred engineering entities; external/plugin code execution |
| OpenSpec (future) | Reviewed adapter for a pinned native schema: distinguish current specs from proposed changes/deltas, keep native requirement/scenario/change identities | Change task checkbox = verified software; archived proposal = ProjectsTimeline release confirmation |
| GitHub Spec Kit (future) | Pinned supported process/artifact version and explicit spec/plan/task references; preserve custom/unrecognized artifacts as source | Universal fixed seven-stage mapping or execution of generated scripts/workflows; prose plan = dependency proof |
| Git (future) | Explicit repo grant, commit/diff facts and linked references under a separate policy | Commit = successful test, time spent, requirement satisfaction or developer intention |

OpenSpec's own design separates current specs and proposed changes/deltas; preserve that distinction rather than flattening both into active requirements. [Official concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md). Spec Kit now supports multiple/custom processes and artifacts, so an adapter must be version/process-aware rather than assume a fixed filename layout. [Official repository documentation](https://github.com/github/spec-kit). These are architecture implications from the sources, not implemented compatibility claims. Neither tool is initialized here.

## Authority is not a single status field

A relationship has **meaning** (contains, references, applies to, explicitly depends on…), **origin** (source assertion/manual assertion/AI proposal), **review** (unreviewed/accepted/rejected/superseded) and exact provenance/revision. Approval does not erase AI origin; a source assertion can be reviewed without becoming verified evidence. Do not conflate these dimensions into one edge color or a boolean verified.

- Explicit source assertion: neutral solid line, native relationship label/direction, source disclosure. Derived project ownership is labelled as the explicit project field, not a runtime call/dependency edge.
- AI/heuristic proposal: separate dashed suggestion layer with reason, model/rule version and cited source if later enabled. Off by default; no invented certainty/confidence as fact; never accepted by opening the map.
- User approval/manual assertion: visible review/actor/revision badge; original origin retained. Separate audited commands with same-project/type/revision checks. User-authored edges may have no document source; show that honestly.
- Actual evidence: an observation/run/outcome tied to exact check/requirement revisions and actual provenance. Display the outcome and freshness, not a generic green edge. A proposed test/scenario or a checked Markdown task cannot create it.

The prototype has **source assertions only**, no suggestion or evidence records. The legend labels their absence rather than fabricating examples. Development state is a separate explicitly simulated interaction layer.

## Identity, source and updates

- Internal project/entity IDs stay stable. Source bindings use `(adapter/format namespace, source project identity, native record identity)`; the same title/path across formats does not identify one entity.
- PTB initially has one native source binding attached to the formed project; that binding is not the project's identity or a database-wide one-source limit. Future reviewed attachment preserves the original binding/captures and uses an explicit source/entity crosswalk. Same-looking native IDs across sources are not equivalent automatically; federation/automatic matching remains deferred.
- Unstructured files/sections have source-document/capture anchors, not invented permanent engineering IDs. Rename/heading changes require reviewed anchor remapping; a heading hash or line number is not a durable semantic key. Duplicate/broken/ambiguous references remain inspectable.
- Retain immutable exact captured text/bytes identity, document hashes, adapter/version and exact spans/heading context. A live path alone cannot recover wording after edit/delete. Captured versus live source must be clear. Do not promise in-place source editing or filesystem watching in the first slice.
- Apply the existing proposed B/L/I review: prior reviewed source baseline, local revision, incoming source. No silent overwrite/destructive omission/completion reset. New adapter candidates cannot change confirmed releases or operational state. Existing PTB packages remain reference-closed; do not introduce implicit database-only link resolution.

## Trust and persistence gates

Main owns native grants, containment, file/total/depth bounds, symlink/alias/encoding checks, captured sessions and named operations. Each adapter specifies what it can acquire; a PTB manifest grant must not turn into an unrestricted vault/repository grant. No fetching remote images/links, shell commands, dynamic plugin loading or interpreting instructions in documents as agent authority. Rendering keeps scripts/HTML inert. Optional AI later requires separate explicit data/model/permission review; it cannot broaden a file grant.

Project queries return bounded typed projections and reference origin/review/source, not renderer-authoritative graph mutations. Presentation coordinates/collapse/viewport are independent from domain relationships and progress. Future layout work must respect current Electron CSP and bounded processing, cancellation/stale-result ownership; no unsafe-eval or network relaxation to adopt a library.

Persistence remains additive and separately approved: immutable source/bindings/receipts + typed project definitions/revisions/relationships first; optional suggestions/review decisions/evidence are separate later schemas. Do not build all stores now. Keep release-owned rows/guards, migrations 001–003, actual history/checkpoints and existing typed IPC boundaries intact. Populated-v3 before/after equality, failed-transaction rollback, idempotent retries and packaged recovery are mandatory when a persistence slice is authorized.

## Consolidated AG review refinements

Current supported structured input is **PTB 0.2**, not v0.1/v0.2. The v0.1 planning package is preserved research, not an implemented adapter. Future source formats are not confidence/truth tiers: an explicit OpenSpec or Markdown reference stays an explicit native assertion; an app-generated AI relationship stays a suggestion until reviewed. Neither becomes actual verification merely by being structured or approved.

Path distance also does not change authority. Two native explicit edge segments remain explicit, even when the second is two hops from the anchor. A derived shortcut/route is a separate presentation value with both constituent edge IDs/directions/source anchors. No derived dependency row is persisted from a navigation path.

The first durable schema needs exact capture identity, existing narrative-inclusive semantic hash and audited choices. An additional structured graph digest is optional after versioned normalization rules are reviewed; equality must never authorize an overwrite or imply identical narrative meaning. Generated JSON/abbreviated fixture source must not be displayed as an exact captured section or given a fake document hash/span.

Future ProjectsTimeline MCP should be a separately authorized transport for bounded typed context queries and explicit domain commands, with source provenance and revision checks. It must not expose generic filesystem/SQL/shell execution, the Electron bridge or model access automatically. No server, SDK/dependency or authorization scheme is built in V3 merely to keep this direction possible.
