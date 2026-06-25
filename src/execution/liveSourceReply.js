const LIVE_SOURCE_DISABLED_TEXT = "I don't have live source access enabled in this Discord context.";
const LIVE_SOURCE_FAILED_TEXT = "Live source lookup failed from this Discord context. I can't verify current details right now.";
const LIVE_SOURCE_EMPTY_TEXT = "I checked live Google results, but I didn't find useful live results for that query.";

function cleanInline(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeLiveSourceResult(result = {}) {
  const results = Array.isArray(result.results) ? result.results : [];
  const sources = results
    .map((entry) => cleanInline(entry.source))
    .filter(Boolean);

  return {
    provider: result.provider || result.sourceId || "unknown",
    status: result.status || "unknown",
    reason: result.reason || null,
    configured: Boolean(result.configured),
    result_count: Number.isInteger(result.resultCount) ? result.resultCount : results.length,
    max_results: result.maxResults ?? null,
    timeout_ms: result.timeoutMs ?? null,
    source_count: sources.length,
    sources: sources.slice(0, 5),
    missing_credential_count: Array.isArray(result.missingCredentials)
      ? result.missingCredentials.length
      : 0,
    error_category: result.errorCategory || null
  };
}

function formatResultLine(result, index) {
  const title = cleanInline(result.title) || `Result ${index + 1}`;
  const source = cleanInline(result.source) || "Google result";
  const summary = cleanInline(result.summary || result.snippet);
  const url = cleanInline(result.url);
  const publishedAt = cleanInline(result.publishedAt);
  const parts = [`${index + 1}. ${title} (${source})`];

  if (publishedAt) {
    parts.push(`Published: ${publishedAt}`);
  }

  if (summary) {
    parts.push(summary);
  }

  if (url) {
    parts.push(url);
  }

  return parts.join(" - ");
}

function buildLiveSourceReply(result = {}) {
  if (result.status === "disabled" || result.status === "missing_credentials") {
    return LIVE_SOURCE_DISABLED_TEXT;
  }

  if (result.status === "timeout" || result.status === "error") {
    return LIVE_SOURCE_FAILED_TEXT;
  }

  const results = Array.isArray(result.results) ? result.results : [];

  if (result.status === "ok" && results.length === 0) {
    return LIVE_SOURCE_EMPTY_TEXT;
  }

  if (result.status !== "ok") {
    return LIVE_SOURCE_FAILED_TEXT;
  }

  const lines = results
    .slice(0, 3)
    .map((entry, index) => formatResultLine(entry, index));

  return [
    "Based on live Google results, here are a few current signals:",
    ...lines,
    "Treat these as search-result snippets, not independent verification."
  ].join("\n");
}

function unavailableLiveSourceResult() {
  return {
    sourceId: "google",
    provider: "google",
    status: "disabled",
    reason: "LIVE_SOURCES_DISABLED",
    configured: false,
    resultCount: 0,
    results: [],
    missingCredentials: []
  };
}

async function generateLiveSourceReply({
  content,
  interpretation,
  liveSources
}) {
  if (!interpretation?.needsLiveSource) {
    return null;
  }

  let result;

  try {
    if (typeof liveSources?.searchCurrentEvents === "function") {
      result = await liveSources.searchCurrentEvents({
        query: content,
        interpretation
      });
    } else {
      result = unavailableLiveSourceResult();
    }
  } catch (error) {
    result = {
      sourceId: "google",
      provider: "google",
      status: "error",
      reason: "LIVE_SOURCE_LOOKUP_FAILED",
      configured: false,
      resultCount: 0,
      results: [],
      missingCredentials: [],
      errorCategory: error?.name || "runtime_error"
    };
  }

  return {
    text: buildLiveSourceReply(result),
    live_source_result: summarizeLiveSourceResult(result)
  };
}

module.exports = {
  LIVE_SOURCE_DISABLED_TEXT,
  LIVE_SOURCE_FAILED_TEXT,
  LIVE_SOURCE_EMPTY_TEXT,
  buildLiveSourceReply,
  summarizeLiveSourceResult,
  generateLiveSourceReply
};
