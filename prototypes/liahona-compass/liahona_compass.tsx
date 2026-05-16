import { useState, useEffect, useRef, useCallback } from "react";

const CARDINAL = ["remember", "act", "trust", "wait"];
const SEASONS = { 0:"winter", 1:"winter", 2:"spring", 3:"spring", 4:"spring", 5:"summer", 6:"summer", 7:"summer", 8:"autumn", 9:"autumn", 10:"autumn", 11:"winter" };
const HOUR_TONE = h => h < 6 ? "in the dark hours" : h < 12 ? "in the morning" : h < 17 ? "midday" : h < 21 ? "in the evening" : "late";

const STORAGE_KEY = "liahona_readings";

function loadReadings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveReadings(readings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(readings.slice(-40))); } catch {}
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function compassRose(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const isMain = i % 8 === 0;
    const isSub = i % 4 === 0;
    const len = isMain ? r * 0.18 : isSub ? r * 0.1 : r * 0.06;
    const x1 = cx + Math.cos(a) * (r * 0.72);
    const y1 = cy + Math.sin(a) * (r * 0.72);
    const x2 = cx + Math.cos(a) * (r * 0.72 + len);
    const y2 = cy + Math.sin(a) * (r * 0.72 + len);
    pts.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(180,160,120,0.5)" strokeWidth={isMain ? 1.5 : 0.7} />);
  }
  return pts;
}

export default function LiahonaCompass() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | seeking | receiving | settled
  const [needle, setNeedle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);
  const [response, setResponse] = useState("");
  const [readings, setReadings] = useState(loadReadings);
  const [showArchive, setShowArchive] = useState(false);
  const [glowPulse, setGlowPulse] = useState(0);
  const animRef = useRef(null);
  const needleRef = useRef(0);
  const targetRef = useRef(0);
  const textareaRef = useRef(null);

  const now = new Date();
  const season = SEASONS[now.getMonth()];
  const hourTone = HOUR_TONE(now.getHours());

  const animateNeedle = useCallback(() => {
    const diff = targetRef.current - needleRef.current;
    let wrapped = ((diff + 540) % 360) - 180;
    if (Math.abs(wrapped) < 0.3) {
      needleRef.current = targetRef.current;
      setNeedle(targetRef.current);
      if (phase === "seeking") setPhase("receiving");
      return;
    }
    const resist = phase === "seeking" ? 0.018 + Math.sin(Date.now() / 400) * 0.006 : 0.04;
    needleRef.current += wrapped * resist;
    setNeedle(needleRef.current);
    animRef.current = requestAnimationFrame(animateNeedle);
  }, [phase]);

  useEffect(() => {
    if (phase === "seeking" || phase === "receiving") {
      animRef.current = requestAnimationFrame(animateNeedle);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, animateNeedle]);

  useEffect(() => {
    if (phase === "settled") {
      const t = setInterval(() => setGlowPulse(p => (p + 1) % 60), 50);
      return () => clearInterval(t);
    }
  }, [phase]);

  const seek = async () => {
    if (!input.trim() || phase === "seeking" || phase === "receiving") return;
    setPhase("seeking");
    setResponse("");

    // Drift needle to random searching position
    const drift = needleRef.current + 120 + Math.random() * 200;
    targetRef.current = drift;
    setTargetAngle(drift);

    const systemPrompt = `You are the orientation layer of a symbolic compass artifact called Liahona.

Your role is reflective and grounding — not prophetic, not mystical, not supernatural.

When someone brings an intention or question, you return a single short orienting phrase.

Rules:
- 1 to 6 words only. No exceptions.
- No questions. No explanations. No mystical language.
- Avoid divine or prophetic framing entirely.
- Ground in timeless human wisdom: patience, honesty, attention, simplicity, return, stillness.
- Respond as if the compass simply points toward what is already true.
- Never invent. Never predict. Only orient.
- Awareness of context: it is ${season}, ${hourTone}.

Examples:
"Be still."
"Return to first principles."
"Act with patience."
"You already know."
"Wait before speaking."
"Notice what remains."
"Less than you think."
"Begin where you are."`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 40,
          system: systemPrompt,
          messages: [{ role: "user", content: input.trim() }]
        })
      });
      const data = await res.json();
      const text = (data.content?.[0]?.text || "Be still.").trim().replace(/^"|"$/g, "");

      // Settle needle to final cardinal-ish angle with some variation
      const base = Math.floor(Math.random() * 4) * 90;
      const variation = (Math.random() - 0.5) * 40;
      const final = drift + 180 + base + variation;
      targetRef.current = final;
      setTargetAngle(final);

      setTimeout(() => {
        setResponse(text);
        setPhase("settled");
        const entry = { ts: Date.now(), intention: input.trim(), direction: text };
        const updated = [...readings, entry];
        setReadings(updated);
        saveReadings(updated);
        setInput("");
      }, 2200);
    } catch {
      setResponse("Be still.");
      setPhase("settled");
    }
  };

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); seek(); }
  };

  const reset = () => {
    setPhase("idle");
    setResponse("");
  };

  const cx = 150, cy = 150, r = 120;
  const rad = (needle - 90) * Math.PI / 180;
  const nx = cx + Math.cos(rad) * r * 0.55;
  const ny = cy + Math.sin(rad) * r * 0.55;
  const nx2 = cx + Math.cos(rad + Math.PI) * r * 0.35;
  const ny2 = cy + Math.sin(rad + Math.PI) * r * 0.35;
  const glow = phase === "settled" ? 0.5 + Math.sin(glowPulse / 10) * 0.3 : 0;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem 3rem", fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
      <h2 className="sr-only">Liahona Compass — a reflective orientation artifact</h2>

      {/* Compass */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width="300" height="300" viewBox="0 0 300 300" style={{ overflow: "visible" }}>
          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke="rgba(160,140,100,0.25)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r + 22} fill="none" stroke="rgba(160,140,100,0.12)" strokeWidth="0.5" />

          {/* Tick marks */}
          {compassRose(cx, cy, r)}

          {/* Face */}
          <circle cx={cx} cy={cy} r={r} fill="rgba(30,26,18,0.97)" stroke="rgba(180,155,100,0.4)" strokeWidth="1.5" />

          {/* Subtle inner ring */}
          <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="rgba(180,155,100,0.12)" strokeWidth="0.5" />

          {/* Cardinal glyphs */}
          {CARDINAL.map((word, i) => {
            const a = i * 90 * Math.PI / 180;
            const lx = cx + Math.sin(a) * r * 0.6;
            const ly = cy - Math.cos(a) * r * 0.6;
            return <text key={word} x={lx} y={ly + 4} textAnchor="middle" fontSize="9" fill="rgba(200,175,120,0.35)" letterSpacing="1" style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}>{word}</text>;
          })}

          {/* Glow when settled */}
          {phase === "settled" && <circle cx={cx} cy={cy} r={r * 0.25} fill={`rgba(200,175,100,${glow * 0.08})`} />}

          {/* Needle */}
          <g style={{ transition: "none" }}>
            {/* North tip */}
            <polygon
              points={`${cx},${cy - 8} ${nx},${ny} ${cx + 6},${cy + 5} ${cx - 6},${cy + 5}`}
              fill={phase === "settled" ? "rgba(220,190,120,0.95)" : "rgba(200,175,110,0.7)"}
              style={{ transition: "fill 0.8s" }}
            />
            {/* South tip */}
            <polygon
              points={`${cx},${cy + 6} ${nx2},${ny2} ${cx + 4},${cy - 4} ${cx - 4},${cy - 4}`}
              fill="rgba(100,90,70,0.6)"
            />
            {/* Center pin */}
            <circle cx={cx} cy={cy} r="4" fill="rgba(200,175,120,0.9)" stroke="rgba(30,26,18,0.9)" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Response */}
        <div style={{ minHeight: 48, marginTop: "0.5rem", textAlign: "center" }}>
          {phase === "seeking" && (
            <p style={{ fontSize: 12, color: "rgba(180,155,100,0.5)", letterSpacing: 3, textTransform: "uppercase", margin: 0 }}>seeking</p>
          )}
          {phase === "settled" && response && (
            <p style={{ fontSize: 20, fontWeight: 400, color: "rgba(220,195,140,0.95)", margin: 0, letterSpacing: 0.5, lineHeight: 1.4, cursor: "pointer" }} onClick={reset}>{response}</p>
          )}
        </div>
      </div>

      {/* Input */}
      {(phase === "idle" || phase === "settled") && (
        <div style={{ marginTop: "2rem" }}>
          {phase === "settled" ? (
            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(180,155,100,0.45)", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: "0.5rem" }}>bring another intention</button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="bring an intention or question…"
                rows={2}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(30,26,18,0.6)",
                  border: "0.5px solid rgba(180,155,100,0.2)",
                  borderRadius: 8, color: "rgba(220,195,140,0.85)",
                  fontSize: 15, padding: "0.75rem 3rem 0.75rem 1rem",
                  resize: "none", outline: "none", lineHeight: 1.6,
                  fontFamily: "var(--font-sans)"
                }}
              />
              {input.trim() && (
                <button onClick={seek} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "rgba(200,175,120,0.6)",
                  fontSize: 18, cursor: "pointer", padding: 4
                }}>↑</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Archive */}
      {readings.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <button onClick={() => setShowArchive(a => !a)} style={{
            background: "none", border: "none", color: "rgba(180,155,100,0.3)",
            fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", padding: 0, display: "block", margin: "0 auto"
          }}>
            {showArchive ? "close" : `${readings.length} ${readings.length === 1 ? "reading" : "readings"}`}
          </button>

          {showArchive && (
            <div style={{ marginTop: "1.25rem", borderTop: "0.5px solid rgba(180,155,100,0.1)", paddingTop: "1.25rem" }}>
              {[...readings].reverse().map((r, i) => (
                <div key={r.ts} style={{ marginBottom: "1.25rem", opacity: 1 - i * 0.06, display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, color: "rgba(180,155,100,0.3)", letterSpacing: 1, minWidth: 64, paddingTop: 3, textTransform: "uppercase" }}>{formatDate(r.ts)}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(180,155,100,0.75)", fontWeight: 500 }}>{r.direction}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(150,130,90,0.4)" }}>{r.intention}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
