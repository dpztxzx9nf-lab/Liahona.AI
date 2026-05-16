const assert = require("assert");
const {
  interpretMessage,
  classifyIntent,
  classifyNeedsLiveSource
} = require("../src/interpretive/interpretMessage");
const { fallbackReply } = require("../src/execution/generateReply");

const educationalCases = [
  "What's game theory?",
  "What is energy?",
  "What's capitalism?",
  "Who was Napoleon?"
];

for (const input of educationalCases) {
  const result = interpretMessage(input);
  assert.strictEqual(result.intent, "question", `${input} should be question`);
  assert.strictEqual(result.needsLiveSource, false, `${input} should not need live source`);
  assert.strictEqual(result.shouldRespond, true, `${input} should respond`);
  assert.ok(
    result.responseStyle.includes("educational"),
    `${input} should use educational style`
  );
  assert.strictEqual(
    fallbackReply(input, result),
    "",
    `${input} should not use timid fallback`
  );
}

const liveCases = [
  "What's new with Trump?",
  "What is happening in the news today?",
  "Any breaking headlines right now?"
];

for (const input of liveCases) {
  const result = interpretMessage(input);
  assert.strictEqual(result.needsLiveSource, true, `${input} should need live source`);
  assert.ok(
    fallbackReply(input, result).includes("Reuters"),
    `${input} should point to live sources`
  );
}

assert.strictEqual(classifyIntent("Hello?"), "social");
assert.strictEqual(classifyNeedsLiveSource("What is game theory?"), false);

console.log("interpretMessage tests passed");
