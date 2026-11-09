---
ptb: 1
kind: check
id: check.restart-recovery
project: proj.projectstimeline
title: Verify checkpoint recovery
requirements:
  - req.preserve-intention
method: manual
expected:
  - The same project displays the saved intention and next step after restart.
  - Switching to an empty project does not show the previous project's context.
---

# Planned verification

Save a checkpoint, quit the app, restart, open the project, and compare the saved values. This is a **plan**, not proof of a passing test.
