# BEGIN Phase B — Antigravity V2 Preview presentation

2026-11-06. **BEGIN Phase B is authorized by the user's explicit instruction after confirmed delivery and Phase A review.** Codex read all three reports committed at `07f89d830ae196cb74e3cde978faead4e3e2920f`; their static-review limits remain recorded. Do not rewrite those reports or discard their commits.

Contract: **v2-preview-1**. Approved original ref `codex/v2-preview-contract` = `1cb122d0946b1131268e07154198899657c1d769`. Current Phase B clarifications/BEGIN ref: **codex/v2-preview-phase-b**. Read current files using `git show codex/v2-preview-phase-b:<path>`; do not replace your branch with the Codex branch.

In your existing clean isolated checkout on `antigravity/v2-preview-ui`, incorporate these **two source-only commits in this order**:

```powershell
git cherry-pick 601a350bc44356a7886d650867b5ec7dcfe772a7
git cherry-pick 838a8eb0223b94c6fca265efdfe57c7b48a164d5
```

Codex verified the clean worktree at 07f89d8, its ancestry from 92531b9, reports-only diff and clean combined type patch application. Cherry-picking adds descendants, preserving all three Phase A reports/history. Stop/report unexpected dirt/conflicts rather than reset or force anything. Shared types remain Codex-owned. No other Codex commits should be cherry-picked without a nominated integration ref.

**Resolved questions:**

- AG-Q-01: real document-only selection with null recordKey/diagnosticId/source is valid; Back/Escape can use it. Package-only clearing can use all four nullable fields null.
- AG-Q-02: documentId is now `string | null`. A package-level diagnostic whose source is null must use documentId:null, source:null, recordKey:null and its actual diagnosticId. Do not use the first document, an empty string or a synthetic location. Unread but known document IDs are real selectable documents, without an invented source range. Actual related-source links use their captured source/document.
- AG-Q-03: occurrences = records.length; unparsed = invalid-record occurrence count (syntax OR schema invalid). Label this accurately. Severity counts count diagnostics.
- Your CON-06 uses the older candidate policy: **WORKFLOW_PURPOSE and WORKFLOW_UNRESOLVED are both resolution / Needs review**, not syntax errors. Other real errors still make an invalid snapshot. Never transfer release confirmation.

**Assignment unchanged:** implement the named controlled `BlueprintPreview` and only necessary namespaced new presentation files under `src/renderer/blueprint-preview/`, the assigned `tests/e2e/blueprint-preview-ui.test.mjs` and your report/reviewer-report paths. Full allowlist and frontend acceptance remain in the original handoff (read it at the original final contract ref), except its Phase A gate is superseded by this BEGIN. No App/controller/shared/main/preload/DB/migrations/package/global style changes. UI components import canonical shared types; no window.workspace calls or fake production snapshots.

You can typecheck isolated UI now using the approved existing locked baseline (npm ci only, no package edits/shared node_modules). Codex will install/audit parser dependencies on the backend branch. Your real UI e2e/screenshots await Codex's real integration ref; do not invent a runtime or patch App. Continue graphite/violet tokens, compact stacked detail, UTF16 captured source, diagnostics with individually focusable related locations and all states. Up to two smaller read-only reviewers, attributed reports/action logs and Git report transport remain authorized.

Publish committed bounded UI work/report on your branch and tell the user/Codex it is ready. Codex reads reports via Git; no live agent channel is assumed. Codex will implement backend concurrently and own integration/regressions/package verification. No push, automatic merge or V3a. Stop at your assigned boundary.
