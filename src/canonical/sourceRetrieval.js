const { CANONICAL_MODES } = require("./grounding");

const CANONICAL_REFERENCES = Object.freeze([
  {
    source: "Book of Mormon",
    reference: "Alma 36",
    summary: "Alma describes repentance, remembrance of Christ, and receiving mercy after deep guilt.",
    keywords: ["repentance", "repent", "forgiveness", "forgive", "forgiven", "sin", "mercy", "christ", "atonement"],
    themes: ["repentance_forgiveness", "christ"]
  },
  {
    source: "Bible",
    reference: "James 1:5",
    summary: "James teaches that those who lack wisdom may ask God in faith.",
    keywords: ["prayer", "pray", "wisdom", "ask", "god", "faith", "doubt"],
    themes: ["prayer", "faith_doubt", "explicit_spiritual_question"]
  },
  {
    source: "Book of Mormon",
    reference: "Ether 12:6",
    summary: "Moroni teaches that faith is tested before receiving a witness.",
    keywords: ["faith", "doubt", "witness", "trial", "testimony", "belief", "believe"],
    themes: ["faith_doubt"]
  },
  {
    source: "Bible",
    reference: "Matthew 11:28-30",
    summary: "Christ invites the weary and burdened to come unto Him and find rest.",
    keywords: ["christ", "jesus", "savior", "burden", "weary", "rest", "suffering", "sorrow"],
    themes: ["christ", "meaning_purpose_suffering"]
  },
  {
    source: "Book of Mormon",
    reference: "2 Nephi 2",
    summary: "Lehi teaches agency, opposition, joy, and moral choice within God's plan.",
    keywords: ["agency", "choice", "choose", "purpose", "opposition", "joy", "moral", "right thing", "wrong"],
    themes: ["moral_direction", "meaning_purpose_suffering", "eternal_perspective"]
  },
  {
    source: "Doctrine and Covenants",
    reference: "Doctrine and Covenants 121:7-9",
    summary: "The Lord speaks comfort in affliction and frames suffering with patience and hope.",
    keywords: ["suffering", "affliction", "trial", "fear", "comfort", "hope", "patience"],
    themes: ["meaning_purpose_suffering", "eternal_perspective"]
  },
  {
    source: "Book of Mormon",
    reference: "Moroni 10:3-5",
    summary: "Moroni invites sincere prayer and spiritual seeking about truth.",
    keywords: ["scripture", "book of mormon", "prayer", "pray", "truth", "holy ghost", "spirit"],
    themes: ["scripture", "prayer", "explicit_spiritual_question"]
  }
]);

const STOPWORDS = new Set([
  "a", "about", "and", "are", "for", "from", "how", "into", "the", "this",
  "that", "what", "when", "where", "who", "why", "with", "your", "should"
]);

function normalizeText(text) {
  return String(text || "").replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();
}

function tokens(text) {
  return normalizeText(text).match(/[a-z0-9']{3,}/g) || [];
}

function keywords(text) {
  return tokens(text).filter((token) => !STOPWORDS.has(token));
}

function sourceScore({ content, canonicalContext, reference }) {
  const queryTerms = new Set([
    ...keywords(content),
    ...(canonicalContext?.matched_terms || []).map(normalizeText),
    canonicalContext?.canonical_trigger
  ].filter(Boolean));

  if (queryTerms.size === 0) {
    return 0;
  }

  const referenceKeywords = new Set(reference.keywords.map(normalizeText));
  let score = 0;

  for (const term of queryTerms) {
    if (referenceKeywords.has(term)) {
      score += 1;
    }
  }

  if (reference.themes.includes(canonicalContext?.canonical_trigger)) {
    score += 1.5;
  }

  return score;
}

function retrieveCanonicalSources({ content, canonicalContext, limit = 3 } = {}) {
  if (canonicalContext?.canonical_mode !== CANONICAL_MODES.DIRECT) {
    return [];
  }

  if (!canonicalContext?.canonical_trigger || canonicalContext.confidence < 0.45) {
    return [];
  }

  return CANONICAL_REFERENCES
    .map((reference) => ({
      source: reference.source,
      reference: reference.reference,
      summary: reference.summary,
      relevance: Number(sourceScore({ content, canonicalContext, reference }).toFixed(2))
    }))
    .filter((reference) => reference.relevance >= 2)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

module.exports = {
  CANONICAL_REFERENCES,
  retrieveCanonicalSources,
  sourceScore
};
