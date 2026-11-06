---
ptb: 1
kind: decision
id: dec.local-storage
project: proj.projectstimeline
title: Prefer local persistence
features:
  - feat.resume-development
requirements:
  - req.preserve-intention
---

# Proposed decision

Use a local persistent store for checkpoints.

## Rationale

The developer should be able to resume projects offline.

## Alternatives

Remote-only service, plain-text-only storage, or a local database. Importing this document does not mean the decision has been formally accepted.
