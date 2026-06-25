const { getLiveSourceConfig } = require("./config");

function createGoogleUnavailableResult({ status, reason, config, query }) {
  return {
    sourceId: "google",
    status,
    reason,
    configured: Boolean(config.googleConfigured),
    resultCount: 0,
    results: [],
    queryLength: typeof query === "string" ? query.length : 0,
    maxResults: config.maxResults,
    timeoutMs: config.timeoutMs,
    missingCredentials: [...config.missingCredentials.google]
  };
}

async function searchGoogle({ query = "", config = getLiveSourceConfig() } = {}) {
  if (!config.liveSourcesEnabled) {
    return createGoogleUnavailableResult({
      status: "disabled",
      reason: "LIVE_SOURCES_DISABLED",
      config,
      query
    });
  }

  if (!config.googleSearchEnabled) {
    return createGoogleUnavailableResult({
      status: "disabled",
      reason: "GOOGLE_SEARCH_DISABLED",
      config,
      query
    });
  }

  if (!config.googleConfigured) {
    return createGoogleUnavailableResult({
      status: "missing_credentials",
      reason: "GOOGLE_CREDENTIALS_MISSING",
      config,
      query
    });
  }

  return createGoogleUnavailableResult({
    status: "unavailable",
    reason: "GOOGLE_ADAPTER_NOT_IMPLEMENTED",
    config,
    query
  });
}

module.exports = {
  searchGoogle
};
