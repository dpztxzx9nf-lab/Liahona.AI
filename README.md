# Liahona.AI

This repository contains the Liahona.AI orientation layer: a quiet symbolic interface direction, source-grounded governance, curated continuity checkpoints, and a lightweight Discord/OpenAI runtime that currently delivers the experience.

Today, the active runtime is a Node.js Discord bot with an Express keepalive endpoint, OpenAI response generation, message interpretation, delivery guards, channel/forum policy, and diagnostic logging.

This repository also contains active governance documents in `core/`, supporting implementation docs in `docs/`, early continuity/source scaffolding in `src/`, and historical reference material in `legacy-archive/`.

Liahona should remain distinct from the rest of the ThinkCore ecosystem. ThinkCore is the public lab/studio identity. CCC is the command-center and telemetry layer. Liahona is the reflective artifact and orientation surface; it should not become productivity software or an operations dashboard.

## Operational Summary

| Item | Value |
| --- | --- |
| Entrypoint | `index.js` |
| Development command | `npm run dev` |
| Production command | `npm start` |
| PM2 process | `liahona` |
| PM2 ecosystem file | `ecosystem.config.cjs` |
| Default port | `3000`, unless `PORT` is set |
| Runtime logs | `logs/runtime.jsonl` |

Use `docs/OPERATIONS.md` for PM2 layout, Windows reboot persistence, verification commands, and handoff notes.

## Current Scope

Implemented today:
- Discord bot runtime
- OpenAI-backed reply generation with local fallbacks
- Intent interpretation and response style routing
- Channel silence, forum throttling, and duplicate-delivery guards
- Runtime diagnostics and PM2-oriented operation
- Governance and source-boundary documentation

Scaffolded or planned:
- Canonical/source manifests
- Continuity scopes
- Projection artifact types
- Data and memory planning
- Semantic retrieval architecture

Not implemented yet:
- Full artifact-first frontend UI
- Semantic memory system
- Embeddings
- SQLite-backed runtime storage
- Source ingestion or retrieval
- Durable continuity recall

## Orientation

Use `STATUS.md` for the current implementation status.

Use `docs/GUIDE.md` for runtime operation and PM2 workflow.

Use `core/` for active governance and ontology.

Use `continuity/` for curated semantic checkpoints.

Use `legacy-archive/` only as preserved historical reference, not active governance.
