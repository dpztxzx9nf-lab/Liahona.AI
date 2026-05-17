const MESSAGE_CLASSIFICATIONS = Object.freeze({
  QUESTION: "QUESTION",
  COMMAND: "COMMAND",
  JOURNAL_ENTRY: "JOURNAL_ENTRY",
  REFLECTION: "REFLECTION",
  CASUAL_CHAT: "CASUAL_CHAT",
  SYSTEM_UPDATE: "SYSTEM_UPDATE",
  UNKNOWN: "UNKNOWN"
});

function normalizeText(text) {
  return String(text || "").replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function isQuestionLike(text) {
  return text.endsWith("?") || hasAny(text, [
    /^(who|what|when|where|why|how|can|could|would|should|is|are|do|does|did|will)\b/,
    /\b(tell me|explain|help me understand)\b/,
    /\bwhat['’]?s\b/
  ]);
}

function classifyMessage(content) {
  const text = normalizeText(content);

  if (!text) {
    return MESSAGE_CLASSIFICATIONS.UNKNOWN;
  }

  if (hasAny(text, [
    /\b(system update|status update|runtime update|deployment update|ops update)\b/,
    /\b(deployed|restarted|crashed|fixed|patched|shipped|released|rolled back|rollback)\b/,
    /\b(liahona is online|liahona is down|bot is online|bot is down)\b/
  ])) {
    return MESSAGE_CLASSIFICATIONS.SYSTEM_UPDATE;
  }

  if (hasAny(text, [
    /\b(journal|diary|log this|note this|record this)\b/,
    /\b(today i|i feel|i felt|i noticed|i learned|i realized|i'm grateful|i am grateful)\b/
  ])) {
    return MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY;
  }

  if (isQuestionLike(text)) {
    return MESSAGE_CLASSIFICATIONS.QUESTION;
  }

  if (hasAny(text, [
    /^!/,
    /^(please\s+)?(write|draft|compose|create|make|build|summarize|rewrite|search|find|remember|recall|look up|explain)\b/,
    /\b(make me|show me|give me|tell me)\b/
  ])) {
    return MESSAGE_CLASSIFICATIONS.COMMAND;
  }

  if (hasAny(text, [
    /\b(i think|i wonder|i'm worried|im worried|i am worried|i'm trying to understand)\b/,
    /\b(help me process|sitting with|thinking about|reflecting on)\b/
  ])) {
    return MESSAGE_CLASSIFICATIONS.REFLECTION;
  }

  if (hasAny(text, [
    /\b(thanks|thank you|good morning|good night|hello|hi|hey)\b/,
    /\b(how are you|what's up|whats up)\b/
  ])) {
    return MESSAGE_CLASSIFICATIONS.CASUAL_CHAT;
  }

  return MESSAGE_CLASSIFICATIONS.UNKNOWN;
}

module.exports = {
  MESSAGE_CLASSIFICATIONS,
  classifyMessage,
  isQuestionLike
};
