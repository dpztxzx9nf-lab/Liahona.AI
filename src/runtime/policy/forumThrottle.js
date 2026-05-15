const { ChannelType } = require("discord.js");
const { channelBehavior } = require("../../interpretive/channelBehavior");

const threadMessageCounts = new Map();
const threadChannelTypes = new Set([
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.AnnouncementThread
]);

function isForumOrThread(message) {
  return threadChannelTypes.has(message.channel?.type) ||
    message.channel?.parent?.type === ChannelType.GuildForum;
}

function directlyMentionsLiahona(message, clientUserId) {
  return Boolean(clientUserId && message.mentions?.users?.has(clientUserId));
}

function applyForumThrottle(message, interpretation, clientUserId) {
  if (!interpretation.shouldRespond || !isForumOrThread(message)) {
    return interpretation;
  }

  const channelId = message.channel?.id;
  const interval = channelBehavior.forumResponseIntervalMessages;

  if (!channelId || !Number.isInteger(interval) || interval <= 1) {
    return interpretation;
  }

  if (directlyMentionsLiahona(message, clientUserId)) {
    threadMessageCounts.set(channelId, 0);
    return interpretation;
  }

  const messageCount = (threadMessageCounts.get(channelId) || 0) + 1;
  threadMessageCounts.set(channelId, messageCount);

  if (messageCount < interval) {
    return {
      ...interpretation,
      shouldRespond: false,
      responseReason: "forum_throttle_wait"
    };
  }

  threadMessageCounts.set(channelId, 0);
  return interpretation;
}

module.exports = {
  applyForumThrottle,
  isForumOrThread,
  directlyMentionsLiahona
};
