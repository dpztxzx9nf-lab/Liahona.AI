const { getLiveSourceConfig } = require("./config");

function createXUnavailableResult({ status, reason, config, query }) {
  return {
    sourceId: "x",
    status,
    reason,
    configured: Boolean(config.xConfigured),
    resultCount: 0,
    results: [],
    queryLength: typeof query === "string" ? query.length : 0,
    maxResults: config.maxResults,
    timeoutMs: config.timeoutMs,
    missingCredentials: [...config.missingCredentials.x]
  };
}

async function searchX({ query = "", config = getLiveSourceConfig() } = {}) {
  if (!config.liveSourcesEnabled) {
    return createXUnavailableResult({
      status: "disabled",
      reason: "LIVE_SOURCES_DISABLED",
      config,
      query
    });
  }

  if (!config.xSearchEnabled) {
    return createXUnavailableResult({
      status: "disabled",
      reason: "X_SEARCH_DISABLED",
      config,
      query
    });
  }

  if (!config.xConfigured) {
    return createXUnavailableResult({
      status: "missing_credentials",
      reason: "X_CREDENTIALS_MISSING",
      config,
      query
    });
  }

  return createXUnavailableResult({
    status: "unavailable",
    reason: "X_ADAPTER_NOT_IMPLEMENTED",
    config,
    query
  });
}

module.exports = {
  searchX
};
