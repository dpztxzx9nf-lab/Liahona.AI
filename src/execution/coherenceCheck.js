const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could",
  "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "my",
  "of", "on", "or", "should", "that", "the", "this", "to", "was", "what",
  "when", "where", "who", "why", "will", "with", "would", "you", "your"
]);

function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .match(/[a-z0-9']{3,}/g) || [];
}

function meaningfulTokens(text) {
  return tokens(text).filter((token) => !STOPWORDS.has(token));
}

function hasMeaningfulOverlap(originalTokens, responseTokens) {
  const responseSet = new Set(responseTokens);
  const overlap = originalTokens.filter((token) => responseSet.has(token));
  const required = originalTokens.length >= 6 ? 2 : 1;

  return overlap.length >= required;
}

function checkResponseCoherence({ originalMessage, generatedResponse, interpretation }) {
  const response = String(generatedResponse || "").trim();

  if (!response) {
    return { coherent: true, reason: "empty-response" };
  }

  if (interpretation?.intent === "high-risk") {
    return { coherent: true, reason: "high-risk-safety-response" };
  }

  if (interpretation?.needsLiveSource) {
    return { coherent: true, reason: "live-source-limit-response" };
  }

  const originalTokens = meaningfulTokens(originalMessage);
  const responseTokens = meaningfulTokens(response);

  if (originalTokens.length < 2 || responseTokens.length < 2) {
    return { coherent: true, reason: "too-little-text-to-judge" };
  }

  if (hasMeaningfulOverlap(originalTokens, responseTokens)) {
    return { coherent: true, reason: "token-overlap" };
  }

  return {
    coherent: false,
    reason: "no-meaningful-overlap",
    original_terms: originalTokens.slice(0, 12),
    response_terms: responseTokens.slice(0, 12)
  };
}

module.exports = {
  checkResponseCoherence
};
