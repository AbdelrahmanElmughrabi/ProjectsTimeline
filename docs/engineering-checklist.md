# ProjectsTimeline — Engineering checklist

Updated: 2026-11-06. Milestones: foundation, Resume and approved Visual Foundation implemented; automated checks pass. User manual acceptance/review pending. Stages/progress and release implementation are not authorized.

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
| Architecture | Interfaces sufficient for slice | Verified | Shared typed contracts; six fixed bridge methods exercised by Electron tests |
| Architecture | Expensive decisions documented | Designed | Accepted ADR 0001 covers runtime, schema, state rules, storage, migrations and trust boundary |
| Data | Minimum entities designed | Verified | Three tables created by migration; CRUD/reopen checks pass |
| Data | Relationships/constraints identified | Verified | FK/CHECK rejection, project separation, required text and completion invariant tested |
| Data | Persistence approach justified | Verified | Built-in SQLite writes/reopens in actual Electron and packaged executable |
| Data | Migration strategy defined | Verified | Backup, atomic pending batch, rollback, repeat startup and newer-schema refusal tested |
| Data | Write failures/recovery considered | Verified | SQLite lock/aborted INSERT; UI retains text and retries successfully |
| Security | Context isolation enabled | Verified | Actual Electron window preferences assert true |
| Security | No unrestricted renderer Node access | Verified | Actual renderer has no require/process; sandbox true, nodeIntegration false |
| Security | IPC narrowly scoped/validated | Verified | Sender/frame/URL checks plus payload validation tested; six fixed methods |
| Security | Local file/database access controlled | Verified | Main owns fixed profile data path; protocol serves only document/build assets |
| Security | Untrusted input handled safely | Verified | Required/bounded input, bound SQL and inert stored markup checks pass |
| Verification | User defines expected behavior | Designed | User approved proposed rules/criteria on 2026-11-05 |
| Verification | Unit tests cover business rules | Verified | npm test: 17/17 rules/integration/boundary checks, including Resume selector/query |
| Verification | Persistence integration test exists and passes | Verified | Real-file Node tests, Electron restart and packaged restart pass |
| Verification | Manual restart/recovery completed | Designed | Await user's own packaged-app flow; automated result does not complete this |
| Verification | Failure cases tested | Verified | Invalid input/IDs, locked/aborted writes, failed migration/backup/newer schema |
| Verification | Results/unresolved issues recorded | Verified | verification.md preserves earlier evidence, visual baseline 23/23 and current 17 + 7 + 1 checks, screenshots and limits |
| Ownership | User can explain architecture | Undecided | Walk through boundaries |
| Ownership | User understands important data flows | Undecided | Trace request, validation, commit, UI acknowledgement |
| Ownership | User understands core implementation | Undecided | Line-by-line review of sensitive code |
| Ownership | User can debug basic application | Undecided | Trace one controlled failure without AI taking over |
| Ownership | User personally designs/implements stage-progress calculation and policy | Designed | User explicitly reserved this component; implementation pending before A2. AI must not implement the algorithm |

Latest evidence: [verification.md](verification.md) records baseline 23/23 before visual edits and final 25/25 (17 Node + 7 Electron + 1 packaged). Build/typechecks and packaging pass. Inspected 800/1160/1440, empty, keyboard and real error/stale captures. Eleven protected source/dependency files match pre-visual SHA-256 hashes; main changes only its startup background. Verified states refer to recorded automation/inspection, not user acceptance or a full accessibility/security audit.

Next gates: user completes remaining Visual Foundation/Resume manual checks, and reviews the planning-only [stage/progress alternatives and acceptance cases](stages-progress-design.md). The original seven stage names/equal weights are restored; release scope was intended but its data model is not approved. No stage code, migrations, UI or executable tests are authorized. The user personally designs/writes the core policy; full release publishing remains future E.

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
| Developer ownership | User owns stage-progress calculation and policy | Designed | Help define invariants, review user algorithm/implementation, and test it; do not generate core logic |
| Release scope/evidence | Future E: preparation, publication and final release verification | Undecided | Dependencies: requirements/checks/evidence/freshness, source/artifact identity, lifecycle/targets/permissions and release acceptance policy |
| Visual consistency | Semantic theme/spacing/type/state/layout tokens and reduced-motion-aware feedback | Verified | tokens.css + shared native styles; sampled rendered contrast/hover and reduced motion checked; no settings system added |
| Visual verification | Preserve baseline; keyboard/overflow/long-content/state/layout inspection | Verified | All previous 23 checks retained; 2 added Electron scenarios; 25/25 pass with 800/1160/1440 and error-state screenshots |
| Manual visual acceptance | User reviews density, contrast, focus/keyboard and real-project interactions | Designed | Pending user; automated checks and agent screenshot inspection do not complete this gate |
| Stage requirements | Original seven-stage lifecycle and equal-stage-weight readiness intent | Designed | User supplied exact names/formula and overlap/current-stage/exclusion/commitment/final-confirmation rules; recorded in stages-progress-design.md |
| Stage scope/data model | Project-owned versus release-owned stages versus release snapshots | Undecided | Recommend release-owned instances to preserve confirmed releases; schema and legacy opt-in migration need approval |
| Stage policy details | Counting unit, custom stage weights, empties, exclusions, unassigned scope, rounding | Undecided | Recommendations/alternatives and P01–P21 are proposed specifications, not approved or executed tests; counting-unit clarification remains open |
| Release readiness | Protected final confirmation, required evidence and frozen release context | Undecided | Propose minimal manual-confirmation boundary; full publishing/E and freshness/withdrawal policy remain separate decisions |
| History | Git checkpoints per reviewable engineering increment | Implemented | User requested both histories; 78a7758 saves tested Resume/Visual Foundation. Planning documentation gets a separate commit; no remote push |
| History | In-app action/checkpoint association and transition history | Undecided | User requested capability; event schema/command boundaries not approved. Preserve explicit append-only checkpoint journal; no auto-authored accomplishments or fabricated old events |
