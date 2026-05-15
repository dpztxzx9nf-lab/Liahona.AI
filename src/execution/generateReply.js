const OpenAI = require("openai");
const { identity } = require("../interpretive/identity");
const { extractResponseText } = require("./extractResponseText");

let openai;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openai;
}

function buildSystemPrompt(interpretation) {
  return [
    `Speak as ${identity.name}. Use the name only if the user already did.`,
    `Voice: ${identity.voice.join(", ")}.`,
    `Style: ${interpretation.responseStyle}.`,
    "Forbidden: self-description; explaining what you are; narrating your philosophy; abstract declarations; dramatic framing; phrases like \"the important shift is\", \"at its core\", \"what this really means\", or \"as an AI\".",
    identity.boundaries.join(" ")
  ].join(" ");
}

function fallbackReply(content, interpretation) {
  if (interpretation.intent === "high-risk") {
    return "I'm sorry you're dealing with that. If you're in immediate danger, call emergency services now. If you're in the U.S. or Canada, call or text 988 for immediate crisis support.";
  }

  if (interpretation.needsRetrieval) {
    return "I don't hold that continuity here.";
  }

  if (content.trim() === "!ping") {
    return "pong";
  }

  if (interpretation.intent === "casual" || interpretation.intent === "social") {
    return "";
  }

  return "";
}

async function waitForCompletedResponse(client, response) {
  let current = response;
  const incompleteStatuses = new Set(["queued", "in_progress"]);

  while (current?.id && incompleteStatuses.has(current.status)) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    current = await client.responses.retrieve(current.id);
  }

  return current;
}

async function generateReply({ content, interpretation }) {
  const client = getClient();

  if (!client) {
    return fallbackReply(content, interpretation);
  }

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    stream: false,
    input: [
      {
        role: "system",
        content: buildSystemPrompt(interpretation)
      },
      {
        role: "user",
        content
      }
    ],
    max_output_tokens: interpretation.maxOutputTokens || 120
  };

  let response = await client.responses.create(request);
  response = await waitForCompletedResponse(client, response);

  if (response.status && response.status !== "completed") {
    return fallbackReply(content, interpretation);
  }

  const text = extractResponseText(response).trim();

  if (!text) {
    return fallbackReply(content, interpretation);
  }

  return text;
}

module.exports = {
  generateReply
};
