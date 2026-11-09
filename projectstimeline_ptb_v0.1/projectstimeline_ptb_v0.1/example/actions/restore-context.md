---
ptb: 1
kind: action
id: act.restore-context
project: proj.projectstimeline
title: Persist and restore working context
scope: scope.context-improvement
features:
  - feat.resume-development
requirements:
  - req.preserve-intention
action_type: implementation
stage_hint: implementation
definition_of_done: Saved project-specific context is restored after a full application restart.
---

# Work description

Persist the user-authored working intention and next step. Render that record faithfully when resuming the project.
