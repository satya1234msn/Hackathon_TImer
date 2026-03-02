import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NeuralNetCanvas from "../components/backgrounds/NeuralNetCanvas";
import GravityGridCanvas from "../components/backgrounds/GravityGridCanvas";
import CosmicDustCanvas from "../components/backgrounds/CosmicDustCanvas";
import FallingSandCanvas from "../components/backgrounds/FallingSandCanvas";
import PremiumBgCanvas from "../components/backgrounds/PremiumBgCanvas";
import CelebrationCanvas from "../components/backgrounds/CelebrationCanvas";
import TimeBox from "../components/ui/TimeBox";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// ── Clock Skew Detection Constants ────────────────────────────────────────
const CLOCK_SKEW_THRESHOLD = 5000; // 5 seconds
const MAX_CLOCK_SKEW_SAMPLES = 10;

function getTimeParts(remainingMs) {
    // Math.floor is stable: digit only changes when a full second boundary is crossed
    // Math.ceil would bounce on tiny remainingMs fluctuations
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
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

export default function TimerPage() {
    const [state, setState] = useState({
        startedAt: null,
        durationMs: TWENTY_FOUR_HOURS_MS,
        serverOffsetMs: 0,
        serverElapsedMs: 0,      // ← Server-calculated elapsed time
        serverRemainingMs: TWENTY_FOUR_HOURS_MS, // ← Server-calculated remaining time
        loading: true,
        error: "",
        lastSyncTime: null,
        clockSkewWarning: false
    });

    const [clockNow, setClockNow] = useState(Date.now());
    const [isStarting, setIsStarting] = useState(false);

    // ── Retry logic with exponential backoff ──────────────────────────────
    const retryStateRef = useRef({
        failureCount: 0,
        nextRetryTime: Date.now(),
        maxRetries: 8
    });

    // ── Clock skew detection samples ─────────────────────────────────────
    const clockSkewSamplesRef = useRef([]);

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
        const reqStart = Date.now();

        try {
            const response = await fetch("/api/timer-state");
            if (!response.ok) {
                throw new Error(`Timer sync failed with status ${response.status}`);
            }

            const reqEnd = Date.now();
            const payload = await response.json();

            // ── Validate server response ──────────────────────────────────
            if (typeof payload.now !== "number" || !Number.isFinite(payload.now)) {
                throw new Error("Invalid server timestamp in response");
            }

            // ── Validate essential elapsed/remaining fields ───────────────
            if (typeof payload.elapsedMs !== "number" || !Number.isFinite(payload.elapsedMs)) {
                throw new Error("Invalid server elapsedMs in response");
            }
            if (typeof payload.remainingMs !== "number" || !Number.isFinite(payload.remainingMs)) {
                throw new Error("Invalid server remainingMs in response");
            }

            const serverNow = payload.now;
            const clientMidpoint = Math.round((reqStart + reqEnd) / 2);

            // ── Calculate raw offset ──────────────────────────────────────
            const rawOffset = serverNow - clientMidpoint;

            // ── Detect clock skew (now less critical since we use server elapsed time) ──
            clockSkewSamplesRef.current.push(rawOffset);
            if (clockSkewSamplesRef.current.length > MAX_CLOCK_SKEW_SAMPLES) {
                clockSkewSamplesRef.current.shift();
            }

            const avgSkew = clockSkewSamplesRef.current.length > 0
                ? clockSkewSamplesRef.current.reduce((a, b) => a + b, 0) / clockSkewSamplesRef.current.length
                : 0;

            const skewVariance = clockSkewSamplesRef.current.length > 0
                ? Math.max(...clockSkewSamplesRef.current.map(s => Math.abs(s - avgSkew)))
                : 0;

            const hasClockSkewWarning = skewVariance > CLOCK_SKEW_THRESHOLD;

            setState((prev) => ({
                ...prev,
                startedAt:
                    typeof payload.startedAt === "number" || payload.startedAt === null
                        ? payload.startedAt
                        : prev.startedAt,
                durationMs: typeof payload.durationMs === "number" ? payload.durationMs : prev.durationMs,
                // Smooth: blend previous offset 70% + new 30% to dampen jitter
                serverOffsetMs: Math.round(prev.serverOffsetMs * 0.7 + rawOffset * 0.3),
                // Store server-calculated times for use in render
                serverElapsedMs: payload.elapsedMs,
                serverRemainingMs: payload.remainingMs,
                loading: false,
                error: "",
                lastSyncTime: Date.now(),
                clockSkewWarning: hasClockSkewWarning
            }));

            // ── Reset retry state on success ──────────────────────────────
            retryStateRef.current = {
                failureCount: 0,
                nextRetryTime: Date.now(),
                maxRetries: 8
            };

        } catch (err) {
            console.error("[Sync Error]", err.message);

            const retry = retryStateRef.current;
            const backoffMs = Math.min(30000, 1000 * Math.pow(2, retry.failureCount));
            retry.failureCount += 1;
            retry.nextRetryTime = Date.now() + backoffMs;

            if (retry.failureCount >= retry.maxRetries) {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: "Unable to sync timer. Retrying indefinitely. Check your connection."
                }));
            } else {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: `Sync error (attempt ${retry.failureCount}). Retrying...`
                }));
            }
        }
    }, []);

    // Initial sync on mount
    useEffect(() => {
        syncFromServer();
    }, [syncFromServer]);

    // ── Adaptive polling with exponential backoff ─────────────────────────
    useEffect(() => {
        const poll = () => {
            const now = Date.now();
            const retry = retryStateRef.current;

            // Only retry if the backoff time has elapsed
            if (now < retry.nextRetryTime) {
                return;
            }

            syncFromServer().catch(() => { });
        };

        // Determine poll interval based on state
        const basePollInterval = state.startedAt !== null ? 60_000 : 3_000;
        const interval = setInterval(poll, basePollInterval);
        return () => clearInterval(interval);
    }, [syncFromServer, state.startedAt]);


    useEffect(() => {
        const tick = setInterval(() => {
            setClockNow(Date.now());
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    const syncedNow = clockNow + state.serverOffsetMs;
    
    // ── Use server-calculated elapsed/remaining time as source of truth ──────
    // Calculate how much time has passed since last sync
    const timeSinceSyncMs = state.lastSyncTime ? Date.now() - state.lastSyncTime : 0;
    
    // Estimate current elapsed time based on server value + time since sync
    // This allows smooth interpolation between syncs instead of jumping every 3-60 seconds
    const estimatedElapsedMs = Math.max(0, state.serverElapsedMs + timeSinceSyncMs);
    const elapsedMs = state.startedAt === null ? 0 : Math.min(estimatedElapsedMs, state.durationMs);
    
    // Calculate remaining from estimated elapsed
    const remainingMs = state.startedAt === null 
        ? state.durationMs 
        : Math.max(0, state.durationMs - elapsedMs);
    
    const { hours, minutes, seconds } = useMemo(() => getTimeParts(remainingMs), [remainingMs]);

    // Calculate normalized progress from 0.0 (start) to 1.0 (deadline)
    const progress = Math.max(0, Math.min(1, 1 - (remainingMs / (state.durationMs || 1))));

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

    const glowColorClass =
        indicatorColor === "green"
            ? "glow-green"
            : indicatorColor === "yellow"
                ? "glow-yellow"
                : "glow-red";

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

            // ── Validate response data ────────────────────────────────────
            if (typeof payload.now !== "number" || !Number.isFinite(payload.now)) {
                throw new Error("Invalid server timestamp in start response");
            }

            if (typeof payload.elapsedMs !== "number" || !Number.isFinite(payload.elapsedMs)) {
                throw new Error("Invalid server elapsedMs in start response");
            }

            if (typeof payload.remainingMs !== "number" || !Number.isFinite(payload.remainingMs)) {
                throw new Error("Invalid server remainingMs in start response");
            }

            const newOffset = payload.now - Date.now();

            setState((prev) => ({
                ...prev,
                startedAt: typeof payload.startedAt === "number" ? payload.startedAt : prev.startedAt,
                durationMs: typeof payload.durationMs === "number" ? payload.durationMs : prev.durationMs,
                serverOffsetMs: Math.round(prev.serverOffsetMs * 0.5 + newOffset * 0.5),
                serverElapsedMs: payload.elapsedMs,
                serverRemainingMs: payload.remainingMs,
                lastSyncTime: Date.now(),
                error: ""
            }));

            // Reset retry state on successful start
            retryStateRef.current = {
                failureCount: 0,
                nextRetryTime: Date.now(),
                maxRetries: 8
            };
        } catch (err) {
            console.error("[Start Error]", err);
            setState((prev) => ({
                ...prev,
                error: "Failed to start timer. Please check your connection and try again."
            }));
        } finally {
            setIsStarting(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden text-slate-100">
            {/* ── Celebration Canvas (fires on finish) ── */}
            <CelebrationCanvas active={finished} />

            <div
                className="absolute inset-0 pointer-events-none transition-transform duration-1000 ease-linear"
                style={{ transform: `scale(${1.06 - 0.06 * progress})` }}
                aria-hidden="true"
            >
                <div className="absolute inset-0 h-full w-full animate-scale-breath">
                    <div className="bg-gradient-animated absolute inset-0" aria-hidden="true"></div>
                    <div className="bg-theme-wash absolute inset-0" aria-hidden="true"></div>
                    <div className="bg-theme-sheen absolute inset-0" aria-hidden="true"></div>

                    {/* ── Conceptual Visuals (Neural Net + Gravity Grid) ── */}
                    <NeuralNetCanvas />
                    <GravityGridCanvas />
                    <CosmicDustCanvas />
                    <FallingSandCanvas />

                    {/* ── Original Premium animated background (gradient orbs + scanner) ── */}
                    <PremiumBgCanvas />

                    {/* ── Immersive Portal Edge Glow ── */}
                    <div className="portal-glow-edge" aria-hidden="true"></div>

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
                </div>
            </div>

            {/* ── Dynamic Vignette Overlay ── */}
            <div
                className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-linear"
                aria-hidden="true"
                style={{
                    background: `radial-gradient(circle at center, transparent ${85 - 45 * progress}%, rgba(0, 0, 0, ${0.4 + 0.5 * progress}) 150%)`
                }}
            ></div>

            <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-2 pb-10 pt-16 text-center sm:px-6 sm:pt-20">
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
                                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                                className="times-up-card relative mx-auto w-fit rounded-2xl px-10 py-8 sm:px-16 sm:py-10 text-center"
                            >
                                <p className="times-up text-4xl sm:text-5xl md:text-6xl">
                                    Time&apos;s Up!
                                </p>
                                <motion.p
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                                    className="times-up-sub mt-3 text-sm tracking-[0.22em] uppercase sm:text-base"
                                >
                                    24 Hours Complete
                                </motion.p>
                            </motion.div>
                        ) : (

                            <motion.div
                                key="timer"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18 }}
                                transition={{ duration: 0.42, ease: "easeOut" }}
                                className="timer-wrap relative w-full"
                            >
                                {/* ── Soft Radial Breathing Glow ── */}
                                <div className={`radial-breathing-glow ${glowColorClass}`} aria-hidden="true"></div>

                                <div
                                    role="timer"
                                    aria-live="polite"
                                    className="timer-row relative z-10 mx-auto flex w-fit items-center justify-center"
                                >
                                    <TimeBox label="HOURS" value={hours} phaseClass={phaseClass} />
                                    <span className="timer-colon mb-6 px-0.5 text-5xl text-slate-100 sm:mb-8 sm:px-2 sm:text-7xl">
                                        :
                                    </span>
                                    <TimeBox label="MINUTES" value={minutes} phaseClass={phaseClass} />
                                    <span className="timer-colon mb-6 px-0.5 text-5xl text-slate-100 sm:mb-8 sm:px-2 sm:text-7xl">
                                        :
                                    </span>
                                    <TimeBox label="SECONDS" value={seconds} phaseClass={phaseClass} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        className={`overflow-hidden transition-all duration-700 ease-out ${hasStarted || isStarting ? "mt-0 max-h-0 opacity-0" : "mt-12 max-h-36 opacity-100"
                            }`}
                    >
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={isStarting || state.loading}
                            aria-label="Start 24-hour hackathon countdown"
                            className="start-btn rounded-xl px-8 py-3 font-display text-base font-semibold uppercase tracking-[0.12em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-65 sm:text-lg"
                        >
                            {isStarting ? "Starting..." : "Launch"}
                        </button>
                    </div>

                    {state.loading && <p className="mt-7 text-sm text-slate-300/85">Syncing global timer...</p>}

                    {state.error && (
                        <p role="status" className="error-text mt-5 text-sm sm:text-base">
                            {state.error}
                        </p>
                    )}

                    {state.clockSkewWarning && !state.error && (
                        <p role="alert" className="mt-5 text-sm text-yellow-300/90">
                            ⚠️ Large time difference detected. Check your system clock.
                        </p>
                    )}

                </section>
            </main>
        </div>
    );
}
