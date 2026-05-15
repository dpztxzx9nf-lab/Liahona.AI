const { SOURCE_LAYERS } = require("../layers");
const { createSourceRecord } = require("../schema");

const liveSources = [
  createSourceRecord({
    id: "x",
    title: "X",
    layer: SOURCE_LAYERS.LIVE,
    authorityLevel: "news-social-reference",
    updateFrequency: "continuous",
    retrievalMode: "not-implemented",
    trustNotes: "Live social signal only; verify independently."
  }),
  createSourceRecord({
    id: "ap",
    title: "Associated Press",
    layer: SOURCE_LAYERS.LIVE,
    authorityLevel: "news-reference",
    updateFrequency: "continuous",
    retrievalMode: "not-implemented",
    trustNotes: "Current events reference only; verify independently."
  }),
  createSourceRecord({
    id: "reuters",
    title: "Reuters",
    layer: SOURCE_LAYERS.LIVE,
    authorityLevel: "news-reference",
    updateFrequency: "continuous",
    retrievalMode: "not-implemented",
    trustNotes: "Current events reference only; verify independently."
  })
];

function getLiveSources() {
  return liveSources.map((source) => ({ ...source }));
}

function getLiveSourceById(id) {
  const source = liveSources.find((entry) => entry.id === id);
  return source ? { ...source } : null;
}

module.exports = {
  liveSources,
  getLiveSources,
  getLiveSourceById
};
