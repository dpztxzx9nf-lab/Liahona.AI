# Liahona Project Audit

Audit date: 2026-06-24

Audit branch: `codex/liahona-project-audit`

Committed baseline: `master` / `origin/master` at `98c53f9`

Scope: general project audit, documentation report only. This audit was produced from read-only inspection and the chat audit. It did not rebuild, refactor, archive, delete, stage, commit, deploy, change runtime code, inspect secret values, or change PM2/deployment behavior.

## Baseline And Working Tree

The committed baseline for this audit is `98c53f9`, shared by `HEAD`, `master`, and `origin/master` at audit time.

The current branch had five uncommitted working-tree paths. These are not part of the committed baseline and should be treated as a working-tree overlay:

- `ARCHITECTURE.md` - uncommitted documentation wording.
- `README.md` - uncommitted documentation wording.
- `src/runtime/publicContinuity.js` - uncommitted public continuity copy wording inside a runtime-served page.
- `.codex/environments/environment.toml` - untracked Codex environment/action config.
- `Liahona Hub.md` - untracked local hub note.

The tracked uncommitted diff at audit time was:

- `ARCHITECTURE.md`: 4 insertions.
- `README.md`: 4 changed lines, 3 insertions and 1 deletion.
- `src/runtime/publicContinuity.js`: 10 changed lines, 5 insertions and 5 deletions.

## Executive Summary

Liahona is a coherent small Node.js Discord/OpenAI runtime with a much larger governance, continuity, source, and planning shell around it. The runtime itself is understandable and relatively narrow: Express keepalive routes, a Discord message pipeline, OpenAI response generation with local fallbacks, simple policy gates, local diagnostics, and lightweight continuity/canonical helpers.

The main drift is not chaotic implementation. The drift is between vocabulary, docs, and actual behavior. Some docs still say there is no retrieval or durable recall, while the runtime now has lightweight JSONL continuity recall and hardcoded canonical reference retrieval. These are real capabilities, but they are not semantic memory, embeddings, database-backed persistence, broad source ingestion, or live web access.

The highest priority cleanup should be documentation clarification and privacy hardening around logs. Runtime behavior should not be expanded until the current source, memory, continuity, and projection vocabulary is made precise.

## Current Architecture Map

Main entrypoint: `index.js`.

Runtime startup flow:

```text
index.js
-> load environment with dotenv
-> validate environment
-> start Express
-> register /, /continuity, and /dev routes
-> create canonical, continuity, interpretive, and projection ports
-> create Discord client
-> handle Discord messageCreate events
```

Message handling flow:

```text
Discord message
-> validate message
-> dedupe per message id
-> ignore bot/self messages
-> classify message
-> interpret intent and response style
-> optionally store journal/system update without replying
-> apply channel silence
-> apply forum/thread throttle
-> detect canonical context
-> retrieve continuity context when available
-> synthesize recurring themes when useful
-> retrieve hardcoded canonical references for direct canonical mode
-> build prompt
-> call OpenAI Responses API or local fallback
-> clean reply text
-> coherence check
-> deliver Discord projection
-> log diagnostics
```

DM behavior differs from server behavior:

- DMs bypass regular guild channel silence.
- Regular guild channels generally require direct invocation, mention, or reply to the bot.
- High-risk messages bypass channel silence.
- Threads and forum posts use throttle behavior unless Liahona is directly mentioned.

Fallback behavior:

- Missing `OPENAI_API_KEY` uses local fallback replies.
- Retrieval intent fallback says Liahona does not hold that continuity.
- Live/current-events fallback says Liahona cannot see live news and points to Reuters or AP.
- High-risk fallback gives safety-first crisis guidance.
- Empty casual/social fallback can produce no reply.
- Discord missing-permission errors can fall back from `message.reply` to `channel.send`.

## File / Folder Inventory

### Runtime And Entrypoints

- `index.js`: active process entrypoint. Starts Express, registers runtime routes, creates ports, configures Discord, and logs startup.
- `package.json`: scripts for start/dev/PM2/test/data reset plus dependencies.
- `package-lock.json`: dependency lockfile.
- `ecosystem.config.cjs`: PM2 ecosystem config for process `liahona`.

### Runtime Code

- `src/runtime/pipeline/`: main message orchestration and invocation state.
- `src/runtime/policy/`: channel silence, forum/thread throttling, message-level dedupe.
- `src/runtime/diagnostics/`: environment validation, runtime health, message diagnostics, JSONL logging.
- `src/runtime/devPortal.js`: local/private `/dev` route reading logs and docs.
- `src/runtime/publicContinuity.js`: public `/continuity` page served by Express.

### Discord Bot And Projection

- `src/projection/discord/`: Discord delivery style, delivery fallback, duplicate-delivery guard.
- `src/projection/types.js`: projection object helpers for plain, sourced, continuity, and artifact projections.
- `src/projection/artifact/`: scaffolded artifact fragment factories.
- `src/delivery/sendMessage.js`: compatibility wrapper around Discord projection delivery.

### Interpretation And Execution

- `src/interpretive/`: message classification, intent interpretation, identity/voice boundaries, channel behavior planning notes.
- `src/execution/`: OpenAI Responses API call, prompt construction, fallback replies, response extraction, coherence check, reply cleanup.

### Continuity And Canonical Grounding

- `src/continuity/runtimeStore.js`: local JSONL continuity store and keyword recall.
- `src/continuity/themeSynthesis.js`: recurring theme synthesis over recalled entries.
- `src/continuity/scopes/manifest.js`: planned continuity scope manifest.
- `src/canonical/grounding.js`: canonical trigger detection and mode selection.
- `src/canonical/sourceRetrieval.js`: hardcoded canonical reference selector.
- `src/canonical/corpora/manifest.js`: canonical corpus/source manifest.

### Source Manifests

- `src/sources/`: source registry scaffolding for canonical, philosophical, live, continuity, and runtime layers.
- `src/sources/canonical/manifest.js`: manifest-backed canonical source records.
- `src/sources/philosophical/manifest.js`: not-implemented philosophical source records.
- `src/sources/live/manifest.js`: not-implemented live source records.
- `src/sources/continuity/manifest.js`: empty continuity source registry.
- `src/sources/runtime/manifest.js`: empty runtime source registry.

### Governance And Documentation

- `core/`: active governance and ontology. Covers foundation, architecture, continuity, runtime, tooling, and sources.
- `docs/`: supporting implementation, operations, observability, data, projection, dev portal, and security docs.
- `continuity/`: curated semantic project checkpoints.
- `dev-portal/`: mostly placeholder operational note categories.
- `legacy-archive/`: historical reference, not active governance.
- `.cursor/rules/`: active Cursor guidance derived from governance distinctions.
- `AGENTS.md`: agent/runtime constraints for this workspace.

### Public / Prototype Surfaces

- `index.html` and `style.css`: static Liahona.AI public artifact-style page in this repo.
- `prototypes/liahona-compass/`: non-production React compass prototype and notes.

### Runtime State And Local Artifacts

- `data/`: ignored runtime state. Do not delete casually.
- `logs/`: ignored runtime logs. Do not expose or commit.
- `.env`: ignored local secrets file. It was not read.
- `node_modules/`: ignored dependencies.
- `.obsidian/`, `.verb.md`, `*.canvas`: ignored local workspace/editor artifacts.

## What Is Working

- The runtime has clear startup and orchestration through `index.js`.
- Discord message handling is centralized in `src/runtime/pipeline/handleMessage.js`.
- Intent classification and response style routing are implemented.
- Regular guild channels, DMs, threads, and forum posts have distinct response policies.
- OpenAI generation and local fallback behavior are explicit.
- Discord delivery handles missing-permission fallback.
- Duplicate message and duplicate delivery guards exist.
- Runtime diagnostics are structured and written to local JSONL.
- Continuity is implemented as simple local JSONL storage and keyword recall.
- Recurring theme synthesis exists over recalled entries.
- Canonical grounding detection exists.
- Direct canonical mode can retrieve a small hardcoded set of canonical references.
- `/dev` exists as a local/private operational projection.
- `/continuity` exists as a public continuity projection.
- Tests cover interpretation, continuity, theme synthesis, canonical grounding, canonical source selection, and Discord projection fallback.

Checks run during audit:

```text
npm run test:interpret
npm run test:continuity
npm run test:themes
npm run test:canonical
npm run test:canonical-sources
npm run test:projection
node --check for JS/CJS files
require smoke check for src JS files
```

All listed checks passed.

## What Is Unclear Or Stale

- Several docs still describe continuity recall and canonical retrieval as not implemented. That is now too broad. The accurate statement is: lightweight JSONL recall and hardcoded canonical reference retrieval are implemented, while semantic memory, embeddings, SQLite persistence, broad source ingestion, and live retrieval are not.
- `src/README.md` says `judgment/`, `conduct/`, `orientation/`, and `frontier/` are nonexistent, but committed `.gitkeep` folders exist for those paths.
- `docs/GUIDE.md` points website edits to `C:\Projects\Liahona.AI`, while this repo also has `index.html` and `style.css`.
- `docs/Eternal Sources/` is mostly URL pointers, not a local searchable corpus. One file contains copied article text, but most are short source references.
- `dev-portal/*.txt` files are category markers, not real operational continuity records yet.
- Some source/doc text displayed mojibake in PowerShell output. Encoding should be checked before ingestion or public publishing.
- `better-sqlite3` is installed but unused, which implies planned persistence more strongly than the runtime currently supports.
- The terms memory, continuity, sources, retrieval, KINDEX, orientation, and artifact are all valuable, but they need stricter current-versus-future boundaries.

## Source / Memory Reality

What Liahona can currently access:

- Static project docs: partially. `/dev` reads selected docs and runtime files for local operational display.
- Canonical source references: partially. Manifests and files exist under `docs/Eternal Sources/`, but direct runtime retrieval uses hardcoded summaries in `src/canonical/sourceRetrieval.js`.
- Project continuity docs: yes, through committed docs and `continuity/` checkpoints.
- Discord/KINDEX history: not broadly. The bot sees live Discord messages and can store selected entries into local JSONL. It does not have broad KINDEX archive access.
- Local runtime continuity: yes, through `data/continuity.jsonl` when entries are stored.
- Local files generally: no general local-file search capability in runtime.
- Vector database / embeddings: none.
- SQLite-backed persistence: none in active use, despite `better-sqlite3` dependency.
- Live web/news/current events: none. Runtime falls back to honest limitation language for live/current questions.

Current meaning of key terms:

- Memory: future scoped memory architecture, not implemented as semantic memory.
- Continuity: implemented in three limited forms: docs/checkpoints, git history, and simple local JSONL recall.
- Sources: mostly manifests and source references, plus a small hardcoded canonical selector.
- Retrieval: lightweight keyword recall and hardcoded canonical reference selection only.

## Risks

### Privacy And Logging

The largest risk is verbose diagnostics. `MODEL_TRACE` and related events can include original message content, retrieved context, final prompt, and generated response. That is useful for debugging but conflicts with the stated privacy direction to avoid full message content by default, especially for DMs or sensitive channels.

Recommended direction:

- Redact or hash message content by default.
- Keep full trace logging behind explicit local debug mode.
- Document retention and deletion policy for `logs/runtime.jsonl`.

### Dev Portal Exposure

The `/dev` portal is local-only when no `DEV_PORTAL_TOKEN` exists, or token-gated when configured. Token-in-query access is easy to use but can leak through browser history, logs, or screenshots.

Recommended direction:

- Keep `/dev` local/private.
- Avoid exposing raw log content.
- Prefer local-only default.
- Consider safer auth only if the portal must be accessed remotely.

### Missing Environment Example

There is no `.env.example`, even though required keys are documented.

Recommended direction:

- Add a safe `.env.example` with names only, no values.
- Include `DISCORD_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `PORT`, and `DEV_PORTAL_TOKEN`.

### Prototype Safety

`prototypes/liahona-compass/liahona_compass.tsx` calls an external model endpoint from client code. It is correctly marked non-production and should not be integrated without backend key handling, fallback behavior, route review, and security review.

### Authority And Overclaiming

The governance docs are careful about not claiming divine, prophetic, or authoritative status. The runtime prompt also reinforces this. The risk is future projection/source work blurring hardcoded summaries, interpretation, and canon.

Recommended direction:

- Keep canonical source references outward-facing.
- Never present Liahona summaries as scripture or doctrine.
- Distinguish canonical text, source summary, and interpretive response.

## Dead Code / Clutter Candidates

These are candidates for review, not deletion:

- Empty scaffold folders:
  - `src/conduct/`
  - `src/foundation/`
  - `src/frontier/`
  - `src/judgment/`
  - `src/orientation/`
  - local empty `src/config/`
- `src/delivery/sendMessage.js`: compatibility wrapper not used by active pipeline.
- `src/projection/artifact/`: future artifact projection scaffold not used by Discord runtime.
- `src/sources/index.js` and source registry helpers: useful scaffold, but not active runtime behavior.
- `dev-portal/*.txt`: placeholder category markers.
- `better-sqlite3`: installed but unused.
- `prototypes/liahona-compass/`: valuable directional prototype, but should stay non-production.
- `legacy-archive/`: intentionally preserved historical material. It should remain archive-only, not active governance.

## Do Not Change Yet

Do not change these until Phase 1 documentation clarification is complete and owner review confirms direction:

- `.env`
- `data/`
- `logs/`
- PM2 state
- Windows scheduled startup tasks
- `ecosystem.config.cjs`
- deployment behavior
- `legacy-archive/`
- `docs/Eternal Sources/`
- runtime message routing
- runtime logging behavior
- canonical source behavior
- continuity storage behavior
- the five pre-existing uncommitted working-tree files, unless specifically reviewed and accepted

## Cleanup Plan

### Phase 1: Documentation Clarification Only

Goal: make the repo tell the truth about what exists now.

Recommended tasks:

- Update README, STATUS, ARCHITECTURE, and src README to distinguish:
  - implemented lightweight continuity recall
  - implemented hardcoded canonical reference selection
  - planned semantic memory
  - planned embeddings
  - planned SQLite persistence
  - planned broad source ingestion
  - planned live retrieval
- Add `.env.example` with safe key names only.
- Clarify whether `index.html` / `style.css` in this repo are active public site files or historical/static projection files.
- Fix the `src/README.md` contradiction about nonexistent folders.
- Add privacy notes for verbose logs and `MODEL_TRACE`.
- Document that `dev-portal/*.txt` are placeholders until populated.

### Phase 2: Safe File Cleanup / Archive

Goal: reduce clutter without losing historical continuity.

Recommended tasks:

- Decide whether empty scaffold folders should stay as deliberate architecture markers or be removed.
- Decide whether `src/delivery/sendMessage.js` remains as compatibility API or is deprecated.
- Decide whether artifact projection factories should stay scaffolded or move to prototype/planning.
- Review `better-sqlite3` dependency after deciding whether SQLite is near-term.
- Keep legacy material preserved, but avoid treating it as active governance.

### Phase 3: Runtime / Router Fixes

Goal: make current runtime safer and easier to test before adding new systems.

Recommended tasks:

- Add tests for the full message pipeline using mocked ports.
- Add tests for DM behavior versus guild behavior.
- Add tests for store-without-reply behavior.
- Add tests for high-risk channel-silence bypass.
- Add tests for empty reply / delivery skip.
- Add tests for OpenAI failure and non-completed response fallback.
- Add configurable diagnostic redaction.
- Add log retention or rotation guidance.

### Phase 4: Source / Memory / Continuity Implementation

Goal: implement the next layer only after boundaries are clear.

Recommended tasks:

- Define memory scopes before adding more storage.
- Decide JSONL versus SQLite for continuity.
- Define reset/retention policy for DMs separately from public/server continuity.
- Replace hardcoded canonical reference retrieval with a source adapter only if citations and authority boundaries are clear.
- Keep live/current source retrieval separate from canonical grounding.
- Do not add embeddings until privacy and reset semantics are decided.

### Phase 5: Deployment / Process Hardening

Goal: make production operation boring and recoverable.

Recommended tasks:

- Verify PM2 status from the owner's normal PowerShell session.
- Verify Windows reboot persistence.
- Document exact startup/restart/save workflow.
- Add a simple health check procedure.
- Add log review and retention procedure.
- Keep deployment changes separate from docs cleanup and runtime routing changes.

## Suggested Next PRs

1. `docs: clarify implemented vs planned Liahona systems`
2. `docs: add environment example and privacy notes`
3. `test: add full message pipeline coverage`
4. `runtime: redact verbose diagnostics`
5. `cleanup: review scaffold placeholders`

## Verification Notes

Audit checks performed before creating this file:

```text
npm run test:interpret
npm run test:continuity
npm run test:themes
npm run test:canonical
npm run test:canonical-sources
npm run test:projection
node --check for JS/CJS files
require smoke check for src JS files
git status --short --branch
git diff --stat
git ls-files --others --exclude-standard
```

Commands intentionally not run:

- `npm run dev`
- `npm start`
- PM2 commands
- deployment commands
- destructive cleanup commands
- commands that read `.env` contents, runtime log contents, or runtime data contents

