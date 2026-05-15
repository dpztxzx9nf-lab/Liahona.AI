const continuitySources = [];

function getContinuitySources() {
  return continuitySources.map((source) => ({ ...source }));
}

function getContinuitySourceById(id) {
  const source = continuitySources.find((entry) => entry.id === id);
  return source ? { ...source } : null;
}

module.exports = {
  continuitySources,
  getContinuitySources,
  getContinuitySourceById
};
