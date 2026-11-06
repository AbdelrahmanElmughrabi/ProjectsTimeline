# Codex → Antigravity / user — V2 report

2026-11-06 · **Current: Phase C real integration candidate; Phase B explicitly authorized.** Earlier Phase A gates/results below are historical, superseded by [BEGIN](../antigravity-v2-begin.md). Contract `v2-preview-1`, selection fix 838a8eb. Integration owner: Codex. Antigravity is manually operated, never launched by Codex.

## Phase C — runtime ready and Antigravity feedback

Exact real integration runtime **codex/v2-preview-runtime = ec49d435317b6d1f230694fcae9c265b04d65f13**. Backend **76321b5**: actual installed/locked parser versions, 78 Node + 16 real Electron checks passed. Integrated reviewed AG source **0018f48** and reports **07f89d8/87fb73e** on a separate `codex/v2-preview-integration` branch; AG branch/report ancestry left intact. Home now has **Preview blueprint**, root controller/typed bridge/main snapshot service/real parser are wired, all stages/entities are read-only source. Existing mounted project drafts survive. Candidate build passes.

Follow-up source **1cc199c** fixes Home return focus after React renders. Current built runtime includes it. Root navigation integration now passes **2/2** real Electron cases (no skipped cases); rebuilt Windows package and **4/4** packaged recovery tests pass, including bundled ESM/session restart. Initial package system-temp rename EPERM was resolved by task-local workspace TEMP/TMP. These are recorded separate runs, not a claim the final combined UI suite has run. Screenshots at 800/1160/1440 were inspected. User requested this status before forwarding Phase C feedback; UI fixes/tests remain pending with Antigravity. Main is unchanged by the integration branch; no milestone-complete/acceptance claim.

**Antigravity: continue only your UI/test/report ownership.** Read the runtime ref and this feedback, do not merge/reset your branch or edit Codex files. Return bounded fix/test commits and report. Your two skipped tests must become real executed cases now; the existing static text assertions are not UI execution evidence. Root has also added real controller/navigation tests in its own file; one real Desk Notes/BOM/CRLF/keyboard/three-width case already passed (remaining error/recovery case is still being checked).

Runtime access for your tests: run from your own worktree with `PROJECTS_TIMELINE_APP_ROOT=C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline`; your **test-only** launcher may execute the installed Electron at `<app-root>/node_modules/electron/dist/electron.exe` with args `[app-root, --data-dir=<isolated test dir>]`. Use your own Playwright dependency; do not share/symlink node_modules or change parent files. Native dialog stubbing only inside Electron tests is allowed; no production API stubs/fake snapshots. This reads Codex's built dist (currently real integrated candidate), writes only isolated profiles and your own ignored `artifacts/antigravity-*`. A new UI fix is not present in that runtime until Codex integrates/builds it; mark that specific execution pending, never claim it passed against old UI. Final packaging remains Codex-owned.

Required concrete fixes (queue IDs):

1. **AG-UI-001:** BlueprintDiagnostics related-source fallback `recordKeys[index]/[0]` and inspector related-source buttons can select a record while highlighting a different record's source (e.g. PROJECT_OWNER's related project metadata). Choose a record key only if that occurrence actually contains the source span; otherwise null, preserving the real diagnostic/source. Diagnostic-record buttons must not pair one record's document with another document's diagnostic anchor. Controller deliberately rejects inconsistent pairs. Add a cross-document related-source navigation regression.
2. **AG-UI-002:** Escape uses lastTriggerRef, but inspector/source heading buttons never update it. Route trigger remembering through those components; verify Escape returns to the actual source/relationship opener. Also verify keyboard reachability when a focused Refresh/Choose button becomes disabled (focusable header exists, but being focusable alone doesn't move focus).
3. **AG-UI-003:** Replace both AWAITING INTEGRATION placeholders with actual real parser/UI scenarios, viewport screenshots and keyboard assertions; no unconditional skips, no fake controller. Report execution versus pending fix runtime honestly. Your static reviewers' “100% compliance” is not evidence for unexecuted keyboard/responsive paths.

Optional small copy polish while touching UI: remove opaque occurrence keys from the prominent project-identity summary and avoid implementation explanations (session grant/parser generation) in routine loading/cancel banners; source technical details can remain in source inspector. No visual overhaul requested.

No push/V3a/migration or schema change. Codex continues packaged verification and its assigned integration checks while waiting for bounded UI fixes. Report exchange remains committed Git files, not live messaging.

## Initial Phase A actions and actual outcomes (92531b9)

| Action | Outcome |
| --- | --- |
| Read attached V2 brief, PTB/domain/UX/traceability/roadmap/examples/ADRs and actual source/security/library schema | V2 preview-only; existing library release-only; typed controlled UI + main-owned acquisition/session boundary prepared |
| Rerun npm test, npm run test:e2e, npm run test:packaged in main checkout | 49 Node + 14 Electron + 3 packaged **66/66 passed**; build/typechecks included, existing packaged V1 executable tested |
| Inspect primary maintainer Markdown/JSON/dialog/position documentation and tagged manifests | Candidate direct AST + strict visitor/scanner strategy; no packages downloaded/installed, no vulnerability-audit or candidate-runtime pass claimed |
| Two lighter read-only reviewers: acquisition/workflow boundary; frontend DTO/ownership/acceptance | Findings incorporated: bounded handle reads, duplicate occurrence identity, explicit stale/cancel states, no fake development-template resolution, separate report writers |
| Draft implementation contract, typed example, standalone Antigravity prompt and review queue | Ready for contract review; application source/preload/IPC/SQLite/migrations/dependencies unchanged |
| Independently typecheck docs/agent-handoffs/contracts/v2-preview.ts with strict no-emit Node16 TypeScript | Passed; declarations are a documentation artifact, not an implemented application API |
| Check relative Markdown links in all 12 new/updated documents; compare protected source/tests/config/ADRs 0001–0006 against 9d638f2 | Passed, no missing links; protected paths unchanged |

## Finalization follow-up — actions and actual outcomes

Working directory for all commands: `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline`.

| Action / purpose | Actual outcome |
| --- | --- |
| Apply the user's contract directions | Authored stage order, presentation without inferred priority, packaging-independent semantics; blocking unclosed fence/strict JSON with partial source; both workflow reference statuses Needs review |
| Publish canonical src/shared/blueprint-preview.ts; docs entry type-reexports it | Source-only **601a350bc44356a7886d650867b5ec7dcfe772a7**. Diagnostic severity/code pairs typed; WorkspaceApi/preload/channels/runtime/dependencies untouched. Type readiness is not BEGIN |
| npm --prefix artifacts/v2-preview-dependency-review install --package-lock-only --ignore-scripts --no-audit --no-fund, isolated cache/registry | Metadata only, 36 non-root packages, all registry HTTPS/integrity metadata/MIT/no declared install scripts. Initial restricted DNS returned ENOTFOUND; authorized bounded network retry succeeded. No scratch node_modules/package code or app lock change |
| npm audit --omit=dev --json against that scratch lock | Exit 0; **0 known vulnerabilities**. See local audit.json and contract for limits; not a tarball/code/runtime security audit |
| npm test | Exit 0; **49/49 Node passed**, both TypeScript targets and build passed; renderer assets still index-BZzTd8r3.js/index-X768Ofa9.css |
| Explicit strict no-emit TypeScript check of docs forwarding entry | Passed; canonical declarations work under Node16. Both app compilers also include shared types |
| Inspect/assert dist/shared/blueprint-preview.js; compare protected paths to 92531b9 | Emitted module contains CommonJS metadata only, no runtime imports/values. Existing app source/tests/scripts/manifests/security/migrations/ADRs 0001–0006 unchanged. An auxiliary compiler-API probe was unavailable in installed TS7; emitted-output assertion replaced it and passed |
| One smaller read-only final contract reviewer (gpt-6-luna), no edits/delegation/tests | No material DTO/policy/gate gaps; stale report finding addressed by this finalization section and current status. Not Antigravity delivery |

Audit evidence SHA-256: scratch package-lock.json `39567659228c0c73df2490306614e66d27d28b8a1e5bf6a359f4433f71687210`; audit.json `ddba25b9498f4f0f3206d162e745c9268d28aed5198f8101cd2e06ae0def5f8d`. These ignored local artifacts are not application dependency changes. Actual combined resolution/integrity, native ESM packaging, bounded hostile-input performance and Windows path/race enforcement still require Phase B execution. No new policy decision is currently unresolved.

## Historical Phase A gates (superseded by BEGIN and Phase C above)

- V2-DEP-001 / V2-CON-001: directions finalized; isolated dependency review complete with the above limits. Do not repeat resolved product decisions as approval questions.
- V2-HANDOFF-001: user stated intent to hand over the prompt; actual receipt confirmation remains pending.
- V2-READY-001: types ready at the exact source commit above. Read final documents via `git show codex/v2-preview-contract:<path>` without altering the owned UI checkout.
- V2-BEGIN-001: **CLOSED**. User must explicitly open implementation after confirming receipt; Codex then supplies BEGIN/ref/allowance. No feature/dependency installation or cherry-pick now.
- Antigravity: may return read-only contract/UX findings first; later implement only its allowlist and commit a separate action/verification report. Read v2-review-queue.md for dispositions; do not alter it.

This report is a file-based handoff, not evidence of live cross-agent messaging or delivered Antigravity work. V2 hostile-input/preview/UI/packaged cases are planned, not executed. V1 manual UX acceptance stays open. No V3a, import/apply, model, migration or source-document edits.
