const { canonicalManifest } = require("../../canonical/corpora/manifest");
const { SOURCE_LAYERS } = require("../layers");
const { createSourceRecord } = require("../schema");

const canonicalSources = canonicalManifest.map((entry) => createSourceRecord({
  id: entry.id,
  title: entry.title,
  layer: SOURCE_LAYERS.CANONICAL,
  authorityLevel: entry.authorityLevel,
  updateFrequency: "static",
  retrievalMode: "manifest-only",
  trustNotes: "Outward authoritative church source; remains external and unmodified by Liahona.",
  path: entry.path,
  type: entry.type,
  scope: entry.scope
}));

function getCanonicalSources() {
  return canonicalSources.map((source) => ({ ...source }));
}

function getCanonicalSourceById(id) {
  const source = canonicalSources.find((entry) => entry.id === id);
  return source ? { ...source } : null;
}

module.exports = {
  canonicalSources,
  getCanonicalSources,
  getCanonicalSourceById
};
