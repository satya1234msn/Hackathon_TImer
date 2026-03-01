const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DURATION_MS = 24 * 60 * 60 * 1000;
const STATE_FILE = path.join(__dirname, "timer-state.json");
const DIST_DIR = path.join(__dirname, "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

// ── Simple module-level state ───────────────────────────────────────────────
// Use TIMER_STARTED_AT env var as a permanent fallback (survives restarts)
let startedAt = process.env.TIMER_STARTED_AT ? Number(process.env.TIMER_STARTED_AT) : null;

// Try to restore from file on startup
try {
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (typeof saved.startedAt === "number") {
      startedAt = saved.startedAt;
    }
  }
} catch (err) {
  console.warn("Could not read timer-state.json on startup:", err.message);
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ startedAt }, null, 2) + "\n", "utf8");
  } catch (err) {
    console.warn("Could not write timer-state.json:", err.message);
  }
}

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());

if (fs.existsSync(DIST_INDEX)) {
  app.use(express.static(DIST_DIR));
}

// ── API Routes ──────────────────────────────────────────────────────────────
app.get("/api/timer-state", (req, res) => {
  res.json({ startedAt, durationMs: DURATION_MS, now: Date.now() });
});

app.post("/api/start", (req, res) => {
  if (startedAt === null) {
    startedAt = Date.now();
    saveState();
    console.log("Timer started at:", startedAt);
  }
  res.json({ startedAt, durationMs: DURATION_MS, now: Date.now() });
});

app.post("/api/reset", (req, res) => {
  startedAt = null;
  saveState();
  console.log("Timer reset.");
  res.json({ startedAt, durationMs: DURATION_MS, now: Date.now() });
});

// ── Test endpoints ──────────────────────────────────────────────────────────
app.post("/api/test/14hr", (req, res) => {
  startedAt = Date.now() - 10 * 3600 * 1000;
  saveState();
  res.json({ success: true, remainingHours: 14 });
});

app.post("/api/test/4hr", (req, res) => {
  startedAt = Date.now() - 20 * 3600 * 1000;
  saveState();
  res.json({ success: true, remainingHours: 4 });
});

app.post("/api/test/2min", (req, res) => {
  startedAt = Date.now() - 23 * 3600 * 1000 - 58 * 60 * 1000;
  saveState();
  res.json({ success: true, remainingMinutes: 2 });
});

// ── SPA fallback ────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (fs.existsSync(DIST_INDEX)) {
    res.sendFile(DIST_INDEX);
    return;
  }
  res.status(200).send("Frontend build not found. Run `npm run build` first.");
});

app.listen(PORT, () => {
  console.log(`UDBHAV 2K26 timer running on http://localhost:${PORT}`);
  console.log(`Timer state: startedAt=${startedAt}`);
});
