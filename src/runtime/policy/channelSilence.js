const { isForumOrThread, directlyMentionsLiahona } = require("./forumThrottle");

function isDirectMessage(message) {
  return !message.guild;
}

function isReplyToBot(message, clientUserId) {
  return Boolean(
    clientUserId &&
    message.mentions?.repliedUser?.id === clientUserId
  );
}

function isClearlyInvoked(content) {
  return /\bliahona\b/i.test(content || "");
}

function shouldApplyChannelSilence(message) {
  if (isDirectMessage(message)) {
    return false;
  }

  if (isForumOrThread(message)) {
    return false;
  }

  return Boolean(message.guild);
}

function applyChannelSilence(message, interpretation, clientUserId) {
  if (!interpretation.shouldRespond || !shouldApplyChannelSilence(message)) {
    return interpretation;
  }

  if (interpretation.intent === "high-risk") {
    return interpretation;
  }

  if (directlyMentionsLiahona(message, clientUserId)) {
    return interpretation;
  }

  if (isReplyToBot(message, clientUserId)) {
    return interpretation;
  }

  if (isClearlyInvoked(message.content)) {
    return interpretation;
  }

  return {
    ...interpretation,
    shouldRespond: false,
    responseReason: "channel_silence_not_invoked"
  };
}

module.exports = {
  applyChannelSilence,
  shouldApplyChannelSilence
};
