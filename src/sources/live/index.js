const manifest = require("./manifest");
const {
  getLiveSourceConfig,
  getLiveSourceConfigSummary,
  parseBoolean
} = require("./config");
const {
  GOOGLE_SEARCH_ENDPOINT,
  GOOGLE_MAX_RESULTS_PER_REQUEST,
  searchGoogle
} = require("./googleSearch");
const { searchX } = require("./xSearch");

module.exports = {
  ...manifest,
  getLiveSourceConfig,
  getLiveSourceConfigSummary,
  parseBoolean,
  GOOGLE_SEARCH_ENDPOINT,
  GOOGLE_MAX_RESULTS_PER_REQUEST,
  searchGoogle,
  searchX
};
