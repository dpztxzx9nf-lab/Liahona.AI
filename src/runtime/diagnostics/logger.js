const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(__dirname, "..", "..", "..", "logs");
const RUNTIME_LOG_FILE = path.join(LOG_DIR, "runtime.jsonl");
const OBSERVABILITY_EVENTS = new Set([
  "RUNTIME_SESSION_START",
  "DISCORD_READY",
  "MESSAGE_RECEIVED",
  "MESSAGE_CLASSIFIED",
  "MESSAGE_STORED",
  "MESSAGE_IGNORED",
  "GENERATION_RESULT",
  "LIVE_SOURCE_RESULT",
  "MODEL_TRACE",
  "CONTEXT_DETACHMENT",
  "PROJECTION_FALLBACK",
  "DELIVERY_RESULT"
]);
const VERBOSE_OBSERVABILITY_EVENTS = new Set([
  "MESSAGE_CLASSIFIED",
  "MESSAGE_STORED",
  "LIVE_SOURCE_RESULT",
  "MODEL_TRACE",
  "CONTEXT_DETACHMENT",
  "PROJECTION_FALLBACK",
  "DELIVERY_RESULT"
]);
const MODEL_DIAGNOSTIC_EVENTS = new Set([
  "MODEL_TRACE",
  "GENERATION_RESULT"
]);
const REDACTED_TEXT_FIELDS = new Set([
  "original_message",
  "generated_response",
  "summary",
  "prompt",
  "response",
  "reply"
]);

let runtimeSessionId = null;

function setRuntimeSessionId(id) {
  runtimeSessionId = id || null;
}

function inferSuccess(event, fields) {
  if (typeof fields.success === "boolean") {
    return fields.success;
  }

  if (event === "RUNTIME_ERROR") {
    return false;
  }

  return true;
}

function valueLength(value) {
  if (value == null) {
    return 0;
  }

  if (typeof value === "string") {
    return value.length;
  }

  try {
    return JSON.stringify(value).length;
  } catch (error) {
    return null;
  }
}

function redactTextValue(value) {
  if (value == null) {
    return value;
  }

  return {
    redacted: true,
    length: valueLength(value)
  };
}

function countBy(values) {
  return values
    .filter((value) => value !== undefined && value !== null && value !== "")
    .reduce((counts, value) => {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
}

function summarizePrompt(value) {
  if (value == null) {
    return value;
  }

  if (!Array.isArray(value)) {
    return {
      redacted: true,
      type: typeof value,
      length: valueLength(value)
    };
  }

  const contentLengths = value.map((message) => valueLength(message?.content));

  return {
    redacted: true,
    message_count: value.length,
    roles: value.map((message) => message?.role || "unknown"),
    content_lengths: contentLengths,
    total_content_length: contentLengths.reduce((sum, length) => sum + (length || 0), 0)
  };
}

function summarizeRetrievedContext(value) {
  if (value == null) {
    return value;
  }

  if (!Array.isArray(value)) {
    return {
      redacted: true,
      type: typeof value,
      length: valueLength(value)
    };
  }

  const relevanceScores = value
    .map((entry) => Number(entry?.relevance_score))
    .filter((score) => Number.isFinite(score));

  return {
    redacted: true,
    entry_count: value.length,
    classifications: countBy(value.map((entry) => entry?.classification)),
    relevance_score_min: relevanceScores.length ? Math.min(...relevanceScores) : null,
    relevance_score_max: relevanceScores.length ? Math.max(...relevanceScores) : null
  };
}

function summarizeRecurringThemes(value) {
  if (value == null) {
    return value;
  }

  if (!Array.isArray(value)) {
    return {
      redacted: true,
      type: typeof value,
      length: valueLength(value)
    };
  }

  return {
    redacted: true,
    theme_count: value.length,
    themes: value.map((theme) => ({
      theme: theme?.theme || "unknown",
      confidence: theme?.confidence ?? null,
      evidence_count: theme?.evidence_count ?? null
    }))
  };
}

function summarizeCanonicalSources(value) {
  if (value == null) {
    return value;
  }

  if (!Array.isArray(value)) {
    return {
      redacted: true,
      type: typeof value,
      length: valueLength(value)
    };
  }

  return {
    redacted: true,
    source_count: value.length,
    references: value.map((source) => ({
      source: source?.source || null,
      reference: source?.reference || null,
      relevance: source?.relevance ?? null
    }))
  };
}

function summarizeCoherence(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  return {
    coherent: Boolean(value.coherent),
    reason: value.reason || null,
    original_term_count: Array.isArray(value.original_terms) ? value.original_terms.length : 0,
    response_term_count: Array.isArray(value.response_terms) ? value.response_terms.length : 0
  };
}

function sanitizeDiagnosticValue(key, value) {
  if (REDACTED_TEXT_FIELDS.has(key)) {
    return redactTextValue(value);
  }

  if (key === "final_prompt") {
    return summarizePrompt(value);
  }

  if (key === "retrieved_context") {
    return summarizeRetrievedContext(value);
  }

  if (key === "recurring_themes") {
    return summarizeRecurringThemes(value);
  }

  if (key === "canonical_sources") {
    return summarizeCanonicalSources(value);
  }

  if (key === "coherence") {
    return summarizeCoherence(value);
  }

  return value;
}

function sanitizeDiagnosticFields(fields = {}) {
  return Object.entries(fields).reduce((sanitized, [key, value]) => {
    sanitized[key] = sanitizeDiagnosticValue(key, value);
    return sanitized;
  }, {});
}

function enrichDiagnosticFields(event, fields) {
  const enriched = { ...fields };

  if (MODEL_DIAGNOSTIC_EVENTS.has(event) && !enriched.configured_model) {
    enriched.configured_model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  }

  return enriched;
}

function writeRuntimeLog(record) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(RUNTIME_LOG_FILE, `${JSON.stringify(record)}\n`);
  } catch (error) {
    console.warn("Runtime JSONL log write failed.", error.message);
  }
}

function writeObservableEvent(event, fields) {
  if (!OBSERVABILITY_EVENTS.has(event) && event !== "RUNTIME_ERROR") {
    return;
  }

  const record = {
    ts: fields.ts || new Date().toISOString(),
    event,
    runtime_session_id: fields.runtime_session_id || runtimeSessionId,
    success: inferSuccess(event, fields)
  };

  if (fields.reason || fields.responseReason) {
    record.reason = fields.reason || fields.responseReason;
  }

  if (fields.inbound_message_id) {
    record.inbound_message_id = fields.inbound_message_id;
  }

  if (fields.response_id) {
    record.response_id = fields.response_id;
  }

  if (fields.projection_id) {
    record.projection_id = fields.projection_id;
  }

  if (fields.errorMessage) {
    record.error_message = fields.errorMessage;
  }

  if (fields.errorCategory || fields.errorName || fields.errorCode || fields.errorStatus) {
    record.error_category = fields.errorCategory || fields.errorName || fields.errorCode || fields.errorStatus;
  }

  if (VERBOSE_OBSERVABILITY_EVENTS.has(event)) {
    const {
      ts,
      level,
      event: ignoredEvent,
      runtime_session_id,
      success,
      ...details
    } = fields;
    Object.assign(record, details);
  }

  writeRuntimeLog(record);
}

function logDiagnostic(event, details = {}) {
  const { level = "info", ...fields } = details;
  const safeFields = sanitizeDiagnosticFields(enrichDiagnosticFields(event, fields));
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...safeFields
  };

  console.log(JSON.stringify(entry));
  writeObservableEvent(event, entry);
}

function logError(event, details = {}, error) {
  logDiagnostic(event, {
    ...details,
    level: "error",
    errorMessage: error?.message || details.errorMessage,
    errorName: error?.name || details.errorName,
    errorCode: error?.code || details.errorCode,
    errorStatus: error?.status || details.errorStatus,
    errorCategory: error?.code || error?.name || details.errorCategory
  });

  if (error) {
    console.error(event, error);
  }

  writeObservableEvent("RUNTIME_ERROR", {
    ...details,
    errorMessage: error?.message || details.errorMessage,
    errorName: error?.name || details.errorName,
    errorCode: error?.code || details.errorCode,
    errorStatus: error?.status || details.errorStatus,
    errorCategory: error?.code || error?.name || details.errorCategory
  });
}

module.exports = {
  logDiagnostic,
  logError,
  sanitizeDiagnosticFields,
  setRuntimeSessionId
};
