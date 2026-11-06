# ADR 0003 — Visual Foundation

Status: User approved and implemented, 2026-11-06. Automated verification complete; user manual acceptance pending. Scope: existing project workspace presentation. See [approved proposal](../visual-foundation-plan.md) and [verification](../verification.md).

Use a distinctive graphite/violet dark foundation with semantic CSS roles in `src/renderer/tokens.css`. Colors, typography, spacing, focus, feedback duration and layout widths have reusable tokens. No theme provider, preferences schema, new icon/font dependency or customization controls are introduced.

Separate presentation into ProjectSidebar, WorkspaceHeader and a small Panel primitive; reuse ResumePanel. App keeps form drafts/event wiring and useProjectWorkspace remains the single state owner. These boundaries accommodate real future views without adding routes, fake navigation or missing domain features now.

Use a 224px sidebar and 300px Resume rail on wide clients. On compact desktop windows use a 208px sidebar and place Resume above Actions. Render one Resume component with Resume-first DOM/keyboard order; CSS places it alongside the working column on wide windows. No sticky Resume overlay or duplicated focus controls.

Keep native Windows window controls. Main changes only its background color to avoid a bright startup surface; preload, IPC validation, security preferences, SQLite, schema/migrations, contracts and domain/state policies remain unchanged. The keyboard skip link focuses main content without changing the exact trusted document URL.

Use visible labels, focus rings, readable type and semantic success/warning/error states. Hover feedback is short and honors reduced motion. Candidate hover contrast was corrected before final verification; sampled rendered text/action states meet the tested 4.5:1 threshold. This is not a complete accessibility certification.

Preserve every existing operation and regression scenario. Screenshots come from isolated profiles populated through actual application operations, not production mock records. No stages, progress calculations, scheduling, fake metrics/statuses, unsupported quick actions or future navigation controls are implemented.

The user owns the future stage-progress calculation/policy. Stop at Visual Foundation acceptance; stage requirements and that algorithm are a separate milestone.
