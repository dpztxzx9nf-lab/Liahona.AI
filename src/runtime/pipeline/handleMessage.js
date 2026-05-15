const { applyForumThrottle } = require("../policy/forumThrottle");
const {
  logDiagnostic,
  logError,
  getMessageDiagnostics,
  validateMessage
} = require("../diagnostics");

async function handleMessage(message, { clientUserId, ports }) {
  const validation = validateMessage(message);

  if (!validation.valid) {
    logDiagnostic("MESSAGE_SKIPPED", {
      reason: validation.reason,
      messageId: message?.id
    });
    return;
  }

  const messageDiagnostics = getMessageDiagnostics(message);

  logDiagnostic("MESSAGE_RECEIVED", messageDiagnostics);

  if (message.author.bot) {
    return;
  }

  try {
    const interpretation = applyForumThrottle(
      message,
      ports.interpretive.interpret(message),
      clientUserId
    );
    const deliveryStyle = ports.projection.chooseDeliveryStyle(message);

    logDiagnostic("INTERPRETATION_RESULT", {
      messageId: message.id,
      intent: interpretation.intent,
      responseStyle: interpretation.responseStyle,
      needsRetrieval: interpretation.needsRetrieval,
      shouldRespond: interpretation.shouldRespond,
      responseReason: interpretation.responseReason,
      deliveryStyle
    });

    if (!interpretation.shouldRespond) {
      return;
    }

    let reply;
    const generationStartedAt = Date.now();

    try {
      reply = await ports.interpretive.generate({
        content: message.content,
        interpretation
      });
      logDiagnostic("GENERATION_RESULT", {
        messageId: message.id,
        success: true,
        replyLength: reply?.length || 0,
        latencyMs: Date.now() - generationStartedAt
      });
    } catch (error) {
      logDiagnostic("GENERATION_RESULT", {
        messageId: message.id,
        success: false,
        replyLength: 0,
        errorMessage: error.message,
        latencyMs: Date.now() - generationStartedAt
      });
      logError("GENERATION_FAILED", { messageId: message.id }, error);
      reply = "I had trouble answering that.";
    }

    const deliveryStartedAt = Date.now();
    let deliveryResult;

    try {
      deliveryResult = await ports.projection.deliver(message, reply);
    } catch (error) {
      logDiagnostic("DELIVERY_RESULT", {
        messageId: message.id,
        success: false,
        deliveryStyle,
        channelId: message.channel?.id,
        errorCode: error.code,
        errorMessage: error.message,
        latencyMs: Date.now() - deliveryStartedAt
      });
      logError("DELIVERY_FAILED", {
        messageId: message.id,
        channelId: message.channel?.id
      }, error);
      return;
    }

    logDiagnostic("DELIVERY_RESULT", {
      messageId: message.id,
      success: true,
      deliveryStyle: deliveryResult?.deliveryStyle || deliveryStyle,
      channelId: message.channel?.id,
      latencyMs: Date.now() - deliveryStartedAt
    });
  } catch (error) {
    logError("PIPELINE_ERROR", {
      messageId: message.id,
      channelId: message.channel?.id
    }, error);
  }
}

module.exports = {
  handleMessage
};
