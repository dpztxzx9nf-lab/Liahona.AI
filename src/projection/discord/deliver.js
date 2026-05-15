const { getProjectionText } = require("../types");
const { chooseDeliveryStyle } = require("./chooseDeliveryStyle");
const { hasDelivered, markDelivered } = require("./deliveryGuard");

async function deliverDiscordMessage(message, projection) {
  const sourceMessageId = message?.id;

  if (sourceMessageId && hasDelivered(sourceMessageId)) {
    return null;
  }

  const content = getProjectionText(projection);

  if (!content || !content.trim()) {
    return null;
  }

  const text = content.trim().slice(0, 2000);
  const deliveryStyle = chooseDeliveryStyle(message);
  const sentMessage = deliveryStyle === "discord_reply"
    ? await message.reply(text)
    : await message.channel.send(text);

  if (sourceMessageId) {
    markDelivered(sourceMessageId);
  }

  return {
    deliveryStyle,
    projectionKind: projection?.kind,
    sentMessage
  };
}

module.exports = {
  deliverDiscordMessage
};
