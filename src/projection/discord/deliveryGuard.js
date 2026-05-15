const deliveredForSourceMessage = new Map();
const DELIVERED_TTL_MS = 5 * 60 * 1000;

function pruneDelivered() {
  const now = Date.now();

  for (const [messageId, deliveredAt] of deliveredForSourceMessage) {
    if (now - deliveredAt > DELIVERED_TTL_MS) {
      deliveredForSourceMessage.delete(messageId);
    }
  }
}

function hasDelivered(sourceMessageId) {
  pruneDelivered();
  return deliveredForSourceMessage.has(sourceMessageId);
}

function markDelivered(sourceMessageId) {
  deliveredForSourceMessage.set(sourceMessageId, Date.now());
}

module.exports = {
  hasDelivered,
  markDelivered
};
