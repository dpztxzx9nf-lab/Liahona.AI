const assert = require("assert");
const { sanitizeDiagnosticFields } = require("../src/runtime/diagnostics/logger");

const SECRET_USER_TEXT = "private user confession about work and family";
const SECRET_PROMPT_TEXT = "private final prompt with retrieved context";
const SECRET_CONTEXT_TEXT = "private recalled journal entry";
const SECRET_RESPONSE_TEXT = "private generated assistant reply";
const SECRET_TERM = "confession";

const sanitized = sanitizeDiagnosticFields({
  original_message: SECRET_USER_TEXT,
  summary: SECRET_CONTEXT_TEXT,
  generated_response: SECRET_RESPONSE_TEXT,
  classification: "JOURNAL_ENTRY",
  channelType: "DM",
  final_prompt: [
    { role: "system", content: SECRET_PROMPT_TEXT },
    { role: "user", content: SECRET_USER_TEXT }
  ],
  retrieved_context: [
    {
      classification: "JOURNAL_ENTRY",
      original_message: SECRET_CONTEXT_TEXT,
      summary: SECRET_CONTEXT_TEXT,
      relevance_score: 1.75
    }
  ],
  recurring_themes: [
    {
      theme: "faith",
      confidence: 0.85,
      evidence_count: 2,
      evidence_terms: [SECRET_TERM]
    }
  ],
  canonical_sources: [
    {
      source: "Bible",
      reference: "James 1:5",
      summary: SECRET_CONTEXT_TEXT,
      relevance: 2.25
    }
  ],
  coherence: {
    coherent: false,
    reason: "no-meaningful-overlap",
    original_terms: [SECRET_TERM],
    response_terms: ["reply"]
  },
  errorMessage: "network timeout"
});

const serialized = JSON.stringify(sanitized);

assert.strictEqual(serialized.includes(SECRET_USER_TEXT), false);
assert.strictEqual(serialized.includes(SECRET_PROMPT_TEXT), false);
assert.strictEqual(serialized.includes(SECRET_CONTEXT_TEXT), false);
assert.strictEqual(serialized.includes(SECRET_RESPONSE_TEXT), false);
assert.strictEqual(serialized.includes(SECRET_TERM), false);

assert.deepStrictEqual(sanitized.original_message, {
  redacted: true,
  length: SECRET_USER_TEXT.length
});
assert.deepStrictEqual(sanitized.generated_response, {
  redacted: true,
  length: SECRET_RESPONSE_TEXT.length
});
assert.strictEqual(sanitized.final_prompt.message_count, 2);
assert.deepStrictEqual(sanitized.final_prompt.roles, ["system", "user"]);
assert.strictEqual(sanitized.retrieved_context.entry_count, 1);
assert.deepStrictEqual(sanitized.retrieved_context.classifications, {
  JOURNAL_ENTRY: 1
});
assert.strictEqual(sanitized.recurring_themes.theme_count, 1);
assert.deepStrictEqual(sanitized.recurring_themes.themes, [
  {
    theme: "faith",
    confidence: 0.85,
    evidence_count: 2
  }
]);
assert.strictEqual(sanitized.canonical_sources.source_count, 1);
assert.deepStrictEqual(sanitized.canonical_sources.references, [
  {
    source: "Bible",
    reference: "James 1:5",
    relevance: 2.25
  }
]);
assert.deepStrictEqual(sanitized.coherence, {
  coherent: false,
  reason: "no-meaningful-overlap",
  original_term_count: 1,
  response_term_count: 1
});
assert.strictEqual(sanitized.classification, "JOURNAL_ENTRY");
assert.strictEqual(sanitized.channelType, "DM");
assert.strictEqual(sanitized.errorMessage, "network timeout");

console.log("diagnostics redaction tests passed");
