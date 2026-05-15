const { getProjectionText } = require("../types");
const { chooseDeliveryStyle } = require("./chooseDeliveryStyle");

async function deliverDiscordMessage(message, projection) {
  const content = getProjectionText(projection);

  if (!content || !content.trim()) {
    return null;
  }

  const text = content.slice(0, 2000);
  const deliveryStyle = chooseDeliveryStyle(message);
  const sentMessage = deliveryStyle === "discord_reply"
    ? await message.reply(text)
    : await message.channel.send(text);

  return {
    deliveryStyle,
    projectionKind: projection?.kind,
    sentMessage
  };
}

module.exports = {
  deliverDiscordMessage
};
