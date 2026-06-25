const INTENTS = new Set([
  "casual",
  "question",
  "creative",
  "project_status",
  "reflective",
  "retrieval",
  "journal",
  "social",
  "philosophical",
  "high-risk"
]);

function normalizeText(text) {
  return text.replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function classifyProjectStatusQuestion(content) {
  const text = normalizeText(content);

  return hasAny(text, [
    /\b(liahona|your|you|the bot|this bot|runtime|code|repo|repository|system|project)\b.*\b(code|repo|repository|runtime|architecture|system|project|status|update|updates|changed|changes|new|latest|version|release|commit|commits)\b/,
    /\b(what['']?s new|what is new|any updates?|latest|current status|status update)\b.*\b(your code|the code|runtime|repo|repository|your architecture|the architecture|system architecture|project|liahona|the bot|this bot|kindex|#?journal|gospel|scripture|canonical|sources?|continuity)\b/,
    /\b(what['']?s new|what is new|any updates?|latest|current status|status update)\b.*#journal\b/,
    /\b(what is|what['']?s|explain|describe)\s+liahona\b/,
    /\b(liahona)\b.*\b(what is|what['']?s|architecture|runtime|code|status|updates?)\b/
  ]);
}

function classifyProtectedLiveSourceQuestion(content) {
  const text = normalizeText(content);

  if (/^what['']?s new\??$/.test(text) || /^what is new\??$/.test(text)) {
    return true;
  }

  return hasAny(text, [
    /\bwhat['']?s new\b.*(?:\bliahona\b|\bkindex\b|#journal\b|\bjournal\b|\bgospel\b|\bscripture\b|\bcanonical\b|\bsources?\b|\bcontinuity\b|\barchitecture\b|\bruntime\b|\bjesus\b|\bchrist\b|\bsavior\b)/,
    /\bwhat is new\b.*(?:\bliahona\b|\bkindex\b|#journal\b|\bjournal\b|\bgospel\b|\bscripture\b|\bcanonical\b|\bsources?\b|\bcontinuity\b|\barchitecture\b|\bruntime\b|\bjesus\b|\bchrist\b|\bsavior\b)/
  ]);
}

function classifyNeedsLiveSource(content) {
  const text = normalizeText(content);

  if (classifyProjectStatusQuestion(text)) {
    return false;
  }

  if (classifyProtectedLiveSourceQuestion(text)) {
    return false;
  }

  return hasAny(text, [
    /\b(right now|as of today|today|tonight|currently|latest|breaking|just now)\b/,
    /\bwhat['']?s new\b/,
    /\b(happening now|going on now|in the news)\b/,
    /\b(news|headlines|live update|current events)\b/,
    /\b(stock price|market today|weather today)\b/
  ]);
}

function classifyIntent(content) {
  const text = normalizeText(content);

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

  if (classifyProjectStatusQuestion(text)) {
    return "project_status";
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
    /\b(meaning of life|why are we here|purpose of existence)\b/,
    /\b(soul|morality|consciousness|existential)\b/,
    /\b(doctrine of|philosophy of|the nature of truth)\b/
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
    /^(who|what|when|where|why|how|can|could|would|should|is|are|do|does)\b/,
    /\bwhat is\b/,
    /\bwhat's\b/,
    /\bwho was\b/,
    /\bwho is\b/
  ])) {
    return "question";
  }

  return "casual";
}

function getResponseStyle(intent, needsLiveSource) {
  if (needsLiveSource) {
    return "live-events-honest-limit";
  }

  const styles = {
    casual: "silent-or-one-short-line",
    question: "direct-educational-answer",
    project_status: "project-status-honest-limit",
    creative: "practical-output-only",
    reflective: "one-grounded-observation-max",
    retrieval: "honest-limit-brief",
    journal: "brief-acknowledgment-only",
    social: "warm-one-line-max",
    philosophical: "direct-educational-answer",
    "high-risk": "supportive-safety-first"
  };

  return styles[intent] || styles.casual;
}

function getMaxOutputTokens(intent, needsLiveSource) {
  if (needsLiveSource) {
    return 100;
  }

  const limits = {
    casual: 40,
    social: 60,
    question: 180,
    project_status: 140,
    journal: 80,
    retrieval: 100,
    reflective: 140,
    philosophical: 180,
    creative: 240,
    "high-risk": 180
  };

  return limits[intent] || 120;
}

function interpretMessage(message) {
  const content = normalizeText(
    typeof message === "string" ? message : message?.content || ""
  );
  const intent = classifyIntent(content);
  const needsLiveSource = classifyNeedsLiveSource(content);
  const hasContent = Boolean(content.trim());

  if (!INTENTS.has(intent)) {
    throw new Error(`Unknown intent: ${intent}`);
  }

  return {
    intent,
    shouldRespond: hasContent,
    responseReason: hasContent ? "message-has-content" : "empty-message",
    responseStyle: getResponseStyle(intent, needsLiveSource),
    maxOutputTokens: getMaxOutputTokens(intent, needsLiveSource),
    needsRetrieval: intent === "retrieval",
    needsProjectStatus: intent === "project_status",
    needsLiveSource
  };
}

module.exports = {
  INTENTS,
  interpretMessage,
  classifyProjectStatusQuestion,
  classifyProtectedLiveSourceQuestion,
  classifyNeedsLiveSource,
  classifyIntent,
  getMaxOutputTokens
};
