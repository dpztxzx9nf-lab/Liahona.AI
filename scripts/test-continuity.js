const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createContinuityPort } = require("../src/ports/ContinuityPort");
const { MESSAGE_CLASSIFICATIONS } = require("../src/interpretive/classifyMessage");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "liahona-continuity-"));
const storePath = path.join(tempDir, "continuity.jsonl");
const port = createContinuityPort({ storePath });

async function run() {
  const stored = await port.store({
    ts: "2026-05-17T10:00:00.000Z",
    author_user_id: "user-1",
    channel_id: "channel-1",
    channel_name: "journal",
    classification: MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY,
    original_message: "Today I noticed prayer helped me feel calmer about work.",
    summary: "Prayer helped me feel calmer about work."
  });

  assert.ok(stored.id, "stored journal entry should receive an id");
  assert.strictEqual(stored.author_user_id, "user-1");
  assert.strictEqual(stored.channel_name, "journal");
  assert.strictEqual(stored.classification, MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY);

  await port.store({
    ts: "2026-05-17T10:05:00.000Z",
    author_user_id: "user-1",
    channel_id: "channel-1",
    channel_name: "journal",
    classification: MESSAGE_CLASSIFICATIONS.SYSTEM_UPDATE,
    original_message: "System update: restarted Liahona after deployment."
  });

  const recalled = await port.recall({
    content: "What helped me feel calm about work?"
  });

  assert.ok(Array.isArray(recalled), "relevant recall should return entries");
  assert.ok(recalled.length > 0, "relevant recall should not be empty");
  assert.strictEqual(recalled[0].classification, MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY);
  assert.ok(
    recalled[0].summary.includes("calmer") || recalled[0].original_message.includes("calmer"),
    "top recalled entry should be related to the journal text"
  );

  const unrelated = await port.recall({
    content: "Tell me about ocean tides and lunar gravity."
  });

  assert.strictEqual(unrelated, null, "unrelated recall should return null");
}

run()
  .then(() => {
    port.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("continuity tests passed");
  })
  .catch((error) => {
    try {
      port.close();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  });
