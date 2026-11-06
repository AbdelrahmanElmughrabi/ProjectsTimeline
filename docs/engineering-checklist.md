# ProjectsTimeline — Engineering checklist

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
| Architecture | Interfaces sufficient for slice | Verified | Shared contracts; 30 fixed named methods, existing sender/frame/URL checks and Result envelopes |
| Architecture | Expensive decisions documented | Designed | Accepted ADRs 0001–0005 cover runtime, storage, migrations, trust, Resume/visual design, release policy and workflow copy/versioning; user understanding remains separate |
| Data | Minimum entities designed | Verified | Three original tables preserved; 002 adds five release/history tables and 003 adds four workflow/action-detail tables plus release origin fields; populated-v1/v2 packaged upgrade/recovery passes |
| Data | Relationships/constraints identified | Verified | FK/CHECK rejection, project separation, required text and completion invariant tested |
| Data | Persistence approach justified | Verified | Built-in SQLite writes/reopens in actual Electron and packaged executable |
| Data | Migration strategy defined | Verified | Backup, atomic pending batch, rollback, repeat startup and newer-schema refusal tested |
| Data | Write failures/recovery considered | Verified | SQLite lock/aborted INSERT; UI retains text and retries successfully |
| Security | Context isolation enabled | Verified | Actual Electron window preferences assert true |
| Security | No unrestricted renderer Node access | Verified | Actual renderer has no require/process; sandbox true, nodeIntegration false |
| Security | IPC narrowly scoped/validated | Verified | Same sender/frame/URL checks; 30 named validated methods, no generic SQL/IPC |
| Security | Local file/database access controlled | Verified | Main owns fixed profile data path; protocol serves only document/build assets |
| Security | Untrusted input handled safely | Verified | Required/bounded input, bound SQL and inert stored markup checks pass |
| Verification | User defines expected behavior | Designed | User approved proposed rules/criteria on 2026-11-05 |
| Verification | Unit tests cover business rules | Verified | Current observed: 47/47 Node checks; original assertions retained with schema/bridge expectations extended |
| Verification | Persistence integration test exists and passes | Verified | 12 Electron + 3 packaged checks pass, including edited templates, independent release copies and exact restart snapshots |
| Verification | Manual restart/recovery completed | Designed | Await user's own packaged-app flow; automated result does not complete this |
| Verification | Failure cases tested | Verified | Invalid input/IDs, locked/aborted writes, failed migration/backup/newer schema |
| Verification | Results/unresolved issues recorded | Verified | First slice 7263c75: 40 Node + 10 Electron; completed editor 6b6fbed: 47 Node + 12 Electron + 3 packaged. Actual evidence and manual limits recorded in verification.md |
| Ownership | User can explain architecture | Undecided | Walk through boundaries |
| Ownership | User understands important data flows | Undecided | Trace request, validation, commit, UI acknowledgement |
| Ownership | User understands core implementation | Undecided | Line-by-line review of sensitive code |
| Ownership | User can debug basic application | Undecided | Trace one controlled failure without AI taking over |
| Ownership | AI implements; user reviews significant decisions and manual acceptance | Designed | User explicitly removed personal stage-coding requirement and approved full slice implementation. ADR 0004 supersedes earlier restrictions; understanding/review gates remain open |

Latest workflow evidence: [verification.md](verification.md). The completed editor passes all 62 automated checks; 800/1160/1440 layouts and keyboard/error/refresh behavior are exercised, and final screenshots were inspected. Automated verification does not establish user acceptance or a comprehensive accessibility/security audit.

Next gate: user manual acceptance of the completed workflow slice. All five workflow decisions are approved and final automated evidence is recorded; stop before the next milestone.

## New roadmap decisions

These supplement preserved M1 evidence. The Continue Implementation brief approved Resume and its refresh strategy. Feature-level Resume remains Implemented until its manual acceptance criterion is complete; automated criteria have recorded verification. Other draft proposals remain Undecided until accepted.

| Category | Proposed work / decision | State | Evidence / next gate |
| --- | --- | --- | --- |
| Requirements and scope | Resume slice and its six acceptance criteria | Implemented | User approved all criteria; automated 1–5 pass, manual criterion 6 pending |
| Architecture/module boundaries | One workspace snapshot owner; refresh from main after committed commands | Verified | useProjectWorkspace; tests distinguish write failure, committed/read failure, repeated read-only retries and stale responses |
| Data/migration safety | Resume uses existing schema v1 without migration | Verified | Existing 001 unchanged; real-file integration confirms version 1 and context recovery; future schema changes need separate approval |
| State transitions | Reopening/history, stage meaning, decisions and verification/readiness freshness | Implemented | Committed release reopening/history, stage scope and revision-bound manual verification ship under ADRs 0004/0005; engineering-decision transitions and automated freshness remain future |
| Security/error handling | Preserve narrow IPC and accurate failure/retry feedback | Verified | 30 fixed named methods through the existing sender/frame/URL checks; original boundaries pass; actual write failure and repeated read-only retries tested |
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
| History | Git checkpoints per reviewable engineering increment | Verified | Stage source 7d2ea2e; workflow first path 7263c75; completed editor 6b6fbed; evidence records separately checkpointed. No push this turn |
| History | Atomic in-app transition history | Verified | Actual action/scope/verification/confirmation events retain before/after values; failure rolls back state/revision/history. Visible audit feed labels actions; legacy history not invented |
| History | Per-action checkpoint association | Undecided | Existing explicit project journals preserved; linking checkpoints to actions remains outside this focused slice |
| Manual stage acceptance | User checks real scope, provenance, frozen history, keyboard/compact layouts and recovery | Designed | Pending user; stop before next milestone |
| Workflow requirements | Reusable definitions copied independently into new releases; practical library/editor | Implemented | User approved all five decisions and clarifications; eight starter actions are not exhaustive, final confirmation stays in the seventh default stage, and Stages Only remains available. No rules engine, sync, marketplace or dependencies |
| Workflow data/copy model | Four workflow/action-detail tables, captured origin, immutable built-in editions and user edit versions | Verified | Schema 003; migrations 001/002 unchanged; fresh incomplete copies, version check, atomic edits/copy, no master propagation, populated legacy upgrade and packaged restart tested |
| Workflow acceptance | Template CRUD/order/duplication, copy isolation, release-local details/stages/order, legacy/frozen guards and responsive UI | Implemented | Automated criteria verified by 47 Node + 12 Electron + 3 packaged; actual user-content/manual acceptance remains pending |
| Workflow first vertical slice | Duplicate/select/copy/render/isolation | Verified | Commit 7263c75; 40 Node + 10 Electron checks passed before completing the editor |
| Workflow final verification | Completed editor, packaged recovery and final result record | Verified | All 62 checks pass; rebuilt executable upgrades populated v2 and recovers edited masters, independent/frozen release copies, legacy work and Resume after full restart. Manual acceptance is separate |
