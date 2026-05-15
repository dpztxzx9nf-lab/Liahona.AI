const inFlight = new Map();
const completed = new Map();
const COMPLETED_TTL_MS = 5 * 60 * 1000;

function pruneCompleted() {
  const now = Date.now();

  for (const [messageId, completedAt] of completed) {
    if (now - completedAt > COMPLETED_TTL_MS) {
      completed.delete(messageId);
    }
  }
}

async function runOncePerMessage(messageId, handler) {
  if (!messageId) {
    return { executed: false, reason: "missing-message-id" };
  }

  pruneCompleted();

  if (completed.has(messageId)) {
    return { executed: false, reason: "already-completed" };
  }

  if (inFlight.has(messageId)) {
    await inFlight.get(messageId);
    return { executed: false, reason: "coalesced" };
  }

  const run = (async () => handler())();

  inFlight.set(messageId, run);

  try {
    const result = await run;
    completed.set(messageId, Date.now());
    return { executed: true, result };
  } finally {
    inFlight.delete(messageId);
  }
}

module.exports = {
  runOncePerMessage
};
