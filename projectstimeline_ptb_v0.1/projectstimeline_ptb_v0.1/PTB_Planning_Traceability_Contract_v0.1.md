# ProjectsTimeline Blueprint (PTB) — Planning & Traceability Contract v0.1

**Status:** Design draft for review, not an implemented file format or approved database schema.  
**Product priority:** Resume complex software development with minimal cognitive effort.  
**Implementation premise:** The application imports a strict, human-readable engineering package **without using AI**. Any external LLM is only an authoring assistant and must follow this contract.

## 1. Product and architecture commitments

1. ProjectsTimeline is **development-first**. Engineering work can exist without a release, deadline, or delivery candidate.
2. Projects and features have long-lived identities. A feature may be developed in many efforts and included in several later releases.
3. Small features can be tracked through a few actions. Larger features, or groups of features, can use optional structured **development scopes**. A feature can grow without losing its identity or history.
4. The main workspace offers **Stages / Features / History** as alternate views of authoritative engineering records, not three independent data stores.
5. Blueprint statements, proposed work, committed work, observed events, verification results, and release confirmation are **different kinds of data**.
6. The original full Markdown text and heading hierarchy must remain readable in the app. Structured extraction must not erase the explanation and rationale.
7. Project templates, planning rules, and content import are deterministic. No model inference, implicit approvals, or fabricated accomplishments.
8. Developer-style personalization, Obsidian integration, AI/local-model runtime integration, agent orchestration, and development-pattern analysis are deferred.

## 2. Canonical conceptual model

| Record | Ownership / lifetime | Essential relationships |
| --- | --- | --- |
| Project | Independent, long-lived | Owns all other project records |
| Component | Project-owned; may nest under another component | Contains or categorizes features |
| Feature | Project-owned, persistent across scopes/releases | Has optional primary component; links to requirements, actions, decisions, and checks |
| Requirement | Project-owned, revisionable engineering assertion | May apply to several features; can also be project-wide |
| Development scope | Project-owned, optional focused effort | Can encompass one or many features; owns optional workflow instance and committed work |
| Action | A proposed or committed unit of engineering work | May link to scope, requirements, features, and a workflow stage |
| Decision | Engineering choice with explicitly recorded rationale | May affect multiple features/requirements; approval and supersession are historical events |
| Verification plan/check | Planned way to assess requirements | Links to requirements; is **not** a test result or proof of success |
| Checkpoint / event | Factual or deliberately authored historical context | Refers to real engineering records; retains timestamps and provenance |
| Release | Independent delivery/verification scope | Captures chosen work, artifact identity, evidence, and frozen historical facts |

**Relationship rules:** Project is the ownership boundary. Component ancestry is acyclic. References must exist and belong to the same project. Features may participate in several development scopes over time. A scope does not inherently imply a release. Requirements can be cross-cutting. An action can link to several requirements. A check can verify several requirements. Workflows describe work organization; they do not own product requirements.

## 3. PTB package structure and v0.1 syntax

The **initial supported entry point** is `project.md`. It can be the entire minimal blueprint or declare more Markdown documents using a `documents` list. A package can be authored by a human, an external LLM, or another tool.

Each recognized document has YAML frontmatter followed by ordinary Markdown. **No semantic entity is inferred from free prose.** A renderer may index headings for navigation, but requirements and link relationships must be explicitly declared in metadata. All source text is preserved for reading.

Required common frontmatter:

- `ptb: 1` — major format version, fixed in this contract.
- `kind` — `project`, `component`, `feature`, `requirement`, `scope`, `action`, `decision`, or `check`.
- `id` — stable machine-readable ID, **unique across the whole package**; IDs are not derived from titles or filenames. Suggested prefixes: `proj.`, `cmp.`, `feat.`, `req.`, `scope.`, `act.`, `dec.`, `check.`.
- `title` — human-readable label.
- `project` — required on non-project records; must match the manifest project's ID.

Suggested ID grammar: `^(proj|cmp|feat|req|scope|act|dec|check)\.[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*$`. IDs persist through renames and file moves. Do **not** reassign an old ID to an unrelated concept.

Initial kind-specific fields (all links use stable IDs, never SQLite IDs):

| `kind` | Recognized structural metadata | Notes |
| --- | --- | --- |
| `project` | `documents: [relative/path.md]`, `capabilities: [registered-key]` | The manifest must be `project.md`; `documents` may be empty/omitted |
| `component` | `parent: cmp.some-id` (optional) | Parent must be another component of the same project |
| `feature` | `component: cmp.some-id` (optional) | Feature remains project-owned; component placement can change |
| `requirement` | `features: [feat.some-id]`, `type: functional\|quality\|constraint`, `acceptance: [observable-condition]` | `features` may be empty for cross-cutting project requirements; missing acceptance is a review warning |
| `scope` | `features: [feat.some-id]`, `workflow_key: stable-workflow-key` (optional) | Scope is not a release; workflow selection must be resolved at review time |
| `action` | `scope` (optional), `features`, `requirements`, `action_type`, `stage_hint`, `definition_of_done`, `covers_rule_ids` (all optional) | An imported action is a **proposal**, never complete or verified |
| `decision` | `features`, `requirements` (optional) | Narrative documents alternatives and rationale; import does not confer approval |
| `check` | `requirements`, `method: manual\|automated` (optional), `expected: [observable-result]` | A **planned check**, not an actual passed/failed run |

Optional relation arrays default to empty. The final schema must specify max lengths and supported enum values; the initial validator must reject malformed types and dangling links. Unknown metadata is **reported and preserved as source text but not acted upon**. Namespacing for future extensions may be defined after v0.1.

All Markdown body text and heading paths are retained in the source-document representation. Structured fields govern navigation/traceability; a heading like `## Requirements` alone does not silently create requirement records.

## 4. Import, validation and approval contract

Pipeline:

1. **Acquire safely:** Accept a user-selected local file or package, inspect `project.md`, only read manifest-declared relative `.md` paths; reject traversal, symlink escape, duplicate paths, unsupported size/count, and unsafe URLs. Treat all imported content as untrusted data.
2. **Parse strictly:** Use bounded safe YAML parsing and Markdown parsing. Never execute YAML tags, scripts, Markdown HTML, or document instructions.
3. **Validate:** Check format version, kinds, IDs, field types, project ownership, path resolution, missing references, component cycles, and repeated entity IDs. Distinguish blocking errors from incomplete-but-reviewable warnings.
4. **Normalize:** Produce an immutable *proposed project graph* with source document, heading, and location provenance. Preserve exact source content/hash for later traceability.
5. **Plan deterministically:** Merge explicit **proposed** actions with optional rule-based suggestions, retaining origin and reasons. Do not commit or mark complete.
6. **Review:** Display project tree, source text, unresolved warnings, planned scopes/actions, template choices, and suggested additions. User decides what to accept or edit.
7. **Apply atomically:** Create the approved project/development plan and provenance in one transaction; rollback fully if any write fails. Do not silently create or confirm releases.

**Conflict policy:** Blocking errors prevent application. Warnings may allow import with clearly flagged unresolved details; they never imply readiness. No guessing IDs or target features from similar names.

## 5. Planning transformation and traceability contract

### 5.1 Proposed versus committed work

- Explicit `kind: action` entries become **imported action proposals** with identity, description, optional scope and relationships.
- The user may adopt them as committed work, leave them in a proposal queue, edit them, or reject them.
- Approved actions become ordinary tracked work with existing/applicable policies. A separate development scope is **optional**: small work may remain project backlog; larger work is assigned to a scope.
- A development scope can apply an engineering workflow, creating stage/action organization independent of release confirmation.
- An imported document cannot set completed timestamps, authentic test outcomes, or confirmed release flags.

### 5.2 Rule suggestions

- Rule evaluation uses only explicit structured facts such as declared `capabilities`, linked requirement `type`, and selected workflow key; never unstructured prose inference.
- Each suggestion has a stable `rule_id`, proposed action definition, explicit trigger reference, reason, suggested stage, and optional target feature/requirement.
- Duplicate prevention must be **identity/rule-based**, not fuzzy title-matching. An explicit action may declare `covers_rule_ids`. If semantic overlap is uncertain, show it for human review rather than silently discarding one.
- Recommendations are optional until accepted and never alter completion/progress/readiness merely by existing.

### 5.3 Links and proofs

- Action `addresses` requirement; check `verifies` requirement; decision `affects` feature/requirement; event/checkpoint `concerns` corresponding records. These links do not themselves constitute proof.
- Completing an action does not mark its requirement verified.
- Declaring a planned check does not create a test result.
- A recorded check run, manual observation, or evidence reference must be stored as an **actual event with provenance and freshness policy**, distinct from the imported plan.
- Changing a requirement or a scope can invalidate relevant verification while preserving older outcomes in history.

### 5.4 Development versus release

- Development scopes operate **without** a release and must **not** inherit the app-managed `release-confirmation` gate from the current release-focused template implementation.
- A workflow's engineering stages must be separable from a *release-only* confirmation policy. In particular, existing `seven-stage-engineering` has a protected final stage and release gate; it cannot be blindly reused as a development-scope instance.
- **Development progress** measures accepted scope work using a deliberately approved development policy. **Release readiness** is separately assessed against a delivery snapshot and its current verification evidence. Neither is assumed from the other.
- Existing confirmed releases and their provenance must remain frozen and historically correct. No bulk migration that silently reinterprets prior release stages/actions.

## 6. UI projection contract

| View | Question answered | Must show |
| --- | --- | --- |
| Home | Which projects need my attention? | Recognizable project cards/list, latest real activity, factual cross-project summaries |
| Project overview | What is this project, and where was I? | Goal, current focus, selected development scopes, latest checkpoint and next step |
| **Stages** | Where does accepted work sit in the engineering process? | Scoped stage/action tree; explicit unassigned/unspecified states; no invented stage dates |
| **Features** | Which component and capability am I engineering? | Expandable component/feature tree; associated requirements, decisions, actions and checks |
| **History** | What actually happened, in what order, and why? | Recorded events and human-authored reasoning only; traceable record links |
| Inspector / Resume | How do I continue with minimum effort? | Last stated problem, intention, changes, unresolved questions, next action, linked context |

All views query the **same authoritative IDs/relationships**. Switching view should retain selected feature/action when possible. The user can open the full original Markdown section from a structured record. There is no fake activity, inferred work session duration, or AI-authored 'reason' presented as fact.

## 7. Reimport and evolution rules

- PTB IDs and hashes enable future change comparisons across package versions and path renames.
- Reimport is a **reviewed diff**, not a replace-all: additions, changed fields/body, omitted records, changed links, and conflicts are presented separately.
- Missing records are not automatically deleted; completed work/checkpoints/evidence/history are never reset by reimport.
- Existing project-state edits and imported-source changes require an explicit conflict resolution policy.
- First implementation can limit itself to **new-project import**, but must persist origin identifiers/hashes and reserve the reimport design; repeated same input must not silently create duplicate projects.

## 8. Acceptance scenarios (must be testable without an LLM)

1. Parse a one-file valid blueprint and produce an ordered project outline with intact narrative text.
2. Parse a multi-file package with feature -> requirement -> action/check links; display all source references.
3. The same package produces the same normalized model when reimported for validation; changing filenames without changing IDs preserves record identity.
4. Duplicate IDs, unknown required reference targets, cross-project links, component cycles, and unsafe file paths are rejected with actionable messages.
5. Missing acceptance criteria produces a visible **review warning**, not a fabricated criterion.
6. Rule recommendations show a trigger and rationale, remain uncommitted, and do not silently duplicate `covers_rule_ids` actions.
7. Preview/cancel writes **nothing**. Failed approved import rolls back all records. Restart recovers the committed project and its source document relationships.
8. A developer can import a project, create/use a feature and action, record a checkpoint, reopen after restart, and resume **without creating a release**.
9. Stages, Features, and History navigate to the same action identity; History displays only recorded events.
10. Existing schema v3 projects, action histories, workflows, release verification, and confirmed-release snapshots remain valid after migration.
11. No model is installed or networked, yet import, recommendations, planning, navigation, and verification of the core product remain functional.

## 9. Implementation priorities / boundary of v0.1

**Design now:** full entity meanings, ownership, import and change contracts, release separation, source provenance, UI navigation and failure semantics.

**First working vertical slice:** Deterministic PTB parser + validator -> preview -> atomic **new project** creation with permanent feature/requirement and one optional development scope -> one committed action -> selectable Stages/Features/History projections -> checkpoint and restart recovery. No release required.

**Later vertical slices:** Rich decisions and test run evidence; reimport reviewed diff; deterministic action packs; Git links; UX polish and multi-project dashboard; optional doc collection indexing, Obsidian links, local-model helpers, and personalized development patterns.

## 10. Repository alignment notes (GitHub `main`, reviewed 2026-11-06)

Retain: `001`–`003` migrations, project/action/checkpoint histories, existing release-owned scope snapshots, confirmation provenance, `calculateReleaseProgress`, Workflow Library and typed Electron bridge.

Critical extension: currently `release_stages`, `release_actions`, and confirmation policy are **release-owned**. Do not rebrand them as independent development scopes or reuse release confirmation gating for scope progress. Introduce additive project-owned features/requirements/scopes, preserving frozen historical release semantics. New migrations need explicit safeguards, versioning, and populated-profile upgrade tests.

**Not yet decided:** exact database tables/SQL, concurrency/version policies, final v1 schema JSON Schema/YAML schema, all action enum values, development-progress formula, reimport conflict UI, how reusable template release gates are disentangled. These need separate approval after this contract's behavioral review.
