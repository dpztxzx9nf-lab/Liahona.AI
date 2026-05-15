const { createPlainReply } = require("../projection/types");
const {
  chooseDeliveryStyle,
  deliverDiscordMessage
} = require("../projection/discord");

function createProjectionPort() {
  return {
    chooseDeliveryStyle(message) {
      return chooseDeliveryStyle(message);
    },
    deliver(message, reply, ctx) {
      const projection = createPlainReply({ text: reply });
      return deliverDiscordMessage(message, projection, ctx);
    }
  };
}

module.exports = {
  createProjectionPort
};
