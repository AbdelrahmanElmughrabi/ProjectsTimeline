# PTB v0.2 — Example review and release-free journeys

2026-11-06 · **Design fixtures and specification walkthroughs, not running app features.** [Contract](ptb-v0.2-contract.md) · [Domain](development-domain-contract.md) · [Traceability](product-traceability.md).

## What was checked

Created two realistic engineering plans using exactly the same record format. A temporary inline Node/standard-library documentation check read their explicit JSON blocks and checked common metadata/prefixes, unique IDs, same-project typed targets, component cycles, stage ownership, action type/detail presence, requirement-to-planned-check coverage and absence of imported status/results. It compared normalized records/bodies after combining files and reversing presentation order. It did not write any source/test/helper code into the application, call its bridge, run an importer or change a database.

| Fixture | Files | Records by kind | Explicit domain links | Unscoped actions | Review outcome |
| --- | --- | --- | --- | --- | --- |
| [Desk Notes](examples/ptb-v0.2/small/project.md) | **1** | 1 project, 1 component, 2 features, 3 requirements, 1 scope, 4 actions, 1 decision, 2 checks = **15** | **29** | 1 | JSON/graph checks and semantic repackaging comparison pass |
| [FieldLedger](examples/ptb-v0.2/complex/project.md) | **4** | 1 project, 4 components, 5 features, 8 requirements, 2 scopes, 10 actions, 2 decisions, 5 checks = **37** | **82** | 1 | JSON/graph checks and semantic repackaging comparison pass |

Link totals count declared parent/component/feature/requirement/scope relationships, not project-owner links or internal stage keys. All 3/8 requirements have explicit planned checks; this is coverage of definitions, **not verification success**. No fixture contains completion/outcome/accepted/confirmed flags. No external workflow installation is needed: scope stage plans are inline. All proposed engineering work still requires real user acceptance and execution.

The lightweight fixture extractor recognizes the known fixture fences only. It is not a Markdown-aware production parser, full schema validator, duplicate-JSON-key detector or security implementation. Unsafe acquisition, source span accuracy, blocked-file/junction handling, malicious nested fences and database/UI/restart behavior remain future implementation tests. The existing app's last recorded 62 automated checks were not rerun in this design phase.

## Journey A — ordinary project, one file, no scope required

1. **Preview:** choose Desk Notes' single `project.md`. The source and 15-record outline appear together, including two features, three requirements, four proposed actions and optional scope/stages. Arbitrary headings are narrative. Preview/cancel persists nothing.
2. **Create:** approve structural creation while leaving action selections empty. Requirements are draft; `scope.durable-notes` stays Draft; four actions are Proposed, `dec.notes-local-store` Proposed and both checks Not run. There are **zero releases** and no confirmation obligation.
3. **Begin small work:** accept the relevant requirement revision explicitly, then adopt `act.document-note-recovery` **without a scope**. The same action is now Committed and incomplete; other actions remain proposals. Start authoring the recovery note. It appears under its feature and Stages → Unscoped with the same identity.
4. **Leave context:** save a checkpoint, for example: Accomplished “Outlined the normal restart guarantee”; Problem “Need wording for failed saves”; Intention “Distinguish saved text from unsaved drafts”; Question “Which failed-save feedback will the first UI expose?”; Next “Finish the recovery note, then review the save boundary”; link `act.document-note-recovery`.
5. **Resume:** after a future implemented app's full restart, Home opens Desk Notes, Resume shows exactly that authored context, and Continue opens the same committed action. Toggle Features/Stages/History without creating another task. History has actual import/adoption/checkpoint events, **no inferred coding session**.
6. **Continue deliberately:** once the note is actually written, record completion. This neither accepts the storage decision nor passes the restart check. Activate `scope.durable-notes` only if the developer wants structured work; commit selected scoped proposals after reviewing their placement. No release is needed at any step.

**Expected invariant:** project formation and useful engineering/resumption work end to end without making a scope mandatory. Existing lightweight actions/checkpoints still work for projects never imported from PTB.

## Journey B — larger project, several documents and scopes

1. **Preview the manifest:** FieldLedger declares `domain.md`, `work.md`, `assurance.md` only. Resolve all 37 IDs across files before validation; forward references are legal. Show nested storage component, project-wide `req.recorded-origin`, multi-feature requirements and shared change-history feature.
2. **Review scope:** accept chosen requirement revisions and explicitly activate `scope.offline-core` with its stage plan; keep `scope.invoice-export` Draft. Commit only `act.specify-job-save`, `act.persist-job`, `act.record-change-origin`. Seven other actions remain Proposed; checks Not run and decisions Proposed. No release or gate exists. Show counts/Not assessed, **not inherited release progress**.
3. **Navigate shared work:** selecting `act.persist-job` under Stages → Offline core/Build selects that same record under Jobs/Change history in Features and its recorded adoption in History. `act.record-change-origin` references several features but is one committed action, not three completions. Each scope's `build` key resolves within its own scope.
4. **Record the unresolved boundary:** while implementing, save authored context such as “Job state transaction outlined; need verify history-insert rollback,” link the action and atomicity requirement, record the open question and next step. A future restart must recover those exact links/text without any release container.
5. **Move work explicitly:** if the developer later activates Invoice export and moves `act.record-change-origin` there, select its target Build stage. Validate source/target/action revisions, preserve ID/links/completion, bump both affected scope revisions and append one move event atomically. If already completed, require acknowledgement that real completed work follows it. No source/template edit is performed. A failure leaves both scopes unchanged.
6. **Control closure:** attempting to close Offline core while applicable committed work is unfinished is refused. Pause is an authored focus choice, not an invented time interval. Complete/reassign or explicitly exclude remaining work before closing. A later ordinary edit to a terminal scope requires explicit Reopen; its previous closure remains history. This is distinct from permanently frozen confirmed releases.
7. **Engineering truth:** reviewing `dec.job-transaction` requires actual acceptance; `check.job-rollback` remains a plan until a real assessment is recorded under an approved evidence policy. Completing implementation work never automatically verifies `req.job-atomicity`, and no future delivery record is silently created.

**Expected invariant:** shared project-level features/requirements persist across efforts while membership and actual events explain where work happened. The file layout is provenance, not product ownership.

## Adversarial specification walkthrough (expected outcomes, not executed app tests)

| Proposed input/operation | Contract outcome |
| --- | --- |
| Add a prose `## Requirements` heading without a ptb block | Keep narrative; zero new requirement records. |
| Put example PTB inside a longer outer Markdown fence | Literal code example, not a nested record. Production Markdown recognition needs a future test. |
| Repeat an ID or JSON key; use wrong kind prefix/type | Blocking duplicate/schema diagnostic; never last-key-wins. |
| Point `requirements` at a feature, another project or absent ID | Blocking typed-link/ownership/target diagnostic. |
| Create a component-parent cycle | Blocking cycle diagnostic, actionable path/IDs. |
| Give an unscoped action a stage or reference another scope's missing key | Blocking stage diagnostic; no guessed assignment. |
| Reference a release-purpose/unknown library workflow | Explicit resolution required; no gate transfer or silent fallback. |
| Omit acceptance / add unknown completion or outcome metadata | Missing acceptance warns; unknown fields warn/remain inert. Nothing completes or passes. |
| Declare traversal/junction escape/duplicate physical file or exceed limits | Acquisition fails before apply; no read outside the selected boundary and no persistent writes. |
| Cancel, refresh or edit source after preview | Cancel writes nothing; refresh requires new review; apply uses the captured reviewed snapshot, not silently changed files. |
| Apply twice or lose acknowledgement | Receipt resolves to the same created project/result; no duplicate work. |
| Import an existing external project ID or omit an old record on reimport | Open/cancel initially; later reviewed diff only. Never silently clone, delete, reset completion or overwrite local edits. |
| Inject apply/audit failure, stale move revision or failed refresh | Atomic rollback for failed writes; retained drafts. After acknowledged apply, read-only retry/receipt resolves recovery without duplicate writes. |
| Upgrade an existing v3 profile | Requires separately approved SQL and actual populated-profile/restart tests. No automatic release-to-scope conversion. |

## Design findings and remaining gates

Single-file multi-entity authoring is practical without losing Markdown narrative; complex packages use the identical records/relationships. The explicit inline stage plan solves unknown-template dependence for both examples while leaving reusable-library keys/purpose a separate reviewed integration. Three important costs remain: JSON punctuation, mandatory explicit links, and careful block/body location handling. Review these examples with real project content before treating v0.2 as final. Scope cardinality/lifecycle, development percentages, machine-schema/parser choices and later evidence/snapshot policies still need their approvals. No runtime usability, persistence or security pass is claimed by this design exercise.
