# Live Source Access Plan

This document is planning only. It does not implement live API calls, add
credentials, change Discord behavior, or enable source retrieval.

## Purpose

Liahona should eventually answer current-information questions through a safe,
read-only live-source layer instead of defaulting to the Reuters/AP fallback.

Planned source roles:

- Google: broad web and news discovery.
- X: recent public conversation and real-time signal.
- Liahona: cautious synthesis and orientation, not an authoritative breaking
  news bot.

## Non-Goals

- Do not scrape websites, Google result pages, or X pages.
- Do not add live web, Google, or X access in this planning PR.
- Do not store API keys or tokens in the repo.
- Do not treat Google or X as canonical truth.
- Do not make canonical, gospel, scripture, project, KINDEX, journal,
  architecture, runtime, or continuity questions behave like breaking news.
- Do not add persistent source ingestion, embeddings, or memory.

## Official Source Paths

Planned integrations should use official APIs only.

Google:

- Planned path: Google Programmable Search / Custom Search JSON API.
- Endpoint family: `https://customsearch.googleapis.com/customsearch/v1`.
- Required inputs: API key and Programmable Search Engine ID.
- Note: as of June 25, 2026, Google's Custom Search JSON API documentation says
  the product is closed to new customers and existing customers must transition
  by January 1, 2027. Implementation should confirm account eligibility or pick
  Google's supported successor before build-out.
- Docs:
  - https://developers.google.com/custom-search/v1/overview
  - https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list

X:

- Planned path: X API v2 Recent Search.
- Endpoint: `GET https://api.x.com/2/tweets/search/recent`.
- Required input: bearer token.
- Scope: matching public posts from the recent-search window, currently
  documented as the last seven days.
- Docs:
  - https://docs.x.com/x-api/posts/search-recent-posts

## Architecture

Add a live-source layer behind the existing interpretation and reply pipeline.
The layer should be disabled by default and should only run when routing says a
message is a public current-information question.

Planned boundary:

```js
searchLiveSource({
  query,
  maxResults,
  timeoutMs,
  trace
});
```

Planned normalized result shape:

```js
{
  sourceId: "google" | "x",
  status: "ok" | "disabled" | "missing_credentials" | "timeout" | "error",
  fetchedAt: "ISO-8601 timestamp",
  query: "normalized query or redacted query label",
  results: [
    {
      title: "result title or post label",
      url: "public source URL",
      sourceName: "publisher, domain, or X account",
      publishedAt: "source timestamp when available",
      fetchedAt: "retrieval timestamp",
      snippet: "short excerpt or summary",
      type: "web_result" | "x_post",
      confidenceNotes: ["optional short caveat"]
    }
  ],
  warnings: []
}
```

Adapters should return bounded results and metadata. They should not return raw
API payloads to the generation path or diagnostics path.

## Source Adapters

### Google Adapter

The Google adapter should:

- Use the official Programmable Search / Custom Search JSON API if available.
- Make read-only `GET` requests.
- Require `GOOGLE_API_KEY` and `GOOGLE_CSE_ID`.
- Apply `LIVE_SOURCE_TIMEOUT_MS`.
- Cap results with `LIVE_SOURCE_MAX_RESULTS`.
- Return title, URL, source domain, timestamp when available, and a short
  snippet.
- Avoid logging raw result payloads or request URLs containing credentials.

### X Adapter

The X adapter should:

- Use X API v2 Recent Search only.
- Make read-only `GET` requests.
- Require `X_BEARER_TOKEN`.
- Treat X as public signal, not verification.
- Prefer recent results and include post timestamps when available.
- Return author/account label, public post URL when derivable, created timestamp,
  and a short text summary or excerpt.
- Avoid logging raw post text by default.

## Environment Variables

Live source access should be off unless explicitly enabled.

- `LIVE_SOURCES_ENABLED`: global live-source gate.
- `GOOGLE_SEARCH_ENABLED`: enables the Google adapter.
- `GOOGLE_API_KEY`: Google API key.
- `GOOGLE_CSE_ID`: Google Programmable Search Engine ID.
- `X_SEARCH_ENABLED`: enables the X adapter.
- `X_BEARER_TOKEN`: X API bearer token.
- `LIVE_SOURCE_TIMEOUT_MS`: request timeout, with a conservative default.
- `LIVE_SOURCE_MAX_RESULTS`: max returned results, capped by adapter.

Credential checks should happen at startup or before first use. Missing
credentials should produce a structured disabled/missing-credentials state, not a
runtime crash.

## Routing Behavior

Current-events questions should route to live source retrieval only when:

- `LIVE_SOURCES_ENABLED` is true.
- The selected adapter is enabled.
- Required credentials for that adapter are present.
- The query is classified as public current information.
- The query is not an internal, project, canonical, gospel, scripture, KINDEX,
  journal, architecture, runtime, source, or continuity question.

Examples that may use live sources when configured:

- "What's happening in the news today?"
- "What's new with Trump?"
- "What's new in Ukraine?"

Examples that should not use live sources by default:

- "What's new with your code?"
- "What's new with KINDEX?"
- "What's new with #journal in KINDEX?"
- "What's new with the gospel?"
- "What do you remember about me?"

## Fallback Behavior

If live sources are disabled or unconfigured, use a direct capability boundary:

> I don't have live source access enabled in this Discord context.

When helpful, Liahona may add that it can still explain known structure,
orientation, or non-current context.

Do not use Reuters/AP as the universal fallback. Reuters/AP may be named only if
they are explicitly implemented as configured source adapters or if the user asks
where to check current news.

Failure modes should be specific:

- Disabled: live source access is not enabled.
- Missing credentials: the adapter is enabled but not configured.
- Timeout: the source did not respond within the configured timeout.
- Rate limited: the source rejected the request due to quota or rate limits.
- Insufficient results: retrieval ran but did not return enough useful evidence.
- Conflicting results: retrieved sources disagree or are too weak to synthesize.

## Source Hierarchy

Google and X are live sources, not canonical truth.

- Google results should be cited or named and summarized cautiously.
- X results should be framed as public conversation or signal, not confirmation.
- Canonical and spiritual questions should continue to use canonical/source
  boundaries rather than live-news routing.
- Internal/project questions should not imply live repo, KINDEX, journal, or
  source-history access unless that access is explicitly implemented later.

## Response Behavior

Live-source answers should:

- Name or cite sources used.
- Distinguish confirmed facts from public chatter.
- Include retrieval timestamp or source timestamp when available.
- Say when results are insufficient, conflicting, or only social signal.
- Avoid claiming certainty beyond the retrieved evidence.
- Avoid acting as an authoritative breaking-news service.

## Safety And Privacy

Live-source diagnostics should follow the runtime redaction model.

- Do not log API keys, bearer tokens, authorization headers, or credentialed
  request URLs.
- Do not dump raw Google results, raw X posts, final prompts, or generated
  answers into diagnostics.
- Log bounded metadata instead: adapter name, enabled state, result count,
  timeout, status, error category, source domains, and response length.
- Keep result payloads bounded before generation.
- Use timeouts and result limits for every source request.
- Treat DM questions as sensitive even when the source query is public.
- Do not persist retrieved live results by default.

## Test Plan

Future implementation should add tests for:

- Live sources disabled.
- Missing Google credentials.
- Missing X credentials.
- Google-only configured.
- X-only configured.
- Both Google and X configured.
- Source timeout.
- Source rate-limit or quota error.
- Public-news query.
- Internal/project query.
- Gospel/scripture query.
- KINDEX and journal query.
- Diagnostics redaction for source metadata.
- No raw token, prompt, retrieved result, or generated response logging.

## Recommended Implementation Phases

1. Add environment parsing and capability reporting without network calls.
2. Add adapter interfaces and mocked adapter tests.
3. Replace universal Reuters/AP fallback text with capability-boundary fallback
   text.
4. Add Google adapter behind flags and credentials, if the selected Google API is
   available to this project.
5. Add X recent-search adapter behind flags and credentials.
6. Add synthesis behavior with citations, timestamps, and explicit uncertainty.
7. Harden rate limits, timeouts, retries, result caps, and diagnostics redaction.
8. Add operational documentation for setup, quotas, failure modes, and safe
   rollback.
