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

module.exports = {
  chooseDeliveryStyle
};
