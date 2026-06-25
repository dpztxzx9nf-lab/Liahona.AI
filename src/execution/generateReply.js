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

  if (interpretation.intent === "project_status") {
    return "This asks about Liahona's code, runtime, architecture, or project status. Do not claim live repository access or latest commits. Say that limit plainly and answer only from known architecture or runtime context.";
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

function buildInputMessages({
  content,
  interpretation,
  retrievedContext,
  recurringThemes = [],
  canonicalContext = null,
  canonicalSources = []
}) {
  const input = [
    {
      role: "system",
      content: buildSystemPrompt(interpretation)
    }
  ];

  if (retrievedContext) {
    input.push({
      role: "system",
      content: `Retrieved context: ${JSON.stringify(retrievedContext)}`
    });
  }

  if (Array.isArray(recurringThemes) && recurringThemes.length > 0) {
    input.push({
      role: "system",
      content: [
        `Recurring themes: ${JSON.stringify(recurringThemes)}`,
        "Use these only for reflection-oriented replies when directly helpful.",
        "Be careful and non-certain: say \"you've returned to this tension several times\" rather than making hidden-truth, mystical, symbolic, or diagnostic claims.",
        "Do not over-psychoanalyze or force a pattern."
      ].join(" ")
    });
  }

  if (canonicalContext?.canonical_mode && canonicalContext.canonical_mode !== "NONE") {
    const modeGuidance = canonicalContext.canonical_mode === "DIRECT"
      ? "Direct scripture or doctrinal grounding is allowed only if it naturally answers the user. Do not quote scripture unless it is clearly useful and you can keep it brief."
      : "Use only subtle spiritual orientation language. Do not quote scripture or introduce explicit doctrinal claims.";

    input.push({
      role: "system",
      content: [
        `Canonical context: ${JSON.stringify(canonicalContext)}`,
        modeGuidance,
        "Guardrails: never pretend revelation; never claim divine authority; distinguish interpretation from doctrine; avoid manipulative spirituality; avoid forced scripture injection.",
        "Aim for natural spiritual orientation, not religious performance."
      ].join(" ")
    });
  }

  if (Array.isArray(canonicalSources) && canonicalSources.length > 0) {
    input.push({
      role: "system",
      content: [
        `Canonical sources: ${JSON.stringify(canonicalSources)}`,
        "These are grounding references, not final authority over the user's life.",
        "Use at most one or two references when helpful. Avoid excessive scripture dumping.",
        "Never claim revelation; never present interpretation as doctrine; preserve humility and restraint."
      ].join(" ")
    });
  }

  input.push({
    role: "user",
    content
  });

  return input;
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

  if (interpretation.intent === "project_status") {
    return "I don't have live repo access from this Discord context, so I can't report exact latest commits. I can explain my known architecture and current runtime shape. For exact latest changes, check GitHub or ask from a repo-connected context.";
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

async function generateReply({
  content,
  interpretation,
  ctx,
  retrievedContext = null,
  recurringThemes = [],
  canonicalContext = null,
  canonicalSources = []
}) {
  const client = getClient();
  const input = buildInputMessages({
    content,
    interpretation,
    retrievedContext,
    recurringThemes,
    canonicalContext,
    canonicalSources
  });

  if (ctx) {
    ctx.final_prompt = input;
    ctx.retrieved_context = retrievedContext;
    ctx.recurring_themes = recurringThemes;
    ctx.canonical_context = canonicalContext;
    ctx.canonical_sources = canonicalSources;
  }

  if (!client) {
    return {
      text: fallbackReply(content, interpretation),
      final_prompt: input,
      retrieved_context: retrievedContext,
      recurring_themes: recurringThemes,
      canonical_context: canonicalContext,
      canonical_sources: canonicalSources
    };
  }

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    stream: false,
    input,
    max_output_tokens: interpretation.maxOutputTokens || 120
  };

  let response = await client.responses.create(request);
  response = await waitForCompletedResponse(client, response);

  if (ctx && response?.id) {
    ctx.openai_response_id = response.id;
  }

  if (response.status && response.status !== "completed") {
    return {
      text: fallbackReply(content, interpretation),
      openai_response_id: response?.id,
      final_prompt: input,
      retrieved_context: retrievedContext,
      recurring_themes: recurringThemes,
      canonical_context: canonicalContext,
      canonical_sources: canonicalSources
    };
  }

  const rawText = extractResponseText(response);
  const text = rawText.trim();

  if (!text) {
    return {
      text: fallbackReply(content, interpretation),
      openai_response_id: response?.id,
      raw_generation_text_length: rawText.length,
      cleaned_text_length: 0,
      final_prompt: input,
      retrieved_context: retrievedContext,
      recurring_themes: recurringThemes,
      canonical_context: canonicalContext,
      canonical_sources: canonicalSources
    };
  }

  return {
    text,
    openai_response_id: response?.id,
    raw_generation_text_length: rawText.length,
    cleaned_text_length: text.length,
    final_prompt: input,
    retrieved_context: retrievedContext,
    recurring_themes: recurringThemes,
    canonical_context: canonicalContext,
    canonical_sources: canonicalSources
  };
}

module.exports = {
  generateReply,
  buildSystemPrompt,
  buildInputMessages,
  fallbackReply
};
