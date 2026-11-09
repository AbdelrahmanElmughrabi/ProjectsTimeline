# ProjectsTimeline

A Windows-first desktop workspace for remembering where software work left off, exploring engineering context and preserving verified delivery history.

## What works today

- **Home and Resume.** Open projects from Home and see actual activity and the latest saved checkpoint. Resume uses your authored next step.
- **Blueprints and knowledge.** Preview a PTB v0.2 Markdown blueprint without writing to SQLite. After reviewed formation, use Overview, the interactive Map and the inspector to explore persisted engineering records and exact captured source. Proposed actions stay in the knowledge map until a future explicit commitment feature.
- **Actions, workflows and releases.** Existing project journals and actions remain available. The Workflow Library makes independent release copies of templates. Release readiness uses persisted stages and verification. Confirmed releases remain frozen.

Schema v4 adds durable knowledge to existing projects, checkpoints, workflows and release history. The owner accepted V3a1a UX stabilization. [Current roadmap](docs/design/product-implementation-roadmap.md) · [Verification and open checks](docs/v3a1a-stabilization-verification.md) · [Proposed V5a linked continuity](docs/design/v5a-issue-draft.md).

## Run and verify

Use Windows x64, Node 24.15 or later in the 24.x line, and npm. The lockfile records exact dependency versions. Electron supplies its own runtime. The install needs access to the package registry and Electron binary download.

```powershell
npm ci
npm start
```

`npm start` builds and launches the local renderer. Restart after source changes.

```powershell
npm test               # TypeScript, build and Node suites
npm run test:e2e       # Build and real Electron tests
npm run package        # Build and package for the host under out/
npm run test:packaged  # Test the existing package and full restart recovery
```

Playwright uses Electron's bundled Chromium. The tests use isolated profiles. Screenshots go to ignored `artifacts/`. Packaged tests default to `out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe`. Set `PROJECTS_TIMELINE_EXECUTABLE` to test a different build.

## Local data

The default database is `%APPDATA%/ProjectsTimeline/data/workspace.sqlite`. Development and packaged builds share this local, unencrypted database by default. Saves go through the sandboxed preload and validated main-process commands. SQLite acknowledgement marks the write saved. If the subsequent refresh fails, retry loading performs only reads. Unsaved drafts do not survive quitting.

For an isolated troubleshooting profile, launch with an absolute data directory:

```powershell
.\node_modules\.bin\electron.cmd . --data-dir=C:\Temp\ProjectsTimeline-sandbox
```

Keep troubleshooting profiles separate from your regular data and preserve a copy of the database before any manual recovery.

## Engineering records

- [Engineering workflow](docs/engineering-workflow.md) and [agent instructions](AGENTS.md).
- [Product alignment](docs/product-architecture-alignment.md), [roadmap](docs/design/product-implementation-roadmap.md) and [deferred ideas](docs/design/visual-engineering-backlog.md).
- [Engineering checklist](docs/engineering-checklist.md), [verification history](docs/verification.md) and [architecture decisions](docs/adr).
