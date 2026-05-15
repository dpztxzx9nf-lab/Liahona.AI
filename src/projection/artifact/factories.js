const { createArtifactFragment } = require("../types");
const {
  ARTIFACT_FRAGMENT_TYPES,
  createArtifactFragmentRecord
} = require("./types");

function toArtifactProjection(record) {
  return createArtifactFragment({
    text: record.text,
    artifact: {
      type: record.type,
      payload: record.payload
    },
    metadata: record.metadata
  });
}

function createOrientationFragment({ text = "", orientation = {}, metadata = {} }) {
  const record = createArtifactFragmentRecord({
    type: ARTIFACT_FRAGMENT_TYPES.ORIENTATION,
    text,
    payload: { orientation },
    metadata
  });

  return toArtifactProjection(record);
}

function createCanonicalGroundingFragment({
  text = "",
  grounding = {},
  metadata = {}
}) {
  const record = createArtifactFragmentRecord({
    type: ARTIFACT_FRAGMENT_TYPES.CANONICAL_GROUNDING,
    text,
    payload: { grounding },
    metadata
  });

  return toArtifactProjection(record);
}

function createContinuityCheckpointFragment({
  text = "",
  checkpoint = {},
  metadata = {}
}) {
  const record = createArtifactFragmentRecord({
    type: ARTIFACT_FRAGMENT_TYPES.CONTINUITY_CHECKPOINT,
    text,
    payload: { checkpoint },
    metadata
  });

  return toArtifactProjection(record);
}

function createReflectionFragment({ text = "", reflection = {}, metadata = {} }) {
  const record = createArtifactFragmentRecord({
    type: ARTIFACT_FRAGMENT_TYPES.REFLECTION,
    text,
    payload: { reflection },
    metadata
  });

  return toArtifactProjection(record);
}

function createRuntimeStateFragment({ text = "", runtime = {}, metadata = {} }) {
  const record = createArtifactFragmentRecord({
    type: ARTIFACT_FRAGMENT_TYPES.RUNTIME_STATE,
    text,
    payload: { runtime },
    metadata
  });

  return toArtifactProjection(record);
}

module.exports = {
  createOrientationFragment,
  createCanonicalGroundingFragment,
  createContinuityCheckpointFragment,
  createReflectionFragment,
  createRuntimeStateFragment
};
