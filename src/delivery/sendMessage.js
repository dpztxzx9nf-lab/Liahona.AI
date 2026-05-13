const { ChannelType } = require("discord.js");

function chooseDeliveryStyle(message) {
  const channelType = message.channel?.type;

  if (
    channelType === ChannelType.PublicThread ||
    channelType === ChannelType.PrivateThread ||
    channelType === ChannelType.AnnouncementThread
  ) {
    return "discord_reply";
  }

  return "normal_message";
}

async function sendMessage(message, reply) {
  if (!reply || !reply.trim()) {
    return null;
  }

  const content = reply.slice(0, 2000);
  const deliveryStyle = chooseDeliveryStyle(message);
  const sentMessage = deliveryStyle === "discord_reply"
    ? await message.reply(content)
    : await message.channel.send(content);

  return {
    deliveryStyle,
    sentMessage
  };
}

module.exports = {
  chooseDeliveryStyle,
  sendMessage
};
