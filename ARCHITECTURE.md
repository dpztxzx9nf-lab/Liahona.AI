# Liahona Runtime Architecture

Factual description of the codebase after Phase 1 (folder split) and Phase 2 (pipeline + ports). For philosophical and governance context, see `foundation/`.

## Layer model

The project distinguishes five conceptual layers (`foundation/ontology.md`). The running Discord bot implements a subset of them today:

| Layer | Role | In code today |
| --- | --- | --- |
| **Canonical** | Outward authoritative grounding (scripture, Church sources) | Port stub only; source text in `docs/Eternal Sources/` is not wired to runtime |
| **Interpretive** | Intent, voice, response style, generation | `src/interpretive/`, `src/execution/`, `InterpretivePort` |
| **Runtime** | Orchestration, adapters, policy, process lifecycle | `index.js`, `src/runtime/` |
| **Projection** | How replies surface to the user | `src/delivery/`, `ProjectionPort` |
| **Continuity** | Scoped memory and semantic preservation | Port stub only; `better-sqlite3` is a dependency but unused |

**KINDEX** (human continuity archive) is described in foundation docs and is not implemented in this repository.

## Repository layout

```text
Liahona/
├── index.js                 # Bootstrap: env, Express keepalive, Discord client, ports
├── foundation/              # Human-readable governance (not imported by runtime)
├── docs/                    # Operator guide, data planning, Eternal Sources (static)
├── scripts/                 # resetData.js (data tooling placeholder)
└── src/
    ├── interpretive/        # Meaning and classification
    ├── runtime/             # Orchestration and runtime policy
    ├── execution/           # OpenAI reply generation
    ├── delivery/            # Discord send/reply behavior
    └── ports/               # Layer boundaries (default implementations + stubs)
```

Placeholder directories under `src/` (e.g. `frontier/`, `sources/`, empty `.gitkeep` folders) are reserved for future work and are not on the active path.

## Stability Levels

### Stable Backbone

These folders express the core ontology and should not be renamed casually:

- `src/canonical`
- `src/interpretive`
- `src/runtime`
- `src/projection`
- `src/continuity`

### Active Supporting Systems

These folders are part of the current runtime path or near-runtime architecture:

- `src/judgment`
- `src/conduct`
- `src/delivery`
- `src/execution`
- `src/sources`

### Reserved / Experimental

These folders may support future direction but should not drive architecture yet:

- `src/frontier`
- `src/orientation`
- placeholder `.gitkeep` folders

### Rule

Clarify folder meaning before moving, merging, or deleting anything.

## Folder responsibilities

### `index.js`

- Loads environment (`dotenv`)
- Starts Express keepalive on `PORT` (default 3000)
- Creates Discord client and default ports
- Delegates each `messageCreate` event to `handleMessage()`

### `src/runtime/`

| Path | Responsibility |
| --- | --- |
| `pipeline/handleMessage.js` | Message orchestration: diagnostics, interpret, throttle, generate, deliver |
| `policy/forumThrottle.js` | Forum/thread response interval; uses `channelBehavior` config |

### `src/interpretive/`

| Path | Responsibility |
| --- | --- |
| `interpretMessage.js` | Rule-based intent classification and `shouldRespond` / `needsRetrieval` flags |
| `identity.js` | Name, voice, and boundary strings for system prompts |
| `channelBehavior.js` | Planning notes and `forumResponseIntervalMessages` (used by throttle) |

### `src/execution/`

| Path | Responsibility |
| --- | --- |
| `generateReply.js` | OpenAI `responses.create` call, system prompt assembly, fallbacks when API key is missing |

### `src/delivery/`

| Path | Responsibility |
| --- | --- |
| `sendMessage.js` | Chooses reply vs channel send; truncates to 2000 characters |

### `src/ports/`

Thin facades used by the pipeline. Default factories are called from `index.js`.

### `foundation/`

Ontology, governance, canonical-source philosophy, continuity principles. Not required by Node at runtime.

## Message flow

```text
Discord messageCreate
  → index.js (bootstrap)
  → handleMessage(message, { clientUserId, ports })
       → log MESSAGE_RECEIVED
       → skip if author is bot
       → ports.interpretive.interpret(message)
       → applyForumThrottle(message, interpretation, clientUserId)   [runtime policy]
       → ports.projection.chooseDeliveryStyle(message)
       → log INTERPRETATION_RESULT
       → if !shouldRespond: return
       → ports.interpretive.generate({ content, interpretation })
       → log GENERATION_RESULT (or error → fixed fallback string)
       → ports.projection.deliver(message, reply)
       → log DELIVERY_RESULT
```

Generation uses `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-4.1-mini`). Without an API key, `generateReply` returns deterministic fallbacks (safety, retrieval stub, `!ping`, generic acknowledgment).

## Ports

Created once at startup in `index.js` and passed into `handleMessage`.

| Port | Factory | Methods | Status |
| --- | --- | --- | --- |
| **InterpretivePort** | `createInterpretivePort()` | `interpret(message)`, `generate({ content, interpretation })` | Active; delegates to `interpretMessage` and `generateReply` |
| **ProjectionPort** | `createProjectionPort()` | `chooseDeliveryStyle(message)`, `deliver(message, reply)` | Active; delegates to `sendMessage` |
| **CanonicalPort** | `createCanonicalPort()` | `retrieve()` → `null` | Stub; not called by pipeline |
| **ContinuityPort** | `createContinuityPort()` | `recall()` → `null` | Stub; not called by pipeline |

Forum throttling remains in the runtime layer (`applyForumThrottle`), not behind a port.

## Intentionally not implemented

- Canonical retrieval, citation, or ingestion from `docs/Eternal Sources/`
- Continuity / memory (SQLite, embeddings, scoped recall)
- Wiring `canonical` or `continuity` ports into `handleMessage`
- Channel-specific behavior beyond forum throttle (`channelBehavior` future notes)
- KINDEX integration
- Artifact / web UI projection (Discord-only delivery today)
- PM2, database schemas, and behaviors described only in `docs/DATA.md` and `docs/GUIDE.md`

`interpretMessage` sets `needsRetrieval` for retrieval intent; `generateReply` still answers with a static fallback string, not port-backed recall.

## Next safe phases

Suggested order; each phase should keep behavior explicit and testable (`npm run dev`).

1. **Phase 3 — Canonical module**  
   Manifest for Eternal Sources, read-only corpora, implement `CanonicalPort.retrieve`, call from pipeline only when grounding is required; surface citations via projection.

2. **Phase 4 — Continuity module**  
   SQLite scopes per `docs/DATA.md`, implement `ContinuityPort.recall`, connect `needsRetrieval` to real scoped recall; keep DM vs community separation.

3. **Phase 5 — Projection**  
   Richer delivery (source cards, thread synthesis); optional split of `src/delivery/` under `src/projection/`.

4. **Runtime hardening**  
   Optional `src/runtime/bootstrap.js`, Discord adapter split, injectable `logDiagnostic` for tests—without changing reply behavior.

## Related docs

| Document | Purpose |
| --- | --- |
| `foundation/ontology.md` | Full five-layer ontology |
| `foundation/architecture.md` | Product/stack philosophy (KINDEX, retrieval principles) |
| `docs/GUIDE.md` | Operator workflow, PM2, diagnostics log events |
| `docs/DATA.md` | Planned memory scopes (not implemented) |
