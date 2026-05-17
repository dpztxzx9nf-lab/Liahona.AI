const { interpretMessage } = require("../interpretive/interpretMessage");
const { generateReply } = require("../execution/generateReply");

function createInterpretivePort() {
  return {
    interpret(message) {
      return interpretMessage(message);
    },
    generate({ content, interpretation, ctx, retrievedContext }) {
      return generateReply({ content, interpretation, ctx, retrievedContext });
    }
  };
}

module.exports = {
  createInterpretivePort
};
