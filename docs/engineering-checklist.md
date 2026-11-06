# ProjectsTimeline — Engineering checklist

## Current phase — V3 Visual Engineering Workspace design, 2026-11-07

**Design assessment and isolated prototypes only.** Preservation baseline 47f73c6 contains the installed tooling and paused drafts. No production source/config/dependency/test/migration/ADR change in this phase. [Contract/VD1–VD5](design/v3-product-experience-contract.md), [study/screenshots](design/v3-visual-prototype/README.md), [inventory](design/v3-ui-component-inventory.md), [roadmap](design/product-implementation-roadmap.md), [Antigravity prompt](agent-handoffs/antigravity-v3-workspace-design.md).

| Category | Work / state | Evidence / next gate |
| --- | --- | --- |
| UX direction | Two graph-first concepts produced; final composition **Undecided** | Atlas versus Focus Workbench rendered with real Vivarium definitions; independent user/Antigravity review before selecting production layout. Paused board-first composition superseded, historical checkpoint retained. |
| Source/domain integrity | Approved foundations retained; new adapter/map policy **Undecided** | Deterministic PTB, independent development/release ownership, explicit approval, counts/Not assessed. VD1–VD5 plus concrete command/SQL review gate implementation. |
| Tooling | Exercised study path **Verified, prototype only** | Installed/lock versions match; actual React Flow/ELK/Tailwind/Base UI dialog build/render under current strict CSP. shadcn configured, no generated app components adopted. Build warnings/scale limits recorded. |
| Verification | Actual checks **Verified within stated scope** | Fresh app build/typechecks + 78/78 Node, zero skips; read-only real-source validation; pure projection and actual isolated Electron/Playwright journey, source/focus, simulated complete/reopen/context and 800/1160/1540 screenshots. Not full app Electron/packaged rerun. |
| Ownership | External design review **pending** | Two lighter Codex read-only reviews completed; Antigravity manual prompt/isolated ownership prepared, not launched. No implementation agent or production BEGIN. |

Next gate: user reviews the two concepts, source/authority boundaries and VD1–VD5; manually deliver the design-only Antigravity prompt. Existing manual V1/V2 acceptance and inherited dev-tool maintenance remain separate. No production implementation/migration from documenting the backlog.

## Historical implementation records


V2 checkpoint: **V2 implemented/automatically verified; user acceptance pending.** Final source bb2fd95 integrates reviewed AG fb49a4e/489c9c7 and closes AG-UI-001–003 through rebuilt-UI evidence. **78 Node + 21 Electron/UI + 4 rebuilt-packaged = 103 passing cases, zero skips**, both TS targets/build/package pass. Production audit zero; full audit retains 12 moderate inherited build-tool chain findings (no flagged package code in ASAR). Schema v3/security/legacy history unchanged. [Final report/manual checklist](v2-verification-report.md), [queue](agent-handoffs/v2-review-queue.md). Stop before V3a.

Prior V1 checkpoint, 2026-11-06: the design package/five decisions are approved with refinements, and **V1 Home** is implemented/automatically verified. Final **49 Node + 14 Electron + 3 rebuilt-packaged = 66/66 pass**, with build/typechecks and compact/wide screenshots. No migration/dependency change or implementation agents at that checkpoint. V1 acceptance remains open; the current V2 Phase A authorization is recorded above.

Updated: 2026-11-06. Foundation, Resume, Visual Foundation, Development Stages & Progress and the approved workflow milestone are implemented. Final workflow suite: **47 Node + 12 Electron + 3 packaged = 62/62 passed**, including build/typechecks, rebuilt Windows package, migration/restart recovery and compact UI checks. Manual acceptance remains open. Workflow decisions are recorded in ADR 0005; prior ownership authorization is recorded in ADR 0004.

States: **Undecided → Designed → Implemented → Verified**. Undecided includes AI proposals awaiting the user's decision. Designed means agreed, not merely written. Verified requires recorded results; generated code or a test file is insufficient.

| Category | Item | State | Evidence / next gate |
| --- | --- | --- | --- |
| Requirements | Core user problem defined | Designed | User brief: personal project workspace and development continuity |
| Requirements | First vertical slice defined | Designed | User brief: create → act → complete → checkpoint → restart → resume |
| Requirements | Explicit exclusions documented | Designed | User brief; scope in foundation-plan.md |
| Requirements | Acceptance criteria defined/approved by user | Designed | User approved rules/criteria; implemented and automatically exercised; manual acceptance pending |
| Architecture | Technology choices reviewed | Verified | User approved; installed/pinned; actual Electron and packaged checks pass |
| Architecture | Process/module boundaries defined | Verified | Renderer → preload → main → data; runtime preferences and bridge checks pass |
| Architecture | Data flow understood | Undecided | User explains one write and error return |
| Architecture | Interfaces sufficient for slice | Verified | Shared contracts; 31 fixed named methods including read-only getHomeSummary, existing sender/frame/URL checks and Result envelopes |
| Architecture | Expensive decisions documented | Designed | ADRs 0001–0006 cover runtime/storage/trust, Resume/visual/release/workflow behavior and Home read/continuity decisions; user understanding remains separate |
| Data | Minimum entities designed | Verified | Three original tables preserved; 002 adds five release/history tables and 003 adds four workflow/action-detail tables plus release origin fields; populated-v1/v2 packaged upgrade/recovery passes |
| Data | Relationships/constraints identified | Verified | FK/CHECK rejection, project separation, required text and completion invariant tested |
| Data | Persistence approach justified | Verified | Built-in SQLite writes/reopens in actual Electron and packaged executable |
| Data | Migration strategy defined | Verified | Backup, atomic pending batch, rollback, repeat startup and newer-schema refusal tested |
| Data | Write failures/recovery considered | Verified | SQLite lock/aborted INSERT; UI retains text and retries successfully |
| Security | Context isolation enabled | Verified | Actual Electron window preferences assert true |
| Security | No unrestricted renderer Node access | Verified | Actual renderer has no require/process; sandbox true, nodeIntegration false |
| Security | IPC narrowly scoped/validated | Verified | Same sender/frame/URL checks; 31 named methods, no generic SQL/IPC |
| Security | Local file/database access controlled | Verified | Main owns fixed profile data path; protocol serves only document/build assets |
| Security | Untrusted input handled safely | Verified | Required/bounded input, bound SQL and inert stored markup checks pass |
| Verification | User defines expected behavior | Designed | User approved proposed rules/criteria on 2026-11-05 |
| Verification | Unit tests cover business rules | Verified | Final 49/49 Node checks; existing 47 retained plus two Home query/isolation/read-only/recovery scenarios |
| Verification | Persistence integration test exists and passes | Verified | 14 Electron + 3 rebuilt-packaged checks pass, including Home/Resume recovery, edited templates and frozen releases |
| Verification | Manual restart/recovery completed | Designed | Await user's own packaged-app flow; automated result does not complete this |
| Verification | Failure cases tested | Verified | Invalid input/IDs, locked/aborted writes, failed migration/backup/newer schema |
| Verification | Results/unresolved issues recorded | Verified | First slice 7263c75: 40 Node + 10 Electron; completed editor 6b6fbed: 47 Node + 12 Electron + 3 packaged. Actual evidence and manual limits recorded in verification.md |
| Ownership | User can explain architecture | Undecided | Walk through boundaries |
| Ownership | User understands important data flows | Undecided | Trace request, validation, commit, UI acknowledgement |
| Ownership | User understands core implementation | Undecided | Line-by-line review of sensitive code |
| Ownership | User can debug basic application | Undecided | Trace one controlled failure without AI taking over |
| Ownership | AI implements; user reviews significant decisions and manual acceptance | Designed | User explicitly removed personal stage-coding requirement and approved full slice implementation. ADR 0004 supersedes earlier restrictions; understanding/review gates remain open |

Latest evidence: [verification.md](verification.md). V1/regressions pass all 66 checks, including 800/1160/1440 Home overflow/screenshots, keyboard/draft continuity and failed/late reads. Prior workflow evidence below stays historical. Automation does not establish manual acceptance or a comprehensive accessibility/security audit.

Next gate: user manual acceptance of V1 Home; earlier manual/understanding gates stay open until recorded. No V2 or additional migration without explicit approval. Rich linked context follows V3a in the approved direction; recommendations remain separate.

## New roadmap decisions

These supplement preserved M1 evidence. The Continue Implementation brief approved Resume and its refresh strategy. Feature-level Resume remains Implemented until its manual acceptance criterion is complete; automated criteria have recorded verification. Other draft proposals remain Undecided until accepted.

| Category | Proposed work / decision | State | Evidence / next gate |
| --- | --- | --- | --- |
| Requirements and scope | Resume slice and its six acceptance criteria | Implemented | User approved all criteria; automated 1–5 pass, manual criterion 6 pending |
| Architecture/module boundaries | One workspace snapshot owner; refresh from main after committed commands | Verified | useProjectWorkspace; tests distinguish write failure, committed/read failure, repeated read-only retries and stale responses |
| Data/migration safety | Resume uses existing schema v1 without migration | Verified | Existing 001 unchanged; real-file integration confirms version 1 and context recovery; future schema changes need separate approval |
| State transitions | Reopening/history, stage meaning, decisions and verification/readiness freshness | Implemented | Committed release reopening/history, stage scope and revision-bound manual verification ship under ADRs 0004/0005; engineering-decision transitions and automated freshness remain future |
| Security/error handling | Preserve narrow IPC and accurate failure/retry feedback | Verified | 31 fixed named methods through unchanged sender/frame/URL checks; original boundaries pass; actual write failure and repeated read-only retries tested |
| UI scope/accessibility | Approved Visual Foundation on the existing project screen | Implemented | User-approved scope complete; automated evidence/screenshots recorded; user acceptance pending |
| Testing/verification | Retain M1 regressions; selector/refresh/navigation/restart checks | Verified | Baseline rerun 15/15 before edits; final 23/23 with source and packaged Resume recovery |
| Testing/verification | User manual Resume acceptance and line-by-line review | Designed | Pending user execution/review; do not mark complete from automation |
| Developer ownership | AI implements approved domain logic; user reviews and accepts | Designed | Latest ownership amendment authorizes stage core/tests/integration; earlier personal-coding restriction superseded by ADR 0004 |
| Release scope/evidence | Future E: preparation, publication and final release verification | Undecided | Dependencies: requirements/checks/evidence/freshness, source/artifact identity, lifecycle/targets/permissions and release acceptance policy |
| Visual consistency | Semantic theme/spacing/type/state/layout tokens and reduced-motion-aware feedback | Verified | tokens.css + shared native styles; sampled rendered contrast/hover and reduced motion checked; no settings system added |
| Visual verification | Preserve baseline; keyboard/overflow/long-content/state/layout inspection | Verified | All previous 23 checks retained; 2 added Electron scenarios; 25/25 pass with 800/1160/1440 and error-state screenshots |
| Manual visual acceptance | User reviews density, contrast, focus/keyboard and real-project interactions | Designed | Pending user; automated checks and agent screenshot inspection do not complete this gate |
| Stage requirements | Original seven-stage lifecycle and equal-stage-weight readiness intent | Designed | User supplied exact names/formula and overlap/current-stage/exclusion/commitment/final-confirmation rules; recorded in stages-progress-design.md |
| Stage scope | Release-scoped stages/progress, committed applicable checklist actions and equal included-stage weights | Verified | Original seven persisted defaults and scoped policy exercised through Node/Electron/packaged tests; user acceptance pending |
| Stage data model | Concrete release/stage/action/history constraints and legacy opt-in migration | Verified | 002 side tables, same-project/composite constraints, populated-v1 preservation/backup/rollback and packaged restart checks pass |
| Stage scope review | Empty included stages withhold overall percentage | Verified | Pure policy and real UI/store checks confirm null overall progress and separate empty/unassigned scope warnings |
| Stage calculation contract | Pure policy, scope warnings, counts/current stage, invariants and essential tests | Verified | Eight policy test groups; out-of-order/equal weights/eligibility/null scope/confirmation/purity/invalid graph checks pass |
| Release readiness | Protected confirmation from current latest passed manual provenance | Verified | Failed/stale/other-release/older-pass evidence blocked; ordinary gate commands rejected; atomic confirmation/frozen A independent of B; manual acceptance pending |
| History | Git checkpoints per reviewable engineering increment | Verified | Stage 7d2ea2e; workflow 7263c75/6b6fbed; V1 Home 0c5197c; records separately checkpointed. No push this turn |
| History | Atomic in-app transition history | Verified | Actual action/scope/verification/confirmation events retain before/after values; failure rolls back state/revision/history. Visible audit feed labels actions; legacy history not invented |
| History | Per-action checkpoint association | Undecided | Existing explicit project journals preserved; linking checkpoints to actions remains outside this focused slice |
| Manual stage acceptance | User checks real scope, provenance, frozen history, keyboard/compact layouts and recovery | Designed | Pending user; stop before next milestone |
| Workflow requirements | Reusable definitions copied independently into new releases; practical library/editor | Implemented | User approved all five decisions and clarifications; eight starter actions are not exhaustive, final confirmation stays in the seventh default stage, and Stages Only remains available. No rules engine, sync, marketplace or dependencies |
| Workflow data/copy model | Four workflow/action-detail tables, captured origin, immutable built-in editions and user edit versions | Verified | Schema 003; migrations 001/002 unchanged; fresh incomplete copies, version check, atomic edits/copy, no master propagation, populated legacy upgrade and packaged restart tested |
| Workflow acceptance | Template CRUD/order/duplication, copy isolation, release-local details/stages/order, legacy/frozen guards and responsive UI | Implemented | Automated criteria verified by 47 Node + 12 Electron + 3 packaged; actual user-content/manual acceptance remains pending |
| Workflow first vertical slice | Duplicate/select/copy/render/isolation | Verified | Commit 7263c75; 40 Node + 10 Electron checks passed before completing the editor |
| Workflow final verification | Completed editor, packaged recovery and final result record | Verified | All 62 checks pass; rebuilt executable upgrades populated v2 and recovers edited masters, independent/frozen release copies, legacy work and Resume after full restart. Manual acceptance is separate |
| Product alignment | Development-first journeys, independent ownership and protected delivery direction | Designed | User approved direction for further design; single-file multi-entity requirement replaces rejected file-per-entity proposal; existing v3 semantics preserved |
| Revised design contracts | PTB v0.2, scope lifecycle/moves, connected UX, PA-01–18 and slice dependencies | Designed | User approved with refinements: counts/Not Assessed; no gate transfer; rich continuation immediately after V3a; PTB ordering before V2. SQL/evidence/snapshot gates remain |
| V1 Home | PA-01/18: default project cards, actual checkpoint/activity and project continuity | Implemented | Explicitly authorized slice complete, 66 checks pass; user manual acceptance pending |
| V1 read model | Existing-record query, deterministic ties, no manufactured events or new migration | Verified | Two real-file Node scenarios prove isolation, empty legacy activity, timestamp/ID ties, no writes, no full-project loading and reopen equality; schema stays v3 |
| V1 continuity/failure | Mounted drafts, same-project refresh, read retries and superseded responses/focus | Verified | Two real Electron scenarios plus packaged Home→Resume recovery pass; Workflows/Releases regressions retained; no V2 started |
| V2 contract/collaboration | Preview-only parser/acquisition/session/DTO/states/order and separate UI ownership/reporting | Designed | Final v2-preview-1 + nullable package selection; confirmed BEGIN and reviewed final AG commits; all concrete UI findings resolved, user acceptance remains |
| V2 baseline | Preserve actual working V1/release/workflow/persistence/security behavior | Verified | Fresh 49 Node + 14 Electron + 3 existing-packaged checks pass before changes; no V2 runtime/security coverage claimed |
| V2 parser/graph/acquisition | Strict deterministic captured preview; bounded Windows-safe file access; no writes | Verified | Final Node 78/78: 29 new + all old; both fixture graphs, hostile syntax/IDs/relationships, scope resolution, alias/junction/race and database equality |
| V2 bridge/navigation | Three fixed trusted commands; Home → inspect → refresh/cancel with retained drafts | Verified | Final 21/21 Electron/UI cases, zero skips; exact 34 methods, all original regressions + actual source/diagnostic/focus/error/three-width checks |
| V2 packaging | Actual locked dependency ESM inside Windows package and old recovery | Verified | Final rebuild and 4/4 packaged recovery pass; renderer bytes match ASAR and final UI tested in package |
| V2 UI acceptance | AG bounded presentation, related-source ownership, opener focus and real UI cases | Implemented | Automated behavior/layout checks pass; user native-picker/visual/context acceptance remains in final report |
| Maintenance | Inherited packaging-tool advisory review | Undecided | Full audit 12 moderate dev-chain findings; production audit zero, flagged code absent from package. Separate compatible update review; no force-fix/major downgrade |
