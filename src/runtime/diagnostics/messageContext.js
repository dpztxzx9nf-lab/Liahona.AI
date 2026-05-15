const { ChannelType } = require("discord.js");

function getChannelTypeName(channelType) {
  return ChannelType[channelType] || String(channelType ?? "unknown");
}

function validateMessage(message) {
  if (!message || typeof message !== "object") {
    return { valid: false, reason: "missing-message" };
  }

  if (!message.author || typeof message.author !== "object") {
    return { valid: false, reason: "missing-author" };
  }

  if (message.content != null && typeof message.content !== "string") {
    return { valid: false, reason: "invalid-content" };
  }

  return { valid: true };
}

function getMessageDiagnostics(message) {
  const isDM = !message.guild;

  return {
    messageId: message.id,
    authorUsername: message.author?.username || "unknown",
    isBot: Boolean(message.author?.bot),
    guildName: message.guild?.name || "DM",
    channelName: message.channel?.name || "DM",
    channelId: message.channel?.id,
    channelType: getChannelTypeName(message.channel?.type),
    isDM,
    contentLength: message.content?.length || 0
  };
}

module.exports = {
  getMessageDiagnostics,
  validateMessage
};
