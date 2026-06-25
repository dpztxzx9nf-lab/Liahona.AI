const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_MAX_RESULTS = 5;
const MAX_TIMEOUT_MS = 15000;
const MAX_RESULTS = 25;

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parsePositiveInteger(value, defaultValue, maxValue) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return Math.min(parsed, maxValue);
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getLiveSourceConfig(env = process.env) {
  const liveSourcesEnabled = parseBoolean(env.LIVE_SOURCES_ENABLED, false);
  const googleSearchEnabled = parseBoolean(env.GOOGLE_SEARCH_ENABLED, false);
  const xSearchEnabled = parseBoolean(env.X_SEARCH_ENABLED, false);
  const googleApiKeyPresent = hasValue(env.GOOGLE_API_KEY);
  const googleCseIdPresent = hasValue(env.GOOGLE_CSE_ID);
  const xBearerTokenPresent = hasValue(env.X_BEARER_TOKEN);
  const googleMissingCredentials = [];
  const xMissingCredentials = [];

  if (!googleApiKeyPresent) {
    googleMissingCredentials.push("GOOGLE_API_KEY");
  }

  if (!googleCseIdPresent) {
    googleMissingCredentials.push("GOOGLE_CSE_ID");
  }

  if (!xBearerTokenPresent) {
    xMissingCredentials.push("X_BEARER_TOKEN");
  }

  const googleCredentialsPresent = googleMissingCredentials.length === 0;
  const xCredentialsPresent = xMissingCredentials.length === 0;
  const googleConfigured = liveSourcesEnabled && googleSearchEnabled && googleCredentialsPresent;
  const xConfigured = liveSourcesEnabled && xSearchEnabled && xCredentialsPresent;

  return {
    liveSourcesEnabled,
    googleSearchEnabled,
    xSearchEnabled,
    googleConfigured,
    xConfigured,
    googleCredentialsPresent,
    xCredentialsPresent,
    maxResults: parsePositiveInteger(
      env.LIVE_SOURCE_MAX_RESULTS,
      DEFAULT_MAX_RESULTS,
      MAX_RESULTS
    ),
    timeoutMs: parsePositiveInteger(
      env.LIVE_SOURCE_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
      MAX_TIMEOUT_MS
    ),
    missingCredentials: {
      google: googleMissingCredentials,
      x: xMissingCredentials
    }
  };
}

function getLiveSourceConfigSummary(config = getLiveSourceConfig()) {
  return {
    liveSourcesEnabled: config.liveSourcesEnabled,
    googleSearchEnabled: config.googleSearchEnabled,
    xSearchEnabled: config.xSearchEnabled,
    googleConfigured: config.googleConfigured,
    xConfigured: config.xConfigured,
    googleCredentialsPresent: config.googleCredentialsPresent,
    xCredentialsPresent: config.xCredentialsPresent,
    maxResults: config.maxResults,
    timeoutMs: config.timeoutMs,
    missingCredentials: {
      google: [...config.missingCredentials.google],
      x: [...config.missingCredentials.x]
    }
  };
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_RESULTS,
  MAX_TIMEOUT_MS,
  MAX_RESULTS,
  getLiveSourceConfig,
  getLiveSourceConfigSummary,
  parseBoolean
};
