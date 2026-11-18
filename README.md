# ProjectsTimeline

ProjectsTimeline aims to turn software engineering notes, including notes in Obsidian, into source-linked diagrams that help you understand a project and pick up where you left off.

Today, the local-first Windows app builds its **Engineering Map** from structured PTB Markdown and keeps a **development journal** with **saved next steps**.

**Active development · v0.1.0 · Unreleased.** Run it from source to try the current build.

## Why I’m building it

When I come back to a project or start a new session with a coding assistant, I want to know what I was working on, why a decision was made, and what I should do next. That context often lives across notes, code changes, and chat history. I’m building ProjectsTimeline so I can explore how the software fits together, see where a claim came from, and leave myself a clear place to resume.

![ProjectsTimeline Engineering Map showing a proposed Vivarium action connected to its feature, requirements, and scope, with details in the inspector.][map-image]

*Engineering Map in the packaged Windows app, using the Vivarium example project.* [Highlighted relationship source][source-image] · [Packaged screenshots and verification][desktop-evidence]

## What works today

- **Explore engineering records.** Preview a structured PTB v0.2 Markdown blueprint before writing to the database. After review, create a project and explore its components, features, requirements, decisions, and planned checks. Open a record or relationship to inspect its exact captured source. [Blueprint format][ptb]
- **Save and resume work.** Record what you accomplished and what to do next in a project checkpoint. Home shows recent activity, Resume brings back the latest saved checkpoint, and Journal preserves earlier entries.
- **Track work and releases.** Manage project actions, reuse workflow templates, check release readiness against saved stages and verification, and preserve confirmed release records.

## From a blueprint to the Map

In the Vivarium example, `check.determinism` explicitly references `req.deterministic-reproducibility`. ProjectsTimeline validates the reference and displays a **plans to verify** edge from the check to the requirement. The inspector can show the exact text behind the edge. The check still reads **Not run**. Establishing that the software meets the requirement would take a test result against a specific build. [Source record][fixture-edge]

React reads the graph through a typed Electron bridge. The main process validates the records and writes the reviewed graph and its captured source to SQLite in one transaction. React Flow renders the graph and ELK computes its layout. [Architecture decision][formation]

**Why proposals stay out of tracked work.** I approved keeping imported proposals as stable engineering records. Creating backlog entries on import would have required guards to keep proposals out of completion and release workflows. The Vivarium test saved **47 definitions and 86 relationships** with zero tracked actions or releases. Recovery tests showed that an interrupted import leaves no partial project, and retrying after a lost acknowledgement returns the existing project. [Design review][proposal-design] · [Verification][formation-evidence]

## Future plans

| Status | Direction |
| --- | --- |
| **Next · awaiting implementation approval** | **Linked checkpoints (V5a).** Save a checkpoint from an engineering record and return to that exact record revision after a restart. Keep the saved context readable in Journal if the record changes or becomes unavailable. [Design][v5a] |
| **Exploratory** | **Diagrams from ordinary Markdown and Obsidian notes.** Explore how to identify engineering records and relationships, review ambiguous links, and recognize the same record after a rewrite or reimport. [Ingestion design][ingestion] |
| **Exploratory** | **Context for coding agents.** Explore giving an assistant the saved next step and relevant source, then using Git and CI evidence to propose status updates or reports for review. |

## Run and verify

Use Windows x64, Node.js 24.15 or later in the 24.x line, and npm. Installation needs access to the package registry and Electron’s binary download.

```powershell
git clone https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline.git
cd ProjectsTimeline
npm ci
npm start
```

`npm start` builds and launches the app. Restart after source changes.

Use a [separate profile](#local-data) to try the example if you already have project data. From Home, choose **Preview blueprint** and select `tests/fixtures/vivarium/project.md`. Select **Review project formation**, then **Create knowledge project** to explore the Map. [Vivarium fixture][fixture]

```powershell
npm test               # TypeScript, build and Node tests
npm run test:e2e       # Build and run Electron tests
npm run package        # Build the Windows package under out/
npm run test:packaged  # Exercise the existing package and restart recovery
```

Tests use isolated profiles, and test screenshots go to `artifacts/`. Packaged tests use `out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe` by default. Set `PROJECTS_TIMELINE_EXECUTABLE` to test a different build.

The development workflow uses focused branches, pull requests, and code review to verify AI-assisted changes. [Engineering workflow][workflow]

- **Hosted Windows CI.** The advisory job builds and runs Node tests for PRs targeting `main`. Its pilot passed **92/92 tests** with zero skips. [CI run][ci]
- **Desktop verification.** The stabilization report records **28 passing Electron tests** and **five passing packaged recovery cases**. Native-picker and screen-reader checks remain open. [Desktop verification][desktop-evidence]

## Local data

Development and packaged builds share the local, unencrypted SQLite database at `%APPDATA%/ProjectsTimeline/data/workspace.sqlite` by default. A save is acknowledged after SQLite commits. If the following refresh fails, retrying reloads the saved data. Unsaved drafts are lost when the app closes.

For a separate profile, use an absolute data directory. Run this from the repository root after the first build.

```powershell
.\node_modules\.bin\electron.cmd . --data-dir=C:\Temp\ProjectsTimeline-sandbox
```

Keep troubleshooting profiles separate from your regular data and preserve a copy of the database before manual recovery.

## Engineering records

[Product roadmap][roadmap] · [Product alignment][alignment] · [Deferred ideas][backlog] · [Architecture decisions][decisions]

[Verification history][verification] · [Engineering checklist][checklist] · [Agent instructions][agents]

[map-image]: docs/v3a1a/stabilization/vivarium-neighborhood-1540.png
[desktop-evidence]: docs/v3a1a-stabilization-verification.md
[ptb]: docs/design/ptb-v0.2-contract.md
[fixture-edge]: https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/blob/1e18dd7a89669a7e0a5ace5e14b43bd3a8b382b6/tests/fixtures/vivarium/project.md#L294
[formation]: docs/adr/0008-durable-knowledge-formation.md
[v5a]: docs/design/v5a-linked-development-continuity.md
[ingestion]: docs/design/multi-format-ingestion-design.md
[fixture]: tests/fixtures/vivarium/project.md
[workflow]: docs/engineering-workflow.md
[ci]: https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/actions/runs/42566363806
[roadmap]: docs/design/product-implementation-roadmap.md#smaller-complete-vertical-slices
[verification]: docs/verification.md
[checklist]: docs/engineering-checklist.md
[agents]: AGENTS.md
[proposal-design]: https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/blob/1b3be9255f8f344fbd8897389b732462212e7004/docs/design/v3a1a-final-design-review.md#1-keep-knowledge-identity-materialize-work-on-commitment
[formation-evidence]: https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/blob/1e18dd7a89669a7e0a5ace5e14b43bd3a8b382b6/docs/v3a1a-verification-report.md#what-the-checks-established
[source-image]: docs/v3a1a/stabilization/exact-relationship-source.png
[alignment]: docs/product-architecture-alignment.md
[backlog]: docs/design/visual-engineering-backlog.md
[decisions]: docs/adr
