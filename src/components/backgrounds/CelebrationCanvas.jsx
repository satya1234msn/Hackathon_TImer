import { useEffect, useRef } from "react";

const COLORS = [
    "#4ade80", "#22c55e", "#86efac", "#bbf7d0",
    "#34d399", "#6ee7b7", "#a7f3d0", "#ffffff",
    "#d1fae5", "#10b981"
];

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

function createParticle(cx, cy) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(2, 10);
    return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(2, 5),
        gravity: randomBetween(0.18, 0.28),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: randomBetween(5, 11),
        h: randomBetween(3, 6),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.14, 0.14),
        opacity: 1,
        fadeStart: randomBetween(60, 110),
        life: 0,
    };
}

export default function CelebrationCanvas({ active }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({ particles: [], frame: null });

    useEffect(() => {
        if (!active) {
            stateRef.current.particles = [];
            if (stateRef.current.frame) cancelAnimationFrame(stateRef.current.frame);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        const s = stateRef.current;
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.4;

        // Single clean burst from center — 120 particles
        for (let i = 0; i < 120; i++) {
            s.particles.push(createParticle(cx, cy));
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            s.particles = s.particles.filter(p => p.opacity > 0.02 && p.y < canvas.height + 30);

            for (const p of s.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.994;
                p.rotation += p.rotationSpeed;
                p.life++;
                if (p.life > p.fadeStart) p.opacity -= 0.022;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }

            ctx.globalAlpha = 1;

            if (s.particles.length > 0) {
                s.frame = requestAnimationFrame(draw);
            }
        }

        draw();

        return () => {
            window.removeEventListener("resize", resize);
            if (s.frame) cancelAnimationFrame(s.frame);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 100
            }}
        />
    );
}
