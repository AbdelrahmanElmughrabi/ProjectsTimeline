# ProjectsTimeline — Visual Foundation proposal

Status: **Approved and implemented; automated checks passed, user acceptance pending.** Date: 2026-11-06. Scope: existing project workspace only. This does not authorize the following stage-progress milestone. See [ADR 0003](adr/0003-visual-foundation.md) and [verification](verification.md).

## Current UI versus reference

Proposal review inspected App.tsx, ResumePanel.tsx, useProjectWorkspace.ts and styles.css, the preceding Resume screenshot and the [supplied reference](design/ui-reference.png). Before this milestone the appearance was a dark green sidebar/light main area with stacked panels, small text and repeated hardcoded colors. The approved graphite/violet presentation is now implemented; the original functionality remains the baseline.

| Area | Reference inspiration | Proposed original treatment |
| --- | --- | --- |
| Shell/sidebar | Dark surfaces, clear selection, grouped navigation | Graphite shell, restrained violet selection, existing real project list/create form. Keep native Windows frame/controls. |
| Workspace | Strong project header and bounded content | Actual saved project name; main working column plus a wide-window Resume rail. No image banner, copied illustration, fabricated project description or lifecycle badge. |
| Resume | Visible right-hand project memory panel | Reuse ResumePanel and real saved timestamp/accomplishment/nextSteps. Label Latest checkpoint, not Last session. Keep its working form-focus actions and empty/stale states. |
| Actions/checkpoints | Consistent rows, cards and readable hierarchy | Existing create/complete controls, checkpoint form and all history, using shared visual primitives and larger text. No calendar or scheduling assumptions. |
| Visual detail | Violet accents, fine borders, layered dark panels | Subtle surface separation and limited accent use. Preserve semantic success/warning/error distinctions; no decorative progress or glow-heavy backgrounds. |

The reference is inspiration, not a specification of working features. Its example projects, project description/status, sample dates, percentages and counts will not be copied. The design study shown in chat contains region labels and palette only, not simulated records or controls.

## Tokens and typography

Use semantic CSS custom properties in one token file. Components consume roles rather than their own color literals; later themes can override the same properties without a provider, picker or preferences schema now.

| Token | Proposed value | Use |
| --- | --- | --- |
| --surface-app | #101219 | Main canvas |
| --surface-sidebar | #151823 | Project navigation |
| --surface-panel | #1C2030 | Actions, Resume, checkpoint panels |
| --surface-input | #151924 | Editable fields |
| --surface-hover | #252A3C | Hovered interactive surfaces |
| --surface-selected | #302A4F | Selected project row |
| --on-selection | #ECE8FF | Selected project text |
| --border-subtle | #363E56 | Decorative panel dividers |
| --border-control | #66728C | Identifiable input boundaries |
| --text-primary | #EDF0FA | Main content |
| --text-secondary | #A8B1C7 | Supporting text, timestamps and hints |
| --accent | #A99AFF | Selection and restrained emphasis |
| --action-primary | #6C58D7 | Main action fill |
| --on-action | #FFFFFF | Main action text |
| --focus-ring | #C5B8FF | Visible keyboard focus |
| --status-success | #69D5A3 | Existing completed/success states |
| --status-warning | #F2C66D | Saved-but-refresh-failed warning |
| --status-error | #FF9B9B | Failed write/load feedback |

Supporting geometry tokens: spacing 4/8/12/16/20/24/32px; control radius 8px, panel radius 12px; controls at least 40px high (44px effective targets for coarse pointers); 2px focus ring with 2px offset. Panel padding 20–24px, workspace gaps 24px. Solid surfaces and one quiet panel border; no ornamental shadow stacks.

Use locally available Segoe UI Variable / Segoe UI / system sans-serif. Body 14–15px, form labels 13–14px, supporting metadata at least 12px, section titles 18px, project title 28–30px. Weights 400/500/600. Prefer readable regular text over widespread uppercase micro-labels. Long names and checkpoint text wrap. No downloaded fonts or icon dependency; keep iconography minimal and labels visible.

Computed color-pair checks for this proposal: primary text/panel 14.20:1; secondary text/panel 7.53:1; accent/panel 6.74:1; white/primary action 5.23:1; control outline/input 3.64:1. These are arithmetic checks of candidate tokens, not verification of a rendered accessible UI; final hover, disabled, error and selected combinations still need inspection.

## Layout and component boundaries

Wide client widths, approximately 1120px and above: 224px sidebar; remaining workspace contains a header, a working column (minimum about 440px) and a 300px Resume rail with 24px gaps/padding. Actions, checkpoint form and history stay in the working column. Leave unneeded space quiet rather than filling it with invented metrics.

Compact desktop widths: sidebar about 208px; Resume becomes the first workspace panel below the project header, then Actions, checkpoint form and history stack. Render **one** ResumePanel, repositioned by layout rules, not separate desktop/mobile copies. Retain logical keyboard order, one primary workspace scroll flow, no sticky/fixed Resume overlay or competing panel scrollbars. Preserve current supported window minimum; verify 800, 1160 and 1440px outer window sizes rather than relying on one screenshot.

Reusable pieces:

- **ProjectSidebar:** presentation of actual project rows and creation/error/retry controls; callbacks and state still come from the existing owner.
- **WorkspaceHeader:** actual project name and contextual copy; no new project status/description fields.
- **Panel/section heading:** small presentational primitive only where repeated structure benefits. Preserve heading IDs and accessible region names.
- **ResumePanel:** reuse its existing data/behavior contract; update appearance and layout placement.
- **Button, field, action-row and checkpoint-card styles:** shared semantic CSS on native elements. Extract additional React components only when they remove meaningful repeated structure; no generic form system or design-system package.

App retains form draft ownership and event wiring. useProjectWorkspace, the selector, shared data contracts, IPC, domain behavior and SQLite remain intact. Candidate application edits are renderer styles/tokens, App markup, ResumePanel presentation and small presentational components. If needed to prevent a bright startup flash, include only the cosmetic BrowserWindow backgroundColor adjustment; no custom titlebar/window-control IPC.

## Reference elements without supporting functionality

| Reference element | Missing support / decision | Treatment for this slice |
| --- | --- | --- |
| Home, Ideas, Workflows, Engineering, Notes navigation | Corresponding screens and domain slices largely missing | Hide unsupported destinations; retain real Projects selection |
| Timeline/Stages and dated Gantt bars | Stage assignment, progress policy and scheduling data absent | No timeline, dates, durations or fake tabs; stage policy remains user-owned |
| Project progress percentage/focus progress bar | No approved stage-progress calculation | Omit; keep only existing real action count and row completion states |
| In Development badge/project description/favorites | No project lifecycle/description/favorite fields or commands | Omit from header |
| Decisions/tests/verification counts | No user-project engineering records | Omit; this app's automated test count is not project engineering data |
| Global search, notifications, settings/collapse controls | No corresponding behavior/persistence yet | Omit; no inactive toolbar icons |
| New Decision, Add Test quick actions | Commands, forms and records missing | Omit; existing add/save controls remain available |
| Edit checkpoint, context menus, Activity/Notes tabs | Checkpoints append-only; no edit/feed/reference system | Keep all saved checkpoint history and no fake menus/tabs |
| Last session/automatically selected next action | No session tracking or action-linked Resume policy | Use actual latest checkpoint time and saved nextSteps only |
| Release badges/readiness indicators | Future milestone E not implemented | Omit; completion never implies a verified release |

These stay in the existing A–E roadmap. This slice introduces neither their schemas nor placeholder implementations.

## Approved implementation and verification plan

1. Recheck the existing 23-test baseline before application edits. Add semantic dark tokens and shared native-control styles; retain existing interaction names and validation feedback.
2. Apply shell/sidebar/header layout, then Resume/Actions/checkpoint/history presentation on this one screen. Extract only the presentational pieces above. Keep existing data/state ownership and selectors; preserve all actions during empty, loading, saving, failed-write and stale-refresh states.
3. Add only short 120–160ms color/border/background feedback for existing hover/focus states; honor prefers-reduced-motion. No animation framework, entrance choreography, parallax, pulsing status or theme/customization system.
4. Run build/typechecks, all 17 Node and five Electron checks, rebuild the executable, and run packaged recovery. Existing assertions about persistence, exact Resume timestamps, focus controls, real failed writes, read-only retry and late responses must remain. DOM selectors may change only when structure requires it; do not weaken behavior assertions.
5. Add focused checks/inspection for keyboard navigation/focus visibility, long saved names/text, dark empty/error/stale states, reduced motion and 800/1160/1440px layouts without horizontal overflow. Do not add tests that merely assert CSS literal values.
6. Record actual outcomes and screenshots, update the existing checklist/roadmap/verification/log, then stop for user review. Do not continue to stage progress or another milestone automatically.

Proposed acceptance: every current create/open/add/complete/save/retry/Resume interaction works; real saved data and timestamps survive navigation/restart; no unsupported or fabricated controls/metrics appear; wide and compact layouts are readable and keyboard usable; error/warning/selection meaning uses labels as well as color; no schema/dependency/state-owner rewrite; stage-progress logic remains unimplemented; automated results and the user's manual visual acceptance are recorded separately.

## Acceptance gate

The user explicitly approved the palette, responsive layout, typography and incremental scope. Implementation now uses the token file, ProjectSidebar/WorkspaceHeader/Panel presentation components, App/Resume integration and a cosmetic native window background change. The 23-test baseline passed before edits; the expanded suite passes 25/25, including keyboard, actual contrast, reduced motion, maximum-length content and three window sizes. See verification.md for commands, screenshots and the unchanged-file check.

Stop for user manual visual/interaction acceptance. Existing Resume manual acceptance and personal understanding checks also remain open. Do not start stages, progress calculations or another feature automatically.
