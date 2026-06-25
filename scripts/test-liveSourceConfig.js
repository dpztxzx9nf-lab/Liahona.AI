const assert = require("assert");
const {
  getLiveSourceConfig,
  getLiveSourceConfigSummary,
  getLiveSourceById,
  searchGoogle,
  searchX
} = require("../src/sources/live");

const SECRET_GOOGLE_KEY = "secret-google-api-key";
const SECRET_X_TOKEN = "secret-x-bearer-token";

function assertNoSecrets(value) {
  const serialized = JSON.stringify(value);

  assert.strictEqual(serialized.includes(SECRET_GOOGLE_KEY), false);
  assert.strictEqual(serialized.includes(SECRET_X_TOKEN), false);
}

async function run() {
  const defaultConfig = getLiveSourceConfig({});

  assert.strictEqual(defaultConfig.liveSourcesEnabled, false);
  assert.strictEqual(defaultConfig.googleSearchEnabled, false);
  assert.strictEqual(defaultConfig.xSearchEnabled, false);
  assert.strictEqual(defaultConfig.googleConfigured, false);
  assert.strictEqual(defaultConfig.xConfigured, false);
  assert.strictEqual(defaultConfig.maxResults, 5);
  assert.strictEqual(defaultConfig.timeoutMs, 3000);
  assert.deepStrictEqual(defaultConfig.missingCredentials.google, [
    "GOOGLE_SEARCH_API_KEY",
    "GOOGLE_SEARCH_ENGINE_ID"
  ]);
  assert.deepStrictEqual(defaultConfig.missingCredentials.x, ["X_BEARER_TOKEN"]);

  const disabledWithCredentials = getLiveSourceConfig({
    LIVE_SOURCES_ENABLED: "false",
    GOOGLE_SEARCH_ENABLED: "true",
    GOOGLE_SEARCH_API_KEY: SECRET_GOOGLE_KEY,
    GOOGLE_SEARCH_ENGINE_ID: "google-cse-id",
    X_SEARCH_ENABLED: "true",
    X_BEARER_TOKEN: SECRET_X_TOKEN
  });

  assert.strictEqual(disabledWithCredentials.liveSourcesEnabled, false);
  assert.strictEqual(disabledWithCredentials.googleSearchEnabled, true);
  assert.strictEqual(disabledWithCredentials.xSearchEnabled, true);
  assert.strictEqual(disabledWithCredentials.googleCredentialsPresent, true);
  assert.strictEqual(disabledWithCredentials.xCredentialsPresent, true);
  assert.strictEqual(disabledWithCredentials.googleConfigured, false);
  assert.strictEqual(disabledWithCredentials.xConfigured, false);
  assertNoSecrets(disabledWithCredentials);
  assertNoSecrets(getLiveSourceConfigSummary(disabledWithCredentials));

  const disabledGoogleResult = await searchGoogle({
    query: "What's happening in the news today?",
    config: disabledWithCredentials
  });
  const disabledXResult = await searchX({
    query: "What's happening in the news today?",
    config: disabledWithCredentials
  });

  assert.strictEqual(disabledGoogleResult.status, "disabled");
  assert.strictEqual(disabledGoogleResult.reason, "LIVE_SOURCES_DISABLED");
  assert.strictEqual(disabledGoogleResult.resultCount, 0);
  assert.deepStrictEqual(disabledGoogleResult.results, []);
  assert.strictEqual(disabledXResult.status, "disabled");
  assert.strictEqual(disabledXResult.reason, "LIVE_SOURCES_DISABLED");
  assert.strictEqual(disabledXResult.resultCount, 0);
  assert.deepStrictEqual(disabledXResult.results, []);
  assertNoSecrets(disabledGoogleResult);
  assertNoSecrets(disabledXResult);

  const configuredWithExistingGoogleNames = getLiveSourceConfig({
    LIVE_SOURCES_ENABLED: "true",
    GOOGLE_SEARCH_ENABLED: "true",
    GOOGLE_SEARCH_API_KEY: SECRET_GOOGLE_KEY,
    GOOGLE_SEARCH_ENGINE_ID: "google-cse-id"
  });

  assert.strictEqual(configuredWithExistingGoogleNames.googleCredentialsPresent, true);
  assert.strictEqual(configuredWithExistingGoogleNames.googleConfigured, true);
  assert.deepStrictEqual(configuredWithExistingGoogleNames.missingCredentials.google, []);
  assertNoSecrets(configuredWithExistingGoogleNames);

  const missingGoogleCredentials = getLiveSourceConfig({
    LIVE_SOURCES_ENABLED: "true",
    GOOGLE_SEARCH_ENABLED: "true"
  });
  const missingGoogleResult = await searchGoogle({
    query: "current public event",
    config: missingGoogleCredentials
  });

  assert.strictEqual(missingGoogleCredentials.googleConfigured, false);
  assert.deepStrictEqual(missingGoogleCredentials.missingCredentials.google, [
    "GOOGLE_SEARCH_API_KEY",
    "GOOGLE_SEARCH_ENGINE_ID"
  ]);
  assert.strictEqual(missingGoogleResult.status, "missing_credentials");
  assert.strictEqual(missingGoogleResult.reason, "GOOGLE_CREDENTIALS_MISSING");
  assert.deepStrictEqual(missingGoogleResult.results, []);

  const legacyGoogleCredentials = getLiveSourceConfig({
    LIVE_SOURCES_ENABLED: "true",
    GOOGLE_SEARCH_ENABLED: "true",
    GOOGLE_API_KEY: SECRET_GOOGLE_KEY,
    GOOGLE_CSE_ID: "legacy-google-cse-id"
  });

  assert.strictEqual(legacyGoogleCredentials.googleCredentialsPresent, true);
  assert.strictEqual(legacyGoogleCredentials.googleConfigured, true);
  assert.deepStrictEqual(legacyGoogleCredentials.missingCredentials.google, []);

  const missingXCredentials = getLiveSourceConfig({
    LIVE_SOURCES_ENABLED: "true",
    X_SEARCH_ENABLED: "true"
  });
  const missingXResult = await searchX({
    query: "public conversation",
    config: missingXCredentials
  });

  assert.strictEqual(missingXCredentials.xConfigured, false);
  assert.deepStrictEqual(missingXCredentials.missingCredentials.x, ["X_BEARER_TOKEN"]);
  assert.strictEqual(missingXResult.status, "missing_credentials");
  assert.strictEqual(missingXResult.reason, "X_CREDENTIALS_MISSING");
  assert.deepStrictEqual(missingXResult.results, []);

  const boundedConfig = getLiveSourceConfig({
    LIVE_SOURCE_TIMEOUT_MS: "60000",
    LIVE_SOURCE_MAX_RESULTS: "1000"
  });

  assert.strictEqual(boundedConfig.timeoutMs, 15000);
  assert.strictEqual(boundedConfig.maxResults, 25);

  const invalidBoundsConfig = getLiveSourceConfig({
    LIVE_SOURCE_TIMEOUT_MS: "not-a-number",
    LIVE_SOURCE_MAX_RESULTS: "-1"
  });

  assert.strictEqual(invalidBoundsConfig.timeoutMs, 3000);
  assert.strictEqual(invalidBoundsConfig.maxResults, 5);

  const googleSource = getLiveSourceById("google");
  const xSource = getLiveSourceById("x");

  assert.strictEqual(googleSource.layer, "live");
  assert.strictEqual(googleSource.retrievalMode, "programmable-search-json-api");
  assert.strictEqual(xSource.layer, "live");
  assert.strictEqual(xSource.retrievalMode, "adapter-stub");

  console.log("live source config tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
