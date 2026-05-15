require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { handleMessage } = require("./src/runtime/pipeline/handleMessage");
const { createCanonicalPort } = require("./src/ports/CanonicalPort");
const { createContinuityPort } = require("./src/ports/ContinuityPort");
const { createInterpretivePort } = require("./src/ports/InterpretivePort");
const { createProjectionPort } = require("./src/ports/ProjectionPort");
const {
  logDiagnostic,
  logError,
  validateEnvironment,
  isRuntimeHealthy,
  updateRuntimeState
} = require("./src/runtime/diagnostics");

const envValidation = validateEnvironment();

updateRuntimeState({
  envValid: envValidation.valid,
  discordConfigured: envValidation.config.discordConfigured
});

logDiagnostic("STARTUP_VALIDATION", {
  valid: envValidation.valid,
  warningCount: envValidation.warnings.length,
  errorCount: envValidation.errors.length,
  config: envValidation.config
});

for (const warning of envValidation.warnings) {
  logDiagnostic("STARTUP_WARNING", warning);
}

for (const error of envValidation.errors) {
  logDiagnostic("STARTUP_ERROR", { level: "error", ...error });
}

const app = express();
const port = envValidation.config.port;

app.get("/", (req, res) => {
  res.send("Liahona is alive.");
});

app.listen(port, () => {
  updateRuntimeState({ httpListening: true });
  console.log(`Keepalive server listening on port ${port}`);
  logDiagnostic("HTTP_READY", { port, healthy: isRuntimeHealthy().healthy });
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
  updateRuntimeState({ discordReady: true });
  console.log(`Liahona online as ${client.user.tag}`);
  logDiagnostic("DISCORD_READY", {
    tag: client.user.tag,
    healthy: isRuntimeHealthy().healthy
  });
});

client.on("error", (error) => {
  logError("DISCORD_CLIENT_ERROR", {}, error);
});

client.on("shardError", (error) => {
  logError("DISCORD_SHARD_ERROR", {}, error);
});

client.on("messageCreate", async (message) => {
  try {
    await handleMessage(message, {
      clientUserId: client.user?.id,
      ports
    });
  } catch (error) {
    logError("MESSAGE_HANDLER_ERROR", {
      messageId: message?.id
    }, error);
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.warn("DISCORD_TOKEN is not set. Discord client was not started.");
  logDiagnostic("DISCORD_SKIPPED", {
    reason: "DISCORD_TOKEN_MISSING"
  });
} else {
  client.login(process.env.DISCORD_TOKEN).catch((error) => {
    updateRuntimeState({ discordReady: false });
    console.warn("Discord login failed.");
    logError("DISCORD_LOGIN_FAILED", {}, error);
  });
}
