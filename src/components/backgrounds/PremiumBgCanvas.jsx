import { useEffect, useRef } from "react";

export default function PremiumBgCanvas() {
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
