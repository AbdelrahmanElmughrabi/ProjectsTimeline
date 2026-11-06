# V1 — Home and Project Continuity

2026-11-06 · User authorized V1 only after approving the design direction. Baseline rerun before edits: **47 Node + 12 Electron + 3 packaged = 62/62 passed**, including build/typechecks. Source checkpoint `1ade173`; supplied v0.1 package remains untracked/unchanged. No new migration, dependency, PTB parser, development-scope feature or recommendation engine.

Status: **Implemented and automatically verified; manual acceptance pending.** Source `0c5197c`; final **49 Node + 14 Electron + 3 rebuilt-packaged = 66/66 passed**. Build/typechecks/package pass. [Evidence/screenshots](verification.md) and [ADR 0006](adr/0006-home-project-continuity.md). Stop before V2.

| Requirement | UI | Existing data / named operation | Acceptance |
| --- | --- | --- | --- |
| PA-01 Recognize projects | Default Home, saved project names/initials, responsive cards | New read-only `getHomeSummary`; projects + latest checkpoint + latest recorded activity | Empty/populated/error states, long text, keyboard and 800/1160/1440 widths |
| PA-01/14 Continue existing work | Open/return to selected project and existing Resume; preserve mounted workspace/drafts during Home navigation | Existing openProject/read-after-write owner; same-project return refresh retains mounted snapshot while withholding stale details | Saved text/time matches Resume; drafts and release selection survive Home round trip; restart recovers saved context |
| PA-01 Factual activity | Latest saved checkpoint/event, clearly separate from authored next steps | Existing checkpoints/action_events; no session, duration or invented historical event | Legacy no-event records remain honestly empty; checkpoint/event ties deterministic |
| PA-18 Safe integration | Home loading/error/read-only retry; existing Workflows/Releases accessible | One extra fixed typed read API, unchanged sender/frame/URL/security policy | Failed and late Home reads cannot restore stale cards; existing regressions/package recovery pass |

The summary query returns one row per project without opening complete project/release histories. Checkpoint order remains timestamp descending then ID descending. Activity candidates are actual checkpoint saves and existing action events, ordered timestamp descending, checkpoint before event on a tie, then descending ID within source. Cards order recorded activity newest first, no-activity projects last, then project creation time/ID descending for deterministic ties. Project creation time is labeled Created, never a fictional work session. Saved next steps retain their own checkpoint timestamp even if a later action event exists.

Home reads have their own guarded request token within the existing workspace owner. Acknowledged mutations invalidate cached summaries; entering Home or explicitly refreshing reads saved data. A failed summary read withholds stale cards and offers read-only retry. No Home visit writes activity. Preserve existing save-vs-refresh failure handling and immutable release policy.

Node tests will verify real-file query ordering, isolation, read-only behavior and reopen recovery. Electron tests will cover Home → project → checkpoint → Home, mounted draft continuity, Workflows/Releases access, failure/retry/late reads and three sizes. Rebuild final package and run existing packaged tests with Home recovery assertions. Manual acceptance remains user-owned.

The approved roadmap is direction, not blanket implementation authority. Rich linked context moves immediately after V3a; PTB stable presentation order will be finalized before V2, not implemented here. Deterministic recommendations are intentionally absent until their separate later slice.
