import { useEffect, useRef } from "react";

export default function CosmicDustCanvas() {
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

        // Create very sparse, extremely faint, slow particles
        const numParticles = Math.min(45, window.innerWidth / 25); // Very low density
        const particles = Array.from({ length: numParticles }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.04, // Unbelievably slow horizontal drift
            vy: (Math.random() - 0.5) * 0.04, // Unbelievably slow vertical drift
            r: Math.random() * 0.6 + 0.2,     // Microscopic particles (0.2px to 0.8px)
            phase: Math.random() * Math.PI * 2, // For opacity pulsing
            speed: Math.random() * 0.01 + 0.005 // Pulse speed
        }));

        function draw() {
            const w = canvas.width;
            const h = canvas.height;
            t++;

            ctx.clearRect(0, 0, w, h);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around gracefully
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                // Pulse opacity to simulate "twinkling" / catching light
                const baseOpacity = 0.35 + Math.sin(t * p.speed + p.phase) * 0.3; // Fluctuates between 0.05 and 0.65

                ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();

                // Add a tiny, extreme-faint halo to a few larger dust particles
                if (p.r > 0.6) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
                    ctx.fill();
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

    return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none mix-blend-screen opacity-80" aria-hidden="true" />;
}
