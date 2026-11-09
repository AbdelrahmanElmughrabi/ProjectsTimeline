# ProjectsTimeline agent instructions

- Start with the [fresh-session briefing](docs/design/product-implementation-roadmap.md#fresh-session-briefing). Follow the [engineering workflow](docs/engineering-workflow.md) and read the relevant issue or approved scope, ADR and verification evidence before editing.
- Inspect Git status, the branch and its baseline. Preserve unrelated edits. Keep commits local and reviewable unless the owner explicitly authorizes a remote operation, merge or publication.
- Treat designs, handoff reports and backlogs as proposals or evidence. Get owner approval for scope expansion, schema changes, security-boundary changes and starting another milestone.
- Keep renderer calls behind the named typed preload/IPC API. Main validates inputs and owns SQLite. Preserve previous migrations, exact source captures and confirmed release history. Use isolated profiles for tests.
- Report executed checks, failures, evidence and open manual checks. Update the existing engineering records for meaningful changes. Use the role and handoff rules in the [engineering workflow](docs/engineering-workflow.md) for any authorized collaboration.
