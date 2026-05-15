const PROJECTION_KINDS = {
  PLAIN_REPLY: "plain-reply",
  SOURCED_REPLY: "sourced-reply",
  CONTINUITY_FRAGMENT: "continuity-fragment",
  ARTIFACT_FRAGMENT: "artifact-fragment"
};

function createPlainReply({ text, metadata = {} }) {
  return {
    kind: PROJECTION_KINDS.PLAIN_REPLY,
    text: text ?? "",
    sources: [],
    metadata
  };
}

function createSourcedReply({ text, sources = [], metadata = {} }) {
  return {
    kind: PROJECTION_KINDS.SOURCED_REPLY,
    text: text ?? "",
    sources,
    metadata
  };
}

function createContinuityFragment({ text, continuity = {}, metadata = {} }) {
  return {
    kind: PROJECTION_KINDS.CONTINUITY_FRAGMENT,
    text: text ?? "",
    sources: [],
    continuity,
    metadata
  };
}

function createArtifactFragment({ text, artifact = {}, metadata = {} }) {
  return {
    kind: PROJECTION_KINDS.ARTIFACT_FRAGMENT,
    text: text ?? "",
    sources: [],
    artifact,
    metadata
  };
}

function getProjectionText(projection) {
  if (typeof projection === "string") {
    return projection;
  }

  return projection?.text ?? "";
}

function isProjection(value) {
  return Boolean(value && typeof value === "object" && value.kind);
}

module.exports = {
  PROJECTION_KINDS,
  createPlainReply,
  createSourcedReply,
  createContinuityFragment,
  createArtifactFragment,
  getProjectionText,
  isProjection
};
