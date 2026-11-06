# ADR 0007 — Blueprint preview boundary and collaboration

2026-11-06 · **Proposed in V2 Phase A; contract/dependency approval pending.** [Candidate contract](../v2-preview-contract.md) · [Antigravity handoff](../agent-handoffs/antigravity-v2-preview.md). No parser, application API, migration or preview feature implemented by this ADR.

V2 inspects selected PTB v0.2 source deterministically without importing/accepting work. Main owns native file selection, root-bound bounded reads, parsing/validation, opaque session/snapshot memory and request generations. Renderer receives captured text/typed graph/diagnostics, never filesystem authority. Choose/refresh/cancel create no project/history/preferences/source writes. Existing data, migrations 001–003 and security policies remain intact.

Recommend tagged candidates mdast-util-from-markdown 2.0.2 and jsonc-parser 3.3.1 after approval/resolved-graph review. AST-guided literal closed ptb fences, strict syntax errors, duplicate decoded keys, original source positions and invalid partial occurrence identity are explicit contract choices. Do not introduce app-wide ESM, HTML rendering, a rule engine or new development-template records. Actual library remains release-only; unresolved/incompatible references are shown honestly.

Codex owns shared declarations/backend/security/controller/root integration/tests. Antigravity owns bounded namespaced Preview presentation in an isolated checkout after user approval/handoff and source-DTO readiness. At most two smaller read-only reviewers may support its work, with separately attributed committed reports. Git files and a Codex-owned review queue carry findings and actual action/test evidence; no live agent connection or automatic launch is assumed. Final integration/regressions and acceptance remain with Codex/user.

Contract-only types in docs are a review artifact. V3a apply/receipts/entities, percentages, AI/models and durable preview storage are excluded. Stop at Phase A until gates are met, and at V2 before any V3a work.
