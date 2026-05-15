const deliveredForSourceMessage = new Map();
const DELIVERED_TTL_MS = 5 * 60 * 1000;

function pruneDelivered() {
  const now = Date.now();

  for (const [messageId, record] of deliveredForSourceMessage) {
    if (now - record.deliveredAt > DELIVERED_TTL_MS) {
      deliveredForSourceMessage.delete(messageId);
    }
  }
}

function getDeliveryRecord(sourceMessageId) {
  pruneDelivered();
  return deliveredForSourceMessage.get(sourceMessageId) || null;
}

function hasDelivered(sourceMessageId) {
  return Boolean(getDeliveryRecord(sourceMessageId));
}

function markDelivered(sourceMessageId, { outboundMessageId, projectionId } = {}) {
  const existing = getDeliveryRecord(sourceMessageId);
  const deliveryCount = (existing?.deliveryCount || 0) + 1;

  deliveredForSourceMessage.set(sourceMessageId, {
    deliveredAt: Date.now(),
    deliveryCount,
    outboundMessageId: outboundMessageId || existing?.outboundMessageId || null,
    projectionId: projectionId || existing?.projectionId || null
  });

  return deliveryCount;
}

module.exports = {
  getDeliveryRecord,
  hasDelivered,
  markDelivered
};
