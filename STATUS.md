# Liahona.AI Status

This file separates current implementation from scaffolding, planned systems, and archived material.

## IMPLEMENTED

- Lightweight Node.js runtime started by `index.js`.
- Express keepalive endpoint.
- Discord client and message event handling.
- OpenAI Responses API generation when `OPENAI_API_KEY` is configured.
- Local fallback replies when OpenAI is unavailable.
- Message interpretation and response style routing.
- Channel silence behavior for regular guild channels.
- Forum/thread throttling.
- In-memory duplicate-message and duplicate-delivery guards.
- Runtime diagnostics for startup, interpretation, generation, projection, and delivery.
- PM2-oriented scripts in `package.json`.
- Data reset utility scoped to `data/`.
- Interpretive test script at `scripts/test-interpretMessage.js`.
- Active governance documents in `core/`.
- Active Cursor rules in `.cursor/rules/`.

## SCAFFOLDED

- Source layer manifests in `src/sources/`.
- Canonical corpus manifest in `src/canonical/corpora/manifest.js`.
- Continuity scope manifest in `src/continuity/scopes/manifest.js`.
- Port boundaries in `src/ports/`.
- Projection object types and artifact fragment factories in `src/projection/`.
- Planning documents for data, source, runtime, and continuity systems.

Scaffolded means structure exists, but the full behavior is not implemented.

## PLANNED

- Semantic memory.
- Embeddings.
- SQLite-backed runtime storage.
- Source ingestion.
- Canonical, philosophical, live, or continuity retrieval.
- Durable continuity recall.
- Full artifact-first frontend UI.
- Source cards or richer human-facing projections.
- Expanded test coverage.
- Mature operational continuity records in `dev-portal/`.

Planned systems should not be described as current runtime behavior until implemented and verified.

## ARCHIVED / LEGACY

- `legacy archive/` contains preserved historical continuity, prior foundation drafts, exploratory notes, source stubs, and reference material.
- `legacy archive/foundation/` is superseded by `core/` for active governance.
- Legacy material may explain why the project evolved, but it does not define current runtime behavior.

## DO NOT TOUCH CASUALLY

- `index.js`
- `src/runtime/`
- `src/interpretive/`
- `src/execution/`
- `src/projection/discord/`
- `src/ports/`
- `package-lock.json`
- `.env`
- `docs/Eternal Sources/`
- `legacy archive/`
- PM2 scripts and deployment assumptions
- Runtime data under `data/`, if present

Change these only with a clear operational reason and awareness of current runtime behavior.
