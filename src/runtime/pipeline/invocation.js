const crypto = require("crypto");

function createInvocationContext(message) {
  return {
    inbound_message_id: message?.id || null,
    response_id: crypto.randomUUID(),
    projection_id: crypto.randomUUID(),
    delivery_count: 0,
    delivered: false,
    terminated: false,
    openai_response_id: null
  };
}

function correlationFields(ctx) {
  return {
    inbound_message_id: ctx.inbound_message_id,
    response_id: ctx.response_id,
    projection_id: ctx.projection_id,
    delivery_count: ctx.delivery_count
  };
}

function terminateInvocation(ctx, reason) {
  ctx.terminated = true;
  ctx.termination_reason = reason;
}

function canContinue(ctx) {
  return !ctx.terminated && !ctx.delivered;
}

module.exports = {
  createInvocationContext,
  correlationFields,
  terminateInvocation,
  canContinue
};
