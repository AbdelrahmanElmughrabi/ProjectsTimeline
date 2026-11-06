# ADR 0005 — Reusable workflow definitions and independent release copies

Status: User approved all five Phase A decisions with clarifications, 2026-11-06. Implementation in progress. [Approved plan](../workflow-library-plan.md); the first duplicate/select/copy/display/isolation path passes 40 Node and 10 Electron checks. Final editor/packaged verification is recorded separately when executed.

Migration 003 adds template headers, ordered template stages/actions and independent action details, plus nullable release origin ID/version/name. Migrations 001/002 and existing data remain unchanged; older releases retain unspecified origins/details. Built-in seven-stage v1 is read-only and contains eight ordinary starter actions, not an exhaustive checklist. Editable duplicates get independent IDs/version 1; user edits advance their template version. Future immutable built-in editions use later migrations, not startup patching.

Applying a chosen template commits fresh incomplete actions in one transaction with captured source version/name, independent stage/action/detail IDs and real creation audit. No completion, exclusion or verification state is inherited. Final confirmation is app-managed inside the copied closing stage: stage seven for the default workflow, never an appended eighth stage. Master edits have no update/cascade path into active or confirmed releases. Stages Only remains available.

Local release definition/order/stage changes use existing editable-release guards, scope revisions and atomic before/after audit, invalidating previous verification. New action detail rows obey confirmed/protected-action freeze guards. Tracked work is excluded with reasons, not destructively deleted. Template stage/action definitions may be edited/reordered/removed independently; the protected closing stage cannot be removed or placed earlier.

No progress formula, Electron trust/document boundary, data location, dependency or architecture framework change. No AI generation, conditional rule engine, sync, packs or marketplace. Complete the authorized editor, verify regressions/packaged recovery and stop for manual acceptance before the next milestone.
