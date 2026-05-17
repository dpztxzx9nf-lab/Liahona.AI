const CANONICAL_MODES = Object.freeze({
  NONE: "NONE",
  LIGHT: "LIGHT",
  DIRECT: "DIRECT"
});

const TRIGGERS = Object.freeze({
  explicit_spiritual_question: {
    terms: ["god", "christ", "jesus", "holy ghost", "spirit", "gospel", "doctrine", "scripture"],
    weight: 0.45
  },
  repentance_forgiveness: {
    terms: ["repentance", "repent", "forgiveness", "forgive", "forgiven", "sin", "atonement"],
    weight: 0.45
  },
  meaning_purpose_suffering: {
    terms: ["meaning", "purpose", "suffering", "suffer", "sorrow", "grief", "trial", "burden"],
    weight: 0.3
  },
  faith_doubt: {
    terms: ["faith", "doubt", "doubting", "belief", "believe", "testimony"],
    weight: 0.4
  },
  prayer: {
    terms: ["prayer", "pray", "prayed", "praying"],
    weight: 0.35
  },
  scripture: {
    terms: ["scripture", "scriptures", "bible", "book of mormon", "doctrine and covenants", "pearl of great price"],
    weight: 0.5
  },
  christ: {
    terms: ["christ", "jesus", "savior", "redeemer", "atonement"],
    weight: 0.5
  },
  church: {
    terms: ["church", "ward", "bishop", "sacrament", "temple", "covenant"],
    weight: 0.3
  },
  moral_direction: {
    terms: ["right thing", "wrong", "moral", "ethical", "commandment", "should i"],
    weight: 0.3
  },
  eternal_perspective: {
    terms: ["eternal", "eternity", "salvation", "resurrection", "heaven", "plan of salvation"],
    weight: 0.45
  }
});

function normalizeText(text) {
  return String(text || "").replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();
}

function isQuestionLike(text) {
  const normalized = normalizeText(text);
  return normalized.endsWith("?") ||
    /^(who|what|when|where|why|how|can|could|would|should|is|are|do|does|did|will)\b/.test(normalized);
}

function includesTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(text);
}

function matchedTriggers(content) {
  const text = normalizeText(content);

  return Object.entries(TRIGGERS)
    .map(([trigger, config]) => {
      const matched_terms = config.terms.filter((term) => includesTerm(text, term));

      if (matched_terms.length === 0) {
        return null;
      }

      return {
        trigger,
        matched_terms,
        weight: config.weight
      };
    })
    .filter(Boolean);
}

function hasFalsePositiveContext(content) {
  const text = normalizeText(content);

  return [
    /\bchurch (building|parking|gym|address|website)\b/,
    /\bchristmas\b/,
    /\bpray tell\b/,
    /\bfaith in (the )?(market|economy|system|process|algorithm)\b/
  ].some((pattern) => pattern.test(text));
}

function directSpiritualAsk(content, matches) {
  if (!isQuestionLike(content)) {
    return false;
  }

  return matches.some(({ trigger }) => [
    "explicit_spiritual_question",
    "repentance_forgiveness",
    "faith_doubt",
    "prayer",
    "scripture",
    "christ",
    "moral_direction",
    "eternal_perspective"
  ].includes(trigger));
}

function detectCanonicalContext({ content, classification, directQuestion = false } = {}) {
  const text = normalizeText(content);
  const matches = matchedTriggers(text);

  if (!text || matches.length === 0 || hasFalsePositiveContext(text)) {
    return {
      canonical_trigger: null,
      canonical_mode: CANONICAL_MODES.NONE,
      confidence: 0,
      matched_terms: [],
      guardrails: []
    };
  }

  if (classification === "JOURNAL_ENTRY" && !directQuestion) {
    return {
      canonical_trigger: null,
      canonical_mode: CANONICAL_MODES.NONE,
      confidence: 0,
      matched_terms: [],
      guardrails: []
    };
  }

  const baseScore = matches.reduce((total, match) => total + match.weight, 0);
  const termBoost = Math.min(
    0.2,
    Math.max(0, [...new Set(matches.flatMap((match) => match.matched_terms))].length - 1) * 0.1
  );
  const questionBoost = isQuestionLike(text) || directQuestion ? 0.25 : 0;
  const reflectionBoost = classification === "REFLECTION" ? 0.1 : 0;
  const confidence = Math.min(0.95, baseScore + termBoost + questionBoost + reflectionBoost);
  const primary = matches.sort((a, b) => b.weight - a.weight)[0];

  if (confidence < 0.45) {
    return {
      canonical_trigger: null,
      canonical_mode: CANONICAL_MODES.NONE,
      confidence: Number(confidence.toFixed(2)),
      matched_terms: [...new Set(matches.flatMap((match) => match.matched_terms))],
      guardrails: []
    };
  }

  const mode = directSpiritualAsk(text, matches) || confidence >= 0.75
    ? CANONICAL_MODES.DIRECT
    : CANONICAL_MODES.LIGHT;

  return {
    canonical_trigger: primary.trigger,
    canonical_mode: mode,
    confidence: Number(confidence.toFixed(2)),
    matched_terms: [...new Set(matches.flatMap((match) => match.matched_terms))],
    guardrails: [
      "Never pretend revelation.",
      "Never claim divine authority.",
      "Distinguish interpretation from doctrine.",
      "Avoid manipulative spirituality.",
      "Avoid forced scripture injection."
    ]
  };
}

module.exports = {
  CANONICAL_MODES,
  detectCanonicalContext,
  matchedTriggers
};
