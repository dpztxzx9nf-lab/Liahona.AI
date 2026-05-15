require("dotenv").config();

const express = require("express");
const { ChannelType, Client, GatewayIntentBits, Partials } = require("discord.js");
const { interpretMessage } = require("./src/interpretive/interpretMessage");
const { applyForumThrottle } = require("./src/runtime/policy/forumThrottle");
const { generateReply } = require("./src/execution/generateReply");
const { chooseDeliveryStyle, sendMessage } = require("./src/delivery/sendMessage");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Liahona is alive.");
});

app.listen(port, () => {
  console.log(`Keepalive server listening on port ${port}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("clientReady", () => {
  console.log(`Liahona online as ${client.user.tag}`);
});

function getChannelTypeName(channelType) {
  return ChannelType[channelType] || String(channelType ?? "unknown");
}

function getMessageDiagnostics(message) {
  const isDM = !message.guild;

  return {
    messageId: message.id,
    authorUsername: message.author?.username || "unknown",
    isBot: Boolean(message.author?.bot),
    guildName: message.guild?.name || "DM",
    channelName: message.channel?.name || "DM",
    channelId: message.channel?.id,
    channelType: getChannelTypeName(message.channel?.type),
    isDM,
    contentLength: message.content?.length || 0
  };
}

function logDiagnostic(event, details) {
  console.log(event, details);
}

client.on("messageCreate", async (message) => {
  const messageDiagnostics = getMessageDiagnostics(message);

  logDiagnostic("MESSAGE_RECEIVED", messageDiagnostics);

  if (message.author.bot) {
    return;
  }

  const interpretation = applyForumThrottle(
    message,
    interpretMessage(message),
    client.user?.id
  );
  const deliveryStyle = chooseDeliveryStyle(message);

  logDiagnostic("INTERPRETATION_RESULT", {
    messageId: message.id,
    intent: interpretation.intent,
    responseStyle: interpretation.responseStyle,
    needsRetrieval: interpretation.needsRetrieval,
    shouldRespond: interpretation.shouldRespond,
    responseReason: interpretation.responseReason,
    deliveryStyle
  });

  if (!interpretation.shouldRespond) {
    return;
  }

  let reply;
  const generationStartedAt = Date.now();

  try {
    reply = await generateReply({
      content: message.content,
      interpretation
    });
    logDiagnostic("GENERATION_RESULT", {
      messageId: message.id,
      success: true,
      replyLength: reply?.length || 0,
      latencyMs: Date.now() - generationStartedAt
    });
  } catch (error) {
    logDiagnostic("GENERATION_RESULT", {
      messageId: message.id,
      success: false,
      replyLength: 0,
      errorMessage: error.message,
      latencyMs: Date.now() - generationStartedAt
    });
    console.error("reply generation failed", error);
    reply = "I had trouble answering that.";
  }

  const deliveryStartedAt = Date.now();
  let deliveryResult;

  try {
    deliveryResult = await sendMessage(message, reply);
  } catch (error) {
    logDiagnostic("DELIVERY_RESULT", {
      messageId: message.id,
      success: false,
      deliveryStyle,
      channelId: message.channel?.id,
      errorCode: error.code,
      errorMessage: error.message,
      latencyMs: Date.now() - deliveryStartedAt
    });
    console.error("reply delivery failed", error);
    return;
  }

  logDiagnostic("DELIVERY_RESULT", {
    messageId: message.id,
    success: true,
    deliveryStyle: deliveryResult?.deliveryStyle || deliveryStyle,
    channelId: message.channel?.id,
    latencyMs: Date.now() - deliveryStartedAt
  });
});

if (!process.env.DISCORD_TOKEN) {
  console.warn("DISCORD_TOKEN is not set. Discord client was not started.");
} else {
  client.login(process.env.DISCORD_TOKEN);
}
