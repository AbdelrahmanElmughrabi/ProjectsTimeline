# V2 review queue — Codex-owned

2026-11-06 · Finalized contract `v2-preview-1`; **Phase B authorized** after user-confirmed delivery/review. This file is single-writer (Codex). Reports provide evidence/questions, not automatic approval. Exact BEGIN: [antigravity-v2-begin.md](antigravity-v2-begin.md).

| ID | Topic | Status / next owner |
| --- | --- | --- |
| V2-DEP-001 | mdast-util-from-markdown 2.0.2 + jsonc-parser 3.3.1, main-only parsing | Direction approved; isolated metadata graph 36 packages / npm audit 0 known vulnerabilities. No package code/app dependency installation. Recheck actual combined graph/integrity on Phase B installation |
| V2-CON-001 | DTO/commands/states/order, blocking unclosed fences, partial/duplicate handling, strict JSON and Needs review for unresolved/incompatible workflows | Finalized per user decisions; Antigravity may challenge through reports, never silently change the contract |
| V2-HANDOFF-001 | User manually gives prompt to Antigravity; no launch by Codex | Confirmed by user; all three committed reports reviewed at 07f89d830ae196cb74e3cde978faead4e3e2920f |
| V2-READY-001 | Canonical src/shared/blueprint-preview.ts source-only commits | Ready: 601a350bc44356a7886d650867b5ec7dcfe772a7 + 838a8eb0223b94c6fca265efdfe57c7b48a164d5. Clean AG worktree; combined patch applies with git apply --check; no AG commits changed |
| V2-BEGIN-001 | Explicit implementation gate after confirmed handoff | OPEN per user; BEGIN published at codex/v2-preview-phase-b, bounded UI allowance unchanged |
| V2-AG-001 | Antigravity UI/action log and up to two smaller read-only review reports | Not started/received; no test or integration claim |
| V2-INTEGRATE-001 | Codex allowlist review, real parser/UI integration and full final verification | Phase C/D only; not started |
| AG-Q-01 | Document-only selection / deselection | Resolved: valid snapshotId + actual documentId, recordKey/diagnosticId/source all null is accepted. Package-only clearing may use documentId null with those fields null. No onSelect signature expansion |
| AG-Q-02 | Package-level diagnostic source | Resolved with minimal type change 838a8eb: documentId is string or null. For a source:null package diagnostic use documentId:null, source:null, recordKey:null, actual diagnosticId. Never fallback to first doc/empty string/fabricated location. Known unread document selection may use its real document ID without an anchor. Related-source jumps use actual captured references |
| AG-Q-03 | Occurrence/unparsed counts | Resolved: occurrences === records.length; unparsed === records.filter(r => r.state === 'invalid-record').length, including schema-invalid occurrences. Label Unparsed / invalid records, not only malformed JSON. Error/resolution/warning counts count diagnostics by severity |
| AG-REVIEW-01 | CON-01–07 / UX-01–05 in three reports at 07f89d8 | Accepted controlled presentation, inert text/UTF16 slicing, invalid/duplicate visibility, compact/focus recommendations. CON-06's WORKFLOW_PURPOSE error wording is superseded: incompatible and unavailable workflows both Needs review. Review was static, not runtime evidence; fixture counts will be verified by real parser tests |

For each delivered finding add source branch/commit, report item, severity, affected contract/acceptance rule, owner, disposition (open/accepted/rejected/deferred) and rationale. Do not erase rejected or resolved findings. Escalate material design/security/dependency changes to the user after preparing a concrete proposal; routine corrections stay within the assigned owner.
