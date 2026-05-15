const { interpretMessage } = require("../interpretive/interpretMessage");
const { generateReply } = require("../execution/generateReply");

function createInterpretivePort() {
  return {
    interpret(message) {
      return interpretMessage(message);
    },
    generate({ content, interpretation, ctx }) {
      return generateReply({ content, interpretation, ctx });
    }
  };
}

module.exports = {
  createInterpretivePort
};
