import { useEffect, useRef } from "react";

export default function NeuralNetCanvas() {
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
