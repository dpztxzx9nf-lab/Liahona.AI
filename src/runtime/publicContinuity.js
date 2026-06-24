function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStatusList(title, items) {
  return `
    <div class="split-card">
      <h3>${escapeHtml(title)}</h3>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderPublicContinuityPage() {
  const implemented = [
    "Discord/OpenAI runtime",
    "Express keepalive server",
    "restrained message interpretation",
    "plain Discord delivery",
    "local private observability"
  ];
  const planned = [
    "public artifact integration",
    "curated public continuity",
    "source cards and richer projections",
    "semantic memory only after governance and privacy boundaries are clear"
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Liahona Continuity</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 18px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 50% 0%, rgba(112, 88, 255, 0.18), transparent 28rem),
        #05070b;
      color: #f4f1e8;
      line-height: 1.58;
    }
    main { max-width: 840px; margin: 0 auto; }
    header {
      min-height: 44vh;
      display: grid;
      align-content: center;
      padding: 42px 0 28px;
      text-align: center;
    }
    section {
      margin: 14px 0;
      padding: 18px;
      border: 1px solid rgba(244, 241, 232, 0.14);
      border-radius: 18px;
      background: rgba(12, 16, 24, 0.84);
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
    }
    h1, h2, h3 { margin: 0 0 10px; line-height: 1.15; }
    h1 { font-size: clamp(2rem, 9vw, 4.5rem); letter-spacing: -0.06em; }
    h2 { font-size: 1.2rem; color: #d7c8ff; }
    h3 { font-size: 1rem; color: #f4f1e8; }
    p { margin: 8px 0; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 6px 0; }
    a { color: #d7c8ff; text-decoration-thickness: 1px; text-underline-offset: 3px; }
    .eyebrow {
      color: #a79bbd;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.76rem;
      margin-bottom: 12px;
    }
    .lead {
      max-width: 660px;
      margin: 0 auto;
      color: #c9c2d6;
      font-size: 1.05rem;
    }
    .muted { color: #a79bbd; }
    .grid {
      display: grid;
      gap: 12px;
    }
    @media (min-width: 720px) {
      .grid.two { grid-template-columns: 1fr 1fr; }
    }
    .split-card {
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(244, 241, 232, 0.1);
    }
    .checkpoint {
      padding: 14px;
      border-left: 3px solid #d7c8ff;
      background: rgba(215, 200, 255, 0.055);
      border-radius: 12px;
    }
    .notice {
      border-color: rgba(126, 231, 135, 0.28);
      background: rgba(20, 72, 42, 0.14);
    }
  </style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">Public Continuity</div>
    <h1>Liahona.AI</h1>
    <p class="lead">A quiet orientation layer under development: KINDEX grounds human continuity; Liahona reflects, remembers selectively, and points outward toward source-grounded understanding.</p>
  </header>

  <section>
    <h2>1. What Liahona Is</h2>
    <p>Liahona.AI is currently a lightweight Discord/OpenAI runtime, a public artifact direction, and a set of governance and continuity documents. It is not divine, prophetic, authoritative, operational command software, or a replacement for scripture, conscience, community, or human judgment.</p>
  </section>

  <section>
    <h2>2. KINDEX Grounds / Liahona Orients</h2>
    <p><strong>KINDEX</strong> is the human continuity layer: people, conversations, lived history, community context, and shared memory.</p>
    <p><strong>Liahona</strong> is the orienting interpretive layer: reflection, source boundaries, restrained responses, and meaningful projection across time.</p>
  </section>

  <section>
    <h2>3. Current Projections</h2>
    <div class="grid">
      <div class="split-card">
        <h3>Public Site</h3>
        <p>The current public Liahona.AI projection introduces the public identity and experience direction.</p>
        <p><a href="https://dpztxzx9nf-lab.github.io/Liahona.AI/">Open public Liahona.AI</a></p>
      </div>
      <div class="split-card">
        <h3>Omma Artifact Prototype</h3>
        <p>The Omma artifact is a prototype for visual and experiential direction, not production architecture.</p>
        <p><a href="https://omma.build/p/cosmic-artifact-interactive-experience-d-iphwcg">Open Omma prototype</a></p>
      </div>
      <div class="split-card">
        <h3>Discord Runtime</h3>
        <p>The live runtime is a restrained Discord/OpenAI bot with interpretation, policy gates, generation, delivery, and private diagnostics.</p>
      </div>
      <div class="split-card">
        <h3>Private Dev Portal</h3>
        <p>The private <code>/dev</code> portal is local, read-only, and operational. It is not part of the public experience.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>4. Public vs Private Continuity</h2>
    <p>Public continuity should show curated, non-sensitive evolution: milestones, project direction, source-grounded summaries, and major architectural decisions.</p>
    <p>Private continuity may include local runtime status, logs, diagnostic metadata, implementation notes, and operational failures. Those private details do not belong on public pages.</p>
  </section>

  <section>
    <h2>5. Runtime vs Artifact</h2>
    <p>The runtime currently answers and delivers messages. The artifact direction explores how orientation might feel as a public experience. They are related, but not the same layer.</p>
    <p>The runtime must stay understandable and governed. The artifact must stay public-safe, restrained, and source-humble.</p>
  </section>

  <section>
    <h2>6. Selected Continuity Checkpoints</h2>
    <div class="checkpoint">
      <h3>Interpretive Routing Stabilization</h3>
      <p>Recent work made Liahona more proportional: ordinary educational questions route to direct concise answers, philosophical questions stay restrained, and live/current questions preserve uncertainty.</p>
    </div>
    <div class="checkpoint">
      <h3>Architecture Status Clarification</h3>
      <p>The repository now distinguishes implemented runtime, scaffolded source/continuity structure, planned memory/retrieval systems, and legacy reference material.</p>
    </div>
    <div class="checkpoint">
      <h3>Projection Boundary Definition</h3>
      <p>Public site, artifact prototype, Discord runtime, and private dev portal are now treated as separate projections with different privacy and governance boundaries.</p>
    </div>
  </section>

  <section>
    <h2>7. Current Status</h2>
    <div class="grid two">
      ${renderStatusList("Implemented", implemented)}
      ${renderStatusList("Planned / Not Current", planned)}
    </div>
  </section>

  <section class="notice">
    <h2>8. Restraint And Governance</h2>
    <p>Liahona should preserve clarity over complexity, grounding over performance, continuity over noise, reflection over productivity, and human judgment over automation.</p>
    <p class="muted">This public page intentionally does not expose logs, IDs, raw diagnostics, private Discord content, environment details, admin controls, or private operational notes.</p>
  </section>
</main>
</body>
</html>`;
}

function registerPublicContinuity(app) {
  app.get("/continuity", (req, res) => {
    try {
      res.type("html").send(renderPublicContinuityPage());
    } catch (error) {
      res.status(500).type("html").send("<h1>Continuity page unavailable</h1>");
    }
  });
}

module.exports = {
  registerPublicContinuity
};
