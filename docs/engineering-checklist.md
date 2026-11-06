# ProjectsTimeline — Engineering checklist

Updated: 2026-11-06. Foundation, Resume, Visual Foundation and focused Development Stages & Progress implemented. **44/44 automated checks pass**; manual acceptance/review remains pending. The user authorized AI implementation of the core and integrations; the former personal-coding restriction is superseded by ADR 0004.

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
| Architecture | Interfaces sufficient for slice | Verified | Shared contracts; 13 fixed bridge methods, existing sender/frame/URL checks and Result envelopes |
| Architecture | Expensive decisions documented | Designed | Accepted ADR 0001 covers runtime, schema, state rules, storage, migrations and trust boundary |
| Data | Minimum entities designed | Verified | Three original tables preserved; five release/history side tables added by versioned 002, real-file and packaged upgrade/restart checks pass |
| Data | Relationships/constraints identified | Verified | FK/CHECK rejection, project separation, required text and completion invariant tested |
| Data | Persistence approach justified | Verified | Built-in SQLite writes/reopens in actual Electron and packaged executable |
| Data | Migration strategy defined | Verified | Backup, atomic pending batch, rollback, repeat startup and newer-schema refusal tested |
| Data | Write failures/recovery considered | Verified | SQLite lock/aborted INSERT; UI retains text and retries successfully |
| Security | Context isolation enabled | Verified | Actual Electron window preferences assert true |
| Security | No unrestricted renderer Node access | Verified | Actual renderer has no require/process; sandbox true, nodeIntegration false |
| Security | IPC narrowly scoped/validated | Verified | Same sender/frame/URL checks; 13 named validated methods, no generic SQL/IPC |
| Security | Local file/database access controlled | Verified | Main owns fixed profile data path; protocol serves only document/build assets |
| Security | Untrusted input handled safely | Verified | Required/bounded input, bound SQL and inert stored markup checks pass |
| Verification | User defines expected behavior | Designed | User approved proposed rules/criteria on 2026-11-05 |
| Verification | Unit tests cover business rules | Verified | npm test: 33/33 policy/domain/SQLite/migration/security checks; original assertions retained with schema/bridge expectations extended |
| Verification | Persistence integration test exists and passes | Verified | Real-file Node tests, Electron restart and packaged restart pass |
| Verification | Manual restart/recovery completed | Designed | Await user's own packaged-app flow; automated result does not complete this |
| Verification | Failure cases tested | Verified | Invalid input/IDs, locked/aborted writes, failed migration/backup/newer schema |
| Verification | Results/unresolved issues recorded | Verified | verification.md preserves baselines and current 33 Node + 9 Electron + 2 packaged checks, screenshots, limits and file map |
| Ownership | User can explain architecture | Undecided | Walk through boundaries |
| Ownership | User understands important data flows | Undecided | Trace request, validation, commit, UI acknowledgement |
| Ownership | User understands core implementation | Undecided | Line-by-line review of sensitive code |
| Ownership | User can debug basic application | Undecided | Trace one controlled failure without AI taking over |
| Ownership | AI implements; user reviews significant decisions and manual acceptance | Designed | User explicitly removed personal stage-coding requirement and approved full slice implementation. ADR 0004 supersedes earlier restrictions; understanding/review gates remain open |

Latest evidence: [verification.md](verification.md): baseline 25/25 before stage edits; final **44/44** (33 Node + 9 Electron + 2 packaged), build/typechecks/package pass. New stage UI checked at 800/1160/1440, keyboard, real failed-write/stale refresh and full restart; populated v1 also upgraded in the final packaged executable. Startup/security/protocol, shipped 001 and dependency files are unchanged. Automated verification does not establish user acceptance or a comprehensive accessibility/security audit.

Next gate: the user authorized **Phase A design review** for Reusable Engineering Workflows. Review the [schema/copy/library proposal and five decisions](workflow-library-plan.md); stop for approval before migration or feature code. Prior manual results remain unrecorded unless provided; that does not block the authorized planning. No workflow implementation is implied by the rerun baseline.

## New roadmap decisions

These supplement preserved M1 evidence. The Continue Implementation brief approved Resume and its refresh strategy. Feature-level Resume remains Implemented until its manual acceptance criterion is complete; automated criteria have recorded verification. Other draft proposals remain Undecided until accepted.

| Category | Proposed work / decision | State | Evidence / next gate |
| --- | --- | --- | --- |
| Requirements and scope | Resume slice and its six acceptance criteria | Implemented | User approved all criteria; automated 1–5 pass, manual criterion 6 pending |
| Architecture/module boundaries | One workspace snapshot owner; refresh from main after committed commands | Verified | useProjectWorkspace; tests distinguish write failure, committed/read failure, repeated read-only retries and stale responses |
| Data/migration safety | Resume uses existing schema v1 without migration | Verified | Existing 001 unchanged; real-file integration confirms version 1 and context recovery; future schema changes need separate approval |
| State transitions | Reopening/history, stage meaning, decisions and verification/readiness freshness | Undecided | Existing complete-only rule stays; review new policies before their slices |
| Security/error handling | Preserve narrow IPC and accurate failure/retry feedback | Verified | Same six channels/preload; original boundary checks pass; actual write failure and repeated read failure tested |
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
| History | Git checkpoints per reviewable engineering increment | Implemented | 7d2ea2e saves verified stage source/tests; ownership/evidence records have a separate documentation checkpoint. No push this turn |
| History | Atomic in-app transition history | Verified | Actual action/scope/verification/confirmation events retain before/after values; failure rolls back state/revision/history. Visible audit feed labels actions; legacy history not invented |
| History | Per-action checkpoint association | Undecided | Existing explicit project journals preserved; linking checkpoints to actions remains outside this focused slice |
| Manual stage acceptance | User checks real scope, provenance, frozen history, keyboard/compact layouts and recovery | Designed | Pending user; stop before next milestone |
| Workflow requirements | Reusable definitions copied independently into new releases; practical library/editor | Designed | User brief authorizes implementation after Phase A approval; no rules engine, sync, marketplace or dependencies |
| Workflow data/copy model | Four new tables, nullable origin snapshots, immutable built-in editions and user edit versions | Undecided | workflow-library-plan.md; migration 003 not written; five approval decisions include commitment and protected closing behavior |
| Workflow acceptance | Template CRUD/order/duplication, copy isolation, rollback/legacy/frozen guards, restart and compact UI | Undecided | Proposed acceptance criteria in workflow-library-plan.md, not implemented or verified workflow behavior |
| Workflow planning baseline | Verify actual repository before relying on prior milestone claims | Verified | Clean source at a8620fa; fresh npm test 33/33, Electron 9/9 and existing packaged 2/2 pass; no feature/schema changes |
