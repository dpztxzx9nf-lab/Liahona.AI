const { getContinuityScopes } = require("../continuity/scopes/manifest");

function createContinuityPort() {
  return {
    getScopes() {
      return getContinuityScopes();
    },
    async recall() {
      return null;
    }
  };
}

module.exports = {
  createContinuityPort
};
