const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DURATION_MS = 24 * 60 * 60 * 1000;
const STATE_FILE = path.join(__dirname, "timer-state.json");
const DIST_DIR = path.join(__dirname, "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

// ── Server uptime tracking for clock skew detection ──────────────────────────
const SERVER_START_TIME = Date.now();

// ── Timestamp validation utilities ────────────────────────────────────────────
function isValidTimestamp(ts) {
  // Reject timestamps that are:
  // - Not a finite number
  // - More than 1 year in the future
  // - More than 10 years in the past
  return (
    typeof ts === "number" &&
    Number.isFinite(ts) &&
    ts > 0 &&
    ts > (Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000) &&
    ts <= (Date.now() + 365.25 * 24 * 60 * 60 * 1000)
  );
}

// ── Load state from file (safe to call multiple times) ────────────────────────
function loadStateFromFile() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      if (saved.startedAt === null || isValidTimestamp(saved.startedAt)) {
        return saved.startedAt;
      } else {
        console.warn(`[loadStateFromFile] Invalid state in file: startedAt=${saved.startedAt}`);
        return null;
      }
    }
  } catch (err) {
    console.warn("Could not read timer-state.json:", err.message);
  }
  return null;
}

// ── Module-level state ─────────────────────────────────────────────────────
// Guard against NaN: Number("null") and Number("undefined") return NaN
const _envTs = Number(process.env.TIMER_STARTED_AT);
let startedAt = (process.env.TIMER_STARTED_AT && Number.isFinite(_envTs) && _envTs > 0)
  ? _envTs
  : null;

// Try to restore from file on startup
const fileState = loadStateFromFile();
if (fileState !== null) {
  startedAt = fileState;
}

if (startedAt !== null && !isValidTimestamp(startedAt)) {
  console.warn(`[startup] Invalid env var TIMER_STARTED_AT=${startedAt}, resetting to null`);
  startedAt = null;
}

console.log(`[startup] Initial state: startedAt=${startedAt} (server time: ${Date.now()})`);

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
  // Reload from file to ensure we're always in sync (ALWAYS, not conditionally)
  startedAt = loadStateFromFile();

  // Return precise server-side calculations to eliminate client-side clock skew
  const serverNow = Date.now();
  const elapsedMs = startedAt === null ? 0 : Math.max(0, serverNow - startedAt);
  const remainingMs = startedAt === null ? DURATION_MS : Math.max(0, DURATION_MS - elapsedMs);

  res.json({
    startedAt,
    durationMs: DURATION_MS,
    elapsedMs,      // ← Server-calculated elapsed time (eliminates clock skew)
    remainingMs,    // ← Server-calculated remaining time
    now: serverNow, // ← For offset calculation
    serverUptime: serverNow - SERVER_START_TIME,
    version: 3 // API version bump for new fields
  });
});

app.post("/api/start", (req, res) => {
  // Reload from file first to always stay in sync
  startedAt = loadStateFromFile();

  // Prevent race conditions: only start if not already started
  if (startedAt === null || !Number.isFinite(startedAt)) {
    startedAt = Date.now();
    saveState();
    console.log(`[/api/start] Timer started at ${startedAt}`);
  } else {
    console.log(`[/api/start] Timer already running since ${startedAt}`);
  }

  const serverNow = Date.now();
  const elapsedMs = startedAt === null ? 0 : Math.max(0, serverNow - startedAt);
  const remainingMs = startedAt === null ? DURATION_MS : Math.max(0, DURATION_MS - elapsedMs);

  res.json({
    startedAt,
    durationMs: DURATION_MS,
    elapsedMs,
    remainingMs,
    now: serverNow,
    alreadyRunning: startedAt !== null && (startedAt < Date.now() - 1000),
    version: 3
  });
});


app.post("/api/reset", (req, res) => {
  // Reload from file first to ensure consistency
  startedAt = loadStateFromFile();

  const wasStarted = startedAt !== null;
  startedAt = null;
  saveState();
  console.log("Timer reset.");

  const serverNow = Date.now();
  res.json({
    startedAt: null,
    durationMs: DURATION_MS,
    elapsedMs: 0,
    remainingMs: DURATION_MS,
    now: serverNow,
    wasRunning: wasStarted,
    version: 3
  });
});

// ── Diagnostic endpoint (for debugging clock skew issues) ────────────────────
app.get("/api/debug/timer", (req, res) => {
  // Reload from file to always stay in sync
  startedAt = loadStateFromFile();

  const serverNow = Date.now();
  const elapsedMs = startedAt === null ? 0 : Math.max(0, serverNow - startedAt);
  const remainingMs = startedAt === null ? DURATION_MS : Math.max(0, DURATION_MS - elapsedMs);
  const hours = Math.floor(elapsedMs / (60 * 60 * 1000));
  const minutes = Math.floor((elapsedMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((elapsedMs % (60 * 1000)) / 1000);
  const remainHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remainMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const remainSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

  res.json({
    serverTime: new Date(serverNow).toISOString(),
    startedAt: startedAt ? new Date(startedAt).toISOString() : null,
    timerRunning: startedAt !== null,
    elapsed: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    remaining: `${String(remainHours).padStart(2, "0")}:${String(remainMinutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`,
    elapsedMs,
    remainingMs,
    version: 3
  });
});

// ── Test endpoints ──────────────────────────────────────────────────────────
app.post("/api/test/14hr", (req, res) => {
  startedAt = Date.now() - 10 * 3600 * 1000;
  saveState();
  const serverNow = Date.now();
  const elapsedMs = Math.max(0, serverNow - startedAt);
  const remainingMs = Math.max(0, DURATION_MS - elapsedMs);
  res.json({ success: true, remainingHours: 14, startedAt, elapsedMs, remainingMs, now: serverNow, version: 3 });
});

app.post("/api/test/4hr", (req, res) => {
  startedAt = Date.now() - 20 * 3600 * 1000;
  saveState();
  const serverNow = Date.now();
  const elapsedMs = Math.max(0, serverNow - startedAt);
  const remainingMs = Math.max(0, DURATION_MS - elapsedMs);
  res.json({ success: true, remainingHours: 4, startedAt, elapsedMs, remainingMs, now: serverNow, version: 3 });
});

app.post("/api/test/2min", (req, res) => {
  startedAt = Date.now() - 23 * 3600 * 1000 - 58 * 60 * 1000;
  saveState();
  const serverNow = Date.now();
  const elapsedMs = Math.max(0, serverNow - startedAt);
  const remainingMs = Math.max(0, DURATION_MS - elapsedMs);
  res.json({ success: true, remainingMinutes: 2, startedAt, elapsedMs, remainingMs, now: serverNow, version: 3 });
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
