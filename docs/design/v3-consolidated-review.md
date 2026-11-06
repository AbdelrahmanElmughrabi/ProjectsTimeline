# V3 consolidated design and production-readiness review

2026-11-07 · **Design/integration planning only. No merge, production V3 code or migration.**

Reviewed Antigravity **92a712908223756d984abf675bc542dad65f77eb**, descended directly from frozen handoff **63c18e90f6a3ff26cc724c3a6fe2c8d65ee66aca**. All 27 changed paths are its assigned reports/prototype/screenshots. Its branch/worktree and the original handoff remain intact. Nine pre-existing modified Codex screenshots are preserved separately, not included in this review's checkpoint.

[Canonical experience/decisions](v3-product-experience-contract.md) · [UX](connected-workspace-design.md) · [capability audit](v3-capability-audit.md) · [roadmap](product-implementation-roadmap.md) · [adoption policy](blueprint-adoption-merge-policy.md).

## Independent conclusion

**Recommend a refined Concept C as the visual direction; rebuild its production composition using the existing architecture.** C removes redundant hub lines, reads more clearly than A and gives the canvas more space than B. Keep its outside-lens recovery, deliberate neighborhood entry/return and conditional inspector. It is not ready to copy into production. Passing its walkthrough does not establish valid adoption transitions, exact source for every fixture, stable map interaction or accessible focus handling.

What this change does: Antigravity adds an isolated, in-memory comparison prototype with component/feature maps, contextual source inspection, selective adoption, work/checkpoints and three design cases. It does not add any application API, database persistence or usable production workflow. The review uses the ponytail-review procedure and two lighter read-only domain/UX reviewers, then independently reproduces the important cases in an isolated Electron viewer.

## A / B / C comparison

| Criterion | A · Component Atlas | B · Focus Workbench | C · Spoke-Free Atlas / disposition |
| --- | --- | --- | --- |
| Initial comprehension | Components/features visible, but project hub consumes attention | Capability index helps a novice follow one question | Best initial scanning. Use neutral component index/grouping, not a claim of architectural dependency topology. Its default has seven nodes and zero typed edges. |
| Relationship readability | Project ownership spokes are source-backed project fields, **not fabricated dependencies**, but visually redundant | Real neighborhoods readable only after zoom; short canvas | Drop ownership spokes by default. Make explicit neighborhoods the relationship map; preserve native labels/direction and path provenance. |
| Navigation | Stable intent, but outside-lens explanation absent in the study | Capabilities easy to find, competing scroll regions | Keep outside-lens banner and return breadcrumb; retain the useful capability directory. Separate neighborhood anchor from ordinary selection. |
| Responsive behavior | Full-width narrow detail works; fitted labels small | Persistent index and lower inspector squeeze the canvas | Keep C's narrow replacement detail. Three-column 800px overview still requires zoom; use fewer columns/list at narrow sizes and a readable starting zoom. No-overflow alone is insufficient. |
| Keyboard | Source return/list tested; incomplete detail focus | Same baseline limits | Search/outline do not announce/restore selection well; Close inspector leaves focus on BODY in the probe. Fix before production acceptance. |
| Continuity | Conditional strip and explicit checkpoint text | Same baseline | Keep strip, improve checkpoint target intent and saved lens/filter restoration. Landing recommendation is not actually demonstrated. |
| Extensibility | Source-backed pure projection is reusable as a pattern | Too much persistent chrome for a default | C supports bounded source/path layers. Do not encode format tiers as truth/confidence or add every future adapter now. |
| Implementation cost | Compact exploratory JSX, deliberately limited | Shares A's implementation | C's ~5,300 added lines include formatted CSS, fixtures and reports; line count alone is not a defect. Its large App combines too many responsibilities and simulation shortcuts for production reuse. |

The final proposal is neither a seven-card task tracker nor an every-record graph: goal/capabilities establish orientation; component groups are an index; selecting **Explore connections** reveals bounded, source-backed relationships, related work and exact wording. Map geometry has no engineering meaning. No edge is drawn just to make the canvas look connected.

## Findings to resolve before production reuse

These are prototype limitations/bugs, not evidence that the working application or its database was damaged. No prototype patch is required merely to retain the research.

### Must fix in a production implementation

1. **Review can silently revoke approvals and commitments.**
   - **What this is:** `main.jsx:481–538` copies current accepted/active/committed sets into checkboxes and replaces all three sets on Apply.
   - **Problem:** After completing an action, clearing action choices produces **0 committed, 1 done, 10 proposed**. No reasoned exclusion, scope lifecycle transition or requirement revision occurs. `main.jsx:1744–1747` also checks the unresolved-requirement acknowledgement automatically from a bulk-select button.
   - **Fix:** Apply explicit **new transition deltas**, not replacement snapshots. Existing accepted/active/committed state is read-only in adoption; exclusion/reassignment/revision/lifecycle use dedicated audited commands. Never auto-check acknowledgement. Main validates per-item placement and exact acknowledged Draft revisions atomically.
   - **If skipped:** Production could misrepresent prior engineering commitments/history and count uncommitted completed work.

2. **Some “exact captured source” is reconstructed fixture text.**
   - **What this is:** `model.mjs:40–337` embeds supplementary records, abbreviated documents, placeholder hashes and line-only anchors. `main.jsx:648–658,1606–1636` serializes missing source offsets back into PTB while labelling it an exact capture.
   - **Problem:** All 15 Desk Notes and 37 FieldLedger embedded records lack UTF-16 source offsets. Desk's normalized metadata matches after empty defaults; FieldLedger has **15 records with differing non-default fields**. Their attached semantic digests are copied from the actual fixtures, not computed from these rewritten definitions. A count/hash badge cannot establish fidelity.
   - **Fix:** Use real parser snapshots as fixtures. Missing source opens a clearly labelled generated definition view or unavailable-source state; never invent a source line/hash or call serialized metadata captured text.
   - **If skipped:** Users would follow supporting knowledge that was not actually present at the displayed source location.

3. **Selection resets the viewport and dragging does not update controlled nodes.**
   - **What this is:** `main.jsx:135–147,196–325,352–359` recomputes/fits on selectedId and supplies controlled nodes without onNodesChange. Its custom Fit map also resets positions.
   - **Problem:** Selecting a second node after zoom refits the viewport. A settled pointer drag moved the node **0px** in both axes in the targeted probe. Two sets of zoom/fit controls duplicate the same tasks.
   - **Fix:** Use React Flow's controlled change handler; retain positions/viewport through selection. One control set; Fit changes viewport only, Arrange/reset changes layout explicitly. Separate lens/anchor/expansion layout jobs from selection and handle failure/stale/unmounted results.
   - **If skipped:** Exploring the graph destroys spatial orientation and advertised arrangement behavior fails.

4. **Explicit edge authority is confused with distance from the anchor.**
   - **What this is:** `model.mjs:445–449` marks any edge touching a second-hop node as path-2hop; `main.jsx:291–310` styles it dashed amber.
   - **Problem:** In the determinism neighborhood, **four real primary-component source assertions** become dashed “2-hop” links. They are direct declared edges; only the route from the selected requirement is indirect. No new dependency was asserted, but the legend blurs the distinction.
   - **Fix:** Keep each native segment's explicit authority/source. Indicate route length on the node/path overlay or use a separate derived shortcut that retains both constituent edge IDs and an unmistakable path label. Distance, assertion origin, review and evidence are separate dimensions.
   - **If skipped:** The user cannot tell whether a line is written in source, inferred, or merely part of a longer navigation route.

5. **Explicit unscoped placement is lost in the filter explanation.**
   - **What this is:** `main.jsx:1288–1293` uses `placement.scope ?? source.scope` for the outside-filter notice; the row renderer correctly checks whether a placement exists.
   - **Problem:** A source-scoped action committed as unscoped appears in the Unscoped list **and** gets an “outside this scope filter” warning. Explicit null incorrectly falls back to proposed scope.
   - **Fix:** Test placement presence rather than nullish scope; share one pure effective-placement selector across rows, counts, filters and review summaries.
   - **If skipped:** Scope/Unscoped explanations disagree about the same action.

### Should fix in production composition and contracts

6. **Focus/accessibility behavior is incomplete and one Base UI prop is unsupported.**
   - **What this is:** `main.jsx:1591` uses onCloseAutoFocus; `1972–2003` removes the focused Close button without a destination. Search/outline also unmount their openers without an inspector focus/selection announcement.
   - **Problem:** Installed Base UI 1.9.0 exposes **finalFocus**, not onCloseAutoFocus; a small TypeScript probe returns TS2322. The passing source-return case uses the library's default return behavior, not that callback. The runtime inspector-close probe ends on BODY.
   - **Fix:** Use the actual typed API and stable surviving focus targets. Mark the selected outline entry, announce changes/outside-lens selection and retain a list/search path without dragging. Test narrow Back, removed openers, source Escape and view switches.
   - **If skipped:** Typed integration fails or keyboard users lose their place even though the mouse screenshot looks correct.

7. **Saved context and landing claims exceed the demonstration.**
   - **What this is:** `main.jsx:564–595` targets selected before chosen focus, stores savedLens but never restores it. Home always opens Overview (`750–768`), regardless of adoption state.
   - **Problem:** Browsing another requirement can change the checkpoint target away from intentionally started work; Continue restores target/view but not lens/filter. “Active project → Map” is a proposal, not a tested behavior.
   - **Fix:** Make checkpoint target explicit, defaulting to chosen focus or project with a deliberate Use selected record action. Continue restores validated hints or explains fallback. Define landing from capture versus formed workspace, not an invented active-project status.
   - **If skipped:** Context recovery still depends on reconstructing what browsing changed.

8. **The reports drift from the contract and fixtures.**
   - **What this is:** The main report reassigns VD2/3/4/5 meanings, recommends PTB v0.1 support, cites nonexistent example IDs/commands and gives conflicting Desk Notes counts. It reports Lucide 1.16.0 versus installed 1.70.0.
   - **Problem:** Current parser accepts **only PTB 0.2**. Desk Notes has one component, two features, three requirements, one optional Draft scope, four actions, one decision and two checks. Examples such as act.renderer-shell / feat.deterministic-generation and workspace:openBlueprintPackage are not existing definitions/APIs. The helper fixture and count assertions do not establish these claims.
   - **Fix:** Keep AG reports immutable as research; the canonical package corrects them and preserves original VD meanings. Link each future capability to actual code or explicitly mark it proposed. No v0.1 adapter or new schema is authorized.
   - **If skipped:** Approval would target the wrong behavior and implementation could expand beyond the supported contract.

## Adopt / modify / reject recommendations

| AG recommendation | Disposition |
| --- | --- |
| Remove ownership hub spokes / avoid B's permanent split | **Adopt direction.** Keep A/B as research, not production options. C's grid is a component index; legitimate focused relationships earn the graph canvas. |
| Outside-lens notice, expansion/reveal and return breadcrumb | **Adopt, refine.** Stable neighborhood anchor/back state; ordinary selection does not recenter/refit. Narrow recovery must remain reachable above/replacing detail. |
| Direct versus two-hop context | **Modify.** Useful navigation; preserve explicit edge identity/origin and distinguish path distance from authority. No implied dependency or confidence. |
| Sparse coverage badge | **Modify.** Neutral “No explicit feature links,” not an engineering defect/priority/warning. Infrastructure components may legitimately have none. |
| Three independent default-none adoption groups | **Adopt contract, rewrite transition behavior.** Already an established direction; do not ask to approve silent revocation, combined acknowledgement or unchecked history loss. |
| Structured graph digest plus narrative semantic hash | **Modify/defer extra stored digest.** Structural comparison is useful, but current V2 exposes no separate normalized-graph digest. Define versioned normalization first if needed; source/semantic hashes already suffice for first receipt safety. No parser/hash-policy change. |
| Conditional landing and continuity | **Modify.** Preview capture → Overview; a formed knowledge workspace can open Map, with Overview reachable explicitly; legacy entry unchanged. Continue is explicit. No new active-project flag. Focus and checkpoint target remain separate from browsing. |
| Skip separate V3-M shipping milestone | **Agree as a default.** Keep a bounded app:// CSP/keyboard/layout compatibility check inside the first authorized slice; reuse a pure projection, not a throwaway renderer. |
| V3a1 + V3b1 + V5a as one large schema/shell batch | **Reject combined first scope.** Split formation, early linked context, unscoped adoption and optional inline activation. Preserve the original lifecycle/ID meanings; no speculative evidence/rule/snapshot tables. |
| PTB v0.1/v0.2 authority tiers | **Reject v0.1 claim and truth ranking.** PTB 0.2 first. Native explicit links, user review, optional AI proposals and actual evidence are independent; future formats are not intrinsically less truthful. |

## Source/digest investigation

Independent execution of the existing compiled production capture/parser confirmed both Vivarium packages are Valid, 47 records/86 links, with equal normalized known metadata (excluding the packaging documents list) and typed relationships. Semantic hashes remain **b0fbefb814c3ad7825531d1b16451deb555e88b9021f989a4202dd6f5fc134b8** and **23245ab6fced888e76b652a5c6b00f3a2030897252e58cc7f17b031842df3be1**.

Four narratives differ: project, req.export-extensibility, act.document-dna-format, dec.export-interface. This is **not only harmless trailing headings**: the project's multi-file narrative adds a paragraph about domain/work document organization, while the single version ends with Components. Preserve the actual wording as well as boundary headings. The current graphSemantic normalizes newlines/outer blank lines and metadata set order, excludes file packaging, and includes narrative. Exact document SHA, narrative-inclusive semantic SHA and a possible future structured comparison signature have different meanings. Same graph/count does not establish identical source meaning or permit automatic deduplication/overwrite/approval.

AG's prototype imports only the single-file capture; comparison notes/line ranges are hardcoded. Its check asserts four note entries exist, not that both packages were parsed. The independent real-source check validates the underlying four-difference finding; it does not validate every hardcoded displayed line. Use exact anchors from whichever capture is displayed, and label validation/comparison narrowly. Do not show “Single & Multi-file verified” as engineering evidence.

## Production reuse and boundaries

Reuse **ideas and small tested patterns**, not the 5,319-line change as an application feature. model.mjs contains extensive hand-maintained fixtures; most style.css lines are formatting, so no honest line-savings estimate follows from the count alone.

| Keep / extract after tests | Rebuild or discard for production |
| --- | --- |
| React Flow custom-node/viewport mechanics; ELK only where relationships need it | Controlled changes, measured bounds, stable viewport/layout jobs with failure/cancellation; no selection-driven layout or duplicate controls |
| Outside-lens predicate and direct typed-neighborhood idea | Typed source-edge/path records with exact provenance, caps and tests; no generic mutable graph store |
| C's component/capability hierarchy, one inspector, compact detail replacement | Native semantic labels, narrow readable columns/list, focus/announcement behavior; no raw-ID-heavy seven-metric overview by default |
| Default-none review presentation and linked-context disclosure | Main-owned immutable review plans/receipts, delta transitions/revisions, per-item placement and intentional targets; no parallel React-state authority |
| Installed Base UI / tokens / existing Panel, controller and Result patterns | Typed Base UI APIs and shared native controls; no wholesale shadcn/CSS migration, new framework/store/dependency |
| Proposed stages, decisions and checks as definitions | Preserve in source/project records; do not implement full decision/evidence/lifecycle engines before their slices |

Suggested production responsibilities: existing app shell/navigation; a project workspace controller using current acknowledged-write/read-retry conventions; a pure typed map projection; MapCanvas; reusable node/legend/outline; RecordInspector + existing source-selection behavior; reviewed-application form/controller; checkpoint context. Split by these actual jobs, not by arbitrary line limits. Keep domain approval/validation and SQLite transactions in main. No Redux-like store, generic adapter framework or graph execution engine is necessary.

TypeScript integration must use the actual preview/durable discriminated types, not merely rename JSX to TSX. Preview occurrence keys and external PTB IDs are not SQLite IDs; resolve durable bindings explicitly. Duplicate/invalid source occurrences stay inspectable, not first-wins Map entries or valid entities. Source/model fixtures do not validate these trust-boundary cases. Disable connection/deletion affordances on a semantic-read-only canvas and test the exact installed library props.

The [capability audit](v3-capability-audit.md) maps every essential interaction to actual parser/store/IPC/persistence and a safe slice. The [roadmap](product-implementation-roadmap.md) preserves V5a immediately after first formation and separates deep scope/library/evidence work. Future Markdown/Obsidian/OpenSpec/Spec Kit/AI/MCP remain extensibility boundaries/backlog, not implementation permission.

## Actual verification and remaining review

- Commit/ownership/ancestry read directly; all three AG reports read. Original AG worktree remains clean at 92a7129; no source/report cherry-pick or merge.
- Built the exact AG source with existing installed dependencies to **artifacts/v3-c-review/build**, not its committed screenshot folder. Build passes with the known non-RSC use-client/chunk warnings. A copied harness changes only imports/output/profile destinations and a finite wait timeout; its model + real Electron/Playwright walkthrough **passes**, producing all 16 screenshots separately at 800/1160/1540 outer widths. Zero page/console/CSP errors, external requests or Node/app bridge in those exercised paths. Host tool sandbox escalation does not disable Electron's renderer sandbox.
- Targeted runtime probe separately reproduces selection refit, 0px dragging, BODY focus after close, automatic Draft acknowledgement, silent uncommit/ghost Done counts and the false Unscoped warning. These were absent from the passing AG assertions. A temporary TypeScript API probe fails with the expected TS2322 for onCloseAutoFocus. This is evidence of a real API mismatch, not a failed application build.
- Source/model probes read real files through the existing parser, compare supplementary fixtures and verify that four dashed second-hop segments retain exact resolved explicit-edge IDs. Desk metadata equivalence is checked after normalizing missing empty covers_rule_ids, not misreported as four substantive changes.
- Visually inspected committed A/B/C and independently rendered C wide/narrow/source/adoption/context flows. No-overflow is only one layout check. New runtime evidence/logs stay in ignored artifacts/v3-c-review; original dirty screenshots are hash-preserved.
- **Not rerun:** full application Node/Electron/package/recovery. No production files/tests/dependencies/migrations changed; prior 78/103 results are historical. No V3 SQLite/restart/rollback/evidence test exists yet. Screen-reader usability, large-model performance and production app:// / ASAR library adoption remain implementation gates.

Verdict: **resolve findings 1–8 in the production design/integration plan; do not ship either prototype.** A refined C is the strongest reviewed direction, still awaiting user acceptance. No measured line-savings claim. Review VD1–VD5 and the concrete next-slice/schema proposal before coding.

Evidence at the immutable AG ref: docs/agent-handoffs/reports/antigravity-v3-visual-workspace.md and both supporting reports; docs/design/antigravity-v3-visual/{main.jsx,model.mjs,check.mjs,style.css,screenshots}. Use `git show 92a7129:<path>` to recover it without merging. This repository's new review checkpoint records canonical recommendations, not acceptance of AG's executable prototype.
