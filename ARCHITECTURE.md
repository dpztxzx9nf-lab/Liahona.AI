# Liahona Runtime Architecture

This document describes the current implementation reality of this repository.

For governing ontology, source principles, continuity philosophy, and system boundaries, see `core/`. For current implementation status, see `STATUS.md`.

## Current Repository Role

This repository is currently a lightweight Discord/OpenAI runtime with supporting governance, documentation, source manifests, and continuity scaffolding.

Its product role is narrower than ThinkCore and quieter than CCC: Liahona is an orientation layer and symbolic artifact surface, not the umbrella ecosystem identity or the operational command center.

It is not yet:
- a full artifact-first frontend UI
- a semantic memory system
- a SQLite-backed persistence system
- a source-ingestion or retrieval system
- a durable continuity recall system
- a productivity dashboard
- a telemetry command surface

## Five-Layer Model

The project keeps five conceptual layers. Some are implemented; others are scaffolded or planned.

| Layer | Role | Current Status |
| --- | --- | --- |
| Canonical | Outward grounding sources and source boundaries | Scaffolded through manifests and docs |
| Interpretive | Message interpretation, identity, response style, orientation | Implemented for Discord replies |
| Runtime | Process startup, orchestration, policy, diagnostics | Implemented |
| Projection | Human-facing reply shape and Discord delivery | Partly implemented; richer projections planned |
| Continuity | Meaningful preservation across time | Implemented as docs/checkpoints; runtime recall planned |

KINDEX remains the human continuity/archive context outside this runtime. Liahona is the orienting interpretive layer around that broader continuity.

## What Currently Runs

`index.js` starts the active runtime:
- loads environment variables
- validates runtime configuration
- starts an Express keepalive endpoint
- creates the Discord client
- wires runtime ports
- registers the Discord message handler
- logs startup and runtime diagnostics

The active message flow is:

```text
Discord message
-> runtime pipeline
-> interpretive classification
-> channel/forum policy
-> OpenAI generation or local fallback
-> plain projection
-> Discord delivery
-> diagnostics
```

Implemented runtime modules:
- `src/runtime/pipeline/` for message orchestration
- `src/runtime/policy/` for channel silence, forum throttle, and duplicate-message guards
- `src/runtime/diagnostics/` for runtime health and structured logs
- `src/interpretive/` for identity, channel behavior notes, and intent classification
- `src/execution/` for OpenAI generation, response extraction, and fallback handling
- `src/projection/discord/` for Discord delivery style and delivery guards
- `src/ports/` for current layer boundaries

## What Is Scaffolded

Scaffolded means the structure exists, but full behavior is not implemented.

Current scaffolding:
- `src/sources/` defines source layers and manifests.
- `src/canonical/corpora/manifest.js` lists canonical source records.
- `src/continuity/scopes/manifest.js` defines planned continuity scopes.
- `src/projection/` defines projection object types beyond plain replies.
- `src/ports/` provides boundary adapters, though some ports are thin and not fully used by the message pipeline.
- `docs/DATA.md` describes future data scopes without implementing storage.

## What Is Planned

These systems are architectural direction, not current runtime behavior:
- semantic memory
- embeddings
- SQLite-backed persistence
- source ingestion
- canonical/philosophical/live/continuity retrieval
- durable continuity recall
- richer source cards or artifact projections
- full artifact-first frontend UI
- broader automated test coverage
- mature operational records in `dev-portal/`

Planned systems should stay clearly labeled until implemented and verified.

## Repository Organization

Existing top-level areas:

```text
Liahona/
├── .cursor/rules/           # Active agent guidance
├── core/                    # Active governance and ontology
├── continuity/              # Curated semantic checkpoints
├── dev-portal/              # Early operational continuity placeholders
├── docs/                    # Supporting implementation and source docs
├── legacy-archive/          # Historical reference, not active governance
├── prototypes/              # Non-production prototypes
├── scripts/                 # Operational and test scripts
├── src/                     # Active runtime and scaffolding
├── ARCHITECTURE.md          # This implementation-reality document
├── README.md                # Repository orientation
├── STATUS.md                # Implemented/scaffolded/planned status
├── index.js                 # Runtime entrypoint
└── package.json             # Node scripts and dependencies
```

Planned or optional areas:
- `data/` may be used later for runtime data, caches, SQLite, or embeddings. It is not currently an implemented persistence layer.
- `tests/` may be added later for broader automated coverage. Current interpretation checks live in `scripts/test-interpretMessage.js`.

## Governance and Runtime Separation

`core/` defines active governance:
- identity boundaries
- canonical vs interpretive distinctions
- source hierarchy
- continuity principles
- runtime philosophy
- tooling principles

`src/` contains runtime implementation. Runtime code should serve the governance layer, but it should not redefine governance by accident.

`.cursor/rules/` contains active agent guidance derived from the same governance distinctions.

`legacy-archive/` is preserved reference material. It can explain project history, but it is not active governance.

## Continuity Boundaries

Continuity currently exists in three forms:
- `continuity/` for curated semantic checkpoints
- `dev-portal/` for early operational notes and placeholders
- Git history for code and document evolution

Runtime continuity recall, embeddings, scoped memory, and semantic indexing are planned, not implemented.

## Runtime Principles

The runtime should remain:
- understandable
- modular
- observable
- rebuildable
- restrained
- aligned with source and governance boundaries

Avoid:
- implying planned systems already exist
- hiding operational behavior behind abstract language
- coupling current Discord delivery to future UI assumptions
- expanding memory or retrieval before data boundaries are clear
