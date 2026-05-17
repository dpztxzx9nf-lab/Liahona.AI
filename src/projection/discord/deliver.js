const { ChannelType } = require("discord.js");
const { getProjectionText } = require("../types");
const { chooseDeliveryStyle } = require("./chooseDeliveryStyle");
const { hasDelivered, markDelivered } = require("./deliveryGuard");

const THREAD_CHANNEL_TYPES = new Set([
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread
]);

const DISCORD_MISSING_PERMISSIONS = 50013;

function getChannelTypeName(channelType) {
  return ChannelType[channelType] || String(channelType ?? "unknown");
}

function isForumPost(message) {
  return message.channel?.parent?.type === ChannelType.GuildForum;
}

function getProjectionDiagnostics(message, outboundMethod) {
  const channel = message.channel;

  return {
    outbound_method: outboundMethod,
    channel_id: channel?.id || null,
    channel_name: channel?.name || null,
    channel_type: getChannelTypeName(channel?.type),
    is_thread: THREAD_CHANNEL_TYPES.has(channel?.type),
    is_forum_post: isForumPost(message),
    parent_channel_id: channel?.parent?.id || null,
    parent_channel_type: getChannelTypeName(channel?.parent?.type),
    archived: Boolean(channel?.archived ?? channel?.threadMetadata?.archived ?? false),
    locked: Boolean(channel?.locked ?? channel?.threadMetadata?.locked ?? false)
  };
}

function isMissingPermissionsError(error) {
  return error?.code === DISCORD_MISSING_PERMISSIONS;
}

async function sendWithFallback(message, text, deliveryStyle) {
  const initialMethod = deliveryStyle === "discord_reply"
    ? "message.reply"
    : "channel.send";

  try {
    const sentMessage = initialMethod === "message.reply"
      ? await message.reply(text)
      : await message.channel.send(text);

    return {
      sentMessage,
      attempted_outbound_method: initialMethod,
      outbound_method: initialMethod,
      fallback_used: false,
      permission_error_suppressed: false
    };
  } catch (error) {
    if (!isMissingPermissionsError(error)) {
      throw error;
    }

    if (initialMethod !== "message.reply" || typeof message.channel?.send !== "function") {
      return {
        sentMessage: null,
        attempted_outbound_method: initialMethod,
        outbound_method: initialMethod,
        fallback_used: false,
        permission_error_suppressed: true,
        error_code: error.code,
        error_message: error.message
      };
    }

    try {
      const sentMessage = await message.channel.send(text);

      return {
        sentMessage,
        attempted_outbound_method: initialMethod,
        outbound_method: "channel.send",
        fallback_used: true,
        fallback_reason: "DISCORD_MISSING_PERMISSIONS",
        permission_error_suppressed: false,
        initial_error_code: error.code,
        initial_error_message: error.message
      };
    } catch (fallbackError) {
      if (!isMissingPermissionsError(fallbackError)) {
        throw fallbackError;
      }

      return {
        sentMessage: null,
        attempted_outbound_method: initialMethod,
        outbound_method: "channel.send",
        fallback_used: true,
        fallback_reason: "DISCORD_MISSING_PERMISSIONS",
        permission_error_suppressed: true,
        initial_error_code: error.code,
        initial_error_message: error.message,
        error_code: fallbackError.code,
        error_message: fallbackError.message
      };
    }
  }
}

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
  const deliveryAttempt = await sendWithFallback(message, text, deliveryStyle);
  const sentMessage = deliveryAttempt.sentMessage;
  const projectionDiagnostics = getProjectionDiagnostics(message, deliveryAttempt.outbound_method);

  if (!sentMessage && deliveryAttempt.permission_error_suppressed) {
    return {
      skipped: true,
      reason: "discord-missing-permissions",
      deliveryStyle,
      projectionKind: projection?.kind,
      projection_id: ctx?.projection_id || null,
      delivery_count: ctx?.delivery_count || 0,
      raw_generation_text_length: ctx?.raw_generation_text_length || 0,
      cleaned_text_length: ctx?.cleaned_text_length || 0,
      final_projection_text_length: text.length,
      ...projectionDiagnostics,
      attempted_outbound_method: deliveryAttempt.attempted_outbound_method,
      fallback_used: deliveryAttempt.fallback_used,
      fallback_reason: deliveryAttempt.fallback_reason || null,
      permission_error_suppressed: true,
      error_code: deliveryAttempt.error_code,
      error_message: deliveryAttempt.error_message
    };
  }

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
    ...projectionDiagnostics,
    attempted_outbound_method: deliveryAttempt.attempted_outbound_method,
    fallback_used: deliveryAttempt.fallback_used,
    fallback_reason: deliveryAttempt.fallback_reason || null,
    permission_error_suppressed: false,
    initial_error_code: deliveryAttempt.initial_error_code,
    initial_error_message: deliveryAttempt.initial_error_message,
    sentMessage
  };
}

module.exports = {
  deliverDiscordMessage,
  getProjectionDiagnostics,
  isMissingPermissionsError,
  sendWithFallback
};
