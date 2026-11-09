# V5a — Linked Development Continuity

2026-11-09 · **Proposal for approval.** Baseline `21d5091`, schema v4. The user accepted V3a1a UX stabilization and authorized V5a design. [Acceptance and open checks](../v3a1a-stabilization-verification.md) · [Implementation roadmap](product-implementation-roadmap.md).

## One complete journey

**Home → Project → Engineering Map → Record checkpoint → leave → Resume Development → saved record and next step → Journal history.**

1. Open Vivarium and inspect a component, feature, requirement, proposed action or proposed decision. The existing inspector shows the record, authored relationships and exact captured source. **Record checkpoint** opens a labelled editor with the record's title, kind and revision pinned as the continuation target. Opening or browsing the inspector makes no changes.
2. Write **What happened / what you tried** and **Next step**, using the same two required fields as the existing journal. Add optional **Current problem**, **Reasoning** and **Unresolved questions**. They are plain authored notes. Keep the linked target visible beside Save. Changing targets requires an explicit cancel and a new editor from the other record. A developer who made no code changes can describe the observation or investigation in their own words.
3. **Save linked checkpoint** appends one checkpoint and its context. Keep a pending form and its target stable through Save. A definite failure keeps the draft and returns focus to the error or editor. An acknowledged save clears only its own draft. Closing with unsaved text asks whether to discard it. Cancel and inspect are read-only.
4. Return after a project switch or full restart. Home shows the latest checkpoint, next step and linked record label, with **Resume Development** alongside ordinary **Open project** when the latest checkpoint is linked. The knowledge workspace header and existing Resume panel use the same continuation route. A successful linked Resume reveals and selects the saved entity, opens its inspector and places the authored checkpoint next to the record details, with next step first and the longer context expandable. Existing relationship and source actions stay available. On compact windows, open the full-width inspector and focus its context heading. Use the existing Map reveal path and session layout instead of reconstructing a past camera or branch.
5. **Previous checkpoints** appears on a record with linked history and opens the existing Journal filtered to its entity. Journal shows newest first with a clear filter and the option to open any linked entry. Preserve every checkpoint, including unlinked entries and previous revisions. When a checkpoint's link is unavailable, keep its text and timestamp available in Journal.

Use the existing project navigation and Journal. V5a adds a contextual write, an entry in the existing history and a direct return route. The future unified Overview / Sources / Engineering Map / Development / History workspace can reuse those behaviors. A checkpoint records what the user wrote and when they saved it. It does not accept a requirement or decision, commit or complete work, activate a scope, create a work session or establish verification evidence. **Commit Proposed Work**, **Edit Relationships**, **Run Verification** and navigation to adopted work belong to their own slices. [Approved domain ownership](development-domain-contract.md).

## Identity, ordering and recovery

The existing `checkpoints` table owns project, accomplishment, next step and timestamp. `getHomeSummary` ranks by `created_at DESC, id DESC`, and `openProject` and `selectResumeCheckpoint` use the same order. Keep one sequence across old and new entries. A newer unlinked checkpoint remains the latest and uses current project-level Resume. Older linked checkpoints remain individually openable. A missing latest target never silently substitutes an older or similarly named record. [Current checkpoint store](../../src/main/data/database.ts) · [Resume selector](../../src/main/resume.ts).

The continuation link stores the permanent project-owned `knowledge_entities.id` and the exact `knowledge_definitions.revision` seen at Save. The main process derives kind and label. Proposed actions use their knowledge identity through any later adoption. Current entity revisions, titles and source bytes come from the existing knowledge reads. The renderer carries no filesystem path, copied source, layout coordinates, release or action ID, or saved tab/filter. [Current knowledge store](../../src/main/data/knowledge.ts) · [Knowledge schema](../../src/main/data/migrations/004_durable_knowledge.sql).

| Resolved state | Continue behavior |
| --- | --- |
| Current entity matches the saved definition revision | Reveal the entity through the existing bounded Map path, open its inspector and show the chosen checkpoint. |
| The entity has a newer definition | Open the chosen Journal entry with a revision notice. Offer **View saved definition** using `getKnowledgeRecord` with the pinned revision and existing stored-source actions. Offer **Open current record** separately when available. Relationships returned by today's record reader describe the current graph. Do not present them as a historical graph snapshot. |
| Graph or definition is absent, unsupported, or unreadable | Keep the selected checkpoint readable in Journal with a clear reason. A transient read failure has a read-only retry. When the saved checkpoint itself cannot be read, show a load error and preserve Home or Journal navigation. |

Continue carries the clicked `{ projectId, checkpointId }` in renderer state, re-reads project data, and uses that exact entry even if Home refreshed or another checkpoint was saved meanwhile. Treat the journal read and graph resolution separately on this route. The current `readProject` publishes neither result if the graph request fails, so the continuation route must retain a successful `openProject` read when knowledge loading fails. Guard both reads and delayed reveal by the current navigation request and project identity. A superseded request must not open the previous project's context. [Current workspace controller](../../src/renderer/useProjectWorkspace.ts).

## Proposed migration 005

Use one optional one-to-one table. A legacy checkpoint has no context row and needs no backfill or change to its DTO. A new linked checkpoint always has a target and may have any of the three richer fields. The redundant checkpoint index is the composite parent key SQLite needs to enforce checkpoint ownership. The target FK uses the existing composite unique key on the exact definition. This preserves 001–004 and avoids rewriting the base table or creating a generic link/event subsystem.

```sql
-- Proposed 005_linked_checkpoints.sql. Design only.
CREATE UNIQUE INDEX checkpoints_id_project ON checkpoints(id, project_id);

CREATE TABLE checkpoint_context (
  checkpoint_id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  entity_id INTEGER NOT NULL,
  definition_revision INTEGER NOT NULL CHECK (definition_revision > 0),
  target_kind TEXT NOT NULL CHECK (target_kind IN (
    'component', 'feature', 'requirement', 'action', 'decision')),
  problem TEXT CHECK (length(trim(problem)) BETWEEN 1 AND 10000),
  reasoning TEXT CHECK (length(trim(reasoning)) BETWEEN 1 AND 10000),
  unresolved_questions TEXT CHECK (length(trim(unresolved_questions)) BETWEEN 1 AND 10000),
  request_id TEXT NOT NULL UNIQUE CHECK (length(request_id) = 36),
  FOREIGN KEY (checkpoint_id, project_id) REFERENCES checkpoints(id, project_id),
  FOREIGN KEY (entity_id, definition_revision, project_id, target_kind)
    REFERENCES knowledge_definitions(entity_id, revision, project_id, kind)
) STRICT;
```

Use the existing migration runner's backup, transaction, foreign-key check and version marker. The default FK behavior restricts deletion while referenced. Existing application commands already append checkpoints and provide no edit/delete path. A future retention policy must preserve linked history explicitly. Read base checkpoints via left joins, including when a target is unavailable. Derive the pinned title from the definition when readable and otherwise display the saved kind and ID. Keep the current checkpoint activity query as the sole activity source for saves.

## Exact proposed DTO and IPC boundary

```ts
type CheckpointTargetKind = 'component' | 'feature' | 'requirement' | 'action' | 'decision';
type CheckpointTarget = {
  entityId: number;
  revision: number;
  kind: CheckpointTargetKind;
  title: string | null;
};
type DevelopmentCheckpointContext = {
  target: CheckpointTarget;
  problem: string | null;
  reasoning: string | null;
  unresolvedQuestions: string | null;
};
type DevelopmentCheckpoint = Checkpoint & { context?: DevelopmentCheckpointContext };
type SaveDevelopmentCheckpointInput = {
  projectId: number;
  requestId: string;
  target: { entityId: number; revision: number };
  accomplished: string;
  nextSteps: string;
  problem?: string;
  reasoning?: string;
  unresolvedQuestions?: string;
};
// Add to the existing WorkspaceApi.
saveDevelopmentCheckpoint(input: SaveDevelopmentCheckpointInput):
  Promise<Result<Checkpoint & { context: DevelopmentCheckpointContext }>>;
```

- **New named IPC** `workspace:saveDevelopmentCheckpoint`. Add the matching typed preload method under the existing trusted sender, frame and URL checks. `saveCheckpoint` keeps its current input, result and unlinked behavior.
- **Existing reads.** `ProjectDetail.checkpoints` and `resume` become `DevelopmentCheckpoint[]` and `DevelopmentCheckpoint | null`. The Home checkpoint becomes `(Checkpoint & { target?: CheckpointTarget }) | null`. Home joins only the ranked latest checkpoint for its target label. It does not fetch rich notes or load each project's graph. Leave fields absent on legacy responses. `openKnowledgeWorkspace`, `getKnowledgeRecord` and `getKnowledgeSource` retain their inputs. A separate Resume or History IPC is unnecessary.
- **Main validation and transaction.** Reject unknown input and target keys, non-positive or unsafe IDs, malformed UUIDs and invalid text. Reuse the existing 10,000-character bound for each field. Normalize outer whitespace, retain authored internal text and newlines, and store absent or blank optional strings as null. Validate the target's allowed kind, same-project ownership, readable definition and current revision. A stale revision asks the user to reload and review the target while keeping the draft. Insert the base row and context in one immediate transaction and acknowledge only after commit.
- **Retry semantics.** Generate one UUID v4 per explicit save and keep it with that exact pending payload. Within the transaction, check the saved request ID before current-target validation. An identical normalized retry returns the original checkpoint. A changed payload or another project using that ID fails without exposing the existing row. A confirmed failure retains the draft. After a lost acknowledgement, retry that same payload and ID. After an acknowledgement followed by failed refresh, retry reads only. On restart, read saved checkpoints from SQLite. Uncommitted drafts and pending request IDs are session state.

## Small implementation and acceptance

After approval, build one vertical slice. Add 005 and the validated write/read shapes, then wire the existing inspector, Home/Resume and Journal to the same checkpoint. Preserve existing project tools, source dialog, Map Back behavior and unlinked journals. Use the existing keyboard dialog and navigation conventions at 800, 1160 and 1540 px. A draft, selected node or click on Resume changes neither work nor release state.

| Check | Evidence required |
| --- | --- |
| Migration and ordering | Upgrade a populated v4 database and check backup, foreign-key enforcement and preservation of checkpoints, graphs, templates, releases and audit. Assert mixed legacy/linked timestamp ties resolve by descending ID in both Home and Project. A newer unlinked checkpoint wins. |
| Ownership and failed write | Reject wrong-project, unknown, disallowed-kind and stale targets, including collisions with legacy action IDs. Inject failure after base insert and verify neither row commits. Retry identical and mismatched requests, including simulated lost acknowledgement. Assert one checkpoint and unchanged releases/actions/verification. |
| Real continuity | In the rebuilt app, use the Vivarium PetDNA action. Inspect it, save a problem/reasoning/question/next step, switch projects and restart. Resume from Home to that action, read the authored context, open its exact source, then find earlier entries in Journal. Verify the action is still Proposed. Repeat using keyboard and an off-projection target. |
| Degraded and competing reads | Simulate a changed or unavailable target and a failed graph read. Journal retains the intended checkpoint. Review the saved revision and exact source when available. Late responses cannot replace a newer project selection. Failed refresh after an acknowledged write makes zero additional writes. |
| Existing paths and packaged recovery | Keep unlinked Resume, Home summaries, exact stored source and legacy releases/workflows working. Rerun Node, Electron and rebuilt Windows package/recovery tests. Review focus, readability, scroll and source return manually, including compact details. |

**Approval requested** for the single pinned target and five allowed kinds, the additive 005 plus retry key, and the use of current Map/Journal surfaces with the revision and unavailable-target fallback above. [Deferred Focus Canvas, live source, graph and workspace capabilities](visual-engineering-backlog.md).
