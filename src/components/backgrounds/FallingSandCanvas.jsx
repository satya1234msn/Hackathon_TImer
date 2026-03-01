import { useEffect, useRef } from "react";

export default function FallingSandCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animId;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        // Create tiny, warm abstract particles
        const numParticles = Math.min(180, window.innerWidth / 6);
        const particles = Array.from({ length: numParticles }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.15, // Very slight horizontal drift
            vy: Math.random() * 0.4 + 0.1,    // Slow, strictly downward movement
            r: Math.random() * 0.8 + 0.3      // Extremely small particles (0.3px to 1.1px)
        }));

        // Warm, sandy colors
        const colors = [
            "rgba(253, 230, 138, 0.45)", // faint amber
            "rgba(251, 146, 60, 0.35)",  // faint orange/peach
            "rgba(252, 211, 77, 0.4)"    // faint gold
        ];

        // Assign random warm color to each particle
        particles.forEach(p => {
            p.color = colors[Math.floor(Math.random() * colors.length)];
        });

        function draw() {
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around 
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y > h) p.y = 0; // Wrap back to top when they hit the bottom

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        }
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none mix-blend-screen opacity-70" aria-hidden="true" />;
}
