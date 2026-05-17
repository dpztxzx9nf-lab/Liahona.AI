const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const RUNTIME_LOG_PATH = path.join(PROJECT_ROOT, "logs", "runtime.jsonl");
const CONTINUITY_DIR = path.join(PROJECT_ROOT, "continuity");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
  } catch (error) {
    return "";
  }
}

function excerpt(text, maxLength = 900) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function readRuntimeEvents() {
  try {
    const raw = fs.readFileSync(RUNTIME_LOG_PATH, "utf8").trim();
    if (!raw) {
      return [];
    }

    return raw.split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return {
            ts: new Date().toISOString(),
            event: "LOG_PARSE_ERROR",
            success: false,
            reason: "invalid-jsonl-line"
          };
        }
      });
  } catch (error) {
    return [];
  }
}

function getLatest(events, eventName) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].event === eventName) {
      return events[index];
    }
  }

  return null;
}

function summarizeEvents(events) {
  const latestSessionEvent = [...events].reverse()
    .find((event) => event.runtime_session_id);
  const latestSessionId = latestSessionEvent?.runtime_session_id || "unknown";
  const latestStart = getLatest(events, "RUNTIME_SESSION_START");
  const sessionEvents = latestSessionId === "unknown"
    ? events
    : events.filter((event) => event.runtime_session_id === latestSessionId);
  const discordReady = sessionEvents.some((event) => event.event === "DISCORD_READY");
  const recentEvents = events.slice(-10).reverse();
  const recentErrors = events.filter((event) =>
    event.event === "RUNTIME_ERROR" || event.success === false
  );
  const ignoredReasons = events
    .filter((event) => event.event === "MESSAGE_IGNORED")
    .slice(-10)
    .reverse()
    .map((event) => event.reason || "unknown");
  const terminalIds = new Set(events
    .filter((event) => (
      event.event === "MESSAGE_IGNORED" ||
      event.event === "GENERATION_RESULT" ||
      event.event === "DELIVERY_RESULT" ||
      event.event === "RUNTIME_ERROR"
    ))
    .map((event) => event.inbound_message_id)
    .filter(Boolean));
  const unmatchedReceived = [...events]
    .reverse()
    .find((event) =>
      event.event === "MESSAGE_RECEIVED" &&
      event.inbound_message_id &&
      !terminalIds.has(event.inbound_message_id)
    );

  return {
    latestSessionId,
    latestStart,
    discordReady,
    recentEvents,
    recentErrorCount: recentErrors.length,
    ignoredReasons,
    unmatchedReceived
  };
}

function listContinuityFiles() {
  try {
    return fs.readdirSync(CONTINUITY_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    return [];
  }
}

function renderEventList(events) {
  if (events.length === 0) {
    return "<p class=\"muted\">No runtime events found.</p>";
  }

  return `<ol>${events.map((event) => `
    <li>
      <strong>${escapeHtml(event.event)}</strong>
      <span class="muted">${escapeHtml(event.ts || "")}</span>
      ${event.reason ? `<div>Reason: ${escapeHtml(event.reason)}</div>` : ""}
      ${event.inbound_message_id ? `<div class="muted">Message: ${escapeHtml(event.inbound_message_id)}</div>` : ""}
    </li>
  `).join("")}</ol>`;
}

function renderDevPortalPage() {
  const events = readRuntimeEvents();
  const summary = summarizeEvents(events);
  const continuityFiles = listContinuityFiles();
  const statusExcerpt = excerpt(readText("STATUS.md"));
  const architectureExcerpt = excerpt(readText("ARCHITECTURE.md"));
  const observabilityExcerpt = excerpt(readText(path.join("docs", "OBSERVABILITY.md")));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Liahona Dev Continuity</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0d1117;
      color: #e6edf3;
      line-height: 1.5;
    }
    main { max-width: 760px; margin: 0 auto; }
    section {
      margin: 14px 0;
      padding: 14px;
      border: 1px solid #30363d;
      border-radius: 12px;
      background: #161b22;
    }
    h1, h2 { margin: 0 0 10px; line-height: 1.2; }
    h1 { font-size: 1.45rem; }
    h2 { font-size: 1.05rem; color: #9ecbff; }
    p { margin: 8px 0; }
    ol, ul { padding-left: 22px; margin: 8px 0; }
    li { margin: 8px 0; }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      padding: 10px;
      border-radius: 8px;
      background: #0d1117;
      border: 1px solid #30363d;
      overflow: auto;
    }
    .warning {
      border-color: #8a6d3b;
      background: #1f1a10;
    }
    .muted { color: #8b949e; font-size: 0.92em; }
    .ok { color: #7ee787; }
    .bad { color: #ff7b72; }
    a { color: #9ecbff; }
  </style>
</head>
<body>
<main>
  <section class="warning">
    <h1>Liahona Dev Continuity</h1>
    <p>Local/private, read-only, no user memory. This portal reads local files and does not write, edit, delete, retrieve, embed, or administer anything.</p>
  </section>

  <section>
    <h2>Runtime Status</h2>
    <p>Latest session: <strong>${escapeHtml(summary.latestSessionId)}</strong></p>
    <p>Last start: <strong>${escapeHtml(summary.latestStart?.ts || "not found")}</strong></p>
    <p>Discord ready: <strong class="${summary.discordReady ? "ok" : "bad"}">${summary.discordReady ? "yes" : "no"}</strong></p>
    <p>Recent error count: <strong>${summary.recentErrorCount}</strong></p>
  </section>

  <section>
    <h2>Last 10 Lifecycle Events</h2>
    ${renderEventList(summary.recentEvents)}
  </section>

  <section>
    <h2>Recent Ignored Reasons</h2>
    ${summary.ignoredReasons.length
      ? `<ul>${summary.ignoredReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>`
      : "<p class=\"muted\">No ignored-message reasons found.</p>"}
  </section>

  <section>
    <h2>Latest Unmatched MESSAGE_RECEIVED</h2>
    ${summary.unmatchedReceived
      ? `<p><strong>${escapeHtml(summary.unmatchedReceived.inbound_message_id)}</strong></p><p class="muted">${escapeHtml(summary.unmatchedReceived.ts || "")}</p>`
      : "<p class=\"ok\">No unmatched received message found.</p>"}
  </section>

  <section>
    <h2>Continuity Checkpoints</h2>
    ${continuityFiles.length
      ? `<ul>${continuityFiles.map((file) => `<li>${escapeHtml(file)}</li>`).join("")}</ul>`
      : "<p class=\"muted\">No continuity checkpoint files found.</p>"}
  </section>

  <section>
    <h2>STATUS.md</h2>
    <pre>${escapeHtml(statusExcerpt || "Unavailable.")}</pre>
  </section>

  <section>
    <h2>ARCHITECTURE.md</h2>
    <pre>${escapeHtml(architectureExcerpt || "Unavailable.")}</pre>
  </section>

  <section>
    <h2>docs/OBSERVABILITY.md</h2>
    <pre>${escapeHtml(observabilityExcerpt || "Unavailable.")}</pre>
  </section>
</main>
</body>
</html>`;
}

function isLocalRequest(req) {
  const ip = req.ip || req.socket?.remoteAddress || "";
  return ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1";
}

function registerDevPortal(app) {
  app.get("/dev", (req, res) => {
    try {
      const token = process.env.DEV_PORTAL_TOKEN;
      if (token) {
        if (req.query.token !== token) {
          res.status(404).send("Not found.");
          return;
        }
      } else if (!isLocalRequest(req)) {
        res.status(404).send("Not found.");
        return;
      }

      res.type("html").send(renderDevPortalPage());
    } catch (error) {
      res.status(500).type("html").send("<h1>Dev portal unavailable</h1>");
    }
  });
}

module.exports = {
  registerDevPortal
};
