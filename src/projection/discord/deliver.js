const { getProjectionText } = require("../types");
const { chooseDeliveryStyle } = require("./chooseDeliveryStyle");
const { hasDelivered, markDelivered } = require("./deliveryGuard");

async function deliverDiscordMessage(message, projection, ctx = null) {
  const sourceMessageId = message?.id;

  if (ctx && (ctx.terminated || ctx.delivered)) {
    return { skipped: true, reason: "invocation-terminated" };
  }

  if (sourceMessageId && hasDelivered(sourceMessageId)) {
    return { skipped: true, reason: "already-delivered", delivery_count: ctx?.delivery_count || 1 };
  }

  let content = getProjectionText(projection);

  if ((!content || !content.trim()) && ctx?.delivery_text?.trim()) {
    content = ctx.delivery_text;
  }

  const finalProjectionTextLength = content?.trim().length || 0;

  if (!content || !content.trim()) {
    return {
      skipped: true,
      reason: "empty-content",
      raw_generation_text_length: ctx?.raw_generation_text_length || 0,
      cleaned_text_length: ctx?.cleaned_text_length || 0,
      final_projection_text_length: finalProjectionTextLength
    };
  }

  const text = content.trim().slice(0, 2000);
  const deliveryStyle = chooseDeliveryStyle(message);
  const sentMessage = deliveryStyle === "discord_reply"
    ? await message.reply(text)
    : await message.channel.send(text);

  let deliveryCount = 0;

  if (sourceMessageId) {
    deliveryCount = markDelivered(sourceMessageId, {
      outboundMessageId: sentMessage?.id,
      projectionId: ctx?.projection_id
    });
  }

  if (ctx) {
    ctx.delivery_count = deliveryCount;
    ctx.delivered = true;
    ctx.outbound_message_id = sentMessage?.id || null;
  }

  return {
    deliveryStyle,
    projectionKind: projection?.kind,
    projection_id: ctx?.projection_id || null,
    delivery_count: deliveryCount,
    outbound_message_id: sentMessage?.id || null,
    raw_generation_text_length: ctx?.raw_generation_text_length || 0,
    cleaned_text_length: ctx?.cleaned_text_length || 0,
    final_projection_text_length: text.length,
    sentMessage
  };
}

module.exports = {
  deliverDiscordMessage
};
