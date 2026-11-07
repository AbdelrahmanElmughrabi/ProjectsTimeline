# Visual engineering and workflow design backlog

2026-11-07 · **Recorded possibilities for separate review.** The [post-V3a1a stabilization scope](post-v3a1a-ux-review.md) covers the existing app's interaction defects. This backlog tracks follow-up capabilities.

## Follow-up after the stabilization review

| Capability | Prerequisites and boundary |
| --- | --- |
| Multiple sources per project | Separate native grants and adapter contracts. Bindings and immutable captures per source. Approve crosswalk, reviewed overlap/conflict handling, revision semantics and transactional receipts before attachment or updates. [Proposed flow](post-v3a1a-ux-review.md#future-add-source-and-overlap-review). |
| Advanced diagram semantics | Add UML associations, inheritance, dependencies or impact lenses only when a supported source or explicit user assertion supplies the typed meaning and provenance. Review constraints, validation and display rules for each relation. Position and label proximity never imply semantics. |
| Date-free Development and optional Gantt | Show authored stage order, real commitments and Unassigned work when the development policy is ready. Gate Gantt on explicit schedule dates or durations with granularity, time zone, revision and dependency rules. Keep unscheduled work visible. |
| Focus mode and personalization | Explore a reversible canvas focus mode, local shortcuts, density, theme and optional saved layouts. Preserve selection, camera and a keyboard exit. Layout preferences are UI state and require separate review before persistence or native full-screen integration. |
| Unified workspace and richer graph controls | Keep Overview, Sources, Engineering Map, Development and History in one project shell as their real capabilities ship. Releases stay separate and Resume appears for actual saved context. Review typed count filters, advanced edge routing and a Miro-like canvas focus mode separately from the stabilization. |

## Earlier design backlog

| Item / horizon | Purpose and user value | Prerequisites / limits |
| --- | --- | --- |
| Component atlas + explicit neighborhood · immediate prototype | Stable software shape; follow shared requirements without a 47-node cloud | Real typed relationships; default components/features, bounded expansion, list/source/legend. Two concepts actually rendered. |
| Alternative layouts: layered, radial, clustered, matrix · later V3 | Match hierarchy, cross-cutting constraints or dense structure to a readable representation | Comparative usability/performance fixtures, deterministic reset, saved layout separate from semantics; do not ship every layout picker now. |
| Feature neighborhood / architecture lens · immediate prototype, refine later V3 | Explain one capability and its engineering support | Exact direct/path labels and back-to-atlas; avoid automatic recentering on every selection. |
| Dependency view · later V3 | Explain real prerequisites and impact | Approved versioned dependency semantics/cycle/exclusion/override rules; references/contains are not depends-on. |
| Ordered stage/scope roadmap · immediate prototype | Organize work without fabricated dates; link actions and features | Authored plan, independent development membership, explicit commitment; counts/Not assessed, no release gate. |
| Date-aware Gantt and scheduling · later V3 or later milestone | Visualize real scheduled work and rescheduling | Authored date/timezone/granularity/duration and conflict policy; unscheduled work remains visible. No synthetic bars. |
| Workflow/process visualization · later V3 | Understand reusable engineering playbooks and independent instances | Development-purpose templates and optional proposal adoption; release template/gate isolation; no automatic sync/conditional engine. |
| History + linked continuity · immediate simulation, earliest durable V3 follow-up | Resume exact problem, reasoning and next step after interruption | Actual events and authored checkpoint links; no empty dominant rail, inferred sessions or source-as-history. |
| Markdown/Obsidian ingestion · future adapter milestone | Navigate existing engineering knowledge without rewriting all notes as PTB | Separate capture permissions, native link/identity/anchor/version policy, inert rendering; headings do not invent typed entities. |
| OpenSpec / Spec Kit adapters · future adapter milestone | Reuse recognized specs/plans/changes with native semantics | Pin supported format/process versions, fixtures/crosswalk/reimport rules. Do not initialize either tool now. |
| AI-assisted relationship suggestions/review · future milestone | Help connect unstructured knowledge with explicit review and citations | Optional model/privacy/permission decision, proposal provenance/rejection/dedup; never promote guesses or run models merely to read structured docs. |
| Git integration · future milestone | Add real change context and source references | Explicit repository grant, identities and link policy; commits are not verification or time tracking. |
| Engineering playbooks and suggested actions · later V3 / future packs | Reuse sound engineering activities with applicability/definition of done | Independent development library, quality review and optional explicit commitment; no rule engine required initially. |
| Cross-project workflow learning/pattern recognition · future milestone | Discover useful repeated practices and gaps | Sufficient real history, user-controlled cross-project access, explainable observations; no automatic obligation or speculative statistics. |
| Visual personalization · future milestone | Tune density, accent, layouts and useful lenses | Semantic tokens and stable domain/view split first; no broad settings system in prototype. |
| Accessibility and large-project scaling · immediate fundamentals, later depth | Equal access without dragging; readable and bounded navigation | Keyboard/list/source/focus/reduced motion now; screen-reader/user testing, contrast/zoom, cancellation/virtualization and 2,000-record benchmarks before production-scale claims. |
| Manual semantic graph editing · later V3, separate approval | Correct approved relationships naturally without external AI | Typed same-project/revision validation, audited add/remove, source/local override distinction; dragging a node must never modify ownership. |
| Verified engineering evidence overlay · later V3 | Understand what is actually supported, failed or stale | Approved exact-revision assessment/freshness policy; plans/completion remain distinct; legacy release confirmation unchanged. |
| ProjectsTimeline MCP · future milestone | Let authorized developer tools retrieve bounded engineering context and request explicit reviewed operations | Stable typed application queries/commands, transport/auth/data-scope review, provenance/revision/error contracts. No generic SQL/files/shell, automatic model access or server implementation now. |

Consolidated review at AG 92a7129 recommends refined C over A/B, keeping source-edge authority separate from two-hop navigation distance. Sparse link counts are neutral source facts; no automatic defect or priority is inferred. Production map/keyboard/state defects and capability gaps are tracked in v3-consolidated-review.md and v3-capability-audit.md, not silently promoted from prototype to implementation.
