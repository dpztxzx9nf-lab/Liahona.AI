const ARTIFACT_FRAGMENT_TYPES = {
  ORIENTATION: "orientation",
  CANONICAL_GROUNDING: "canonical-grounding",
  CONTINUITY_CHECKPOINT: "continuity-checkpoint",
  REFLECTION: "reflection",
  RUNTIME_STATE: "runtime-state"
};

function createArtifactFragmentRecord({
  type,
  text = "",
  payload = {},
  metadata = {}
}) {
  return {
    type,
    text,
    payload,
    metadata
  };
}

module.exports = {
  ARTIFACT_FRAGMENT_TYPES,
  createArtifactFragmentRecord
};
