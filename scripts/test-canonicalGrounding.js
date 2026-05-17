const assert = require("assert");
const {
  CANONICAL_MODES,
  detectCanonicalContext
} = require("../src/canonical/grounding");
const { buildInputMessages } = require("../src/execution/generateReply");
const { MESSAGE_CLASSIFICATIONS } = require("../src/interpretive/classifyMessage");

const ordinaryJournal = detectCanonicalContext({
  content: "Today I prayed and felt calmer before work.",
  classification: MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY,
  directQuestion: false
});

assert.strictEqual(
  ordinaryJournal.canonical_mode,
  CANONICAL_MODES.NONE,
  "ordinary journal entries should not trigger canonical grounding"
);
assert.strictEqual(ordinaryJournal.canonical_trigger, null);

const directSpiritualQuestion = detectCanonicalContext({
  content: "How should I think about repentance and forgiveness in light of Christ?",
  classification: MESSAGE_CLASSIFICATIONS.QUESTION,
  directQuestion: true
});

assert.strictEqual(
  directSpiritualQuestion.canonical_mode,
  CANONICAL_MODES.DIRECT,
  "direct spiritual questions should allow direct canonical grounding"
);
assert.ok(directSpiritualQuestion.confidence >= 0.7);
assert.ok(directSpiritualQuestion.matched_terms.includes("repentance"));
assert.ok(directSpiritualQuestion.guardrails.some((guardrail) => guardrail.includes("divine authority")));

const lowConfidence = detectCanonicalContext({
  content: "The church building parking lot was full.",
  classification: MESSAGE_CLASSIFICATIONS.UNKNOWN,
  directQuestion: false
});

assert.strictEqual(
  lowConfidence.canonical_mode,
  CANONICAL_MODES.NONE,
  "low-confidence or contextual false positives should be suppressed"
);

const lightContext = detectCanonicalContext({
  content: "I keep wondering about meaning and purpose during this hard season.",
  classification: MESSAGE_CLASSIFICATIONS.REFLECTION,
  directQuestion: false
});

assert.strictEqual(
  lightContext.canonical_mode,
  CANONICAL_MODES.LIGHT,
  "personal meaning/purpose reflection should allow light orientation only"
);

const prompt = buildInputMessages({
  content: "How should I think about repentance and forgiveness in light of Christ?",
  interpretation: {
    responseStyle: "direct-educational-answer",
    intent: "question"
  },
  canonicalContext: directSpiritualQuestion
});

assert.ok(
  prompt.some((message) =>
    message.role === "system" &&
    message.content.includes("Canonical context") &&
    message.content.includes("never pretend revelation") &&
    message.content.includes("natural spiritual orientation")
  ),
  "prompt should include canonical context and guardrails"
);

console.log("canonical grounding tests passed");
