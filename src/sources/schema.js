function createSourceRecord({
  id,
  title,
  layer,
  authorityLevel,
  updateFrequency,
  retrievalMode,
  trustNotes,
  ...optional
}) {
  return {
    id,
    title,
    layer,
    authorityLevel,
    updateFrequency,
    retrievalMode,
    trustNotes,
    ...optional
  };
}

module.exports = {
  createSourceRecord
};
