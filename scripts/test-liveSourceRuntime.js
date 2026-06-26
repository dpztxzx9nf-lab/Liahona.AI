const assert = require("assert");
const {
  LIVE_SOURCE_DISABLED_TEXT,
  LIVE_SOURCE_EMPTY_TEXT,
  LIVE_SOURCE_FAILED_TEXT,
  generateLiveSourceReply
} = require("../src/execution/liveSourceReply");
const { fallbackReply } = require("../src/execution/generateReply");
const {
  interpretMessage,
  classifyNeedsLiveSource
} = require("../src/interpretive/interpretMessage");

const SECRET_GOOGLE_KEY = "secret-google-api-key";

function assertNoSecrets(value) {
  assert.strictEqual(JSON.stringify(value).includes(SECRET_GOOGLE_KEY), false);
}

async function runLiveSource(content, result) {
  const interpretation = interpretMessage(content);
  let callCount = 0;
  const generation = await generateLiveSourceReply({
    content,
    interpretation,
    liveSources: {
      async searchCurrentEvents({ query }) {
        callCount += 1;
        assert.strictEqual(query, content);
        return result;
      }
    }
  });

  return { interpretation, generation, callCount };
}

async function assertNoLiveSourceCall(content) {
  const interpretation = interpretMessage(content);
  let callCount = 0;
  const generation = await generateLiveSourceReply({
    content,
    interpretation,
    liveSources: {
      async searchCurrentEvents() {
        callCount += 1;
        throw new Error("protected query should not call live sources");
      }
    }
  });

  assert.strictEqual(interpretation.needsLiveSource, false, content);
  assert.strictEqual(classifyNeedsLiveSource(content), false, content);
  assert.strictEqual(generation, null, content);
  assert.strictEqual(callCount, 0, content);
}

async function run() {
  const disabled = await runLiveSource("What's happening in the news today?", {
    provider: "google",
    status: "disabled",
    reason: "LIVE_SOURCES_DISABLED",
    configured: false,
    resultCount: 0,
    results: [],
    missingCredentials: []
  });

  assert.strictEqual(disabled.interpretation.needsLiveSource, true);
  assert.strictEqual(disabled.callCount, 1);
  assert.strictEqual(disabled.generation.text, LIVE_SOURCE_DISABLED_TEXT);
  assert.strictEqual(disabled.generation.text.includes("Reuters"), false);
  assertNoSecrets(disabled.generation);

  const missingCredentials = await runLiveSource("Any major headlines today?", {
    provider: "google",
    status: "missing_credentials",
    reason: "GOOGLE_CREDENTIALS_MISSING",
    configured: false,
    resultCount: 0,
    results: [],
    missingCredentials: ["GOOGLE_SEARCH_API_KEY", "GOOGLE_SEARCH_ENGINE_ID"]
  });

  assert.strictEqual(missingCredentials.interpretation.needsLiveSource, true);
  assert.strictEqual(missingCredentials.callCount, 1);
  assert.strictEqual(missingCredentials.generation.text, LIVE_SOURCE_DISABLED_TEXT);
  assert.strictEqual(missingCredentials.generation.live_source_result.missing_credential_count, 2);
  assertNoSecrets(missingCredentials.generation);

  const success = await runLiveSource("What's new in Ukraine?", {
    provider: "google",
    status: "ok",
    reason: "GOOGLE_SEARCH_OK",
    configured: true,
    resultCount: 2,
    maxResults: 5,
    timeoutMs: 3000,
    results: [
      {
        title: "Ukraine update",
        source: "example-news.com",
        url: "https://example-news.com/ukraine",
        publishedAt: "2026-06-25T10:00:00Z",
        summary: "Latest public reporting summary."
      },
      {
        title: "Regional talks continue",
        source: "wire.example",
        url: "https://wire.example/story",
        snippet: "Search result snippet."
      }
    ],
    missingCredentials: []
  });

  assert.strictEqual(success.interpretation.needsLiveSource, true);
  assert.strictEqual(success.callCount, 1);
  assert.ok(success.generation.text.includes("Based on live Google results"));
  assert.ok(success.generation.text.includes("Ukraine update"));
  assert.ok(success.generation.text.includes("example-news.com"));
  assert.ok(success.generation.text.includes("https://example-news.com/ukraine"));
  assert.ok(success.generation.text.includes("search-result snippets"));
  assert.strictEqual(success.generation.live_source_result.result_count, 2);
  assert.deepStrictEqual(success.generation.live_source_result.sources, [
    "example-news.com",
    "wire.example"
  ]);
  assertNoSecrets(success.generation);

  const empty = await runLiveSource("What's new with Trump?", {
    provider: "google",
    status: "ok",
    reason: "GOOGLE_SEARCH_OK",
    configured: true,
    resultCount: 0,
    results: [],
    missingCredentials: []
  });

  assert.strictEqual(empty.interpretation.needsLiveSource, true);
  assert.strictEqual(empty.generation.text, LIVE_SOURCE_EMPTY_TEXT);

  const apiError = await runLiveSource("What's happening in the news today?", {
    provider: "google",
    status: "error",
    reason: "GOOGLE_API_ERROR",
    configured: true,
    resultCount: 0,
    results: [],
    missingCredentials: [],
    errorCategory: "api_error",
    errorMessage: `failed with ${SECRET_GOOGLE_KEY}`
  });

  assert.strictEqual(apiError.generation.text, LIVE_SOURCE_FAILED_TEXT);
  assert.strictEqual(apiError.generation.live_source_result.error_category, "api_error");
  assertNoSecrets(apiError.generation);

  const timeout = await runLiveSource("Any major headlines today?", {
    provider: "google",
    status: "timeout",
    reason: "GOOGLE_SEARCH_TIMEOUT",
    configured: true,
    resultCount: 0,
    results: [],
    missingCredentials: [],
    errorCategory: "timeout"
  });

  assert.strictEqual(timeout.generation.text, LIVE_SOURCE_FAILED_TEXT);
  assert.strictEqual(timeout.generation.live_source_result.error_category, "timeout");
  assertNoSecrets(timeout.generation);

  const fallback = fallbackReply(
    "What's happening in the news today?",
    interpretMessage("What's happening in the news today?")
  );

  assert.strictEqual(fallback, LIVE_SOURCE_DISABLED_TEXT);
  assert.strictEqual(fallback.includes("Reuters"), false);
  assert.strictEqual(fallback.includes("AP"), false);

  await assertNoLiveSourceCall("What's new?");
  await assertNoLiveSourceCall("What's new with your code?");
  await assertNoLiveSourceCall("What's new with Liahona?");
  await assertNoLiveSourceCall("What's new with KINDEX?");
  await assertNoLiveSourceCall("What's new with #journal?");
  await assertNoLiveSourceCall("What's new with Jesus?");
  await assertNoLiveSourceCall("What's new with the gospel?");
  await assertNoLiveSourceCall("Give me a reflection prompt.");

  console.log("live source runtime tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
