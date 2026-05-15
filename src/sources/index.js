const { SOURCE_LAYERS } = require("./layers");
const { createSourceRecord } = require("./schema");
const canonical = require("./canonical/manifest");
const philosophical = require("./philosophical/manifest");
const live = require("./live/manifest");
const continuity = require("./continuity/manifest");
const runtime = require("./runtime/manifest");

const sourcesByLayer = {
  [SOURCE_LAYERS.CANONICAL]: canonical.getCanonicalSources,
  [SOURCE_LAYERS.PHILOSOPHICAL]: philosophical.getPhilosophicalSources,
  [SOURCE_LAYERS.LIVE]: live.getLiveSources,
  [SOURCE_LAYERS.CONTINUITY]: continuity.getContinuitySources,
  [SOURCE_LAYERS.RUNTIME]: runtime.getRuntimeSources
};

function getAllSources() {
  return Object.values(sourcesByLayer).flatMap((getSources) => getSources());
}

function getSourcesByLayer(layer) {
  const getSources = sourcesByLayer[layer];
  return getSources ? getSources() : [];
}

function getSourceById(id) {
  return getAllSources().find((source) => source.id === id) || null;
}

module.exports = {
  SOURCE_LAYERS,
  createSourceRecord,
  canonical,
  philosophical,
  live,
  continuity,
  runtime,
  getAllSources,
  getSourcesByLayer,
  getSourceById
};
