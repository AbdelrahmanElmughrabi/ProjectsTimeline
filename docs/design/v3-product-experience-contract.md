# V3 Visual Engineering Workspace — product experience contract

2026-11-07 · **Review draft; design assessment and isolated prototypes only.** This redirection replaces the paused stage-board-led composition. Historical drafts and tooling are preserved at **47f73c6**, also named codex/v3-paused-design-checkpoint. Approved source integrity, independent development/release ownership and progress/evidence rules remain intact. No feature/migration/dependency approval is implied.

[UX blueprint](connected-workspace-design.md) · [interactive study/run instructions](v3-visual-prototype/README.md) · [ingestion architecture](multi-format-ingestion-design.md) · [roadmap](product-implementation-roadmap.md) · [tooling/component inventory](v3-ui-component-inventory.md) · [backlog](visual-engineering-backlog.md) · [Antigravity handoff](../agent-handoffs/antigravity-v3-workspace-design.md)

## Outcome and diagnosis

ProjectsTimeline transforms existing engineering knowledge into a navigable software model, development organization and useful continuation context. A developer should understand a project and follow its supporting knowledge with less effort than reading every source record. PTB stays deterministic; optional AI is not required to open or understand structured material.

| Inspected implementation/research | Why it falls short | Keep / change |
| --- | --- | --- |
| V2 Preview: eight entity groups, counts, IDs, hashes, source locations, validation and inspector | Excellent fidelity/debugging; poor initial model of what the software does and how concepts connect. Parsing success is not workspace usability. | Keep capture/parser/diagnostics/source navigation. Make goal, capabilities and a bounded semantic map primary. Technical data under disclosure. |
| App/Home/Project: name/time project records, actions plus release workspace, actual checkpoint/activity summaries | No permanent product graph or linked engineering target to recover. Release organization cannot represent all development. | Preserve Home/navigation/security/release subsystem; evolve project views from shared permanent records. |
| Paused V3 prototype: feature cards plus four-stage board and permanent Resume rail | Attractive lists still ask users to reconstruct relationships. Inspector sits below long work lists; an empty recovery rail wastes canvas space. | Retain real fixture research, batch-effect and source policies. Replace the default composition, not the domain foundations. |
| Current Resume/checkpoint: accomplishment/nextSteps, Continue focuses generic action input | Returning after a week still requires finding the problem and related records. | Retain old selection/order; add explicit linked problem/question/next step after formation. Conditional compact recovery strip, no large empty panel. |
| Existing workflow/release system: copied/versioned definitions, actual evidence and frozen confirmation | Useful engineering foundation, but release gates are not development progress. | Reuse isolation/transactions later for development-purpose playbooks; never move release confirmation into ordinary workflows. |

This is a product diagnosis, not a claim that validated V2 behavior failed. Source/UI/tests/config were read; no production V3 changes are included.

## Two distinct concepts

**A — Component Atlas (recommended):** a stable structural canvas, grouped components with capability links, optional child expansion, explicit connected-neighborhood exploration, one inspector to the right at wide widths. No task cloud. The first map shows the project and seven top-level components; two child components are collapsed. A Features lens shows seven capabilities. Select a concept without rearranging the whole graph; Explore connected changes the neighborhood deliberately. Project-ownership lines come from each record's explicit project field, not a guessed runtime dependency.

**B — Focus Workbench:** persistent capability index, a focused relationship canvas, and a reading/inspection surface below it. Better for following one engineering question and longer rationale; less canvas area and more risk of losing global orientation. The study lets users switch concepts using the same record identities and source. It is not merely a theme variant of A.

Recommend **Atlas with an explicit neighborhood mode and synchronized list**. It supplies a stable mental model; Workbench is a serious alternative for Antigravity/usability review, not a second production interface to ship by default. Their rendered comparison and limitations are recorded in verification.md. The reference's graphite/violet hierarchy and coherent shell guide the study; its decorative progress, dates, notifications and mountain illustration are not requirements.

## Connected interaction contract

1. **Home:** recognizable projects; actual saved intention if present. No checkpoint means Open project and a small Save checkpoint affordance later, not an empty dominant Resume panel. Recorded app activity is labelled Recorded; actual verified outcomes have separate evidence provenance.
2. **Overview:** goal and major capabilities/components first, explicit current focus and unresolved questions only when authored. Counts use explicit qualifiers: proposed/committed/in progress/done/Not assessed. No invented percent, schedule, highest priority or coding session.
3. **Map (primary visualization):** component/feature structure, bounded expansion, selection, drag, pan/zoom/fit, semantic lenses/search/list. Relationships show their meaning, direction and source; layout/line proximity never imply dependencies. Default excludes actions, decisions and checks. Requirements enter only contextual neighborhoods; the inspector links other engineering records.
4. **Inspector/source:** same durable identity across views; purpose/details/links first, IDs/hashes secondary. Exact captured section is available and inert. A related-through-feature item is labelled as a path, not a new asserted dependency. Definition/source assertions are not verification.
5. **Development (secondary):** authored scopes/stages and linked capabilities/work. No dates → ordered roadmap; date-aware Gantt remains a later explicit-data feature. Plans, explicit commitments/current work and actual completion are separate. Out-of-order work remains legal. Nothing confirms a release or passes a check from an ordinary completion control.
6. **History/continuity:** actual imports/adoptions/changes/checkpoints/accepted decisions/observations when those operations exist. Source narrative is not historical execution. Save authored accomplishment/problem/questions/next step and exact target/view. Continue resolves it; missing/stale targets retain text and offer history/current context.
7. **Blueprint adoption:** human summary → explicit target → grouped requirement acceptance/action commitment/scope activation with default none → final effect summary → atomic apply/receipt. All definitions survive as proposals without 47 manual forms. Existing-project attachment and updates remain separately reviewed paths; no fuzzy matching/overwrite.
8. **Local evolution:** change a local working definition through a revision, preserve original source, review later source changes against the prior baseline. Map-node movement only arranges the view. It never reassigns a feature, adds a dependency or changes action progress. No edge creation/semantic deletion by dragging in the first map slice.

## Real-case walkthroughs and truth boundaries

Primary data read from C:/Users/fireball/OneDrive/Desktop/3d pet generator/projects-timeline-test. No Vivarium code was run/edited. Existing V2 capture actually validated single/multi packages: **47 records / 86 typed links; 9 components, 7 features, 10 requirements, 1 scope, 10 actions, 4 decisions, 5 planned checks**. One four-stage scope organizes nine actions; one action is unscoped. Single/multi metadata/links agree but four narrative bodies differ; their hashes correctly differ. Preserve those differences.

| Journey | What the developer sees/does | Proposed authority / prototype boundary |
| --- | --- | --- |
| Vivarium comprehension | Open project → seven capabilities → Component Atlas → select Procedural anatomy → inspect its child, feature, requirements/work → exact source section → deliberate connected neighborhood | Node/source identities come from real PTB; project-field ownership is labelled explicitly. Plans remain proposals; no runtime dependencies are inferred from the architecture prose. |
| Vivarium work + return | Switch Development → review simulated plan effects → explicitly commit/activate → Start PRNG action → author checkpoint/problem/next step → Home Continue → same target → History | Prototype clicks are labelled simulation and kept only in memory. Production later needs approved development records, transitions, source/receipt transactions and linked checkpoints. No current SQLite/restart proof. |
| Small Desk Notes | Import one file → understand two features → commit only unscoped recovery-note action → save next step → Continue; leave optional scope Draft | Original 15-record/29-link fixture and earlier worked journey remain useful. No scope, workflow setup, release or percentage required. This new interactive study contains Vivarium only. |
| FieldLedger supplement | Two scopes share a feature and an action; change scope lens without cloning either | Original 37-record/82-link fixture validates ownership assumptions, not implemented V3 persistence. No project-wide stage made from equal labels. |

Reviewer questions (not automatic app diagnoses): Vivarium's no-third-party-runtime-code requirement needs reconciliation with its proposed Three.js stack; performance and deterministic comparison need a reference environment. Five requirements lack a linked planned check; that is definition coverage, not proof of absent real testing. All remain Not assessed until actual observations exist.

## Five consequential decisions for review

| ID | Recommendation / tradeoff |
| --- | --- |
| VD1 Default workspace | Adopt stable Component Atlas with explicit neighborhood exploration; retain Workbench as a reviewed alternative, not two shipped modes by default. Graph usefulness must beat the list, not simply look technical. |
| VD2 Map semantics and editing | Default component/feature structure with bounded requirements on demand; tasks/evidence in context. First map is semantic read-only: positions may move locally, but edges/ownership are not edited by dragging. Later saved layout is presentation-only and needs its own revision/reset policy. |
| VD3 Multi-source authority | Approve the adapter/capture boundary with namespaced identities and explicit crosswalks; source assertions, AI suggestions, user approval and actual evidence remain distinct. PTB first; Markdown is documents/links unless explicitly structured, never invented engineering entities. No adapter implementation/format initialization yet. |
| VD4 Navigation and recovery | Overview / Map / Development / History; Features becomes a map lens/context path rather than another duplicate top-level record list. One inspector, compact replacement at narrow widths; Resume gains prominence only with actual saved context. |
| VD5 Delivery gate | Validate both visual concepts/security/layout first, then separately approve concrete V3a formation + primary map, immediately linked recovery, and early inline development organization as small complete paths. Keep attachment/merge next; defer advanced graph editing, scheduling, percentages and new importers. No blanket SQL authorization. |

Explicit Start/blocker/definition-edit semantics remain proposals in the domain contract, to finalize with their command slice; this design does not silently approve those transitions. Existing release policy and confirmed history remain unchanged. No AI runtime, arbitrary document command execution or new importer is introduced.

**Review before production:** inspect both layouts at wide/narrow sizes; follow a component → source → work → checkpoint → Continue; assess legibility, cognitive effort and keyboard behavior. Prototype reset/reload erases simulated work. Persistent adoption, large-graph performance, migration/restart and production packaging remain future acceptance gates.
