import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NeuralNetCanvas from "../components/backgrounds/NeuralNetCanvas";
import GravityGridCanvas from "../components/backgrounds/GravityGridCanvas";
import CosmicDustCanvas from "../components/backgrounds/CosmicDustCanvas";
import FallingSandCanvas from "../components/backgrounds/FallingSandCanvas";
import PremiumBgCanvas from "../components/backgrounds/PremiumBgCanvas";
import TimeBox from "../components/ui/TimeBox";

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

export default function TimerPage() {
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
