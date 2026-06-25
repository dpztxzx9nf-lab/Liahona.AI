const assert = require("assert");
const {
  interpretMessage,
  classifyProjectStatusQuestion,
  classifyProtectedLiveSourceQuestion,
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
    needsProjectStatus: interpretation.needsProjectStatus,
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
    content: "What's new?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallback: ""
    }
  },
  {
    content: "What's new with your code?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "known structure",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's new with Kindex?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "KINDEX",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's new with #journal in Kindex?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "journal",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's new with #journal?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "journal",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's new with Jesus?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallback: ""
    }
  },
  {
    content: "What's new with the gospel?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "source history",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "Any updates on your architecture?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "architecture",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What is Liahona?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "project_status",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: true,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: true,
      fallbackIncludes: "known structure",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's happening in the news today?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: true,
      needsRetrieval: false,
      needsProjectStatus: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "live source access enabled",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "Any major headlines today?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: true,
      needsRetrieval: false,
      needsProjectStatus: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "live source access enabled",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's new with Trump?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: true,
      needsRetrieval: false,
      needsProjectStatus: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "live source access enabled",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "What's new in Ukraine?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: true,
      needsRetrieval: false,
      needsProjectStatus: false,
      shouldRespondInDm: true,
      shouldRespondInUninvokedGuildChannel: false,
      fallbackIncludes: "live source access enabled",
      fallbackExcludes: "Reuters"
    }
  },
  {
    content: "How smart are you?",
    expected: {
      classification: MESSAGE_CLASSIFICATIONS.QUESTION,
      intent: "question",
      needsLiveSource: false,
      needsRetrieval: false,
      needsProjectStatus: false,
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
      needsProjectStatus: false,
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
      needsProjectStatus: false,
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
  assert.strictEqual(actual.needsProjectStatus, expected.needsProjectStatus, testCase.content);
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

  if (expected.fallbackExcludes) {
    assert.strictEqual(actual.fallback.includes(expected.fallbackExcludes), false, testCase.content);
  }
}

assert.strictEqual(
  classifyNeedsLiveSource("What's new?"),
  false,
  "bare what's-new wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProtectedLiveSourceQuestion("What's new?"),
  true,
  "bare what's-new wording should be protected as ambiguous"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with your code?"),
  false,
  "project/status wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's new with your code?"),
  true,
  "project/status wording should be identifiable before live-source routing"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with Kindex?"),
  false,
  "internal KINDEX wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's new with Kindex?"),
  true,
  "internal KINDEX wording should be guarded before live-source routing"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with #journal in Kindex?"),
  false,
  "internal journal/KINDEX wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's new with #journal in Kindex?"),
  true,
  "internal journal/KINDEX wording should be guarded before live-source routing"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with #journal?"),
  false,
  "internal journal wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProtectedLiveSourceQuestion("What's new with #journal?"),
  true,
  "internal journal wording should be guarded before live-source routing"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with Jesus?"),
  false,
  "spiritual wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProtectedLiveSourceQuestion("What's new with Jesus?"),
  true,
  "spiritual wording should be guarded before live-source routing"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with the gospel?"),
  false,
  "gospel/source wording should not route through live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's new with the gospel?"),
  true,
  "gospel/source wording should be guarded before live-source routing"
);
assert.strictEqual(
  classifyNeedsLiveSource("Any major headlines today?"),
  true,
  "public headline wording should use live-source detection"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's happening in the news today?"),
  true,
  "public news wording should continue to use live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's happening in the news today?"),
  false,
  "public news wording should not be treated as project status"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new with Trump?"),
  true,
  "public figure wording should still route through live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's new with Trump?"),
  false,
  "public figure wording should not be treated as project status"
);
assert.strictEqual(
  classifyNeedsLiveSource("What's new in Ukraine?"),
  true,
  "public current-events wording should still route through live-source detection"
);
assert.strictEqual(
  classifyProjectStatusQuestion("What's new in Ukraine?"),
  false,
  "public current-events wording should not be treated as project status"
);
assert.deepStrictEqual(
  cases
    .filter((testCase) => testCase.expected.knownGap)
    .map((testCase) => testCase.content),
  [
    "Give me a reflection prompt."
  ],
  "known routing gaps should remain explicit before router changes"
);

console.log("router fallback tests passed");
