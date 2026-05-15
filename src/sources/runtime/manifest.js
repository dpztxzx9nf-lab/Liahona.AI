const runtimeSources = [];

function getRuntimeSources() {
  return runtimeSources.map((source) => ({ ...source }));
}

function getRuntimeSourceById(id) {
  const source = runtimeSources.find((entry) => entry.id === id);
  return source ? { ...source } : null;
}

module.exports = {
  runtimeSources,
  getRuntimeSources,
  getRuntimeSourceById
};
