const assert = require("assert");
const { ChannelType } = require("discord.js");
const { deliverDiscordMessage } = require("../src/projection/discord/deliver");
const { createPlainReply } = require("../src/projection/types");

function missingPermissionsError() {
  const error = new Error("Missing Permissions");
  error.code = 50013;
  return error;
}

async function testReplyFallbackSucceeds() {
  const sent = [];
  const message = {
    id: "source-1",
    channel: {
      id: "thread-1",
      name: "forum-post",
      type: ChannelType.PublicThread,
      parent: {
        id: "forum-1",
        type: ChannelType.GuildForum
      },
      archived: false,
      locked: false,
      send: async (content) => {
        sent.push(content);
        return { id: "fallback-outbound-1" };
      }
    },
    reply: async () => {
      throw missingPermissionsError();
    }
  };

  const result = await deliverDiscordMessage(
    message,
    createPlainReply({ text: "fallback please" }),
    { projection_id: "projection-1" }
  );

  assert.strictEqual(result.outbound_message_id, "fallback-outbound-1");
  assert.strictEqual(result.attempted_outbound_method, "message.reply");
  assert.strictEqual(result.outbound_method, "channel.send");
  assert.strictEqual(result.fallback_used, true);
  assert.strictEqual(result.fallback_reason, "DISCORD_MISSING_PERMISSIONS");
  assert.strictEqual(result.is_thread, true);
  assert.strictEqual(result.is_forum_post, true);
  assert.strictEqual(result.archived, false);
  assert.strictEqual(result.locked, false);
  assert.deepStrictEqual(sent, ["fallback please"]);
}

async function testPermissionFailureSuppressed() {
  const message = {
    id: "source-2",
    channel: {
      id: "thread-2",
      name: "locked-post",
      type: ChannelType.PublicThread,
      archived: true,
      locked: true,
      send: async () => {
        throw missingPermissionsError();
      }
    },
    reply: async () => {
      throw missingPermissionsError();
    }
  };

  const result = await deliverDiscordMessage(
    message,
    createPlainReply({ text: "cannot send" }),
    { projection_id: "projection-2" }
  );

  assert.strictEqual(result.skipped, true);
  assert.strictEqual(result.reason, "discord-missing-permissions");
  assert.strictEqual(result.permission_error_suppressed, true);
  assert.strictEqual(result.fallback_used, true);
  assert.strictEqual(result.outbound_method, "channel.send");
  assert.strictEqual(result.error_code, 50013);
  assert.strictEqual(result.archived, true);
  assert.strictEqual(result.locked, true);
}

async function run() {
  await testReplyFallbackSucceeds();
  await testPermissionFailureSuppressed();
  console.log("discord projection tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
