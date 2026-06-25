const { getLiveSourceConfig } = require("./config");

const GOOGLE_SEARCH_ENDPOINT = "https://customsearch.googleapis.com/customsearch/v1";
const GOOGLE_MAX_RESULTS_PER_REQUEST = 10;

function isoTimestamp(now) {
  const value = typeof now === "function" ? now() : now;
  const date = value instanceof Date ? value : new Date(value || Date.now());

  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function googleResultLimit(config) {
  return Math.min(config.maxResults, GOOGLE_MAX_RESULTS_PER_REQUEST);
}

function createGoogleUnavailableResult({
  status,
  reason,
  config,
  query,
  fetchedAt,
  errorCategory,
  statusCode,
  missingCredentials
}) {
  return {
    sourceId: "google",
    provider: "google",
    status,
    reason,
    configured: Boolean(config.googleConfigured),
    resultCount: 0,
    results: [],
    queryLength: typeof query === "string" ? query.length : 0,
    fetchedAt,
    maxResults: googleResultLimit(config),
    timeoutMs: config.timeoutMs,
    missingCredentials: [...(missingCredentials || config.missingCredentials.google)],
    ...(errorCategory ? { errorCategory } : {}),
    ...(statusCode ? { statusCode } : {})
  };
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return null;
  }
}

function firstValue(...values) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0) || null;
}

function extractPublishedAt(item = {}) {
  const metatags = item.pagemap?.metatags;
  const firstMetatags = Array.isArray(metatags) ? metatags[0] : null;

  if (!firstMetatags || typeof firstMetatags !== "object") {
    return null;
  }

  return firstValue(
    firstMetatags["article:published_time"],
    firstMetatags["og:published_time"],
    firstMetatags.datepublished,
    firstMetatags.datePublished,
    firstMetatags.pubdate,
    firstMetatags.date
  );
}

function normalizeGoogleItem(item = {}, { query, fetchedAt }) {
  const url = firstValue(item.link, item.formattedUrl, item.htmlFormattedUrl);
  const source = firstValue(item.displayLink, hostnameFromUrl(url), "Google result");

  return {
    title: firstValue(item.title, item.htmlTitle, "Untitled result"),
    source,
    url,
    publishedAt: extractPublishedAt(item),
    summary: firstValue(item.snippet, item.htmlSnippet, ""),
    snippet: firstValue(item.snippet, item.htmlSnippet, ""),
    query,
    fetchedAt,
    provider: "google"
  };
}

function buildGoogleSearchUrl({ query, env, maxResults }) {
  const url = new URL(GOOGLE_SEARCH_ENDPOINT);

  url.searchParams.set("key", String(env.GOOGLE_API_KEY || "").trim());
  url.searchParams.set("cx", String(env.GOOGLE_CSE_ID || "").trim());
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(maxResults));

  return url;
}

function getGoogleMissingCredentials(env) {
  const missingCredentials = [];

  if (!String(env.GOOGLE_API_KEY || "").trim()) {
    missingCredentials.push("GOOGLE_API_KEY");
  }

  if (!String(env.GOOGLE_CSE_ID || "").trim()) {
    missingCredentials.push("GOOGLE_CSE_ID");
  }

  return missingCredentials;
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

async function searchGoogle({
  query = "",
  config,
  env = process.env,
  fetchFn = globalThis.fetch,
  now = () => new Date()
} = {}) {
  const liveSourceConfig = config || getLiveSourceConfig(env);
  const fetchedAt = isoTimestamp(now);
  const normalizedQuery = typeof query === "string" ? query.trim() : "";

  if (!liveSourceConfig.liveSourcesEnabled) {
    return createGoogleUnavailableResult({
      status: "disabled",
      reason: "LIVE_SOURCES_DISABLED",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt
    });
  }

  if (!liveSourceConfig.googleSearchEnabled) {
    return createGoogleUnavailableResult({
      status: "disabled",
      reason: "GOOGLE_SEARCH_DISABLED",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt
    });
  }

  if (!liveSourceConfig.googleConfigured) {
    return createGoogleUnavailableResult({
      status: "missing_credentials",
      reason: "GOOGLE_CREDENTIALS_MISSING",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt
    });
  }

  const missingCredentials = getGoogleMissingCredentials(env);

  if (missingCredentials.length) {
    return createGoogleUnavailableResult({
      status: "missing_credentials",
      reason: "GOOGLE_CREDENTIALS_MISSING",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt,
      missingCredentials
    });
  }

  if (!normalizedQuery) {
    return createGoogleUnavailableResult({
      status: "unavailable",
      reason: "GOOGLE_QUERY_MISSING",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt
    });
  }

  if (typeof fetchFn !== "function") {
    return createGoogleUnavailableResult({
      status: "error",
      reason: "GOOGLE_FETCH_UNAVAILABLE",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt,
      errorCategory: "runtime_config"
    });
  }

  const maxResults = googleResultLimit(liveSourceConfig);
  const url = buildGoogleSearchUrl({
    query: normalizedQuery,
    env,
    maxResults
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), liveSourceConfig.timeoutMs);

  try {
    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response?.ok) {
      return createGoogleUnavailableResult({
        status: "error",
        reason: "GOOGLE_API_ERROR",
        config: liveSourceConfig,
        query: normalizedQuery,
        fetchedAt,
        errorCategory: response?.status === 429 ? "rate_limited" : "api_error",
        statusCode: response?.status
      });
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const results = items
      .slice(0, maxResults)
      .map((item) => normalizeGoogleItem(item, {
        query: normalizedQuery,
        fetchedAt
      }));

    return {
      sourceId: "google",
      provider: "google",
      status: "ok",
      reason: "GOOGLE_SEARCH_OK",
      configured: true,
      query: normalizedQuery,
      fetchedAt,
      resultCount: results.length,
      results,
      maxResults,
      timeoutMs: liveSourceConfig.timeoutMs,
      missingCredentials: [],
      totalResults: firstValue(payload?.searchInformation?.totalResults, null)
    };
  } catch (error) {
    return createGoogleUnavailableResult({
      status: isAbortError(error) ? "timeout" : "error",
      reason: isAbortError(error) ? "GOOGLE_SEARCH_TIMEOUT" : "GOOGLE_SEARCH_REQUEST_FAILED",
      config: liveSourceConfig,
      query: normalizedQuery,
      fetchedAt,
      errorCategory: isAbortError(error) ? "timeout" : "network_error"
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  GOOGLE_SEARCH_ENDPOINT,
  GOOGLE_MAX_RESULTS_PER_REQUEST,
  searchGoogle
};
