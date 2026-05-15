const runtimeState = {
  envValid: true,
  httpListening: false,
  discordConfigured: false,
  discordReady: false
};

function validateEnvironment() {
  const warnings = [];
  const errors = [];
  const port = Number(process.env.PORT || 3000);

  if (!process.env.DISCORD_TOKEN) {
    warnings.push({
      code: "DISCORD_TOKEN_MISSING",
      message: "DISCORD_TOKEN is not set; Discord client will not start."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    warnings.push({
      code: "OPENAI_API_KEY_MISSING",
      message: "OPENAI_API_KEY is not set; replies will use local fallbacks."
    });
  }

  if (process.env.PORT && Number.isNaN(port)) {
    errors.push({
      code: "PORT_INVALID",
      message: "PORT must be a valid number."
    });
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    config: {
      discordConfigured: Boolean(process.env.DISCORD_TOKEN),
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      port: Number.isNaN(port) ? 3000 : port,
      openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini"
    }
  };
}

function updateRuntimeState(patch) {
  Object.assign(runtimeState, patch);
}

function getRuntimeState() {
  return { ...runtimeState };
}

function isRuntimeHealthy(state = runtimeState) {
  const httpOk = Boolean(state.httpListening);
  const discordConfigured = Boolean(state.discordConfigured);
  const discordOk = !discordConfigured || Boolean(state.discordReady);
  const envOk = state.envValid !== false;
  const healthy = envOk && httpOk && discordOk;

  return {
    healthy,
    checks: {
      environment: envOk,
      http: httpOk,
      discord: discordOk
    },
    discordConfigured,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  };
}

module.exports = {
  validateEnvironment,
  isRuntimeHealthy,
  updateRuntimeState,
  getRuntimeState
};
