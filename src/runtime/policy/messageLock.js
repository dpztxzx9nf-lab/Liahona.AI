const inFlight = new Set();
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

function tryAcquireMessage(messageId) {
  pruneCompleted();

  if (completed.has(messageId)) {
    return { acquired: false, reason: "already-completed" };
  }

  if (inFlight.has(messageId)) {
    return { acquired: false, reason: "in-flight" };
  }

  inFlight.add(messageId);
  return { acquired: true };
}

function releaseMessage(messageId, { markCompleted = false } = {}) {
  inFlight.delete(messageId);

  if (markCompleted) {
    completed.set(messageId, Date.now());
  }
}

module.exports = {
  tryAcquireMessage,
  releaseMessage
};
