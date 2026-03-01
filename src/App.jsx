import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getTimeParts(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };
}

function getIndicatorColor(remainingMs) {
  const remainingHours = remainingMs / (60 * 60 * 1000);
  if (remainingHours <= 4) return "red";
  if (remainingHours <= 14) return "yellow";
  return "green";
}

/* ── Neural Network Canvas (Intelligent, Conceptual, Very Slow) ── */
function NeuralNetCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Create very slow drifting nodes
    const numNodes = Math.min(65, window.innerWidth / 18);
    const nodes = Array.from({ length: numNodes }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.09, // Extremely slow horizontal movement
      vy: (Math.random() - 0.5) * 0.09, // Extremely slow vertical movement
      r: Math.random() * 1.5 + 0.5
    }));

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      t += 0.01;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "rgba(103, 232, 249, 0.45)"; // Faint cyan dots
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around gracefully
        if (node.x < 0) node.x = w;
        if (node.x > w) node.x = 0;
        if (node.y < 0) node.y = h;
        if (node.y > h) node.y = 0;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw synaptic connections if nodes are close
      ctx.lineWidth = 0.6;
      const maxDist = 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.18; // Very faint lines
            ctx.strokeStyle = `rgba(153, 246, 228, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none mix-blend-screen opacity-50" aria-hidden="true" />;
}

/* ── Gravity Grid Canvas (Time/Space distortion bending towards center) ── */
function GravityGridCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      t += 0.003; // Incredibly slow time evolution

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const cell = 55; // Grid cell size
      const maxPullDist = Math.min(w, h) * 0.75; // Gravity well size

      ctx.strokeStyle = "rgba(20, 184, 166, 0.055)"; // Very faint teal grid
      ctx.lineWidth = 1;

      // Apply gravitational distortion to a point
      function distort(x, y) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0 && dist < maxPullDist) {
          const strength = Math.pow(1 - dist / maxPullDist, 1.8) * 110;
          // Very slow breathing effect to the gravity
          const pulse = 1 + Math.sin(t * 1.5 - dist * 0.003) * 0.12;
          const pull = (strength / dist) * pulse;
          return { x: x - dx * pull, y: y - dy * pull };
        }
        return { x, y };
      }

      // Vertical lines
      for (let x = 0; x <= w; x += cell) {
        ctx.beginPath();
        for (let y = 0; y <= h; y += 10) { // Subdivide for smooth curves
          const p = distort(x, y);
          if (y === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= h; y += cell) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) { // Subdivide for smooth curves
          const p = distort(x, y);
          if (x === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none mix-blend-screen opacity-90" aria-hidden="true" />;
}

/* ── Premium Background Animation Canvas ── */
function PremiumBgCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Floating gradient orbs — large, slow, vivid
    const orbs = [
      { x: 0.2, y: 0.3, r: 0.28, color: [6, 182, 212, 0.35], speed: 0.0004, phase: 0 },
      { x: 0.75, y: 0.2, r: 0.25, color: [139, 92, 246, 0.28], speed: 0.0003, phase: 2 },
      { x: 0.5, y: 0.7, r: 0.32, color: [20, 184, 166, 0.38], speed: 0.00035, phase: 4 },
      { x: 0.85, y: 0.65, r: 0.22, color: [59, 130, 246, 0.25], speed: 0.00045, phase: 1 },
      { x: 0.15, y: 0.75, r: 0.2, color: [168, 85, 247, 0.2], speed: 0.0005, phase: 3 },
    ];

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      t++;

      ctx.clearRect(0, 0, w, h);

      // Draw floating gradient orbs
      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(t * orb.speed + orb.phase) * 0.08) * w;
        const cy = (orb.y + Math.cos(t * orb.speed * 0.7 + orb.phase) * 0.06) * h;
        const radius = orb.r * Math.min(w, h);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, g, b, a] = orb.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${a * 0.4})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      // Removed old tech grid to make way for the GravityGrid

      // Horizontal scanner line
      const scanY = (t * 0.4) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 1);
      scanGrad.addColorStop(0, "rgba(20, 184, 166, 0)");
      scanGrad.addColorStop(0.5, "rgba(20, 184, 166, 0.06)");
      scanGrad.addColorStop(1, "rgba(20, 184, 166, 0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 25, w, 50);

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="premium-bg-canvas" aria-hidden="true" />;
}

function TimeBox({ label, value, phaseClass }) {
  return (
    <div
      className={`time-card ${phaseClass} relative w-[11.2rem] rounded-xl px-3 py-3 sm:w-[16rem] sm:px-4 sm:py-4`}
    >
      <div className="time-value-slot flex h-[6.2rem] items-center justify-center overflow-hidden sm:h-[8.2rem]">
        <motion.span
          key={value}
          initial={{ opacity: 0.2, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 27, mass: 0.56 }}
          className="timer-digits text-[4.2rem] sm:text-[5.6rem]"
        >
          {value}
        </motion.span>
      </div>
      <p className="time-label mt-1 text-sm tracking-[0.2em] text-slate-300 sm:mt-2 sm:text-base">{label}</p>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState({
    startedAt: null,
    durationMs: TWENTY_FOUR_HOURS_MS,
    serverOffsetMs: 0,
    loading: true,
    error: ""
  });
  const [clockNow, setClockNow] = useState(Date.now());
  const [isStarting, setIsStarting] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 46 }, (_, idx) => ({
        id: idx,
        left: 3 + (idx * 97) % 95,
        top: 2 + (idx * 41) % 95,
        size: 2 + (idx % 3),
        duration: 5 + (idx % 8),
        delay: (idx % 7) * -0.65
      })),
    []
  );

  const floatingParticles = useMemo(
    () =>
      Array.from({ length: 84 }, (_, idx) => ({
        id: idx,
        left: 2 + ((idx * 57) % 96),
        top: 6 + ((idx * 37) % 88),
        size: 1 + (idx % 4) * 0.9,
        duration: 14 + (idx % 9) * 2,
        delay: (idx % 13) * -0.8
      })),
    []
  );

  const chronoNodes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, idx) => ({
        id: idx,
        angle: idx * 15,
        delay: idx * -0.26,
        radius: idx % 2 === 0 ? "min(35vmin, 23rem)" : "min(29vmin, 19rem)"
      })),
    []
  );

  const syncFromServer = useCallback(async () => {
    const response = await fetch("/api/timer-state");
    if (!response.ok) {
      throw new Error(`Timer sync failed with status ${response.status}`);
    }

    const payload = await response.json();
    setState((prev) => ({
      ...prev,
      startedAt:
        typeof payload.startedAt === "number" || payload.startedAt === null
          ? payload.startedAt
          : prev.startedAt,
      durationMs: typeof payload.durationMs === "number" ? payload.durationMs : prev.durationMs,
      serverOffsetMs: typeof payload.now === "number" ? payload.now - Date.now() : prev.serverOffsetMs,
      loading: false,
      error: ""
    }));
  }, []);

  useEffect(() => {
    syncFromServer().catch(() => {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Unable to sync timer state with server."
      }));
    });

    const poll = setInterval(() => {
      syncFromServer().catch(() => { });
    }, 3000);

    return () => clearInterval(poll);
  }, [syncFromServer]);

  useEffect(() => {
    const tick = setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const syncedNow = clockNow + state.serverOffsetMs;
  const elapsedMs = state.startedAt === null ? 0 : Math.max(0, syncedNow - state.startedAt);
  const remainingMs =
    state.startedAt === null ? state.durationMs : Math.max(0, state.durationMs - elapsedMs);
  const { hours, minutes, seconds } = useMemo(() => getTimeParts(remainingMs), [remainingMs]);

  // Clock hand angles derived from remaining time
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const secAngle = ((60 - (totalSec % 60)) % 60) * 6;
  const minAngle = ((60 - (Math.floor(totalSec / 60) % 60)) % 60) * 6;
  const hrAngle = ((24 - (Math.floor(totalSec / 3600) % 24)) % 24) * 15;
  const hasStarted = state.startedAt !== null;
  const finished = hasStarted && remainingMs <= 0;
  const indicatorColor = getIndicatorColor(remainingMs);

  const phaseClass =
    indicatorColor === "green"
      ? "phase-green"
      : indicatorColor === "yellow"
        ? "phase-yellow"
        : "phase-red";

  async function handleStart() {
    if (isStarting || hasStarted) return;
    setIsStarting(true);

    try {
      const response = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Start request failed with status ${response.status}`);
      }

      const payload = await response.json();

      setState((prev) => ({
        ...prev,
        startedAt: typeof payload.startedAt === "number" ? payload.startedAt : prev.startedAt,
        durationMs: typeof payload.durationMs === "number" ? payload.durationMs : prev.durationMs,
        serverOffsetMs: typeof payload.now === "number" ? payload.now - Date.now() : prev.serverOffsetMs,
        error: ""
      }));
      // started successfully
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to start timer. Please try again."
      }));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <div className="bg-gradient-animated absolute inset-0" aria-hidden="true"></div>
      <div className="bg-theme-wash absolute inset-0" aria-hidden="true"></div>
      <div className="bg-theme-sheen absolute inset-0" aria-hidden="true"></div>

      {/* ── Conceptual Visuals (Neural Net + Gravity Grid) ── */}
      <NeuralNetCanvas />
      <GravityGridCanvas />

      {/* ── Original Premium animated background (gradient orbs + scanner) ── */}
      <PremiumBgCanvas />

      {/* ── Focus Light from Behind + Depth Blur ── */}
      <div className="focus-light" aria-hidden="true"></div>
      <div className="depth-blur-far" aria-hidden="true"></div>
      <div className="depth-blur-near" aria-hidden="true"></div>

      {/* ── Ambient Glow Pulse ── */}
      <div className="ambient-glow-pulse" aria-hidden="true"></div>

      {/* ── Very Light Grain Overlay ── */}
      <div className="grain-overlay" aria-hidden="true"></div>

      <div className="glow-orb a orb-float" aria-hidden="true"></div>
      <div className="glow-orb b orb-float" aria-hidden="true"></div>
      <div className="glow-orb c orb-float" aria-hidden="true"></div>

      <div className="chrono-bg" aria-hidden="true">
        <div className="chrono-ring ring-outer"></div>
        <div className="chrono-ring ring-inner"></div>
        <div className="chrono-sweep sweep-a"></div>
        <div className="chrono-sweep sweep-b"></div>

        {chronoNodes.map((node) => (
          <span
            key={`chrono-${node.id}`}
            className="chrono-node"
            style={{
              "--angle": `${node.angle}deg`,
              "--node-delay": `${node.delay}s`,
              "--node-radius": node.radius
            }}
          ></span>
        ))}
      </div>

      {particles.map((particle) => (
        <span
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            "--duration": `${particle.duration}s`,
            "--delay": `${particle.delay}s`
          }}
          aria-hidden="true"
        ></span>
      ))}

      {floatingParticles.map((particle) => (
        <span
          key={`f-${particle.id}`}
          className="particle particle-slow"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            "--duration": `${particle.duration}s`,
            "--delay": `${particle.delay}s`
          }}
          aria-hidden="true"
        ></span>
      ))}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-6 pb-10 pt-16 text-center sm:pt-20">
        <header className="mt-2 w-full space-y-3 sm:space-y-4">
          <h1 className="font-display text-4xl tracking-[0.1em] text-white sm:text-5xl md:text-6xl title-breathe">
            UDBHAV 2K26
          </h1>
          <p className="font-body text-base font-medium uppercase tracking-[0.22em] text-cyan-100/90 sm:text-lg">
            National Level Hackathon
          </p>
        </header>

        <section className="relative mt-14 w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {finished ? (
              <motion.div
                key="times-up"
                initial={{ opacity: 0, scale: 0.85, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="times-up-popup relative mx-auto w-fit rounded-2xl border border-red-400/55 bg-red-500/10 px-7 py-5 sm:px-10 sm:py-7"
              >
                <div className="times-up-rings" aria-hidden="true"></div>
                <p className="times-up text-4xl text-red-200 sm:text-5xl">Time&apos;s Up!</p>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="timer-wrap"
              >
                <div
                  role="timer"
                  aria-live="polite"
                  className="timer-row relative z-10 mx-auto flex w-fit items-center justify-center"
                >
                  <TimeBox label="HOURS" value={hours} phaseClass={phaseClass} />
                  <span className="timer-colon mb-8 px-1 text-6xl text-slate-100 sm:mb-10 sm:px-2 sm:text-7xl">
                    :
                  </span>
                  <TimeBox label="MINUTES" value={minutes} phaseClass={phaseClass} />
                  <span className="timer-colon mb-8 px-1 text-6xl text-slate-100 sm:mb-10 sm:px-2 sm:text-7xl">
                    :
                  </span>
                  <TimeBox label="SECONDS" value={seconds} phaseClass={phaseClass} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`overflow-hidden transition-all duration-700 ease-out ${hasStarted || isStarting ? "mt-0 max-h-0 opacity-0" : "mt-7 max-h-36 opacity-100"
              }`}
          >
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || state.loading}
              aria-label="Start 24-hour hackathon countdown"
              className="start-btn rounded-xl px-8 py-3 font-display text-base font-semibold uppercase tracking-[0.12em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-65 sm:text-lg"
            >
              {isStarting ? "Starting..." : "Start Countdown"}
            </button>
          </div>

          {state.loading && <p className="mt-7 text-sm text-slate-300/85">Syncing global timer...</p>}

          {state.error && (
            <p role="status" className="error-text mt-5 text-sm sm:text-base">
              {state.error}
            </p>
          )}


        </section>
      </main>
    </div>
  );
}
