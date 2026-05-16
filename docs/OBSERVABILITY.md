# Observability Design

This document defines observability guidance for the Liahona bot.

Current implementation is intentionally minimal: selected runtime lifecycle events are appended to `logs/runtime.jsonl` while existing console diagnostics remain unchanged. Test capture, summaries, rotation, and portal display are planned unless implemented later.

## Purpose

Observability should replace screenshot-based testing with structured runtime evidence.

The goal is to make bot behavior inspectable through logs:
- what started
- what message arrived
- how it was interpreted
- whether it responded
- how generation and delivery behaved
- what failed
- what should be reviewed

## Source Of Truth

Local structured JSONL logs are the intended source of truth for runtime observability.

Each log line should be one JSON object. Logs should be machine-readable first and human-summarizable later.

Screenshots may help visual review, but they should not be the primary test record.

## Suggested Log Files

Current local log path:
- `logs/runtime.jsonl`

Future logs may expand under `logs/`.

Implemented file:
- `runtime.jsonl` for selected runtime lifecycle and error events

Possible future files:
- `messages.jsonl` for fuller message lifecycle events
- `errors.jsonl` for dedicated failure summaries
- `tests.jsonl` for intentional Discord test interactions

Logs should rotate by date or runtime session once volume requires it.

## Stable Event Fields

Use stable fields so logs can feed scripts, summaries, or a future portal.

Recommended fields:
- `ts`
- `level`
- `event`
- `runtime_session_id`
- `inbound_message_id`
- `response_id`
- `projection_id`
- `guild_id`
- `channel_id`
- `channel_type`
- `intent`
- `response_style`
- `should_respond`
- `success`
- `latency_ms`
- `reason`
- `error_code`
- `error_message`

Fields may be omitted when not relevant. Do not log secrets.

## Event Names

Currently logged runtime events:
- `RUNTIME_SESSION_START`
- `DISCORD_READY`
- `MESSAGE_RECEIVED`
- `MESSAGE_IGNORED` for bot/self messages and intentional no-response outcomes
- `GENERATION_RESULT`
- `DELIVERY_RESULT`
- `RUNTIME_ERROR`

Possible future runtime events:
- `STARTUP_VALIDATION`
- `HTTP_READY`
- `MESSAGE_DEDUPED`
- `INTERPRETATION_RESULT`
- `GENERATION_STARTED`
- `PROJECTION_PREPARED`
- `DELIVERY_SKIPPED`

Recommended test events:
- `TEST_CASE_STARTED`
- `TEST_MESSAGE_OBSERVED`
- `TEST_EXPECTATION_RESULT`
- `TEST_CASE_COMPLETED`

Event names should remain stable once used by scripts or portal views.

## Discord Test Capture Model

Discord test interactions should be captured as structured events.

A test case should record:
- test name
- input message text, redacted text, or content hash
- channel type
- whether the bot was mentioned or directly invoked
- expected behavior
- actual intent
- actual response decision
- delivery style
- final reply length
- outcome: `pass`, `fail`, or `manual-review`

Test capture should prefer structured facts over screenshots.

Full conversation history should not be stored by default.

## Planned Discord Deletion Events

Discord deletion events may matter for continuity because KINDEX is the human continuity layer. Deletion logging should support continuity awareness, not surveillance.

Planned event:
- `MESSAGE_DELETED`

A deletion event should be metadata-first:
- `ts`
- `event`
- `runtime_session_id`
- `message_id`
- `guild_id`, when available
- `channel_id`, when available
- `channel_type`, when available
- `was_dm`
- `reason`, if known

Deleted message content should not be stored by default.

Privacy boundaries:
- Treat DMs as sensitive by default.
- Treat private, restricted, or sensitive channels as higher risk.
- Do not attempt to reconstruct deleted content from caches unless a separate privacy-reviewed policy exists.
- Do not use deletion logs for user memory, profiling, or behavioral scoring.

Deletion logging should answer: "something changed in the continuity record," not "what did someone try to erase."

## Dev Portal Summary Role

`dev-portal/` should hold curated operational summaries, not raw logs.

Suggested summary roles:
- `dev-portal/testing.txt` for notable test runs and outcomes
- `dev-portal/failures.txt` for recurring failures or regressions
- `dev-portal/runtime.txt` for startup and runtime health notes
- `dev-portal/deploys.txt` for deployment checkpoints
- `dev-portal/logs.txt` for log locations and summary pointers

Raw JSONL logs remain the evidence layer. `dev-portal/` remains readable operational memory.

## Future Hidden Website Portal Role

A future hidden website portal may read JSONL logs and display:
- runtime health
- recent sessions
- message lifecycle traces
- failures by type
- test run summaries
- response/no-response decisions
- latency trends
- delivery skips and dedupes

The portal should be read-only at first.

Do not add mutation, admin controls, or public access until privacy and operational boundaries are clear.

## Privacy And Safety Rules

Observability must preserve privacy and operational safety.

Rules:
- Never log tokens, API keys, environment variable values, or credentials.
- Avoid storing full message content by default.
- Treat DMs as more sensitive than public channel tests.
- Prefer redacted content, short excerpts, or hashes when possible.
- Keep raw logs separate from curated summaries.
- Make retention and deletion policy explicit before long-term storage.
- Do not expose logs through a public website.
- Do not use logs as user memory without a separate memory design.

## What Not To Build Yet

Do not build yet:
- database-backed analytics
- embeddings over logs
- semantic search over logs
- public dashboards
- automated moderation decisions
- long-term user memory
- admin controls
- screenshot pipelines
- complex frontend visualizations

Keep the first version local, structured, and inspectable.

## Recommended Next Implementation Step

The first JSONL writer exists. The next implementation should stay small:

- preserve current console diagnostics
- add Discord test markers only when there is a clear test workflow
- keep raw logs local and ignored by Git
- add no memory, retrieval, database, analytics, or portal behavior
