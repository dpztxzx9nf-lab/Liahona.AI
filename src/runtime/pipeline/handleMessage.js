const { applyChannelSilence } = require("../policy/channelSilence");
const { applyForumThrottle, directlyMentionsLiahona } = require("../policy/forumThrottle");
const { runOncePerMessage } = require("../policy/messageLock");
const {
  createInvocationContext,
  correlationFields,
  terminateInvocation,
  canContinue
} = require("./invocation");
const { prepareReplyText } = require("../../execution/prepareReply");
const {
  logDiagnostic,
  logError,
  getMessageDiagnostics,
  validateMessage
} = require("../diagnostics");
const {
  classifyMessage,
  MESSAGE_CLASSIFICATIONS,
  isQuestionLike
} = require("../../interpretive/classifyMessage");
const { checkResponseCoherence } = require("../../execution/coherenceCheck");
const { synthesizeRecurringThemes } = require("../../continuity/themeSynthesis");
const { detectCanonicalContext } = require("../../canonical/grounding");

function isIgnoredMessage(message, clientUserId) {
  if (!message?.author) {
    return true;
  }

  if (message.author.bot) {
    return true;
  }

  if (clientUserId && message.author.id === clientUserId) {
    return true;
  }

  return false;
}

function isReplyToBot(message, clientUserId) {
  return Boolean(
    clientUserId &&
    message.mentions?.repliedUser?.id === clientUserId
  );
}

function directlyAsksLiahonaQuestion(message, clientUserId) {
  const content = message.content || "";

  if (!isQuestionLike(content)) {
    return false;
  }

  if (!message.guild) {
    return true;
  }

  return directlyMentionsLiahona(message, clientUserId) ||
    isReplyToBot(message, clientUserId) ||
    /\bliahona\b/i.test(content);
}

function shouldStoreWithoutReply({ classification, message, clientUserId, interpretation }) {
  const storableClassification = classification === MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY ||
    classification === MESSAGE_CLASSIFICATIONS.SYSTEM_UPDATE;

  return storableClassification &&
    interpretation.intent !== "high-risk" &&
    !directlyAsksLiahonaQuestion(message, clientUserId);
}

function isDeeperPersonalDiscussion(content) {
  return /\b(i|me|my|myself)\b/i.test(content || "") &&
    /\b(meaning|purpose|faith|identity|fear|afraid|worried|anxious|relationship|family|growth|becoming|trying to understand|help me process)\b/i.test(content || "");
}

function shouldSynthesizeThemes({ classification, message, clientUserId, interpretation }) {
  if (classification === MESSAGE_CLASSIFICATIONS.REFLECTION) {
    return true;
  }

  if (
    classification === MESSAGE_CLASSIFICATIONS.JOURNAL_ENTRY &&
    directlyAsksLiahonaQuestion(message, clientUserId)
  ) {
    return true;
  }

  return interpretation.intent === "reflective" ||
    isDeeperPersonalDiscussion(message.content);
}

async function retrieveContext({ message, ports, classification, interpretation, ctx }) {
  if (typeof ports.continuity?.recall !== "function") {
    return null;
  }

  try {
    return await ports.continuity.recall({
      message,
      classification,
      interpretation,
      ctx
    });
  } catch (error) {
    logError("CONTEXT_RETRIEVAL_FAILED", correlationFields(ctx), error);
    return null;
  }
}

async function storeContinuityEntry({ message, ports, classification, ctx }) {
  if (typeof ports.continuity?.store !== "function") {
    return null;
  }

  try {
    return await ports.continuity.store({
      ts: message.createdAt?.toISOString?.() || new Date().toISOString(),
      author_user_id: message.author?.id || null,
      channel_id: message.channel?.id || null,
      channel_name: message.channel?.name || null,
      classification,
      original_message: message.content || ""
    });
  } catch (error) {
    logError("CONTINUITY_STORE_FAILED", correlationFields(ctx), error);
    return null;
  }
}

async function retrieveCanonicalSources({ message, ports, canonicalContext, ctx }) {
  if (canonicalContext?.canonical_mode !== "DIRECT") {
    return [];
  }

  if (typeof ports.canonical?.retrieve !== "function") {
    return [];
  }

  try {
    return await ports.canonical.retrieve({
      content: message.content || "",
      canonicalContext
    });
  } catch (error) {
    logError("CANONICAL_RETRIEVAL_FAILED", correlationFields(ctx), error);
    return [];
  }
}

async function processMessage(message, { clientUserId, ports }) {
  const ctx = createInvocationContext(message);
  const correlation = () => correlationFields(ctx);

  logDiagnostic("MESSAGE_RECEIVED", {
    ...getMessageDiagnostics(message),
    ...correlation()
  });

  if (isIgnoredMessage(message, clientUserId)) {
    logDiagnostic("MESSAGE_IGNORED", {
      ...correlation(),
      reason: "bot-or-self"
    });
    terminateInvocation(ctx, "ignored");
    return;
  }

  const classification = classifyMessage(message.content);
  ctx.message_classification = classification;

  logDiagnostic("MESSAGE_CLASSIFIED", {
    ...getMessageDiagnostics(message),
    ...correlation(),
    original_message: message.content || "",
    classification,
    directly_asks_liahona_question: directlyAsksLiahonaQuestion(message, clientUserId)
  });

  let interpretation = ports.interpretive.interpret(message);
  const directQuestion = directlyAsksLiahonaQuestion(message, clientUserId);

  if (shouldStoreWithoutReply({ classification, message, clientUserId, interpretation })) {
    const storedEntry = await storeContinuityEntry({
      message,
      ports,
      classification,
      ctx
    });

    logDiagnostic("MESSAGE_STORED", {
      ...correlation(),
      original_message: message.content || "",
      classification,
      stored_entry_id: storedEntry?.id || null,
      summary: storedEntry?.summary || message.content || "",
      reason: "store_without_assistant_reply"
    });
    logDiagnostic("MESSAGE_IGNORED", {
      ...correlation(),
      reason: "stored_without_assistant_reply",
      classification
    });
    terminateInvocation(ctx, "stored-without-reply");
    return;
  }

  interpretation = applyChannelSilence(message, interpretation, clientUserId);
  interpretation = applyForumThrottle(message, interpretation, clientUserId);
  const deliveryStyle = ports.projection.chooseDeliveryStyle(message);
  const canonicalContext = detectCanonicalContext({
    content: message.content,
    classification,
    directQuestion
  });

  logDiagnostic("INTERPRETATION_RESULT", {
    ...correlation(),
    intent: interpretation.intent,
    classification,
    responseStyle: interpretation.responseStyle,
    needsRetrieval: interpretation.needsRetrieval,
    needsLiveSource: interpretation.needsLiveSource,
    shouldRespond: interpretation.shouldRespond,
    responseReason: interpretation.responseReason,
    canonical_context: canonicalContext,
    deliveryStyle
  });

  if (!interpretation.shouldRespond) {
    logDiagnostic("MESSAGE_IGNORED", {
      ...correlation(),
      reason: interpretation.responseReason || "no-response"
    });
    terminateInvocation(ctx, "no-response");
    return;
  }

  if (!canContinue(ctx)) {
    return;
  }

  let reply;
  let retrievedContext = null;
  let recurringThemes = [];
  let canonical_context = canonicalContext;
  let canonicalSources = [];
  let finalPrompt = null;
  let generatedResponse = null;
  const generationStartedAt = Date.now();

  try {
    retrievedContext = await retrieveContext({
      message,
      ports,
      classification,
      interpretation,
      ctx
    });

    if (shouldSynthesizeThemes({ classification, message, clientUserId, interpretation })) {
      recurringThemes = synthesizeRecurringThemes(retrievedContext);
    }

    canonicalSources = await retrieveCanonicalSources({
      message,
      ports,
      canonicalContext: canonical_context,
      ctx
    });

    const generation = await ports.interpretive.generate({
      content: message.content,
      interpretation,
      ctx,
      retrievedContext,
      recurringThemes,
      canonicalContext: canonical_context,
      canonicalSources
    });

    finalPrompt = generation?.final_prompt || ctx.final_prompt || null;
    retrievedContext = generation?.retrieved_context ?? retrievedContext;
    recurringThemes = generation?.recurring_themes ?? recurringThemes;
    canonical_context = generation?.canonical_context ?? canonical_context;
    canonicalSources = generation?.canonical_sources ?? canonicalSources;

    if (generation?.openai_response_id) {
      ctx.openai_response_id = generation.openai_response_id;
    }

    const prepared = prepareReplyText(generation);
    ctx.raw_generation_text_length = prepared.raw_generation_text_length;
    ctx.cleaned_text_length = prepared.cleaned_text_length;
    ctx.delivery_text = prepared.cleanedText;
    reply = prepared.cleanedText;
    generatedResponse = prepared.cleanedText;

    logDiagnostic("MODEL_TRACE", {
      ...correlation(),
      original_message: message.content || "",
      classification,
      retrieved_context: retrievedContext,
      recurring_themes: recurringThemes,
      canonical_context,
      canonical_sources: canonicalSources,
      final_prompt: finalPrompt,
      generated_response: generatedResponse
    });

    logDiagnostic("GENERATION_RESULT", {
      ...correlation(),
      openai_response_id: ctx.openai_response_id,
      success: true,
      raw_generation_text_length: ctx.raw_generation_text_length,
      cleaned_text_length: ctx.cleaned_text_length,
      replyLength: ctx.cleaned_text_length,
      latencyMs: Date.now() - generationStartedAt
    });
  } catch (error) {
    finalPrompt = finalPrompt || ctx.final_prompt || null;
    retrievedContext = ctx.retrieved_context ?? retrievedContext;
    recurringThemes = ctx.recurring_themes ?? recurringThemes;
    canonical_context = ctx.canonical_context ?? canonical_context;
    canonicalSources = ctx.canonical_sources ?? canonicalSources;

    logDiagnostic("MODEL_TRACE", {
      ...correlation(),
      original_message: message.content || "",
      classification,
      retrieved_context: retrievedContext,
      recurring_themes: recurringThemes,
      canonical_context,
      canonical_sources: canonicalSources,
      final_prompt: finalPrompt,
      generated_response: null,
      errorMessage: error.message
    });
    logDiagnostic("GENERATION_RESULT", {
      ...correlation(),
      success: false,
      replyLength: 0,
      errorMessage: error.message,
      latencyMs: Date.now() - generationStartedAt
    });
    logError("GENERATION_FAILED", correlation(), error);
    reply = "I had trouble answering that.";
  }

  if (!canContinue(ctx)) {
    return;
  }

  if (!reply && ctx.cleaned_text_length > 0) {
    reply = ctx.delivery_text;
  }

  const coherence = checkResponseCoherence({
    originalMessage: message.content,
    generatedResponse: reply,
    interpretation
  });

  if (!coherence.coherent) {
    logDiagnostic("CONTEXT_DETACHMENT", {
      ...correlation(),
      original_message: message.content || "",
      classification,
      retrieved_context: retrievedContext,
      recurring_themes: recurringThemes,
      canonical_context,
      canonical_sources: canonicalSources,
      final_prompt: finalPrompt,
      generated_response: reply,
      coherence
    });
    logDiagnostic("MESSAGE_IGNORED", {
      ...correlation(),
      reason: "CONTEXT_DETACHMENT",
      classification
    });
    terminateInvocation(ctx, "context-detachment");
    return;
  }

  logDiagnostic("PROJECTION_PREPARED", {
    ...correlation(),
    raw_generation_text_length: ctx.raw_generation_text_length,
    cleaned_text_length: ctx.cleaned_text_length,
    final_projection_text_length: reply?.length || 0
  });

  const deliveryStartedAt = Date.now();
  let deliveryResult;

  try {
    deliveryResult = await ports.projection.deliver(message, reply, ctx);
  } catch (error) {
    logDiagnostic("DELIVERY_RESULT", {
      ...correlation(),
      success: false,
      deliveryStyle,
      channelId: message.channel?.id,
      errorCode: error.code,
      errorMessage: error.message,
      latencyMs: Date.now() - deliveryStartedAt
    });
    logError("DELIVERY_FAILED", correlation(), error);
    return;
  }

  if (deliveryResult?.skipped) {
    logDiagnostic("DELIVERY_SKIPPED", {
      ...correlation(),
      reason: deliveryResult.reason,
      delivery_count: deliveryResult.delivery_count || ctx.delivery_count,
      raw_generation_text_length: deliveryResult.raw_generation_text_length ?? ctx.raw_generation_text_length,
      cleaned_text_length: deliveryResult.cleaned_text_length ?? ctx.cleaned_text_length,
      final_projection_text_length: deliveryResult.final_projection_text_length ?? 0
    });
    terminateInvocation(ctx, deliveryResult.reason || "delivery-skipped");
    return;
  }

  terminateInvocation(ctx, "delivered");

  logDiagnostic("DELIVERY_RESULT", {
    ...correlation(),
    success: true,
    outbound_message_id: deliveryResult?.outbound_message_id || ctx.outbound_message_id,
    deliveryStyle: deliveryResult?.deliveryStyle || deliveryStyle,
    channelId: message.channel?.id,
    raw_generation_text_length: deliveryResult?.raw_generation_text_length ?? ctx.raw_generation_text_length,
    cleaned_text_length: deliveryResult?.cleaned_text_length ?? ctx.cleaned_text_length,
    final_projection_text_length: deliveryResult?.final_projection_text_length ?? 0,
    latencyMs: Date.now() - deliveryStartedAt
  });
}

async function handleMessage(message, { clientUserId, ports }) {
  const validation = validateMessage(message);

  if (!validation.valid) {
    logDiagnostic("MESSAGE_SKIPPED", {
      reason: validation.reason,
      inbound_message_id: message?.id
    });
    return;
  }

  const run = await runOncePerMessage(message.id, () =>
    processMessage(message, { clientUserId, ports })
  );

  if (!run.executed) {
    logDiagnostic("MESSAGE_DEDUPED", {
      inbound_message_id: message.id,
      reason: run.reason
    });
  }
}

module.exports = {
  handleMessage,
  isIgnoredMessage
};
