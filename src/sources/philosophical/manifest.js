const { SOURCE_LAYERS } = require("../layers");
const { createSourceRecord } = require("../schema");

const philosophicalSources = [
  createSourceRecord({
    id: "sep",
    title: "Stanford Encyclopedia of Philosophy",
    layer: SOURCE_LAYERS.PHILOSOPHICAL,
    authorityLevel: "philosophical-reference",
    updateFrequency: "slow",
    retrievalMode: "not-implemented",
    trustNotes: "Supports philosophical clarity; not doctrinal authority."
  }),
  createSourceRecord({
    id: "iep",
    title: "Internet Encyclopedia of Philosophy",
    layer: SOURCE_LAYERS.PHILOSOPHICAL,
    authorityLevel: "philosophical-reference",
    updateFrequency: "slow",
    retrievalMode: "not-implemented",
    trustNotes: "Supports philosophical clarity; not doctrinal authority."
  })
];

function getPhilosophicalSources() {
  return philosophicalSources.map((source) => ({ ...source }));
}

function getPhilosophicalSourceById(id) {
  const source = philosophicalSources.find((entry) => entry.id === id);
  return source ? { ...source } : null;
}

module.exports = {
  philosophicalSources,
  getPhilosophicalSources,
  getPhilosophicalSourceById
};
