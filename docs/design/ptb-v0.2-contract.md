# PTB v0.2 — Format, validation and approval proposal

2026-11-06 · **Format adopted; V2 preview parser/runtime implemented for integration review, no importer or database schema changes.** [Final V2 contract](../v2-preview-contract.md) specifies Markdown-aware/strict duplicate-key-rejecting parsing, preserved narrative, deterministic relationships, authored stages and source presentation without inferred priority. Unclosed PTB fences block with captured source; unresolved/incompatible workflows are Needs review. User authorized V2 only; V3a apply/receipts/domain persistence remain future design. Replaces the proposed v0.1 restriction, not its supplied historical package. See [design index](../product-architecture-alignment.md), [domain](development-domain-contract.md) and [worked examples](ptb-v0.2-examples.md).

## 1. One model, two package sizes

A selected Markdown file is the entry point; `project.md` is the recommended name, not an identity. It contains exactly one project record and may contain **any number of component, feature, requirement, scope, action, decision and check records**. Optional project `documents` names additional relative Markdown files. Those files may also contain multiple records, but no second project. Only the entry point declares documents; no recursive discovery or indexing.

Every record is an explicit, top-level Markdown fenced code block whose info string is exactly `ptb`. Its content is one strict JSON object. Its narrative is the Markdown immediately after the block through the next top-level `ptb` block or EOF; outer blank lines are ignored in normalized narrative, but source bytes remain intact. An empty narrative is allowed when metadata is sufficient. Headings within this body organize reading; they never declare entities. Preamble before the first block is preserved as document context. Other code fences, including an outer longer fence demonstrating PTB, are ordinary source, not records. Production recognition must follow Markdown block structure, not a regex searching arbitrary text.

Example of **two entities in one file**:

````markdown
```ptb
{"ptb":"0.2","kind":"project","id":"proj.notes","title":"Desk Notes","goal":"Recover local notes after restart."}
```
# Why this exists
Keep a small offline scratchpad.

```ptb
{"ptb":"0.2","kind":"feature","id":"feat.note-recovery","project":"proj.notes","title":"Restore saved notes"}
```
## Recovery behavior
Restore authored text without inventing a previous session.
````

**Why JSON rather than the old YAML frontmatter:** the user adopted one explicit representation that works inside Markdown, supports JSON tooling and avoids YAML coercion/tags/alias behavior, accepting its additional punctuation. Narrative stays normal Markdown, not escaped JSON strings. JSON duplicates must be rejected, including escaped-equivalent keys; a plain last-key-wins parse is insufficient. No YAML compatibility or silent v0.1 conversion is implied. Literal version string `"0.2"` is mandatory on every record; unknown versions block. This unshipped format is not a migration of existing application data.

## 2. Identity, schema and fields

Required common fields: `ptb`, `kind`, `id`, `title`; every non-project record also requires `project` equal to the sole project's ID. IDs are unique throughout the package, immutable through title/file moves, and must match kind prefix:

`^(proj|cmp|feat|req|scope|act|dec|check)\.[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*$`

Internal SQLite IDs are never import references. External project ID identifies the imported project in this workspace; an existing binding prevents another automatic new-project import. IDs are case-sensitive; differently cased invalid IDs are not corrected. Keys are case-sensitive. No scalar/list or number/string coercion. Titles must contain non-whitespace text; scalar field trimming never changes preserved source. Optional relation arrays default to `[]`; optional scalar links are omitted, not `null`. Empty/duplicate relation entries block. Cross-project or wrong-kind targets block. Source order controls presentation; graph validation resolves forward references after all documents load.

| Kind | Recognized fields beyond common | Meaning/default |
| --- | --- | --- |
| project | `goal` string; `documents` path array; `capabilities` string array | Goal recommended; documents/capabilities default empty. Capabilities are declared facts, not runtime permissions. |
| component | `parent` component ID | Optional; ancestry acyclic. |
| feature | `component` component ID | Optional primary component; identity stays project-owned. |
| requirement | `features` IDs; `type`; `acceptance` strings | Type required: `functional`, `quality`, `constraint`. Features may be empty/project-wide. Missing/empty acceptance warns. |
| scope | `features` IDs; `workflow` object | Optional workflow; imported scope starts draft. |
| action | `features`, `requirements` IDs; `scope`; `stage`; `action_type`; `instructions`; `applicability`; `definition_of_done`; `evidence_guidance`; `covers_rule_ids` | Proposal only. Types: `requirement`, `implementation` (default), `verification`, `decision`, `research`, `documentation`. Stage requires scope. Definition of done recommended. |
| decision | `features`, `requirements` IDs; `rationale`; `alternatives` strings | Proposed choice, never approved by importing. Missing rationale warns. |
| check | `requirements` IDs; `method`; `expected` strings; `instructions` | Planned assessment only. Method optional: `manual` or `automated`; absence means unspecified. Missing requirement/expected result warns. |

Typed relationships are fixed: feature.component → categorization; requirement.features → applies-to; scope.features → concerns; action.features → concerns and action.requirements → addresses; check.requirements → plans-to-verify; decision links → affects. A relation is not proof or dependency execution. No implied feature link from prose or a shared scope; requirement cross-cutting links stay explicit. Imported `status`, completion times, outcomes and confirmation flags are **unrecognized inert data**, warned about, never applied.

Approved V2 bounds: ID/key 128 characters; project title 120, action title 300, other titles 200; goal 2,000; instruction/definition/rationale 10,000 each; applicability/evidence 2,000 each; at most 50 acceptance/expected/alternative strings of 2,000 characters each. Relation arrays at most 200 items; capabilities/rule IDs at most 100. Registry keys: lowercase letters/digits plus `.`, `_`, `-`, beginning with a letter. Unknown capabilities/rule IDs warn and never trigger/suppress suggestions. Unknown fields remain exact source and diagnostics, not executed. V2 enforcement and approved parser dependencies are implemented under later user authorization; importer/persisted entity schema remains deferred.

## 3. Explicit development-stage plans

A scope's `workflow` is exactly one of:

- **Inline:** `{"stages":[{"key":"design","title":"Design"},{"key":"build","title":"Build"}]}`. Ordered unique keys, 1–50 stages. Imported stage plans belong to that scope, not the global library; no actions, completion or confirmation are auto-created. Stage title bound 200.
- **Library reference:** `{"template_key":"development.example","version":1}`. Positive integer version, exact development-purpose edition. Preview reports unresolved/incompatible key/version/purpose as Needs review. Under the approved draft-formation direction, the reference and proposed placement may be stored **only as a Draft plan** without creating stages or commitments; explicit resolution or workflow removal is required before activation/scoped commitment. Never choose by a similar name or instantiate a release-purpose template. The concrete V3a1a storage/command proposal still requires approval.

`action.stage` references a stage key in that action's scope. Missing stage is allowed and displayed Unassigned. For inline workflows a missing target blocks; for unresolved library references retain the string as a Needs review **proposal**, not a validated stage assignment. It must resolve before activation/scoped commitment, not before draft-only knowledge formation. An unscoped action cannot have a stage. No default lifecycle is silently selected. Inline custom keys repeat across scopes safely because stage identity is `(scope ID, stage key)`. Inline plans allow complete single-file blueprints without installed templates. Turning a scope plan into a reusable master is a separate future explicit operation.

This clarifies the older ambiguous “before apply” wording: durable formation stores proposed knowledge; operational adoption/activation has stronger guards. It changes neither PTB syntax nor the existing V2 resolver/parser behavior. See [V3a1a proposal](v3a1a-implementation-proposal.md).

Library purpose/portable keys and development progress remain subject to [domain approval](development-domain-contract.md); none of this changes existing release templates, their gate or arithmetic.

## 4. Acquisition, deterministic graph and source authority

Initial transport: selected UTF-8 file plus declared local files, no archive, URL or folder scan. Proposed limits: 50 files, 1 MiB/file, 10 MiB total, 2,000 records, 20,000 relation edges, component depth 16 and JSON nesting 16. LF and CRLF, with one leading BOM, are accepted; exact bytes including BOM/newlines are preserved. Reject invalid encoding, absolute/drive/UNC/URL paths, backslashes/colons, empty/`.`/`..` segments, NUL, Windows reserved device names/trailing dots or spaces, paths over 240 characters, non-`.md` extensions, repeated/case-fold/NFC-equivalent paths, selected entry redeclaration and physical-file aliases. Resolve real paths/junctions/symlinks beneath the user-authorized root before bounded reads; no symlink escape. Ordinary Markdown hyperlinks/images grant no read or network access.

Pipeline: acquire authorized root → parse block records → schema/ownership/reference/cycle validation → immutable proposal graph/source snapshot → review → approved atomic apply. All operations are main-owned behind named validated commands. Source rendering executes no HTML/scripts or image/link fetches; existing CSP/protocol restrictions remain.

Store document SHA-256 of exact bytes, path, record block/body source spans and heading paths plus immutable import receipt. Spans use zero-based UTF-8 byte offsets, start inclusive/end exclusive; diagnostics additionally show one-based line and Unicode-code-point column. Bounds on editable strings use UTF-16 code units to match current application validators; IDs are ASCII. Normalize narrative line endings to LF and remove only outer blank lines for semantic comparisons. Moving an identical record changes source location, not logical identity. Stable normalized fields/edges/body produce the same semantic graph independent of packaging; exclude manifest `documents`, source paths/locations and display order, retaining them separately. Relation arrays compare as sets; acceptance/expected/stage order remains meaningful. Do not generate runtime timestamps, SQLite IDs or random choices during normalization.

Review holds an immutable main-owned snapshot/token; edits to files after preview are not silently applied. Show that selected source is a captured preview; Refresh discards it and requests a new review. Apply consumes reviewed choices against expected revisions/versions, records actual import/adoption events at apply time, and stores an idempotency receipt. A repeated apply returns its existing result, even after an uncertain acknowledgement. Preview/cancel writes no database, audit, persistent cache or file. Expired preview asks for review again; it never creates an unreviewed plan.

## 5. Review and diagnostic policy

Separate choices: create structural project graph, accept selected requirement revisions, activate selected scopes/workflow plans, commit individually selected actions. Defaults: actions stay proposed, requirements draft, scopes draft, decisions proposed, checks planned. Links and source survive unaccepted work. One reviewed apply may batch explicit choices atomically; “Create project” alone is not “commit all.” Blocking diagnostics disable apply. Warnings may be acknowledged but never mean readiness. Requirements linked from committed research may remain draft, visibly so.

Errors identify file, line/column, record ID, field and conflicting target where available. Diagnostics have stable codes, independent of wording:

| Blocking examples | Review warnings |
| --- | --- |
| `FORMAT_VERSION`, `JSON_SYNTAX`, `DUPLICATE_KEY`, `FIELD_TYPE`, `ID_KIND`, `DUPLICATE_ID`, `LINK_TARGET`, `PROJECT_OWNER`, `COMPONENT_CYCLE`, `STAGE_TARGET`, `PATH_UNSAFE`, `LIMIT_EXCEEDED` | `ACCEPTANCE_MISSING`, `DONE_MISSING`, `RATIONALE_MISSING`, `CHECK_INCOMPLETE`, `UNKNOWN_FIELD`, `UNKNOWN_CAPABILITY`, `UNKNOWN_RULE` |

`WORKFLOW_UNRESOLVED` is resolvable only by explicit review choice; it cannot be acknowledged into a dangling stage reference. Error versus warning is determined by schema/rules, not an LLM. No inference, execution, approval or historical success is extracted from narrative. Reimport initially detects existing identity and offers open/cancel only; later reviewed diff handles additions/changes/omissions/conflicts. Never delete omitted work, reset completion or overwrite edits. An explicit clone policy is deferred.

## 6. Acceptance boundary

Both [fixtures](ptb-v0.2-examples.md) must normalize, preserve narrative/source, resolve typed edges and support commitment/checkpoint/restart without a release. Future implementation tests must additionally cover duplicate keys/IDs, path/cycle/wrong-kind/oversize/hostile content, cancel/no-write, changed preview input, double apply, transactional event-write failure, repeated import and populated-v3 compatibility. The fixture checks performed in this design phase are not a production parser, security test or running application demonstration.
