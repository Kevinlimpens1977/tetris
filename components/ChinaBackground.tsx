import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ChinaBackgroundHandle {
    triggerDragon: () => void;
}

const ChinaBackground = forwardRef<ChinaBackgroundHandle, {}>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // State for animation accessible by imperative handle
    const dragonState = useRef({
        isActive: false,
        x: -300
    });

    useImperativeHandle(ref, () => ({
        triggerDragon: () => {
            if (!dragonState.current.isActive) {
                dragonState.current.isActive = true;
                dragonState.current.x = -300;
            }
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Particles Setup
        const particles: any[] = [];
        const maxParticles = width < 768 ? 40 : 100;

        const createParticle = (w: number, h: number) => {
            const isLantern = Math.random() > 0.7;
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                type: isLantern ? 'LANTERN' : 'PETAL',
                size: isLantern ? Math.random() * 15 + 10 : Math.random() * 3 + 2,
                speed: isLantern ? Math.random() * 0.5 + 0.2 : Math.random() * 1 + 0.5,
                swayRange: Math.random() * 20 + 10,
                swaySpeed: Math.random() * 0.02 + 0.005,
                swayOffset: Math.random() * Math.PI * 2,
                opacity: Math.random() * 0.5 + 0.3
            };
        };

        // Init Particles
        for (let i = 0; i < maxParticles; i++) {
            particles.push(createParticle(width, height));
        }

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        let animationId: number;

        const update = () => {
            ctx.clearRect(0, 0, width, height); // Fully clear, no accumulation

            // --- 1. Draw Background Gradient ---
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#450a0a'); // Dark Red
            grad.addColorStop(1, '#000000'); // Black
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // --- 2. Update & Draw Particles ---
            for (let i = 0; i < maxParticles; i++) {
                const p = particles[i];

                // Movement
                if (p.type === 'LANTERN') {
                    p.y -= p.speed; // Lanterns float up
                    if (p.y < -50) p.y = height + 50;
                } else {
                    p.y += p.speed; // Petals float down
                    if (p.y > height + 10) p.y = -10;
                }

                // Sway
                p.x += Math.cos(Date.now() * p.swaySpeed + p.swayOffset) * 0.2;

                // Draw
                ctx.globalAlpha = p.opacity;

                if (p.type === 'LANTERN') {
                    // Draw Lantern
                    ctx.fillStyle = '#ef4444'; // Red
                    ctx.beginPath();
                    ctx.ellipse(p.x, p.y, p.size * 0.6, p.size * 0.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Gold detail
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(p.x - p.size * 0.2, p.y - p.size * 0.8, p.size * 0.4, 2); // Top
                    ctx.fillRect(p.x - p.size * 0.2, p.y + p.size * 0.6, p.size * 0.4, 4); // Bottom tassel base
                    // Little tassel thread
                    ctx.fillStyle = '#fca5a5';
                    ctx.fillRect(p.x - 1, p.y + p.size * 0.7, 2, p.size * 0.5);
                } else {
                    // Draw Petal (Sakura)
                    ctx.fillStyle = '#fecdd3'; // Pink
                    ctx.beginPath();
                    ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- 3. Dragon Animation (Plow Replacement) ---
            if (dragonState.current.isActive) {
                dragonState.current.x += 8; // Fast speed
                const dx = dragonState.current.x;
                const dy = height / 2 + Math.sin(dx * 0.01) * 100; // Wave motion

                // Draw Dragon Head (Simplified)
                ctx.save();
                ctx.translate(dx, dy);

                // Glow
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 20;

                // Head
                ctx.fillStyle = '#dc2626'; // Red
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#fbbf24'; // Gold
                ctx.beginPath();
                ctx.arc(10, -10, 5, 0, Math.PI * 2);
                ctx.fill();

                // Body segments (Trailin)
                for (let i = 1; i < 10; i++) {
                    ctx.fillStyle = i % 2 === 0 ? '#b91c1c' : '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(-i * 25, Math.sin(i + dx * 0.1) * 20, 20 - i, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Whisker
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.quadraticCurveTo(50, -20, 40, -40);
                ctx.stroke();

                ctx.restore();

                if (dx > width + 500) {
                    dragonState.current.isActive = false;
                }
            }

            animationId = requestAnimationFrame(update);
        };

        update();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
});

export default ChinaBackground;
