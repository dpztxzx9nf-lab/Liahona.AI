const { searchGoogle } = require("../sources/live");

function createLiveSourcePort(options = {}) {
  return {
    async searchCurrentEvents({ query }) {
      return searchGoogle({
        query,
        env: options.env,
        config: options.config,
        fetchFn: options.fetchFn,
        now: options.now
      });
    }
  };
}

module.exports = {
  createLiveSourcePort
};
