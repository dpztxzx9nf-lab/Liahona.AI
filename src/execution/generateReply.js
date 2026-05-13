const OpenAI = require("openai");
const { identity } = require("../foundation/identity");

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
    `${identity.name} is ${identity.role}.`,
    `Voice: ${identity.voice.join(", ")}.`,
    `Response style: ${interpretation.responseStyle}.`,
    identity.boundaries.join(" ")
  ].join(" ");
}

function fallbackReply(content, interpretation) {
  if (interpretation.intent === "high-risk") {
    return "I'm sorry you're dealing with that. If you're in immediate danger, call emergency services now. If you're in the U.S. or Canada, call or text 988 for immediate crisis support.";
  }

  if (interpretation.needsRetrieval) {
    return "I cannot look that up from memory right now.";
  }

  if (content.trim() === "!ping") {
    return "pong";
  }

  return "I hear you.";
}

async function generateReply({ content, interpretation }) {
  const client = getClient();

  if (!client) {
    return fallbackReply(content, interpretation);
  }

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
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
    max_output_tokens: 350
  };

  const response = await client.responses.create(request);

  const text = response.output_text?.trim();

  if (!text) {
    return fallbackReply(content, interpretation);
  }

  return text;
}

module.exports = {
  generateReply
};
