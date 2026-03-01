const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DURATION_MS = 24 * 60 * 60 * 1000;
const STATE_FILE = path.join(__dirname, "timer-state.json");
const DIST_DIR = path.join(__dirname, "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

function getDefaultState() {
  // Allow setting start time via environment variable (survives Render restarts)
  const envStart = process.env.TIMER_STARTED_AT ? Number(process.env.TIMER_STARTED_AT) : null;
  return { startedAt: envStart };
}

// In-memory cache so restarts within the same process don't lose state
let memoryState = null;

function readTimerState() {
  if (memoryState !== null) return memoryState;

  try {
    if (!fs.existsSync(STATE_FILE)) {
      memoryState = getDefaultState();
      return memoryState;
    }

    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      Object.prototype.hasOwnProperty.call(parsed, "startedAt") &&
      (typeof parsed.startedAt === "number" || parsed.startedAt === null)
    ) {
      memoryState = parsed;
      return memoryState;
    }
  } catch (error) {
    console.error("Failed to read timer state:", error.message);
  }

  memoryState = getDefaultState();
  return memoryState;
}

function writeTimerState(state) {
  memoryState = state;
  try {
    fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn("Could not write timer-state.json (using memory only):", error.message);
  }
}

if (!fs.existsSync(STATE_FILE)) {
  writeTimerState(getDefaultState());
}

app.use(express.json());

if (fs.existsSync(DIST_INDEX)) {
  app.use(express.static(DIST_DIR));
}

app.get("/api/timer-state", (req, res) => {
  const state = readTimerState();
  res.json({
    startedAt: state.startedAt,
    durationMs: DURATION_MS,
    now: Date.now()
  });
});

app.post("/api/start", (req, res) => {
  const state = readTimerState();

  if (state.startedAt === null) {
    state.startedAt = Date.now();
    writeTimerState(state);
  }

  res.json({
    startedAt: state.startedAt,
    durationMs: DURATION_MS,
    now: Date.now()
  });
});

// --- TESTING API ENDPOINTS ---
app.post("/api/test/14hr", (req, res) => {
  const state = readTimerState();
  // Set elapsed time exactly to 10 hours so 14 hours remain
  state.startedAt = Date.now() - (10 * 3600 * 1000);
  writeTimerState(state);
  res.json({ success: true, remainingHours: 14 });
});

app.post("/api/test/4hr", (req, res) => {
  const state = readTimerState();
  // Set elapsed to 20 hours so exactly 4 hours remain
  state.startedAt = Date.now() - (20 * 3600 * 1000);
  writeTimerState(state);
  res.json({ success: true, remainingHours: 4 });
});

app.post("/api/test/2min", (req, res) => {
  const state = readTimerState();
  // Set elapsed to 23 hours and 58 minutes so exactly 2 minutes remain
  state.startedAt = Date.now() - (23 * 3600 * 1000) - (58 * 60 * 1000);
  writeTimerState(state);
  res.json({ success: true, remainingMinutes: 2 });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (fs.existsSync(DIST_INDEX)) {
    res.sendFile(DIST_INDEX);
    return;
  }

  res.status(200).send(
    "Frontend build not found. Run `npm run dev` for development or `npm run build` then `npm start`."
  );
});

app.listen(PORT, () => {
  console.log(`UDBHAV 2K26 timer running on http://localhost:${PORT}`);
});
