const { getCanonicalManifest } = require("../canonical/corpora/manifest");

function createCanonicalPort() {
  return {
    getManifest() {
      return getCanonicalManifest();
    },
    async retrieve() {
      return getCanonicalManifest();
    }
  };
}

module.exports = {
  createCanonicalPort
};
