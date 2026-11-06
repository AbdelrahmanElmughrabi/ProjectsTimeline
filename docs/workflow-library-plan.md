# Reusable Engineering Workflows — Phase A proposal

Status: **Approved, implemented and automatically verified; stop for manual acceptance.** Updated: 2026-11-06. The user approved all five decisions and clarifications recorded in [ADR 0005](adr/0005-reusable-workflows.md). Schema 003, named IPC commands, library, template editor, independent release copies and release-local customization are implemented. The first vertical slice passed 40 Node and 10 Electron checks; the final suite passes **47 Node + 12 Electron + 3 packaged = 62/62**, with rebuilt Windows recovery and 800/1160/1440 UI verification. Do not treat automated checks as manual acceptance or start the next milestone before review.

## Fit and current constraints

Workflow templates are reusable definitions; releases are actual, independent work. The current schema v2 already separates release_stages and release_actions, guards confirmed releases, and computes equal weights across any included stage set. Reuse that policy, the main-owned SQLite store, explicit typed IPC and existing acknowledgement/refresh/error behavior. Do not build an execution engine, change the formula, or add dependencies.

At proposal time, createRelease hardcoded seven stages; actions held only a title; and no library or template provenance existed. Existing stage keys are stable, the release_confirmation key is protected, and the policy requires exactly one genuine confirmation gate in the last included stage. The implementation respects those constraints.

## Implemented migration 003

Implemented as `003_workflow_templates.sql`; 001/002 remain unchanged. Four new tables plus three nullable release provenance columns:

| Table/change | Fields and purpose |
| --- | --- |
| workflow_templates | id, name, description, version, nullable built_in_key, created_at, updated_at. User-template version increments on a saved change; built-in editions are immutable. Unique built_in_key/version for system editions; user templates have no system key |
| workflow_template_stages | id, template_id, name, position, protected_closing flag. Each template has exactly one closing stage, pinned last; other stages can be added, renamed, reordered or removed when empty |
| workflow_template_actions | id, template_id, stage_id, position, title, instructions, applicability, definition_of_done, evidence_guidance, action_type. Composite ownership constraints reject another template's stage. No completion, release applicability decision or verification outcome is stored here |
| action_details | action_id primary/foreign key to existing actions; copied instructions, applicability guidance, definition_of_done, evidence_guidance, action_type and nullable within-stage position. Title stays in actions. The details belong to the actual action, never to the master. Missing legacy details remain unspecified, without invented text/history |
| releases additions | source_template_id (nullable FK), source_template_version, source_template_name. All-or-none captured provenance; source version/name are values, not live joins to mutable master fields. Older and stages-only releases retain null provenance |

Do not FK source_template_version to the mutable current template version: that would obstruct edits or propagate them into releases. Do not keep live FKs from copied action/stage definitions to deletable master children. Each copied record has its own identity; the release-level source ID/version/name is sufficient initial provenance. Template deletion/archive and full user revision browsing are outside the requested minimum, so source template identities remain available.

New details need insert/update/delete freeze guards for confirmed release actions. Existing action protection covers title updates; new commands must also protect the confirmation kind, validate ownership and append before/after history atomically. Local definition/order/stage changes advance release scope_revision and make earlier manual verification stale. Master edits never advance a release revision.

Use the existing pre-upgrade backup, atomic migration/version commit and foreign_key_check. Nullable additions avoid fabricating origins for old data; constrained columns must accept existing null values. Verify against actual populated v1/v2 profiles, including confirmed releases. SQLite references: [ADD COLUMN restrictions](https://www.sqlite.org/lang_altertable.html), [foreign-key ownership](https://www.sqlite.org/foreignkeys.html). No table reconstruction or foreign-key toggle is proposed.

## Built-in initialization and versioning

Migration 003 seeds one clearly labelled **Built-in: Seven-stage Engineering Workflow, v1**, with the original seven stage names and the approved starter definitions below. It is a system template, initialized once through migration. Exactly eight ordinary starter actions are included; they are practical starting points, not an exhaustive checklist.

Recommend read-only built-in content with **Duplicate to customize**. A later content upgrade inserts a new immutable built-in edition through a new migration, retaining the old edition for provenance; it does not patch user copies or releases. A duplicated user template receives fresh identities and starts at version 1.

User templates use a simple increasing edit version, not a generic immutable revision-history subsystem. Releases retain the actual copied definitions and origin version/name; that does not promise a complete archive/browser of every earlier user-template draft. New templates can start with seven empty stage definitions; duplicating the built-in supplies its checklist. No fake completion is seeded.

## Approved built-in starter content (implemented)

Eight ordinary actions, plus the app-managed final confirmation added at release creation. In the default workflow, that confirmation is in the seventh and final stage; custom workflows also keep exactly one protected closing stage last. These are engineering starting points; users still add product-specific requirements/features. Completing this starter checklist does not guarantee that all product scope was recorded. Applicability text is guidance for explicit human scope review, not an automatically evaluated rule.

| Stage / type | Title | Instructions and applicability | Definition of done / evidence guidance |
| --- | --- | --- | --- |
| Requirements and Planning / requirement | Record release scope and observable acceptance criteria | List the intended user outcomes, explicit exclusions and a checkable acceptance condition for each committed outcome. Applies to any planned release | Scope and exclusions are written; each committed outcome has an observable pass/fail criterion. Evidence: scope note and acceptance checklist |
| UX, Architecture, and Technical Design / decision | Review ownership boundaries and one critical data flow | Identify which module/process owns state, validation and persistence; trace a critical operation and its failure path. Applies when the release changes application behavior or architecture | Boundaries, data flow, failure behavior and the rationale for consequential choices are recorded. Evidence: architecture note/diagram and decision rationale |
| Development Environment and Project Setup / verification | Verify a clean setup can build and launch | Follow the documented setup in a fresh environment/profile; install declared dependencies and run the documented build/start steps. Applies to software built or distributed from source | Documented steps reproduce a working build/launch without undeclared local state. Evidence: commands, environment/version record and actual result |
| Implementation / implementation | Validate externally supplied input before changing state | Identify input boundaries touched by this release; add appropriate validation, safe error feedback and invalid-input checks. Applies to behavior accepting user, file, network or other external input | Invalid representative input is rejected safely without partial state changes, and expected valid input succeeds. Evidence: boundary tests or recorded manual cases |
| Integrated Release Verification / verification | Run integrated acceptance checks on the release candidate | Exercise committed acceptance criteria against the actual candidate, including relevant integration/security/reliability failure paths. Applies to every release candidate | Relevant criteria pass on the identified candidate; unresolved failures are recorded and addressed before confirmation. Evidence: candidate identity, actual check results and failure resolution |
| Integrated Release Verification / verification | Verify persistence after application restart | Save representative project/state, terminate the app completely, reopen and retrieve the saved data. Applies to software storing persistent local state | Saved data and relevant state are restored correctly after full restart. Evidence: automated persistence/recovery test and/or recorded manual restart result |
| Release Preparation / documentation | Document installation, version identity and recovery | Record how to install/run this version, identify its artifact and recover or roll back when applicable. Applies to software delivered to a user or environment | Another reader can follow the documented installation and applicable recovery steps for the named version. Evidence: release instructions and exercised recovery/install result |
| Deployment/Distribution and Release Confirmation / verification | Verify the delivered artifact in its target environment | Install/deploy the intended artifact and exercise its critical acceptance flow in the target environment. Applies to distributed/deployed software | The delivered version is identified and the critical flow works in its intended environment. Evidence: artifact/version identity and actual target-environment result; final protected confirmation still requires its separate persisted provenance |

Each row maps to separate stored instructions, applicability, definition-of-done and evidence-guidance fields. Types are requirement, implementation, verification, decision, research or documentation; classification does not create a separate requirement/decision domain entity or count as evidence. Quick add requires only a specific title, with optional details/type editor; built-in definitions are fully populated. Missing user-authored details remain honestly blank, not auto-generated.

## Implemented copying and release independence

1. createRelease accepts an optional template ID and expected version. The **Stages only** path remains available; the picker shows the selected template/version and resulting commitment before creation.
2. Applying a template explicitly commits ordinary copied actions as incomplete and initially applicable. Guidance is not an applicability decision. Users can exclude irrelevant work with reasons or add release-specific work. Loose suggestions remain outside release scope until accepted; there are no rule-generated suggestions.
3. One BEGIN IMMEDIATE transaction validates project/template/version and stage/action relationships, rejects stale versions, and validates exactly one protected closing stage last in the order.
4. Creation captures source ID/version/name, fresh stage identities and order, and copies each action definition/order into fresh action/detail/membership rows. Completion, exclusions, verification records and prior confirmation are not inherited.
5. Creation adds exactly one **app-managed** protected confirmation action to the copied closing stage. It is not an editable template action and cannot be duplicated, removed, excluded, moved or satisfied through an ordinary checkbox. Its ordinary checklist classification remains separate from the protected runtime kind.
6. Creation records real copy and per-action events with before/after values. It does not fabricate prior sessions, accomplishments, tests or completion dates. Any stage/action/detail/audit failure rolls back the copy; the template/version is unchanged.
7. Existing release definitions, scope revisions, progress and evidence remain independent. There is no apply-to-existing-release or synchronization operation. Master stage/action edits cannot update copied records. User-template duplicates receive fresh child IDs without release state.

## Implemented release-specific customization boundary

Ordinary copied action titles/details and action ordering are editable; work can be added, reassigned, excluded or reopened; local stages can be added, renamed and reordered. The protected closing stage stays last. Release work is excluded with a reason rather than destructively deleted. Template action/stage definitions can be removed independently; a populated template stage must first have its actions moved or removed. No master change cascades into releases.

All local changes use current editable-release validation, scope revision, atomic audit and read-after-write behavior. Confirmed releases reject all local mutation, including the new detail records. Template edits change only template version/data; confirmed and active copies do not refresh from them.

## Implemented Workflow Library screen and boundaries

- The **Workflows** sidebar destination uses local view selection and preserves project context; it does not change the trusted app document URL or add a router/state framework.
- The template list shows persisted name, description, user/built-in identity and version. Create and Duplicate are real commands; built-in detail is read-only; user templates allow name/description editing.
- The stage editor supports accessible reorder, add/rename and empty-stage removal, with the closing stage pinned. Actions support title-first quick add, full definition fields, and explicit move/reorder/remove controls.
- Wide and compact layouts use the existing presentation styles and accessible keyboard focus; no unrelated destination or visual redesign was added.
- New-release creation supports Stages only or a persisted template. Release cards show captured source name/version and copied action details; local edits stay local. Evidence guidance is labelled separately from recorded verification.
- Named validated bridge commands remain under existing trusted-sender checks. Main owns validation/SQLite; pure progress is unchanged. Failed writes retain drafts; a committed write with failed refresh offers read-only retry without repeating the write. Conflicting writes/navigation are guarded during operations.

## Acceptance criteria and current verification status

1. Create/rename/edit a user template, including full action definitions; quick-add and empty states work. A successful restart recovers exact saved content/order/version.
2. Duplicate built-in/user templates with fresh IDs and independent definitions. Built-in edit commands are rejected, not merely hidden in UI.
3. Stage/action reorder, movement and removal preserve ownership/order; cross-template relationships, blank required titles, stale versions and invalid protected-stage configurations are rejected without partial writes.
4. Apply the same template to releases A/B: different stage/action IDs, identical copied definitions/order, all work initially incomplete. Completing/reopening/excluding/editing A changes neither B nor the master.
5. Rename/change/delete ordinary master definitions after copying: A/B snapshot definitions, origin metadata, scope revisions and verification history remain unchanged. Local edits to an active release stale its old verification; master edits do not.
6. Custom included-stage counts use the existing equal-weight policy; empty/unassigned scope remains null. Protected confirmation remains unique, last and provenance-gated; ordinary verification-typed work cannot substitute for it.
7. Inject an actual copy/detail/audit failure: no partial release/stages/actions/details/membership/events remain. Retry creates one coherent release. Test acknowledged-copy/failed-refresh separately from failed copy.
8. Upgrade populated v1/v2 profiles, including confirmed releases: preserve original IDs/text/timestamps/completion/scope/evidence/audit and keep provenance unspecified. Verify backup, rollback, FK consistency, newer-schema refusal and packaged restart.
9. Existing regressions are retained with the expanded schema/bridge expectations. Final suite: 47 Node + 12 Electron + 3 packaged checks passed. The verification record distinguishes automated evidence, inspected screenshots and unresolved user manual acceptance.

## Implementation record and stop point

1. Accepted decisions are recorded in [ADR 0005](adr/0005-reusable-workflows.md); first vertical slice commit `7263c75` passed 40 Node and 10 Electron checks.
2. The full master editor and release-local metadata/stage/order operations are implemented in checkpoint `6b6fbed`; final suite passes 47 Node + 12 Electron + 3 packaged checks.
3. Final UI/packaged verification and evidence recording are complete. Stop here for manual acceptance before any next milestone. No conditional engine, packs, sync, AI generation, or new dependencies were added.

## Five approved decisions

1. **Built-in:** read-only seven-stage v1 with the eight fully described starter actions above; duplicate to customize; future built-in editions seeded immutably through later migrations.
2. **Data/versioning:** four new tables plus three nullable source columns; user versions are increasing edit revisions, not a full revision archive. Store source ID/version/name and copied definitions, without live master-child links.
3. **Protection/custom stages:** ordinary stages are configurable; exactly one app-managed closing stage/confirmation remains pinned last. Template actions cannot supply protected confirmation.
4. **Application/commitment:** copy only into a new release; explicitly applying the selected template commits its copied checklist, with manual applicability review/reasoned exclusions. Keep Stages only creation. No existing-release apply/merge/sync.
5. **Editing boundary:** title-first optional detail entry; full template stage/action editing; independent active-release action/details/order and stage add/rename/reorder, with reasoned exclusion instead of destructive tracked-work deletion. All confirmed scope/details remain frozen; local changes invalidate prior verification conservatively.

All five decisions were approved with clarifications on 2026-11-06. This record preserves the original design rationale; the approval gate is complete. The workflow milestone is implemented and automatically verified; user manual acceptance remains pending.
