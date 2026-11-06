# Reusable Engineering Workflows — Phase A proposal

Status: **Approval pending; no migration or feature implementation.** Updated: 2026-11-06. User requested design review and an explicit stop before Phase B. The current code is clean at a8620fa; the existing 44 checks were rerun successfully (33 Node, 9 Electron, 2 packaged). Local main is three commits ahead of the recorded origin/main reference; no fetch/push was performed. Prior manual acceptance results are not inferred from automated tests.

## Fit and current constraints

Workflow templates are reusable definitions; releases are actual, independent work. The current schema v2 already separates release_stages and release_actions, guards confirmed releases, and computes equal weights across any included stage set. Reuse that policy, the main-owned SQLite store, explicit typed IPC and existing acknowledgement/refresh/error behavior. Do not build an execution engine, change the formula, or add dependencies.

Current gaps: createRelease hardcodes seven stages; actions hold a title but no instructions/applicability/definition-of-done/evidence guidance/type/order; there is no library or template provenance. Existing stage keys are stable, the release_confirmation key is protected, and the policy requires exactly one genuine confirmation gate in the last included stage. New metadata must respect those constraints too.

## Minimal proposed migration 003

Proposed filename: 003_workflow_templates.sql, **not created yet**. Preserve 001/002 unchanged. Four new tables plus three nullable release provenance columns:

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

Migration 003 seeds one clearly labelled **Built-in: Seven-stage Engineering Workflow, v1**, with the original seven stage names and the reviewed starter definitions below. This is a genuine system template, not a fictitious user record. Initialization occurs once through migration, not on every startup.

Recommend read-only built-in content with **Duplicate to customize**. A later content upgrade inserts a new immutable built-in edition through a new migration, retaining the old edition for provenance; it does not patch user copies or releases. A duplicated user template receives fresh identities and starts at version 1.

User templates use a simple increasing edit version, not a generic immutable revision-history subsystem. Releases retain the actual copied definitions and origin version/name; that does not promise a complete archive/browser of every earlier user-template draft. New templates can start with seven empty stage definitions; duplicating the built-in supplies its checklist. No fake completion is seeded.

## Proposed built-in starter content for approval

Eight ordinary actions, plus the app-managed final confirmation added at release creation. These are engineering starting points; users still add their product-specific requirements/features. Completing this starter checklist is not a guarantee that all product scope was recorded. Applicability text is guidance for explicit human scope review, not an automatically evaluated rule.

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

## Copying and release independence

1. Extend createRelease with an optional template ID and expected version. Keep the existing **Stages only** path for current behavior/backward compatibility. The new-release picker shows the actual template/version, stage/action counts and the resulting commitment before creation.
2. Applying a template is explicit acceptance: ordinary copied actions are committed to that new release, initially applicable and incomplete. Guidance is not an applicability decision. Users explicitly exclude irrelevant work with reasons or add release-specific work. Loose suggestions remain outside release scope until accepted; this feature does not implement rule-generated suggestions.
3. In one existing BEGIN IMMEDIATE transaction, validate project/template/version and stage/action relationships; reject a stale preview version instead of silently copying newer content. Validate exactly one protected closing stage, last in the order.
4. Insert the release with captured source ID/version/name, fresh stage identities and preserved order. Copy every action's complete definition and order into fresh action/detail/membership rows, with completed_at null, no inherited exclusions, no verification records and no confirmation.
5. Add exactly one **app-managed** protected confirmation action to the copied closing stage. It is not an editable template action and cannot be duplicated, removed, excluded, moved or satisfied through an ordinary checkbox. Its ordinary checklist classification remains separate from the protected runtime kind.
6. Record real creation/copy events and per-action creation/commit events with actual before/after values; do not manufacture prior sessions, accomplishments, tests or completion dates. Any stage/action/detail/audit failure rolls the entire creation back. Copying does not modify the template/version.
7. Existing release IDs/definitions/scope revisions/progress/evidence remain unchanged. No apply-to-existing-release operation or synchronization is exposed. Editing/removing master stages/actions cannot delete or update copied records. User-template duplicates also get fresh child IDs, without release state.

## Release-specific customization boundary

Propose independent editing of ordinary copied action titles/details, action ordering, adding/reassigning/excluding/reopening work, and local stage add/rename/reorder. Preserve the protected closing stage last. Remove a release stage/action through the existing reasoned exclusion model, not destructive deletion of tracked history. Template definitions may be deleted because they are untracked starting points; a populated template stage must first have its actions moved or removed. No cascades into releases.

All local changes use current editable-release validation, scope revision, atomic audit and read-after-write behavior. Confirmed releases reject all local mutation, including the new detail records. Template edits change only template version/data; confirmed and active copies do not refresh from them.

## Workflow Library screen and boundaries

- Add a real **Workflows** sidebar destination. Keep Projects and selected project context available for return. Use local view selection; do not change the trusted app document URL, add a router or introduce a new persistence/state framework.
- Template list shows persisted name, description, user/built-in identity and version. Create and Duplicate are real commands; built-in detail is read-only. User templates allow name/description editing.
- Stage editor uses accessible move-up/down controls, add/rename and empty-stage removal. Closing stage is visibly pinned. Actions use title-first quick add; an expandable details editor contains instructions, applicability, definition of done, evidence guidance and type. Move/reorder/remove actions through explicit controls.
- Wide layout: template list plus editor; compact layout: stacked list/editor with wrapping controls and keyboard focus. Reuse Panel, field/button styles and graphite/violet tokens. No unrelated navigation destinations or visual redesign.
- New-release form selects Stages only or an actual persisted template. Release cards display captured source name/version and copied action details; local edits stay local. Evidence guidance is labelled as guidance, distinct from recorded verification.
- Extend named, validated bridge commands under the existing trusted-sender checks. Main owns validation/SQLite; pure progress remains unchanged. Save failure retains drafts; acknowledged save with failed refresh offers read-only retry, without duplicate copy/save. Block conflicting writes/navigation using the existing interaction convention.

## Acceptance criteria before implementation

1. Create/rename/edit a user template, including full action definitions; quick-add and empty states work. A successful restart recovers exact saved content/order/version.
2. Duplicate built-in/user templates with fresh IDs and independent definitions. Built-in edit commands are rejected, not merely hidden in UI.
3. Stage/action reorder, movement and removal preserve ownership/order; cross-template relationships, blank required titles, stale versions and invalid protected-stage configurations are rejected without partial writes.
4. Apply the same template to releases A/B: different stage/action IDs, identical copied definitions/order, all work initially incomplete. Completing/reopening/excluding/editing A changes neither B nor the master.
5. Rename/change/delete ordinary master definitions after copying: A/B snapshot definitions, origin metadata, scope revisions and verification history remain unchanged. Local edits to an active release stale its old verification; master edits do not.
6. Custom included-stage counts use the existing equal-weight policy; empty/unassigned scope remains null. Protected confirmation remains unique, last and provenance-gated; ordinary verification-typed work cannot substitute for it.
7. Inject an actual copy/detail/audit failure: no partial release/stages/actions/details/membership/events remain. Retry creates one coherent release. Test acknowledged-copy/failed-refresh separately from failed copy.
8. Upgrade populated v1/v2 profiles, including confirmed releases: preserve original IDs/text/timestamps/completion/scope/evidence/audit and keep provenance unspecified. Verify backup, rollback, FK consistency, newer-schema refusal and packaged restart.
9. Existing 44 checks still pass with intentional new bridge/schema expectations extended rather than weakened. Add focused Node/Electron/packaged workflow scenarios and inspect 800/1160/1440, keyboard, long content and errors. Record actual results and unresolved manual checks.

## Small implementation sequence after approval

1. Approve this schema/copy/commit/protection model and starter content; record the accepted ADR. No migration is written before approval.
2. Build the first complete path: migrate/seed → list/duplicate built-in → choose template/create release → render copied details → prove isolation with real persistence/IPC/UI tests.
3. Complete user-template creation/name/description plus stage/action editing/reordering/removal, local release customization and error/compact behavior using the same domain rules. No conditional engine, packs, sync, import/export or new dependencies.
4. Run focused/regression/packaged checks, inspect UI, update records/checkpoint, commit reviewable increments and stop for manual acceptance. No next milestone implementation.

## Five decisions requiring approval

1. **Built-in:** read-only seven-stage v1 with the eight fully described starter actions above; duplicate to customize; future built-in editions seeded immutably through later migrations.
2. **Data/versioning:** four new tables plus three nullable source columns; user versions are increasing edit revisions, not a full revision archive. Store source ID/version/name and copied definitions, without live master-child links.
3. **Protection/custom stages:** ordinary stages are configurable; exactly one app-managed closing stage/confirmation remains pinned last. Template actions cannot supply protected confirmation.
4. **Application/commitment:** copy only into a new release; explicitly applying the selected template commits its copied checklist, with manual applicability review/reasoned exclusions. Keep Stages only creation. No existing-release apply/merge/sync.
5. **Editing boundary:** title-first optional detail entry; full template stage/action editing; independent active-release action/details/order and stage add/rename/reorder, with reasoned exclusion instead of destructive tracked-work deletion. All confirmed scope/details remain frozen; local changes invalidate prior verification conservatively.

Phase B is blocked only on the user's requested approval of these reviewable decisions. No feature implementation or migration is included in Phase A.
