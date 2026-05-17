const { getCanonicalManifest } = require("../canonical/corpora/manifest");
const { retrieveCanonicalSources } = require("../canonical/sourceRetrieval");

function createCanonicalPort() {
  return {
    getManifest() {
      return getCanonicalManifest();
    },
    async retrieve(query) {
      if (query) {
        return retrieveCanonicalSources(query);
      }

      return getCanonicalManifest();
    }
  };
}

module.exports = {
  createCanonicalPort
};
