const assert = require("assert");
const {
  GOOGLE_MAX_RESULTS_PER_REQUEST,
  getLiveSourceConfig,
  searchGoogle
} = require("../src/sources/live");

const SECRET_GOOGLE_KEY = "secret-google-api-key";
const SECRET_CSE_ID = "secret-google-cse-id";
const FETCHED_AT = "2026-06-25T12:00:00.000Z";

function googleEnv(overrides = {}) {
  return {
    LIVE_SOURCES_ENABLED: "true",
    GOOGLE_SEARCH_ENABLED: "true",
    GOOGLE_API_KEY: SECRET_GOOGLE_KEY,
    GOOGLE_CSE_ID: SECRET_CSE_ID,
    LIVE_SOURCE_TIMEOUT_MS: "3000",
    LIVE_SOURCE_MAX_RESULTS: "5",
    ...overrides
  };
}

function assertNoSecrets(value) {
  const serialized = JSON.stringify(value);

  assert.strictEqual(serialized.includes(SECRET_GOOGLE_KEY), false);
  assert.strictEqual(serialized.includes(SECRET_CSE_ID), false);
}

function createResponse({ ok = true, status = 200, body = {} } = {}) {
  return {
    ok,
    status,
    async json() {
      return body;
    }
  };
}

function makeItems(count) {
  return Array.from({ length: count }, (_, index) => ({
    title: `Result ${index + 1}`,
    link: `https://example${index + 1}.com/story`,
    displayLink: `example${index + 1}.com`,
    snippet: `Summary ${index + 1}`,
    pagemap: {
      metatags: [
        {
          "article:published_time": `2026-06-${String(index + 1).padStart(2, "0")}T00:00:00Z`
        }
      ]
    }
  }));
}

async function run() {
  const disabledConfig = getLiveSourceConfig({
    ...googleEnv(),
    LIVE_SOURCES_ENABLED: "false"
  });
  const disabled = await searchGoogle({
    query: "latest news",
    config: disabledConfig,
    env: googleEnv(),
    fetchFn: async () => {
      throw new Error("fetch should not run while disabled");
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(disabled.status, "disabled");
  assert.strictEqual(disabled.reason, "LIVE_SOURCES_DISABLED");
  assert.strictEqual(disabled.resultCount, 0);
  assertNoSecrets(disabled);

  const missingCredentials = await searchGoogle({
    query: "latest news",
    env: {
      LIVE_SOURCES_ENABLED: "true",
      GOOGLE_SEARCH_ENABLED: "true"
    },
    fetchFn: async () => {
      throw new Error("fetch should not run without credentials");
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(missingCredentials.status, "missing_credentials");
  assert.strictEqual(missingCredentials.reason, "GOOGLE_CREDENTIALS_MISSING");
  assert.deepStrictEqual(missingCredentials.missingCredentials, [
    "GOOGLE_API_KEY",
    "GOOGLE_CSE_ID"
  ]);
  assertNoSecrets(missingCredentials);

  let requestedUrl = null;
  let requestedOptions = null;
  const success = await searchGoogle({
    query: "public current event",
    env: googleEnv(),
    fetchFn: async (url, options) => {
      requestedUrl = url;
      requestedOptions = options;

      return createResponse({
        body: {
          searchInformation: {
            totalResults: "25"
          },
          items: makeItems(3)
        }
      });
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(success.status, "ok");
  assert.strictEqual(success.reason, "GOOGLE_SEARCH_OK");
  assert.strictEqual(success.provider, "google");
  assert.strictEqual(success.resultCount, 3);
  assert.strictEqual(success.fetchedAt, FETCHED_AT);
  assert.strictEqual(success.query, "public current event");
  assert.strictEqual(success.totalResults, "25");
  assert.strictEqual(requestedUrl.origin + requestedUrl.pathname, "https://customsearch.googleapis.com/customsearch/v1");
  assert.strictEqual(requestedUrl.searchParams.get("key"), SECRET_GOOGLE_KEY);
  assert.strictEqual(requestedUrl.searchParams.get("cx"), SECRET_CSE_ID);
  assert.strictEqual(requestedUrl.searchParams.get("q"), "public current event");
  assert.strictEqual(requestedUrl.searchParams.get("num"), "5");
  assert.strictEqual(requestedOptions.method, "GET");
  assert.strictEqual(requestedOptions.headers.accept, "application/json");
  assert.ok(requestedOptions.signal, "fetch should receive an abort signal");
  assert.deepStrictEqual(success.results[0], {
    title: "Result 1",
    source: "example1.com",
    url: "https://example1.com/story",
    publishedAt: "2026-06-01T00:00:00Z",
    summary: "Summary 1",
    snippet: "Summary 1",
    query: "public current event",
    fetchedAt: FETCHED_AT,
    provider: "google"
  });
  assertNoSecrets(success);

  const empty = await searchGoogle({
    query: "nothing found",
    env: googleEnv(),
    fetchFn: async () => createResponse({ body: {} }),
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(empty.status, "ok");
  assert.strictEqual(empty.resultCount, 0);
  assert.deepStrictEqual(empty.results, []);

  const apiError = await searchGoogle({
    query: "quota test",
    env: googleEnv(),
    fetchFn: async () => createResponse({
      ok: false,
      status: 429,
      body: {
        error: {
          message: `quota error for ${SECRET_GOOGLE_KEY}`
        }
      }
    }),
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(apiError.status, "error");
  assert.strictEqual(apiError.reason, "GOOGLE_API_ERROR");
  assert.strictEqual(apiError.errorCategory, "rate_limited");
  assert.strictEqual(apiError.statusCode, 429);
  assertNoSecrets(apiError);

  const fetchFailure = await searchGoogle({
    query: "network test",
    env: googleEnv(),
    fetchFn: async () => {
      throw new Error(`network failed for ${SECRET_GOOGLE_KEY}`);
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(fetchFailure.status, "error");
  assert.strictEqual(fetchFailure.reason, "GOOGLE_SEARCH_REQUEST_FAILED");
  assert.strictEqual(fetchFailure.errorCategory, "network_error");
  assertNoSecrets(fetchFailure);

  const timeout = await searchGoogle({
    query: "timeout test",
    env: googleEnv(),
    fetchFn: async () => {
      const error = new Error(`timeout for ${SECRET_GOOGLE_KEY}`);
      error.name = "AbortError";
      throw error;
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(timeout.status, "timeout");
  assert.strictEqual(timeout.reason, "GOOGLE_SEARCH_TIMEOUT");
  assert.strictEqual(timeout.errorCategory, "timeout");
  assertNoSecrets(timeout);

  let limitedUrl = null;
  const limited = await searchGoogle({
    query: "limit test",
    env: googleEnv({
      LIVE_SOURCE_MAX_RESULTS: "2"
    }),
    fetchFn: async (url) => {
      limitedUrl = url;
      return createResponse({
        body: {
          items: makeItems(5)
        }
      });
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(limitedUrl.searchParams.get("num"), "2");
  assert.strictEqual(limited.maxResults, 2);
  assert.strictEqual(limited.resultCount, 2);

  let cappedUrl = null;
  const capped = await searchGoogle({
    query: "cap test",
    env: googleEnv({
      LIVE_SOURCE_MAX_RESULTS: "25"
    }),
    fetchFn: async (url) => {
      cappedUrl = url;
      return createResponse({
        body: {
          items: makeItems(12)
        }
      });
    },
    now: () => new Date(FETCHED_AT)
  });

  assert.strictEqual(cappedUrl.searchParams.get("num"), String(GOOGLE_MAX_RESULTS_PER_REQUEST));
  assert.strictEqual(capped.maxResults, GOOGLE_MAX_RESULTS_PER_REQUEST);
  assert.strictEqual(capped.resultCount, GOOGLE_MAX_RESULTS_PER_REQUEST);
  assertNoSecrets(capped);

  console.log("google live search adapter tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
