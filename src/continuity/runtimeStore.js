const fs = require("fs");
const path = require("path");

const DEFAULT_STORE_PATH = path.resolve(__dirname, "..", "..", "data", "continuity.jsonl");
const STOPWORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could",
  "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "my",
  "of", "on", "or", "should", "that", "the", "this", "to", "tell", "was", "what",
  "when", "where", "who", "why", "will", "with", "would", "you", "your"
]);

function normalizeText(text) {
  return String(text || "").replace(/[\u2018\u2019]/g, "'").trim();
}

function summarizeText(text) {
  const normalized = normalizeText(text).replace(/\s+/g, " ");
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

function tokenize(text) {
  return normalizeText(text)
    .toLowerCase()
    .match(/[a-z0-9']{3,}/g) || [];
}

function keywords(text) {
  return tokenize(text).filter((token) => !STOPWORDS.has(token));
}

function scoreEntry(queryText, entry) {
  const queryKeywords = keywords(queryText);
  const entryKeywords = keywords(`${entry.summary || ""} ${entry.original_message || ""}`);

  if (queryKeywords.length === 0 || entryKeywords.length === 0) {
    return 0;
  }

  const entryCounts = new Map();
  for (const keyword of entryKeywords) {
    entryCounts.set(keyword, (entryCounts.get(keyword) || 0) + 1);
  }

  let score = 0;
  for (const keyword of new Set(queryKeywords)) {
    if (entryCounts.has(keyword)) {
      score += 1 + Math.min(entryCounts.get(keyword), 3) * 0.25;
    }
  }

  return score;
}

function readEntries(storePath) {
  if (!fs.existsSync(storePath)) {
    return [];
  }

  return fs.readFileSync(storePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function createContinuityStore({ storePath, dbPath } = {}) {
  const filePath = storePath || dbPath || DEFAULT_STORE_PATH;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  function store(entry) {
    const originalMessage = normalizeText(entry.original_message);

    if (!originalMessage) {
      return null;
    }

    const payload = {
      ts: entry.ts || new Date().toISOString(),
      author_user_id: entry.author_user_id || null,
      channel_id: entry.channel_id || null,
      channel_name: entry.channel_name || null,
      classification: entry.classification || "UNKNOWN",
      original_message: originalMessage,
      summary: normalizeText(entry.summary) || summarizeText(originalMessage)
    };

    const entries = readEntries(filePath);
    const id = entries.length > 0 ? Math.max(...entries.map((item) => Number(item.id) || 0)) + 1 : 1;
    const stored = { id, ...payload };
    fs.appendFileSync(filePath, `${JSON.stringify(stored)}\n`);
    return stored;
  }

  function recall(message, { limit = 3 } = {}) {
    const queryText = typeof message === "string" ? message : message?.content || "";
    const ranked = readEntries(filePath)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 200)
      .map((entry) => ({
        ...entry,
        relevance_score: scoreEntry(queryText, entry)
      }))
      .filter((entry) => entry.relevance_score >= 1.25)
      .sort((a, b) => {
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }

        return new Date(b.ts).getTime() - new Date(a.ts).getTime();
      })
      .slice(0, limit);

    return ranked.length > 0 ? ranked : null;
  }

  function close() {
    return undefined;
  }

  return {
    store,
    recall,
    close
  };
}

module.exports = {
  DEFAULT_STORE_PATH,
  createContinuityStore,
  keywords,
  scoreEntry,
  summarizeText
};
