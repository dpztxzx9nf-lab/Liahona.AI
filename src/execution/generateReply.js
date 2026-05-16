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

function buildStyleGuidance(interpretation) {
  if (interpretation.needsLiveSource) {
    return "This asks about current or live events. You cannot access live news. Say that plainly in one or two sentences and point to Reuters or AP. Do not guess at current facts.";
  }

  if (interpretation.intent === "question" || interpretation.intent === "philosophical") {
    return "Give a direct, plain educational answer in two to four short sentences. Define the topic and one key point. Do not refuse. Do not say you lack a clear answer.";
  }

  return "";
}

function buildSystemPrompt(interpretation) {
  const styleGuidance = buildStyleGuidance(interpretation);

  return [
    `Speak as ${identity.name}. Use the name only if the user already did.`,
    `Voice: ${identity.voice.join(", ")}.`,
    `Style: ${interpretation.responseStyle}.`,
    styleGuidance,
    "Forbidden: self-description; explaining what you are; narrating your philosophy; abstract declarations; dramatic framing; phrases like \"the important shift is\", \"at its core\", \"what this really means\", \"I don't have a clear answer\", or \"as an AI\".",
    identity.boundaries.join(" ")
  ].filter(Boolean).join(" ");
}

function fallbackReply(content, interpretation) {
  if (interpretation.intent === "high-risk") {
    return "I'm sorry you're dealing with that. If you're in immediate danger, call emergency services now. If you're in the U.S. or Canada, call or text 988 for immediate crisis support.";
  }

  if (interpretation.needsRetrieval) {
    return "I don't hold that continuity here.";
  }

  if (interpretation.needsLiveSource) {
    return "I can't see live news. For what's current, check Reuters or AP.";
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

async function generateReply({ content, interpretation, ctx }) {
  const client = getClient();

  if (!client) {
    return { text: fallbackReply(content, interpretation) };
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

  if (ctx && response?.id) {
    ctx.openai_response_id = response.id;
  }

  if (response.status && response.status !== "completed") {
    return { text: fallbackReply(content, interpretation), openai_response_id: response?.id };
  }

  const rawText = extractResponseText(response);
  const text = rawText.trim();

  if (!text) {
    return {
      text: fallbackReply(content, interpretation),
      openai_response_id: response?.id,
      raw_generation_text_length: rawText.length,
      cleaned_text_length: 0
    };
  }

  return {
    text,
    openai_response_id: response?.id,
    raw_generation_text_length: rawText.length,
    cleaned_text_length: text.length
  };
}

module.exports = {
  generateReply,
  buildSystemPrompt,
  fallbackReply
};
