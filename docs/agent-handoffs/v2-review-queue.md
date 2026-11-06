# V2 review queue — Codex-owned

2026-11-06 · Contract candidate `v2-preview-1`; Phase A only. This file is single-writer (Codex). Reports provide evidence/questions, not automatic approval.

| ID | Topic | Status / next owner |
| --- | --- | --- |
| V2-DEP-001 | Candidate pins mdast-util-from-markdown 2.0.2 + jsonc-parser 3.3.1, main-only parsing, no installation yet | Await user contract/dependency approval; Codex checks resolved graph/advisories before install |
| V2-CON-001 | DTO/commands/states, ordering, closed-fence clarification, partial/duplicate handling and current release-only workflow resolution | Candidate ready for user and Antigravity read-only review |
| V2-HANDOFF-001 | User manually gives prompt to Antigravity; no launch by Codex | Await user confirmation; prepared checkout is review-only before Phase B |
| V2-READY-001 | Codex lands agreed src/shared/blueprint-preview.ts contract-only commit and supplies exact BEGIN/ref | After approval/handoff; blocks frontend implementation |
| V2-AG-001 | Antigravity UI/action log and up to two smaller read-only review reports | Not started/received; no test or integration claim |
| V2-INTEGRATE-001 | Codex allowlist review, real parser/UI integration and full final verification | Phase C/D only; not started |

For each delivered finding add source branch/commit, report item, severity, affected contract/acceptance rule, owner, disposition (open/accepted/rejected/deferred) and rationale. Do not erase rejected or resolved findings. Escalate material design/security/dependency changes to the user after preparing a concrete proposal; routine corrections stay within the assigned owner.
