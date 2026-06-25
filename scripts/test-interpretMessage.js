const assert = require("assert");
const {
  interpretMessage,
  classifyIntent,
  classifyProjectStatusQuestion,
  classifyNeedsLiveSource
} = require("../src/interpretive/interpretMessage");
const {
  classifyMessage,
  MESSAGE_CLASSIFICATIONS
} = require("../src/interpretive/classifyMessage");
const { fallbackReply } = require("../src/execution/generateReply");
const { checkResponseCoherence } = require("../src/execution/coherenceCheck");

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

const projectStatusCases = [
  "What's new with your code?",
  "Any updates on your architecture?",
  "What is Liahona?"
];

for (const input of projectStatusCases) {
  const result = interpretMessage(input);
  assert.strictEqual(result.intent, "project_status", `${input} should be project status`);
  assert.strictEqual(result.needsLiveSource, false, `${input} should not need live source`);
  assert.strictEqual(result.needsProjectStatus, true, `${input} should need project status`);
  assert.strictEqual(classifyProjectStatusQuestion(input), true, `${input} should match project status`);
  assert.strictEqual(
    fallbackReply(input, result).includes("live repo access"),
    true,
    `${input} should get honest repo-access fallback`
  );
}

assert.strictEqual(classifyIntent("Hello?"), "social");
assert.strictEqual(classifyNeedsLiveSource("What is game theory?"), false);
assert.strictEqual(classifyProjectStatusQuestion("What's new with Trump?"), false);
assert.strictEqual(
  classifyMessage("Today I noticed I was calmer after prayer."),
  MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY
);
assert.strictEqual(
  classifyMessage("System update: restarted the bot."),
  MESSAGE_CLASSIFICATIONS.SYSTEM_UPDATE
);
assert.strictEqual(
  classifyMessage("What is game theory?"),
  MESSAGE_CLASSIFICATIONS.QUESTION
);
assert.strictEqual(
  checkResponseCoherence({
    originalMessage: "What is game theory?",
    generatedResponse: "Game theory studies strategic decisions between people or systems.",
    interpretation: interpretMessage("What is game theory?")
  }).coherent,
  true
);
assert.strictEqual(
  checkResponseCoherence({
    originalMessage: "What is game theory?",
    generatedResponse: "Napoleon was a French military leader.",
    interpretation: interpretMessage("What is game theory?")
  }).coherent,
  false
);

console.log("interpretMessage tests passed");
