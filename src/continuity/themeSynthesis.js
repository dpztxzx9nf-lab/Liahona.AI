const THEME_CONCEPTS = Object.freeze({
  autonomy: ["autonomy", "agency", "choice", "choose", "freedom", "independent", "control"],
  meaning: ["meaning", "meaningful", "significance", "matter", "matters"],
  continuity: ["continuity", "memory", "remember", "recurring", "again", "returned", "pattern"],
  faith: ["faith", "prayer", "pray", "god", "spiritual", "church", "scripture"],
  purpose: ["purpose", "calling", "direction", "mission", "aim", "why"],
  fear: ["fear", "afraid", "anxiety", "anxious", "worry", "worried", "scared"],
  growth: ["growth", "grow", "learning", "learned", "change", "becoming", "practice"],
  identity: ["identity", "self", "myself", "who", "become", "belong"],
  relationships: ["relationship", "relationships", "family", "friend", "friends", "marriage", "community"],
  "creation/building": ["create", "creation", "building", "build", "making", "project"]
});

const STOPWORDS = new Set([
  "a", "about", "again", "an", "and", "are", "as", "at", "be", "but", "by",
  "can", "could", "do", "does", "feel", "felt", "for", "from", "had", "has",
  "have", "how", "into", "is", "it", "its", "just", "me", "my", "of", "on",
  "or", "that", "the", "this", "to", "today", "was", "what", "when", "where",
  "who", "why", "will", "with", "would", "you", "your"
]);

function normalizeText(text) {
  return String(text || "").replace(/[\u2018\u2019]/g, "'").trim().toLowerCase();
}

function entryText(entry) {
  return normalizeText(`${entry?.summary || ""} ${entry?.original_message || ""}`);
}

function tokenize(text) {
  return normalizeText(text).match(/[a-z0-9']{3,}/g) || [];
}

function keywords(text) {
  return tokenize(text).filter((token) => !STOPWORDS.has(token));
}

function phrases(text) {
  const words = keywords(text);
  const result = [];

  for (let index = 0; index < words.length - 1; index += 1) {
    result.push(`${words[index]} ${words[index + 1]}`);
  }

  return result;
}

function conceptMatches(text, conceptTerms) {
  const tokens = new Set(keywords(text));
  return conceptTerms.filter((term) => tokens.has(term));
}

function countByEntry(entries, extractor) {
  const counts = new Map();

  entries.forEach((entry, entryIndex) => {
    const values = new Set(extractor(entryText(entry)));

    for (const value of values) {
      if (!counts.has(value)) {
        counts.set(value, new Set());
      }

      counts.get(value).add(entryIndex);
    }
  });

  return counts;
}

function synthesizeRecurringThemes(entries) {
  if (!Array.isArray(entries) || entries.length < 2) {
    return [];
  }

  const conceptEntryCounts = new Map();
  const conceptEvidence = new Map();

  for (const [theme, terms] of Object.entries(THEME_CONCEPTS)) {
    const matchingEntries = new Set();
    const evidenceTerms = new Set();

    entries.forEach((entry, entryIndex) => {
      const matches = conceptMatches(entryText(entry), terms);

      if (matches.length > 0) {
        matchingEntries.add(entryIndex);
        matches.forEach((match) => evidenceTerms.add(match));
      }
    });

    conceptEntryCounts.set(theme, matchingEntries.size);
    conceptEvidence.set(theme, evidenceTerms);
  }

  const repeatedKeywordCounts = countByEntry(entries, keywords);
  const repeatedPhraseCounts = countByEntry(entries, phrases);
  const recurringThemes = [];

  for (const [theme, entryCount] of conceptEntryCounts.entries()) {
    if (entryCount < 2) {
      continue;
    }

    const themeTerms = new Set(THEME_CONCEPTS[theme]);
    const repeatedTerms = [...repeatedKeywordCounts.entries()]
      .filter(([term, entryIndexes]) => themeTerms.has(term) && entryIndexes.size >= 2)
      .map(([term]) => term);
    const repeatedThemePhrases = [...repeatedPhraseCounts.entries()]
      .filter(([phrase, entryIndexes]) =>
        entryIndexes.size >= 2 &&
        phrase.split(" ").some((term) => themeTerms.has(term))
      )
      .map(([phrase]) => phrase);

    const confidence = Math.min(
      0.95,
      0.45 + entryCount * 0.15 + repeatedTerms.length * 0.1 + repeatedThemePhrases.length * 0.1
    );

    if (confidence < 0.7) {
      continue;
    }

    recurringThemes.push({
      theme,
      confidence: Number(confidence.toFixed(2)),
      evidence_count: entryCount,
      evidence_terms: [...new Set([
        ...conceptEvidence.get(theme),
        ...repeatedTerms,
        ...repeatedThemePhrases
      ])].slice(0, 6),
      guidance: "Mention cautiously only if it directly helps the reply; use language like \"you've returned to this tension several times\"."
    });
  }

  return recurringThemes
    .sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }

      return b.evidence_count - a.evidence_count;
    })
    .slice(0, 3);
}

module.exports = {
  THEME_CONCEPTS,
  synthesizeRecurringThemes,
  keywords,
  phrases
};
