const { chooseDeliveryStyle, deliverDiscordMessage } = require("../projection/discord");
const { createPlainReply } = require("../projection/types");

async function sendMessage(message, reply) {
  return deliverDiscordMessage(message, createPlainReply({ text: reply }));
}

module.exports = {
  chooseDeliveryStyle,
  sendMessage
};
