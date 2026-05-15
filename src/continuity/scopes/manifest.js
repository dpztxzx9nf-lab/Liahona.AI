const continuityScopes = [
  {
    id: "personal",
    title: "Personal",
    description: "Private, user-scoped memory such as DMs. Intended to be more temporary and independently resettable.",
    persistenceLevel: "session-to-durable",
    retrievalUse: "personal-context-and-preferences"
  },
  {
    id: "server",
    title: "Server",
    description: "Guild- or community-scoped continuity across channels and members on a server.",
    persistenceLevel: "durable",
    retrievalUse: "community-and-server-context"
  },
  {
    id: "channel",
    title: "Channel",
    description: "Channel-scoped conversation context within a server or community space.",
    persistenceLevel: "durable",
    retrievalUse: "channel-topic-and-recent-context"
  },
  {
    id: "thread",
    title: "Thread",
    description: "Thread- or forum-post-scoped context, including replies and synthesis across a thread.",
    persistenceLevel: "durable",
    retrievalUse: "thread-lineage-and-replies"
  },
  {
    id: "journal",
    title: "Journal",
    description: "Reflective or journal-oriented entries and connective reflection over time.",
    persistenceLevel: "archival",
    retrievalUse: "reflection-and-journal-continuity"
  },
  {
    id: "world",
    title: "World",
    description: "Broad shared or public continuity that spans beyond a single channel or thread when needed.",
    persistenceLevel: "archival",
    retrievalUse: "shared-public-context"
  },
  {
    id: "project",
    title: "Project",
    description: "Liahona project continuity: architecture, governance, and meaningful evolution checkpoints.",
    persistenceLevel: "permanent-project",
    retrievalUse: "project-evolution-and-checkpoints"
  }
];

function getContinuityScopes() {
  return continuityScopes.map((scope) => ({ ...scope }));
}

function getContinuityScopeById(id) {
  const scope = continuityScopes.find((entry) => entry.id === id);
  return scope ? { ...scope } : null;
}

module.exports = {
  continuityScopes,
  getContinuityScopes,
  getContinuityScopeById
};
