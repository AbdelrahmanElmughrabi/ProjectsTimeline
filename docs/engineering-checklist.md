# ProjectsTimeline — Engineering checklist

Updated: 2026-11-05. Milestone: first vertical slice. Foundation approval: **approved, including `node:sqlite`**. Implementation and automated verification complete; user review/manual acceptance pending.

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
| Verification | Unit tests cover business rules | Verified | npm test: 12/12 rules/integration/boundary checks |
| Verification | Persistence integration test exists and passes | Verified | Real-file Node tests, Electron restart and packaged restart pass |
| Verification | Manual restart/recovery completed | Designed | Await user's own packaged-app flow; automated result does not complete this |
| Verification | Failure cases tested | Verified | Invalid input/IDs, locked/aborted writes, failed migration/backup/newer schema |
| Verification | Results/unresolved issues recorded | Verified | verification.md records 12 + 2 + 1 passing checks, fixes and limits |
| Ownership | User can explain architecture | Undecided | Walk through boundaries |
| Ownership | User understands important data flows | Undecided | Trace request, validation, commit, UI acknowledgement |
| Ownership | User understands core implementation | Undecided | Line-by-line review of sensitive code |
| Ownership | User can debug basic application | Undecided | Trace one controlled failure without AI taking over |
| Ownership | User reviews AI implementation (replaces personal coding requirement) | Designed | User requested AI implementation with their review on 2026-11-05; sensitive code still requires line-by-line review |

Latest evidence: [verification.md](verification.md) records actual commands/results and test links. Runtime: Electron 45.2.3 / embedded Node 24.22.2. Build/typechecks, 12 Node checks, two Electron scenarios, packaging and one packaged recovery check passed. Normal/compact screenshots inspected. Verified states refer to this evidence, not a full security audit or completed user review.

Next gate: user reviews the sensitive implementation line by line, performs manual restart/recovery, and traces one save/failure. Keep the ownership-understanding items open until the user demonstrates them. No additional first-slice implementation is currently outstanding.
