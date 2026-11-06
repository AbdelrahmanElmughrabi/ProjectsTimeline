# ADR 0006 — Read-only Home and project continuity

2026-11-06 · Accepted under the user's explicit V1 authorization; implemented, manual acceptance pending. [Plan](../v1-home-plan.md) · [Verification](../verification.md).

Home is the default entry point, with actual saved project names/initials, latest checkpoint text/time and latest recorded activity. It does not invent goals, project status, sessions, durations, recommendations or progress. Creation time is labeled Created; a project without checkpoint/action events remains No recorded activity, even when legacy action rows exist. Authored next steps keep their checkpoint timestamp independently of a later event.

One main-owned `getHomeSummary` query uses existing projects/checkpoints/action_events; no per-card full workspace/release loading, schema or cached persisted summary. Latest checkpoint is ordered by timestamp then ID descending, matching Resume. Latest activity uses timestamp descending, checkpoint before action event on ties, then source ID descending. Cards show recent recorded activity first, no-activity last, project creation time/ID descending as tie-breaks. A Home visit creates no history.

One fixed typed read method extends the bridge to 31 methods. Existing trusted-window/main-frame/exact-document and Result handling apply unchanged. The existing workspace hook owns guarded Home reads; acknowledged commands invalidate old summary responses. Home entry/Refresh reads saved data, and failed reads withhold old cards. Project write acknowledgement versus failed refresh remains unchanged; retry never repeats a save.

The project workspace stays mounted while hidden behind Home/Workflows. Returning to the same project refreshes its snapshot without unmounting its forms; stale Resume/release details are withheld during refresh while drafts and selected release remain. A superseded read neither replaces the selected project nor moves keyboard focus from it. Drafts remain session-only and are not recovered after process exit.

Reuse existing graphite/violet tokens and sidebar/native controls, adding only Home cards and navigation. All migrations 001–003, pure Resume/release progress, release/template mutation rules, main startup/security/protocol and dependencies are unchanged. No PTB parser, development entities, richer linked checkpoint fields or recommendation engine belongs to V1. V2 and all new migrations require separate authorization.
