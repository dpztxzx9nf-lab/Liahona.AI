const assert = require("assert");
const { CANONICAL_MODES, detectCanonicalContext } = require("../src/canonical/grounding");
const { retrieveCanonicalSources } = require("../src/canonical/sourceRetrieval");
const { buildInputMessages } = require("../src/execution/generateReply");
const { MESSAGE_CLASSIFICATIONS } = require("../src/interpretive/classifyMessage");

const directContext = detectCanonicalContext({
  content: "How can I think about repentance and forgiveness through Christ?",
  classification: MESSAGE_CLASSIFICATIONS.QUESTION,
  directQuestion: true
});

const directSources = retrieveCanonicalSources({
  content: "How can I think about repentance and forgiveness through Christ?",
  canonicalContext: directContext
});

assert.strictEqual(directContext.canonical_mode, CANONICAL_MODES.DIRECT);
assert.ok(Array.isArray(directSources), "direct retrieval should return an array");
assert.ok(directSources.length > 0, "direct spiritual questions should retrieve relevant references");
assert.ok(directSources.length <= 3, "canonical retrieval should stay small");
assert.ok(
  directSources.some((source) => source.reference === "Alma 36"),
  "repentance/forgiveness question should retrieve Alma 36"
);
assert.ok(
  !directSources.some((source) => source.reference === "Doctrine and Covenants 121:7-9"),
  "irrelevant suffering references should be suppressed for repentance questions"
);

for (const source of directSources) {
  assert.ok(source.source, "source should include source name");
  assert.ok(source.reference, "source should include reference");
  assert.ok(source.summary, "source should include short summary");
  assert.ok(source.relevance >= 2, "source should meet relevance threshold");
}

const lightContext = detectCanonicalContext({
  content: "I keep wondering about meaning and purpose during this hard season.",
  classification: MESSAGE_CLASSIFICATIONS.REFLECTION,
  directQuestion: false
});

const lightSources = retrieveCanonicalSources({
  content: "I keep wondering about meaning and purpose during this hard season.",
  canonicalContext: lightContext
});

assert.strictEqual(lightContext.canonical_mode, CANONICAL_MODES.LIGHT);
assert.deepStrictEqual(lightSources, [], "ordinary reflections should not retrieve canonical sources");

const lowConfidenceSources = retrieveCanonicalSources({
  content: "Should I choose a different project name?",
  canonicalContext: {
    canonical_mode: CANONICAL_MODES.DIRECT,
    canonical_trigger: "moral_direction",
    confidence: 0.3,
    matched_terms: ["should i"]
  }
});

assert.deepStrictEqual(
  lowConfidenceSources,
  [],
  "low-confidence canonical retrieval should return empty"
);

const prompt = buildInputMessages({
  content: "How can I think about repentance and forgiveness through Christ?",
  interpretation: {
    responseStyle: "direct-educational-answer",
    intent: "question"
  },
  canonicalContext: directContext,
  canonicalSources: directSources
});

assert.ok(
  prompt.some((message) =>
    message.role === "system" &&
    message.content.includes("Canonical sources") &&
    message.content.includes("grounding references, not final authority") &&
    message.content.includes("Avoid excessive scripture dumping")
  ),
  "prompt should include canonical sources and strict restraint guidance"
);

console.log("canonical source retrieval tests passed");
