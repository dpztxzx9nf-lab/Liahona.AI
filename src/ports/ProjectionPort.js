const { chooseDeliveryStyle, sendMessage } = require("../delivery/sendMessage");

function createProjectionPort() {
  return {
    chooseDeliveryStyle(message) {
      return chooseDeliveryStyle(message);
    },
    deliver(message, reply) {
      return sendMessage(message, reply);
    }
  };
}

module.exports = {
  createProjectionPort
};
