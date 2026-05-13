// Planning-only channel behavior notes.
//
// Most entries are planning notes. Keep future tuning incremental so regular
// channel behavior, showcase acknowledgments, journal reflections, forum
// synthesis, and DM digest delivery can be adjusted without changing login,
// generation, or delivery flow.

const channelBehavior = {
  forumResponseIntervalMessages: 3,
  regular: {
    intent: "mostly-human-space",
    futureBehavior: "Liahona should rarely speak unless directly useful."
  },
  showcase: {
    intent: "light-acknowledgment",
    futureBehavior: "Liahona can offer brief encouragement or recognition."
  },
  journal: {
    intent: "connective-reflection",
    futureBehavior: "Liahona can return later with intermittent reflection."
  },
  forum: {
    intent: "structured-synthesis",
    futureBehavior: "Liahona can synthesize threads when that behavior is added."
  },
  dm: {
    intent: "personal-interaction",
    futureBehavior: "Liahona can support personal interaction and future digest delivery."
  }
};

module.exports = {
  channelBehavior
};
