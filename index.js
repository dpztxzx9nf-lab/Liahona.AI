require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { handleMessage } = require("./src/runtime/pipeline/handleMessage");
const { createCanonicalPort } = require("./src/ports/CanonicalPort");
const { createContinuityPort } = require("./src/ports/ContinuityPort");
const { createInterpretivePort } = require("./src/ports/InterpretivePort");
const { createProjectionPort } = require("./src/ports/ProjectionPort");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Liahona is alive.");
});

app.listen(port, () => {
  console.log(`Keepalive server listening on port ${port}`);
});

const ports = {
  canonical: createCanonicalPort(),
  continuity: createContinuityPort(),
  interpretive: createInterpretivePort(),
  projection: createProjectionPort()
};

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

client.on("messageCreate", async (message) => {
  await handleMessage(message, {
    clientUserId: client.user?.id,
    ports
  });
});

if (!process.env.DISCORD_TOKEN) {
  console.warn("DISCORD_TOKEN is not set. Discord client was not started.");
} else {
  client.login(process.env.DISCORD_TOKEN);
}
