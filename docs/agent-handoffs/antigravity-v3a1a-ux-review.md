# Antigravity handoff — V3a1a production UX review

**BEGIN independent review and optional isolated mockups when the user delivers this prompt.** The user will return your report ref for consolidation. Review the shipped experience independently before reading any Codex findings.

## Frozen inputs and ownership

- Production evidence base `51f623473cce82ada96066b6503555ab8b11e861` includes the implementation at `e4eadb9`. Open the dedicated `antigravity/v3a1a-ux-review` branch at `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v3a1a-ux-review`. Verify the base and working tree before starting. Prior V2 and V3 Antigravity branches are historical.
- Start with `docs/v3a1a/screenshots/`, `docs/v3a1a-verification-report.md` and `docs/adr/0008-durable-knowledge-formation.md` in your checkout. Compare with the original UI reference and inspect the production renderer read-only. If running the shipped root `out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe`, use a separate absolute `--data-dir` and a copy of the Vivarium fixture. Put all runtime outputs in your assigned folder or ignored artifacts in your checkout.
- Own only `docs/agent-handoffs/reports/antigravity-v3a1a-ux-review.md` and optional `docs/design/antigravity-v3a1a-ux-review/` for a small annotated screenshot or wireframe. Codex owns the consolidated report, canonical designs, source, tests, configuration, migrations and integration. Keep each change within its owner's paths.

## Review tasks

1. Walk Home → project → locate captured sources → Map → inspect and follow an authored edge → exact source → return → find work, history and Resume. Record where the shipped app routes each step. Separate defects reproduced in the executable, visual issues apparent from screenshots, and future features.
2. Test legibility of arrows and labels, spacing and overlapping edges, zoom/pan/Fit/Arrange, node movement and viewport stability, focused-neighborhood Back, inspector/source actions and keyboard focus. Compare 800, 1160 and 1540 outer window widths. Identify which single change would most improve each problem.
3. Sketch a cleaner workspace navigation and a future **Add source** review with an exact capture, ambiguous overlaps and explicit conflict choices. Include a date-free Development view. Gate Gantt on real scheduled data. Preserve actual authored relationships, work state and evidence. If helpful, supply up to two focused visuals for the highest-priority problems.
4. Return a ranked list with reproduction, observed result, expected behavior, affected widths, confidence and the smallest correction. Include commands and actual runtime evidence, or label checks that were screenshot-only. Separate immediate fixes from longer-term decisions.

This is a design assignment. Keep the shipped source, dependencies, migrations, test scripts and product profiles untouched. Future navigation may be shown in a clearly labeled wireframe. Commit only your report and optional visuals locally on your branch, then report the exact SHA and paths to the user and stop.
