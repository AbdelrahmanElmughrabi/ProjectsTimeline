---
ptb: 1
kind: requirement
id: req.preserve-intention
project: proj.projectstimeline
title: Preserve working intention
type: functional
features:
  - feat.resume-development
acceptance:
  - A developer can save the problem being investigated and the next step.
  - The saved context is restored after closing and reopening the application.
  - A project cannot display another project's checkpoint as its latest context.
---

# Requirement rationale

A list of completed tasks cannot reconstruct why a developer stopped working. Preserve the user's stated intention as authored text.
