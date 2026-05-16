const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(__dirname, "..", "..", "..", "logs");
const RUNTIME_LOG_FILE = path.join(LOG_DIR, "runtime.jsonl");
const OBSERVABILITY_EVENTS = new Set([
  "RUNTIME_SESSION_START",
  "DISCORD_READY",
  "MESSAGE_RECEIVED",
  "MESSAGE_IGNORED",
  "GENERATION_RESULT",
  "DELIVERY_RESULT"
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

  writeRuntimeLog(record);
}

function logDiagnostic(event, details = {}) {
  const { level = "info", ...fields } = details;
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields
  };

  console.log(JSON.stringify(entry));
  writeObservableEvent(event, entry);
}

function logError(event, details = {}, error) {
  logDiagnostic(event, {
    ...details,
    level: "error",
    errorMessage: error?.message || details.errorMessage
  });

  if (error) {
    console.error(event, error);
  }

  writeObservableEvent("RUNTIME_ERROR", {
    ...details,
    errorMessage: error?.message || details.errorMessage
  });
}

module.exports = {
  logDiagnostic,
  logError,
  setRuntimeSessionId
};
