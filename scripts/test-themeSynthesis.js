const assert = require("assert");
const { synthesizeRecurringThemes } = require("../src/continuity/themeSynthesis");
const { buildInputMessages } = require("../src/execution/generateReply");

const repeatedFaithEntries = [
  {
    summary: "Prayer helped me feel calmer about work.",
    original_message: "Today I noticed prayer helped me feel calmer about work."
  },
  {
    summary: "Faith came up again while deciding how to handle work fear.",
    original_message: "I returned to faith and prayer while deciding what to do next."
  },
  {
    summary: "System update: restarted the bot after deployment.",
    original_message: "System update: restarted Liahona after deployment."
  }
];

const themes = synthesizeRecurringThemes(repeatedFaithEntries);
assert.ok(themes.length > 0, "repeated themes should be detectable");
assert.strictEqual(themes[0].theme, "faith");
assert.ok(themes[0].confidence >= 0.7, "repeated theme should meet confidence threshold");

const unrelatedThemeNames = themes.map((theme) => theme.theme);
assert.ok(
  !unrelatedThemeNames.includes("creation/building"),
  "unrelated system/deployment entry should not create a recurring building theme"
);

const lowConfidenceThemes = synthesizeRecurringThemes([
  {
    summary: "I prayed before work today.",
    original_message: "I prayed before work today."
  },
  {
    summary: "The deployment restarted cleanly.",
    original_message: "System update: deployment restarted cleanly."
  }
]);

assert.deepStrictEqual(
  lowConfidenceThemes,
  [],
  "single-entry or weak themes should be suppressed"
);

const prompt = buildInputMessages({
  content: "Why do I keep returning to faith when work feels uncertain?",
  interpretation: {
    responseStyle: "one-grounded-observation-max",
    intent: "reflective"
  },
  retrievedContext: repeatedFaithEntries,
  recurringThemes: themes
});

assert.ok(
  prompt.some((message) =>
    message.role === "system" &&
    message.content.includes("Recurring themes") &&
    message.content.includes("Do not over-psychoanalyze")
  ),
  "prompt should include cautious recurring-theme context"
);

console.log("theme synthesis tests passed");
