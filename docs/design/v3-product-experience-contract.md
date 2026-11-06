# V3 Product Experience Contract — review draft

2026-11-06 · **Design/planning only; recommendations below are not approved V3 features or migrations.** Baseline b16f212, tracked source clean. [UX blueprint](connected-workspace-design.md) · [adoption policy](blueprint-adoption-merge-policy.md) · [traceability](product-traceability.md) · [roadmap](product-implementation-roadmap.md) · [design prototype](v3-workspace-prototype.html).

## Outcome and authority

Give a developer an understandable, already organized workspace from a structured blueprint, then preserve enough explicit context to continue a particular engineering problem after an interruption. Import is not the outcome; **review → choose work → act → leave context → resume that work without creating a release** is the acceptance path.

Confirmed foundations: local-first/deterministic PTB v0.2; project-owned development records, optional scopes; explicit approval and actual evidence separate from proposals; source/revision history; counts/Not assessed rather than development percentages; legacy releases/security/persistence remain protected. External AI may author input, but the app needs no model. The original reference guides hierarchy, continuity and graphite/violet styling, not invented dates/stats or extra placeholder destinations.

New recommendations: grouped review/commitment; a feature map and ordinal stage workmap; explicit work state/focus/blocker semantics; earlier linked Resume and inline-scope activation; safely reviewed existing-project attachment and source updates. These need decisions D1–D5 below and later concrete SQL/command approval.

## Evidence from the implementation and real blueprints

V2 reported **103 passing cases** at b16f212; manual acceptance and inherited dev-tool advisories remain in [its report](../v2-verification-report.md). This design phase does not rerun or rebrand that result as V3 verification. No production source/dependencies/schema changed.

| Finding grounded in code | Product implication / recommendation |
| --- | --- |
| [Preview](../../src/renderer/blueprint-preview/BlueprintPreview.tsx) prioritizes validation, counts and hashes; [record list](../../src/renderer/blueprint-preview/BlueprintRecordList.tsx) exposes eight entity groups | Useful technical tool, expensive first-use mental model. Start with the actual project goal, feature map, organization and review effects; put source machinery behind Details. This is a UX finding, not evidence the parser failed. |
| [App](../../src/renderer/App.tsx) has Home/Project/Workflows/Preview and renders backlog + Releases in Project; no permanent development graph | Land formed projects in development Overview, retaining an explicit separate Releases route. Do not convert release rows into mutable development work. |
| [ProjectHome](../../src/renderer/ProjectHome.tsx) repeats checkpoint text/activity per card; Project stores only name/createdAt | Compact recognizable goal/focus/next-step cards; disclose activity when useful. Legacy goal/identity remain absent until authored or explicitly bound. |
| [ResumePanel](../../src/renderer/ResumePanel.tsx) focuses action-title input; [Checkpoint](../../src/shared/contracts.ts) has accomplishment/nextSteps only | “Continue” cannot return to a particular requirement/problem. Link optional saved context to stable records and the saved view, retaining old checkpoint behavior. |
| Existing actions have completion/exclusion/release fields, no commitment/work-state/blocker model | Do not label work In progress/Blocked by inspection or import. Add explicit commands and actual authored blocker reasons before those labels ship. |
| [WorkflowLibrary](../../src/renderer/WorkflowLibrary.tsx) mandates protected release closing stages | Reuse editor/copy architecture later, not release content/gates. Valid inline development plans already exist in PTB; no master-template configuration is required to begin. |
| PTB has feature/requirement/scope links and authored stage order, but no task dependencies, priority, schedule or start hint | No dependency arrows, “ready” queue, critical path, due-date bars or inferred next task. Separate source placement from priority. |
| Reviewed source lives in an ephemeral [session](../../src/main/blueprint/session.ts); current DB has no source binding/receipts/development records | Reuse parser/acquisition and security; add slice-specific project persistence and command guards after SQL review. A DTO is not a usable import implementation. |

Primary case actually read: `C:/Users/fireball/OneDrive/Desktop/3d pet generator/projects-timeline-test/` (README, valid single/three-file packages and deliberate invalid package). Existing production capture/parser was called **read-only**, never Vivarium's application code.

| Case | Actual result | Design use |
| --- | --- | --- |
| Vivarium single + multi | Both valid: **47 records / 86 typed links**: 1 project, 9 components, 7 features, 10 requirements, **1** scope, 10 actions, 4 decisions, 5 planned checks | Main complex walkthrough. One four-stage scope: Design → Foundation → Implementation → Verification. Nine actions scoped, one unscoped; do not invent several scopes. |
| Desk Notes | Valid **15 records / 29 links**; one unscoped action alongside an optional three-stage plan | Small project can begin without scope activation. |
| FieldLedger | Valid **37 records / 82 links**, two independent three-stage scopes sharing permanent features | Validate multi-scope filtering and one task identity across projections; no merged global “current stage.” |
| Vivarium deliberately invalid package | Invalid, 13 occurrences; duplicate ID, cycle, wrong/missing links, bad stage and JSON syntax diagnostics | Review must keep invalid source inspectable; apply must remain unavailable until blocking issues resolve. |

Vivarium single/multi have equal normalized metadata (excluding manifest documents) and typed relationships, **but four narrative bodies differ**: project, req.export-extensibility, act.document-dna-format, dec.export-interface. Its README's narrative-equivalence claim is not confirmed. Current semantic hashes correctly differ under the existing narrative-inclusive policy (single `b0fbefb8…`, multi `23245ab6…`). Preserve source differences; stable IDs prevent duplication. Do not “fix” the parser or erase headings to hide the difference.

Human review also found: req.clean-room's “No third-party runtime assets or code” appears inconsistent with proposed Three.js in dec.stack-choice; req.realtime-performance needs a defined reference device/workload, and snapshot determinism needs an explicit comparison environment. These are **reviewer questions**, not automatically detected app rules or edits to Vivarium. Five of its ten requirements have no explicitly linked planned check; that count can be derived transparently, but is not proof of missing real-world testing. All ten remain Not assessed until actual evidence exists.

## Connected user journey

1. **Recognize/open:** Home's Continue uses an actual saved target/next step. Otherwise Open project; no invented session or recommendation. New project uses ordinary creation or Use blueprint.
2. **Understand:** select file through the existing native/main boundary. Human goal + grouped features + proposed organization first. Technical source/diagnostics remain reachable. Source validation is labelled separately from engineering readiness.
3. **Choose destination:** new project or explicit existing-project target. Existing identity/conflicts route to attachment review; matching a name never merges. Initially implement new-project flow, design both paths now.
4. **Review efficiently:** expand relevant feature/requirement/action groups; select a whole named group or subset explicitly. Requirements, committed actions and scope activation have separate selections, all initially empty. Selecting work never auto-accepts decisions or passes checks. Show linked draft requirements and placement issues before final approval.
5. **Apply once:** summary says exactly what will be created/accepted/committed/activated and what stays proposed. One reviewed transaction/receipt; acknowledged success plus failed read retries reads only. Cancel before apply changes no durable state.
6. **Enter organized development:** component/feature map and preserved inline stage plans are materialized from relationships, not reconstructed by hand. Scope activation is optional; proposed placement remains distinct from actual membership.
7. **Choose work:** saved next step → explicitly chosen focus → explicitly ordered work if later supported → otherwise browse/find a starting action. The app explains when priority/prerequisites are not recorded. A stable list order is not a recommendation.
8. **Work and correct:** Start/Complete/Reopen and local definition edits are explicit, audited, revision-checked. Merely selecting an inspector never starts work. Marking an action done neither approves a decision nor verifies a requirement.
9. **Leave context:** fast accomplishment/next-step entry plus optional problem/questions; visible linked target/view/filter. No automatic inferred intention. Unsaved fields survive navigation or ask keep/discard; failed save retains them.
10. **Return:** Home → Continue restores saved target/context, even if the previous filter would hide it. Missing/retired targets preserve the checkpoint and offer current record/history/overview, never a guessed task. Releases are unnecessary throughout.

## Worked walkthrough A — lightweight Desk Notes

These are **proposed user interactions**, not facts about completed engineering.

| Step / what the developer sees | What they can do | Proposed durable effect |
| --- | --- | --- |
| Review “Recover local notes” goal and two feature cards | Expand restart guarantee, choose req.notes-restart and the unscoped act.document-note-recovery; leave scope activation empty | Nothing until Apply; choices stay in transient review state |
| Summary: 2 features, 3 draft/accepted definition slots, 1 selected requirement, 1 unscoped commitment | Create project with those exact choices | All 15 definitions/source links preserved; selected requirement accepted, one action committed; other actions proposed, scope Draft, decision Proposed, checks Planned, **zero releases** |
| Overview highlights the chosen recovery-note task, with linked restart requirement and check definition | Start that action explicitly; open Features/History without changing task identity | Actual start/focus event if D4 approved; selection alone is not work |
| Save context form linked to the action | Author “Outlined recovery note”; Next “Clarify failed-save behavior”; optional question | Append checkpoint/context links and actual save event; no fabricated coding duration |
| Home after return shows that exact next step | Continue | Read same checkpoint/action; restore context and accessible focus. Do not create a scope or release |

The prototype permits a bulk choice of all three requirements as a different explicit selection. It does not impose that choice on this walkthrough. Proposed production restart acceptance must use a future implemented database; the prototype's navigation simulates interruption in memory only.

## Worked walkthrough B — actual Vivarium

| Step / screen | Deliberate choice / understandable result | Persisted boundary proposed |
| --- | --- | --- |
| Goal + seven feature cards | Recognize DNA, deterministic generation, anatomy, coat, parameter UI, persistence and export; 47 machine records are secondary | No writes, no guessed feature priority |
| Review choices | Review clean-room/stack wording as a human question. Either clarify a local proposed requirement revision or leave it Draft; app must not claim this conflict was automatically discovered | Original source untouched; explicit local proposal override if that future editor exists; otherwise external edit + Refresh requires new review |
| Select intended work/requirements in batches | Select the ten actions only if intended; explicitly activate **Step 1 – Generation Core** to preserve nine scoped placements; act.document-dna-format remains unscoped | One apply receipt captures choices. Requirements left Draft remain visibly unresolved links; no auto-accept. Four decisions Proposed/five checks Planned; zero completion/evidence/release rows |
| Overview → Stages | Four authored columns with feature chips, proposed/committed/doing/done counts; no dates, percent, dependency edges or invented “current stage” | Independent development stage instance/membership, not release_stages/release_actions |
| Choose Implement the deterministic seeded PRNG | User selects it; no claim it was highest priority. Feature view shows Pet DNA/seed requirements and explicitly related anatomy/coat context through req.deterministic-reproducibility | One action identity, explicit Start/focus; indirect navigation labelled “via requirement,” not copied work |
| Save/leave/return | Author next step, e.g. “Compare geometry hashes for the same DNA”; save problem/question and target. Home Continue returns to that action and saved Stages/Features context | Actual authored checkpoint and revision-aware links. Completion of the implementation does not make check.determinism Passed |

**Supplement:** FieldLedger filters scope.offline-core versus scope.invoice-export. feat.change-history remains one feature across both. act.record-change-origin appears directly under its explicitly linked features, but global counts deduplicate its ID. Closing one scope cannot rewrite the other or a legacy confirmed release.

## Five decisions requested

| Decision | Recommendation / tradeoff for approval |
| --- | --- |
| **D1 First useful delivery + explicit bulk effects** | Treat new-project formation + linked Resume + early inline-scope activation as a coordinated acceptance gate (separate vertical slices below). Keep all approval selections empty; allow named-group multi-select and final effect summary. Original unscoped-only V3a remains a useful first increment, but is not enough to claim Vivarium's workspace complete. |
| **D2 Main workspace model** | Overview + ordinal stage workmap + feature map + actual History; one contextual inspector, separate Resume rail. No date Gantt without schedule data; no dependency graph from mere references. Prefer feature understanding over a raw entity navigator. |
| **D3 Source/attachment authority** | One canonical external project binding initially; explicit first attachment to an unbound legacy project; exact IDs/three-way review thereafter. Persist immutable source and local revisions; keep local edits on conflict/omission. No fuzzy merge or destructive omission. This restricts unrelated-source federation until designed. |
| **D4 Work state and honest attention** | Add explicit Not started/In progress/Done, independent authored blocker lifecycle and user-chosen focus; retain commitment/applicability separately. Counts/Not assessed only. Start is not a timer; completion is not evidence. Requires new commands/history, never inferred from selection/source. |
| **D5 Missing semantics/version boundary** | Keep v0.2 compatibility. Add local explicit ordering/blockers first; design optional priority/dependency/schedule/start-hint metadata as a separately approved version extension, not guessed prose or secretly recognized unknown fields. No critical-path/recommendation engine in first V3 delivery. |

## Design acceptance and limits

Pass criteria: walkthrough tasks can be reached by feature/stage/context without configuring 47 definitions; batch effects explain every approval; changing view never creates another action; unscoped work starts without a scope; source conflicts preserve local changes; linked Resume recovers the authored engineering problem. [Traceability](product-traceability.md) supplies screen/data/acceptance links. Antigravity should challenge this proposal, not merely illustrate it.

Prototype = reviewable simulated interactions based on real metadata, no persistence/restart/evidence/import implementation. No production UI/migrations/dependencies or Vivarium code changed. Full V3 runtime tests, populated-v3 migration verification and user usability acceptance remain future gates. Build-tool audit follow-up from V2 remains open; it is not a reason to silently install or upgrade anything in this design phase.
