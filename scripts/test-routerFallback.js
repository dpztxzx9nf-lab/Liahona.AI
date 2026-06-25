const assert = require("assert");
const {
  interpretMessage,
  classifyNeedsLiveSource
} = require("../src/interpretive/interpretMessage");
const {
  classifyMessage,
  MESSAGE_CLASSIFICATIONS
} = require("../src/interpretive/classifyMessage");
const { fallbackReply } = require("../src/execution/generateReply");
const { applyChannelSilence } = require("../src/runtime/policy/channelSilence");

const CLIENT_USER_ID = "liahona-user";

function dmMessage(content) {
  return {
    id: `dm-${content.length}`,
    content,
    guild: null,
    mentions: {
      users: new Map(),
      repliedUser: null
    }
  };
}

function guildMessage(content) {
  return {
    id: `guild-${content.length}`,
    content,
    guild: { id: "guild-1", name: "Guild" },
    channel: { id: "channel-1", name: "general" },
    mentions: {
      users: new Map(),
      repliedUser: null
    }
  };
}

function routeSnapshot(content) {
  const interpretation = interpretMessage(content);

  return {
    content,
    classification: classifyMessage(content),
    intent: interpretation.intent,
    needsLiveSource: interpretation.needsLiveSource,
    needsRetrieval: interpretation.needsRetrieval,
    shouldRespondInDm: applyChannelSilence(
      dmMessage(content),
      interpretation,
      CLIENT_USER_ID
    ).shouldRespond,
    shouldRespondInUninvokedGuildChannel: applyChannelSilence(
      guildMessage(content),
      interpretation,
      CLIENT_USER_ID
    ).shouldRespond,
    responseStyle: interpretation.responseStyle,
    fallback: fallbackReply(content, interpretation)
  };
}

const cases = [
  {
    content: "What's new with your code?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: true,
      needsRetrieval: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "Reuters",
      knownGap: "project/status wording is currently treated as live-source wording"
    }
  },
  {
    content: "Any updates on your architecture?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: false,
      needsRetrieval: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallback: "",
      knownGap: "architecture questions are not separately routed yet"
    }
  },
  {
    content: "What is Liahona?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: false,
      needsRetrieval: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: true,
      fallback: "",
      knownGap: "identity questions are not separately routed yet"
    }
  },
  {
    content: "What's happening in the news today?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: true,
      needsRetrieval: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "Reuters"
    }
  },
  {
    content: "How smart are you?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: false,
      needsRetrieval: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallback: ""
    }
  },
  {
    content: "What do you remember about me?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "retrieval",
      needsLiveSource: false,
      needsRetrieval: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallback: "I don't hold that continuity here."
    }
  },
  {
    content: "Give me a reflection prompt.",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.COMMAND,
      intent: "casual",
      needsLiveSource: false,
      needsRetrieval: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallback: "",
      knownGap: "reflection-prompt commands are currently interpreted as casual"
    }
  }
];

for (const testCase of cases) {
  const actual = routeSnapshot(testCase.content);
  const { expected } = testCase;

  assert.strictEqual(actual.classification, expected.classification, testCase.content);
  assert.strictEqual(actual.intent, expected.intent, testCase.content);
  assert.strictEqual(actual.needsLiveSource, expected.needsLiveSource, testCase.content);
  assert.strictEqual(actual.needsRetrieval, expected.needsRetrieval, testCase.content);
  assert.strictEqual(actual.shouldRespondInDm, expected.shouldRespondInDm, testCase.content);
  assert.strictEqual(
    actual.shouldRespondInUninvokedGuildChannel,
    expected.shouldRespondInUninvokedGuildChannel,
    testCase.content
  );

  if (Object.prototype.hasOwnProperty.call(expected, "fallback")) {
    assert.strictEqual(actual.fallback, expected.fallback, testCase.content);
  }

  if (expected.fallbackIncludes) {
    assert.ok(actual.fallback.includes(expected.fallbackIncludes), testCase.content);
  }
}

assert.strictEqual(
  classifyNeedsLiveSource("What's new with your code?"),
  true,
  "current project/status wording misroutes through live-source detection"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's happening in the news today?"),
  true,
  "public news wording should continue to use live-source detection"
);
assert.deepStrictEqual(
  cases
    .filter((testCase) => testCase.expected.knownGap)
    .map((testCase) => testCase.content),
  [
    "What's new with your code?",
    "Any updates on your architecture?",
    "What is Liahona?",
    "Give me a reflection prompt."
  ],
  "known routing gaps should remain explicit before router changes"
);

console.log("router fallback tests passed");
