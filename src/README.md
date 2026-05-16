# Runtime Source Architecture

This directory contains the active Liahona.AI runtime code plus scaffolding for future source, projection, and continuity systems.

The current implementation is a lightweight Discord/OpenAI bot. It is not yet a semantic memory system, source retrieval system, database-backed runtime, or frontend artifact UI.

## Current Runtime Flow

The active message flow is:

```text
Discord message
-> runtime/pipeline/handleMessage
-> interpretive classification
-> runtime policy gates
-> OpenAI generation or local fallback
-> plain projection
-> Discord delivery
-> diagnostics and local JSONL observability
```

## Implemented

### `runtime/`

Operational runtime infrastructure.

Implemented areas:
- `pipeline/` for message orchestration
- `policy/` for channel silence, forum throttling, and duplicate-message guards
- `diagnostics/` for health checks, console diagnostics, and minimal JSONL logging

### `interpretive/`

Message interpretation and response orientation.

Implemented areas:
- intent classification
- live/current-event detection
- response style selection
- identity and voice boundaries
- planning notes for channel behavior

### `execution/`

Model execution and reply preparation.

Implemented areas:
- OpenAI Responses API calls
- local fallback replies
- response text extraction
- reply text cleanup

### `projection/`

Reply shaping and Discord delivery support.

Implemented areas:
- plain reply projection types
- Discord delivery style selection
- Discord message delivery
- duplicate-delivery guard

Artifact and sourced projection types exist, but richer projection behavior is scaffolded.

### `ports/`

Boundary adapters between runtime layers.

Implemented areas:
- interpretive port for interpretation and generation
- projection port for plain Discord delivery
- canonical and continuity ports as thin scaffolded adapters

Some ports exist to preserve future boundaries and are not fully used by the active message pipeline.

### `delivery/`

Thin compatibility wrapper around Discord projection delivery.

Primary active delivery behavior lives in `projection/discord/`.

## Scaffolded

### `canonical/`

Contains canonical corpus manifest records.

Current behavior is manifest metadata only. It does not retrieve, ingest, cite, or search canonical content.

### `sources/`

Defines source layers and source records.

Current behavior is manifest/scaffold only:
- canonical sources are manifest-backed
- philosophical and live sources are marked `not-implemented`
- continuity and runtime sources are currently empty

There is no source ingestion or retrieval pipeline yet.

### `continuity/`

Defines continuity scope metadata.

Current behavior is scope planning only. There is no durable memory, recall, embeddings, semantic indexing, or continuity retrieval.

### `projection/artifact/`

Defines artifact fragment types and factories.

These are scaffolds for future richer projections. The active Discord bot currently delivers plain text replies.

## Planned / Future

Future systems may expand into:
- semantic memory
- embeddings
- source ingestion
- canonical/philosophical/live/continuity retrieval
- durable continuity recall
- richer source cards or artifact projections
- fuller test coverage
- dev continuity portal integration

These systems should remain clearly marked as planned until implemented and verified.

## Nonexistent Folders

The following concepts have appeared in earlier planning but are not current folders in `src/`:
- `judgment/`
- `conduct/`
- `orientation/`
- `frontier/`

If those concepts are needed later, add them only with a concrete implementation reason.

## Governing Principle

Runtime code should stay understandable, modular, observable, and aligned with the governance boundaries in `core/`.

Do not blur canonical sources, interpretive behavior, runtime infrastructure, projection, or continuity.