const INTENTS = new Set([
  "casual",
  "question",
  "creative",
  "reflective",
  "retrieval",
  "journal",
  "social",
  "philosophical",
  "high-risk"
]);

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function classifyIntent(content) {
  const text = content.trim().toLowerCase();

  if (!text) {
    return "casual";
  }

  if (hasAny(text, [
    /\b(kill myself|suicide|self[-\s]?harm|hurt myself)\b/,
    /\b(overdose|cut myself)\b/,
    /\b(make a bomb|poison someone|hide a body)\b/
  ])) {
    return "high-risk";
  }

  if (hasAny(text, [
    /\b(remember|recall|find|look up|search|retrieve)\b/,
    /\b(what did i say|what was that|where is)\b/
  ])) {
    return "retrieval";
  }

  if (hasAny(text, [
    /\b(journal|diary|log this|note this|record this)\b/,
    /\b(today i|i feel|i felt)\b/
  ])) {
    return "journal";
  }

  if (hasAny(text, [
    /\b(write|draft|compose|story|poem|song|rewrite|brainstorm)\b/,
    /\b(make me|create|invent)\b/
  ])) {
    return "creative";
  }

  if (hasAny(text, [
    /\b(meaning of life|existence|soul|truth|morality|consciousness)\b/,
    /\b(god|faith|doctrine|philosophy)\b/
  ])) {
    return "philosophical";
  }

  if (hasAny(text, [
    /\b(i think|i wonder|i'm worried|im worried|i am worried)\b/,
    /\b(why do i|how should i think|help me process)\b/
  ])) {
    return "reflective";
  }

  if (hasAny(text, [
    /\b(thanks|thank you|good morning|good night|hello|hi|hey)\b/,
    /\b(how are you|what's up|whats up)\b/
  ])) {
    return "social";
  }

  if (text.endsWith("?") || hasAny(text, [
    /^(who|what|when|where|why|how|can|could|would|should|is|are|do|does)\b/
  ])) {
    return "question";
  }

  return "casual";
}

function getResponseStyle(intent) {
  const styles = {
    casual: "brief-natural",
    question: "direct-answer-first",
    creative: "useful-creative",
    reflective: "grounded-reflective",
    retrieval: "honest-retrieval",
    journal: "acknowledge-briefly",
    social: "warm-brief",
    philosophical: "plain-non-preachy",
    "high-risk": "supportive-safety-first"
  };

  return styles[intent] || styles.casual;
}

function interpretMessage(message) {
  const content = typeof message === "string" ? message : message?.content || "";
  const intent = classifyIntent(content);
  const hasContent = Boolean(content.trim());

  if (!INTENTS.has(intent)) {
    throw new Error(`Unknown intent: ${intent}`);
  }

  return {
    intent,
    shouldRespond: hasContent,
    responseReason: hasContent ? "message-has-content" : "empty-message",
    responseStyle: getResponseStyle(intent),
    needsRetrieval: intent === "retrieval"
  };
}

module.exports = {
  INTENTS,
  interpretMessage
};
