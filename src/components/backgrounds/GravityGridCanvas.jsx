import { useEffect, useRef } from "react";

export default function GravityGridCanvas() {
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
