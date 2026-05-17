const { interpretMessage } = require("../interpretive/interpretMessage");
const { generateReply } = require("../execution/generateReply");

function createInterpretivePort() {
  return {
    interpret(message) {
      return interpretMessage(message);
    },
    generate({
      content,
      interpretation,
      ctx,
      retrievedContext,
      recurringThemes,
      canonicalContext,
      canonicalSources
    }) {
      return generateReply({
        content,
        interpretation,
        ctx,
        retrievedContext,
        recurringThemes,
        canonicalContext,
        canonicalSources
      });
    }
  };
}

module.exports = {
  createInterpretivePort
};
