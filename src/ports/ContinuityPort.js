const { getContinuityScopes } = require("../continuity/scopes/manifest");
const { createContinuityStore } = require("../continuity/runtimeStore");

function createContinuityPort(options = {}) {
  const store = options.store || createContinuityStore(options);

  return {
    getScopes() {
      return getContinuityScopes();
    },
    async store(entry) {
      return store.store(entry);
    },
    async recall(input, recallOptions) {
      const message = input?.message || input;
      return store.recall(message, recallOptions);
    },
    close() {
      if (typeof store.close === "function") {
        store.close();
      }
    }
  };
}

module.exports = {
  createContinuityPort
};
