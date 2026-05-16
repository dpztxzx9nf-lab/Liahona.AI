const { applyChannelSilence } = require("../policy/channelSilence");
const { applyForumThrottle } = require("../policy/forumThrottle");
const { runOncePerMessage } = require("../policy/messageLock");
const {
  createInvocationContext,
  correlationFields,
  terminateInvocation,
  canContinue
} = require("./invocation");
const { prepareReplyText } = require("../../execution/prepareReply");
const {
  logDiagnostic,
  logError,
  getMessageDiagnostics,
  validateMessage
} = require("../diagnostics");

function isIgnoredMessage(message, clientUserId) {
  if (!message?.author) {
    return true;
  }

  if (message.author.bot) {
    return true;
  }

  if (clientUserId && message.author.id === clientUserId) {
    return true;
  }

  return false;
}

async function processMessage(message, { clientUserId, ports }) {
  const ctx = createInvocationContext(message);
  const correlation = () => correlationFields(ctx);

  logDiagnostic("MESSAGE_RECEIVED", {
    ...getMessageDiagnostics(message),
    ...correlation()
  });

  if (isIgnoredMessage(message, clientUserId)) {
    logDiagnostic("MESSAGE_IGNORED", {
      ...correlation(),
      reason: "bot-or-self"
    });
    terminateInvocation(ctx, "ignored");
    return;
  }

  let interpretation = ports.interpretive.interpret(message);
  interpretation = applyChannelSilence(message, interpretation, clientUserId);
  interpretation = applyForumThrottle(message, interpretation, clientUserId);
  const deliveryStyle = ports.projection.chooseDeliveryStyle(message);

  logDiagnostic("INTERPRETATION_RESULT", {
    ...correlation(),
    intent: interpretation.intent,
    responseStyle: interpretation.responseStyle,
    needsRetrieval: interpretation.needsRetrieval,
    needsLiveSource: interpretation.needsLiveSource,
    shouldRespond: interpretation.shouldRespond,
    responseReason: interpretation.responseReason,
    deliveryStyle
  });

  if (!interpretation.shouldRespond) {
    terminateInvocation(ctx, "no-response");
    return;
  }

  if (!canContinue(ctx)) {
    return;
  }

  let reply;
  const generationStartedAt = Date.now();

  try {
    const generation = await ports.interpretive.generate({
      content: message.content,
      interpretation,
      ctx
    });

    if (generation?.openai_response_id) {
      ctx.openai_response_id = generation.openai_response_id;
    }

    const prepared = prepareReplyText(generation);
    ctx.raw_generation_text_length = prepared.raw_generation_text_length;
    ctx.cleaned_text_length = prepared.cleaned_text_length;
    ctx.delivery_text = prepared.cleanedText;
    reply = prepared.cleanedText;

    logDiagnostic("GENERATION_RESULT", {
      ...correlation(),
      openai_response_id: ctx.openai_response_id,
      success: true,
      raw_generation_text_length: ctx.raw_generation_text_length,
      cleaned_text_length: ctx.cleaned_text_length,
      replyLength: ctx.cleaned_text_length,
      latencyMs: Date.now() - generationStartedAt
    });
  } catch (error) {
    logDiagnostic("GENERATION_RESULT", {
      ...correlation(),
      success: false,
      replyLength: 0,
      errorMessage: error.message,
      latencyMs: Date.now() - generationStartedAt
    });
    logError("GENERATION_FAILED", correlation(), error);
    reply = "I had trouble answering that.";
  }

  if (!canContinue(ctx)) {
    return;
  }

  if (!reply && ctx.cleaned_text_length > 0) {
    reply = ctx.delivery_text;
  }

  logDiagnostic("PROJECTION_PREPARED", {
    ...correlation(),
    raw_generation_text_length: ctx.raw_generation_text_length,
    cleaned_text_length: ctx.cleaned_text_length,
    final_projection_text_length: reply?.length || 0
  });

  const deliveryStartedAt = Date.now();
  let deliveryResult;

  try {
    deliveryResult = await ports.projection.deliver(message, reply, ctx);
  } catch (error) {
    logDiagnostic("DELIVERY_RESULT", {
      ...correlation(),
      success: false,
      deliveryStyle,
      channelId: message.channel?.id,
      errorCode: error.code,
      errorMessage: error.message,
      latencyMs: Date.now() - deliveryStartedAt
    });
    logError("DELIVERY_FAILED", correlation(), error);
    return;
  }

  if (deliveryResult?.skipped) {
    logDiagnostic("DELIVERY_SKIPPED", {
      ...correlation(),
      reason: deliveryResult.reason,
      delivery_count: deliveryResult.delivery_count || ctx.delivery_count,
      raw_generation_text_length: deliveryResult.raw_generation_text_length ?? ctx.raw_generation_text_length,
      cleaned_text_length: deliveryResult.cleaned_text_length ?? ctx.cleaned_text_length,
      final_projection_text_length: deliveryResult.final_projection_text_length ?? 0
    });
    terminateInvocation(ctx, deliveryResult.reason || "delivery-skipped");
    return;
  }

  terminateInvocation(ctx, "delivered");

  logDiagnostic("DELIVERY_RESULT", {
    ...correlation(),
    success: true,
    outbound_message_id: deliveryResult?.outbound_message_id || ctx.outbound_message_id,
    deliveryStyle: deliveryResult?.deliveryStyle || deliveryStyle,
    channelId: message.channel?.id,
    raw_generation_text_length: deliveryResult?.raw_generation_text_length ?? ctx.raw_generation_text_length,
    cleaned_text_length: deliveryResult?.cleaned_text_length ?? ctx.cleaned_text_length,
    final_projection_text_length: deliveryResult?.final_projection_text_length ?? 0,
    latencyMs: Date.now() - deliveryStartedAt
  });
}

async function handleMessage(message, { clientUserId, ports }) {
  const validation = validateMessage(message);

  if (!validation.valid) {
    logDiagnostic("MESSAGE_SKIPPED", {
      reason: validation.reason,
      inbound_message_id: message?.id
    });
    return;
  }

  const run = await runOncePerMessage(message.id, () =>
    processMessage(message, { clientUserId, ports })
  );

  if (!run.executed) {
    logDiagnostic("MESSAGE_DEDUPED", {
      inbound_message_id: message.id,
      reason: run.reason
    });
  }
}

module.exports = {
  handleMessage,
  isIgnoredMessage
};
