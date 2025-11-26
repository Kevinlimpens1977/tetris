import React, { useRef, useEffect, useState } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, COLORS } from '../constants';
import { TetrominoType, GameAction, PenaltyAnimation } from '../types';
import { getPlayfieldBackground } from '../utils/getPlayfieldBackground';

interface GameBoardProps {
    grid: (string | number)[][];
    activePiece: {
        pos: { x: number; y: number };
        tetromino: TetrominoType;
        rotation: number;
    } | null;
    lastAction: GameAction;
    clearingLines?: number[]; // Optional prop for animation
    ghostEnabled?: boolean; // Ghost piece toggle (levels 1-2 and 7-10)
    penaltyAnimations?: PenaltyAnimation[]; // Floating penalty numbers
    level: number;
}

// Removed static BLOCK_SIZE


// Particle System Interface
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number; // 0 to 1
    color: string;
    size: number;
}

// Text Overlay for TETRIS clear
interface FloatingText {
    text: string;
    y: number;
    opacity: number;
}

// Internal Mist Particle
interface MistParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
    grid,
    activePiece,
    lastAction,
    clearingLines = [],
    ghostEnabled = true,
    penaltyAnimations = [],
    level
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [blockSize, setBlockSize] = useState(30); // Default start size
    const animationFrameRef = useRef<number>(0);

    // Dynamic Sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                // Account for padding (approx 6px total)
                const availableWidth = width - 6;
                const availableHeight = height - 6;

                const sizeX = availableWidth / BOARD_WIDTH;
                const sizeY = availableHeight / BOARD_HEIGHT;
                const newSize = Math.floor(Math.min(sizeX, sizeY));
                setBlockSize(Math.max(10, newSize));
            }
        };

        const ro = new ResizeObserver(updateSize);
        if (containerRef.current) ro.observe(containerRef.current);

        // Initial check
        setTimeout(updateSize, 0);

        return () => ro.disconnect();
    }, []);

    // Animation physics state
    const physicsRef = useRef({
        flashIntensity: 0,
        activeActionId: 0,
        shakeIntensity: 0,
    });

    // Particle System Ref
    const particlesRef = useRef<Particle[]>([]);
    const mistParticlesRef = useRef<MistParticle[]>([]);
    const snowAccumulationRef = useRef<number>(0); // Height in pixels
    const breathingPhaseRef = useRef<number>(0);
    const prevClearingLinesRef = useRef<number[]>([]);
    const prevLevelRef = useRef<number>(level);

    // Initialize Mist Particles
    useEffect(() => {
        const mist: MistParticle[] = [];
        for (let i = 0; i < 40; i++) {
            mist.push({
                x: Math.random() * BOARD_WIDTH * 30, // Approx width, will be scaled in render
                y: Math.random() * BOARD_HEIGHT * 30,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 20 + 10,
                opacity: Math.random() * 0.07 + 0.05
            });
        }
        mistParticlesRef.current = mist;
    }, []);

    // Reset snow on level up
    useEffect(() => {
        if (level !== prevLevelRef.current) {
            snowAccumulationRef.current = 0;
            prevLevelRef.current = level;
        }
    }, [level]);

    // State to control the phases of the Tetris animation (Flash -> Explode)
    const isTetrisFlashRef = useRef<boolean>(false);
    const floatingTextRef = useRef<FloatingText | null>(null);

    // Helper to get ghost piece Y
    const getGhostY = (
        currentGrid: (string | number)[][],
        piece: NonNullable<GameBoardProps['activePiece']>
    ): number | null => {
        // 1. Get shape
        const shape = TETROMINOS[piece.tetromino].shape;

        // Rotate logic needs to match main logic (copy-pasted for now or moved to util)
        // Since rotation logic is inside GameBoard/App, we replicate simple rotation here or assume passed shape is correct?
        // Actually we need to rotate the shape matrix 'piece.rotation' times.
        let matrix = shape;
        for (let i = 0; i < piece.rotation; i++) {
            const N = matrix.length;
            const M = matrix[0].length;
            const newShape = Array(M).fill(0).map(() => Array(N).fill(0));
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < M; c++) {
                    newShape[c][N - 1 - r] = matrix[r][c];
                }
            }
            matrix = newShape;
        }

        // 2. Find lowest valid Y
        // Start from current Y and go down until collision
        let ghostY = piece.pos.y;

        // Simple collision check helper inside GameBoard scope
        const check = (x: number, y: number) => {
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    if (matrix[row][col] !== 0) {
                        const boardX = x + col;
                        const boardY = y + row;
                        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return true;
                        if (boardY >= 0 && currentGrid[boardY][boardX] !== 0) return true;
                    }
                }
            }
            return false;
        };

        if (check(piece.pos.x, ghostY)) return null; // Already colliding (shouldn't happen)

        while (!check(piece.pos.x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    };


    const getRotatedShape = (type: TetrominoType, rotation: number) => {
        let shape = TETROMINOS[type].shape;
        for (let i = 0; i < rotation; i++) {
            const N = shape.length;
            const M = shape[0].length;
            const newShape = Array(M).fill(0).map(() => Array(N).fill(0));
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < M; c++) {
                    newShape[c][N - 1 - r] = shape[r][c];
                }
            }
            shape = newShape;
        }
        return shape;
    };

    const createExplosion = (rows: number[], currentGrid: (string | number)[][]) => {
        const isMega = rows.length >= 4;

        if (isMega) {
            physicsRef.current.shakeIntensity = 20; // Massive shake
            // TETRIS! text is now handled by overlay, but we keep this for particle logic if needed
        }

        // Increase snow accumulation slightly on clear
        snowAccumulationRef.current = Math.min(10, snowAccumulationRef.current + rows.length * 0.5);

        // For each block in the clearing rows, spawn particles
        rows.forEach(y => {
            currentGrid[y].forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'string') {
                    const color = TETROMINOS[cell as TetrominoType].color;
                    const centerX = x * blockSize + blockSize / 2;
                    const centerY = y * blockSize + blockSize / 2;

                    // Mega clear uses Gold/Festive confetti colors
                    const particleCount = isMega ? 40 : 12;

                    for (let i = 0; i < particleCount; i++) {
                        let pColor = color;
                        if (isMega) {
                            // Mix in Gold, White, Red, Green
                            const r = Math.random();
                            if (r > 0.7) pColor = '#fbbf24'; // Gold
                            else if (r > 0.5) pColor = '#ffffff'; // White
                            else if (r > 0.3) pColor = '#ef4444'; // Red
                        }

                        const speed = isMega ? 15 : 8;

                        particlesRef.current.push({
                            x: centerX + (Math.random() - 0.5) * blockSize,
                            y: centerY + (Math.random() - 0.5) * blockSize,
                            vx: (Math.random() - 0.5) * speed,
                            vy: (Math.random() - 0.5) * speed - (isMega ? 5 : 2), // Explosive upwards
                            life: 1.0,
                            color: pColor,
                            size: Math.random() * (isMega ? 10 : 6) + 2
                        });
                    }
                }
            });
        });
    };

    const drawBlock = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        type: TetrominoType,
        pulseIntensity: number,
        flashLevel: number,
        hasSnow: boolean = false,
        overrideColor?: string
    ) => {
        const px = x * blockSize;
        const py = y * blockSize;
        const size = blockSize;
        const config = TETROMINOS[type];

        ctx.save();

        // 1. Dynamic Shadow/Glow
        ctx.shadowColor = overrideColor || config.glowColor;
        ctx.shadowBlur = Math.max(5, (10 + pulseIntensity) + (flashLevel * 30));

        // 2. Base Fill
        ctx.fillStyle = (overrideColor || config.color) + (overrideColor ? 'FF' : 'CC');

        // 3. Draw Base
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

        // 4. Flash Overlay 
        if (flashLevel > 0.05) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashLevel * 0.8})`;
            ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        }

        ctx.shadowBlur = 0;

        // 5. Crystalline Highlights
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + (flashLevel * 0.4)})`;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 2);
        ctx.lineTo(px + size - 2, py + 2);
        ctx.lineTo(px + 2, py + size - 2);
        ctx.fill();

        // 6. Border 
        ctx.strokeStyle = overrideColor ? '#ffffff' : config.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

        // 7. Core Pulse
        const coreOpacity = 0.7 + (pulseIntensity / 40) + (flashLevel * 0.3);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, Math.max(0.5, coreOpacity))})`;
        ctx.beginPath();
        ctx.arc(px + size / 2, py + size / 2, 3 + (flashLevel * 2), 0, Math.PI * 2);
        ctx.fill();

        // 8. Snow Accumulation (only if not in hyper mode)
        if (hasSnow && !overrideColor) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(px, py + 2);
            ctx.bezierCurveTo(px + size * 0.3, py - 4, px + size * 0.7, py - 3, px + size, py + 2);
            ctx.lineTo(px + size, py + 5);
            ctx.bezierCurveTo(px + size * 0.7, py + 3, px + size * 0.3, py + 6, px, py + 4);
            ctx.closePath();
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    };

    const drawGhostBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, type: TetrominoType) => {
        const px = x * blockSize;
        const py = y * blockSize;
        const size = blockSize;
        const config = TETROMINOS[type];

        ctx.save();
        // Ghost is just a border with low opacity
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3; // Semi-transparent
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

        // Optional: Faint fill
        ctx.fillStyle = config.color;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

        ctx.restore();
    };


    // Main Render Loop
    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Physics Update ---
        if (lastAction.id !== physicsRef.current.activeActionId) {
            physicsRef.current.activeActionId = lastAction.id;
            if (lastAction.type === 'ROTATE') physicsRef.current.flashIntensity = 1.0;
            else if (lastAction.type === 'DROP') physicsRef.current.flashIntensity = 0.6;
            else if (lastAction.type === 'LOCK') physicsRef.current.flashIntensity = 1.5;
            else if (lastAction.type === 'MOVE') physicsRef.current.flashIntensity = 0.3;
        }

        physicsRef.current.flashIntensity *= 0.85;
        if (physicsRef.current.flashIntensity < 0.01) physicsRef.current.flashIntensity = 0;

        physicsRef.current.shakeIntensity *= 0.9;
        if (physicsRef.current.shakeIntensity < 0.5) physicsRef.current.shakeIntensity = 0;

        // Reset transform/clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // --- 1. Background & Breathing ---
        breathingPhaseRef.current += 0.002; // Slow breath
        const breath = Math.sin(breathingPhaseRef.current * Math.PI * 2) * 0.07; // 7% amplitude

        const baseBg = getPlayfieldBackground(level);
        // Parse rgba to adjust alpha/lightness if needed, or just overlay black with varying opacity
        // Simpler: Draw base, then overlay breathing

        ctx.fillStyle = baseBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Breathing Overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + breath})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 2. Spotlights (Light Beams) ---
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Beam intensity based on level
        let beamOpacity = 0.05;
        if (level >= 4) beamOpacity = 0.1;
        if (level >= 7) beamOpacity = 0.15;
        if (level === 10) beamOpacity = 0.25;

        const beamGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        beamGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${beamOpacity})`);
        beamGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Second beam for higher levels
        if (level >= 7) {
            const beamGrad2 = ctx.createLinearGradient(canvas.width, 0, 0, canvas.height);
            beamGrad2.addColorStop(0, `rgba(255, 255, 255, 0)`);
            beamGrad2.addColorStop(0.5, `rgba(255, 255, 255, ${beamOpacity * 0.7})`);
            beamGrad2.addColorStop(1, `rgba(255, 255, 255, 0)`);
            ctx.fillStyle = beamGrad2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        // --- 3. Mist Particles ---
        ctx.save();
        mistParticlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // --- Shake Effect (Applied after background) ---
        if (physicsRef.current.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * physicsRef.current.shakeIntensity;
            const dy = (Math.random() - 0.5) * physicsRef.current.shakeIntensity;
            ctx.translate(dx, dy);
        }

        // --- Dynamic Glow Calculation ---
        const now = Date.now();
        const staticPulse = 10 + Math.sin(now * 0.003) * 5;
        const activePulse = 15 + Math.sin(now * 0.008) * 8;
        const megaPulse = Math.sin(now * 0.05); // Faster pulse for mega clear

        // Draw Grid Background (Subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * blockSize, 0);
            ctx.lineTo(x * blockSize, BOARD_HEIGHT * blockSize);
            ctx.stroke();
        }
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * blockSize);
            ctx.lineTo(BOARD_WIDTH * blockSize, y * blockSize);
            ctx.stroke();
        }

        // --- Auto-Contrast Filter ---
        // Simple logic: if level is dark (most are), boost brightness slightly
        // We can just use a fixed boost for now as all backgrounds are relatively dark
        const brightness = 1.1;
        ctx.filter = `brightness(${brightness})`;

        // Draw Static Blocks on Grid
        grid.forEach((row, y) => {
            const isClearing = clearingLines.includes(y);

            // If row is clearing:
            // 1. If it's a Tetris Flash Phase: Draw flashing blocks
            // 2. If it's normal clear or post-flash: Draw nothing (let particles handle it)
            if (isClearing) {
                if (isTetrisFlashRef.current) {
                    // TETRIS PRE-FLASH
                    row.forEach((cell, x) => {
                        if (cell !== 0 && typeof cell === 'string') {
                            // Strobe between Gold and White
                            const strobeColor = megaPulse > 0 ? '#fbbf24' : '#ffffff';
                            drawBlock(ctx, x, y, cell as TetrominoType, 30, 0.8, false, strobeColor);
                        }
                    });
                }
                return;
            }

            row.forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'string') {
                    const hasSnow = y === 0 || grid[y - 1][x] === 0;
                    drawBlock(ctx, x, y, cell as TetrominoType, staticPulse, 0, hasSnow);
                }
            });
        });

        ctx.filter = 'none'; // Reset filter

        // Draw Particles (Explosion)
        if (particlesRef.current.length > 0) {
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // Gravity
                p.life -= 0.015; // Fade out

                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 10 * p.life;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(now * 0.01);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                    // Add sparkle
                    if (Math.random() > 0.8) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2);
                    }

                    ctx.restore();
                }
            }
        }

        // --- Snow Accumulation at Bottom ---
        if (snowAccumulationRef.current > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 10;

            // Draw a wavy snow pile at the bottom
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            const points = 10;
            const step = canvas.width / points;

            for (let i = 0; i <= points; i++) {
                const x = i * step;
                // Wave based on time and index
                const wave = Math.sin(now * 0.002 + i) * 2;
                const h = snowAccumulationRef.current + wave;
                ctx.lineTo(x, canvas.height - h);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Floating Text is now handled by DOM overlay
        if (floatingTextRef.current) {
            // Logic moved to DOM
            floatingTextRef.current = null;
        }

        // Draw Active Piece + Ghost
        if (activePiece && clearingLines.length === 0) {
            // 1. Draw Ghost (only if enabled)
            if (ghostEnabled) {
                const ghostY = getGhostY(grid, activePiece);
                if (ghostY !== null && ghostY > activePiece.pos.y) {
                    const shape = getRotatedShape(activePiece.tetromino, activePiece.rotation);
                    shape.forEach((row, dy) => {
                        row.forEach((val, dx) => {
                            if (val) {
                                const x = activePiece.pos.x + dx;
                                const y = ghostY + dy;
                                if (y >= 0) {
                                    drawGhostBlock(ctx, x, y, activePiece.tetromino);
                                }
                            }
                        });
                    });
                }
            }

            // 2. Draw Active
            const shape = getRotatedShape(activePiece.tetromino, activePiece.rotation);
            shape.forEach((row, dy) => {
                row.forEach((val, dx) => {
                    if (val) {
                        const x = activePiece.pos.x + dx;
                        const y = activePiece.pos.y + dy;
                        if (y >= 0) {
                            drawBlock(ctx, x, y, activePiece.tetromino, activePulse, physicsRef.current.flashIntensity, false);
                        }
                    }
                });
            });
        }
    };

    // Watch for Clearing Lines Trigger
    useEffect(() => {
        // Detect NEW clearing lines
        if (clearingLines.length > 0 && JSON.stringify(clearingLines) !== JSON.stringify(prevClearingLinesRef.current)) {

            const isMega = clearingLines.length >= 4;

            if (isMega) {
                // Phase 1: Flash & Shake
                isTetrisFlashRef.current = true;
                physicsRef.current.shakeIntensity = 5; // Start rumble

                // Trigger DOM Tetris Animation
                setShowTetrisAnim(true);
                setTimeout(() => setShowTetrisAnim(false), 1500);

                // Phase 2: Explode after delay (matching the App.tsx delay logic mostly)
                // App delay is 1000ms. We'll explode at 500ms so particles fly while lines technically still exist in grid data.
                setTimeout(() => {
                    isTetrisFlashRef.current = false;
                    createExplosion(clearingLines, grid);
                }, 500);

            } else {
                // Normal clear: Immediate explosion
                createExplosion(clearingLines, grid);
            }
        }
        prevClearingLinesRef.current = clearingLines;
    }, [clearingLines, grid]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = BOARD_WIDTH * blockSize;
            canvas.height = BOARD_HEIGHT * blockSize;
        }

        const loop = () => {
            render();
            animationFrameRef.current = requestAnimationFrame(loop);
        }
        loop();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [grid, activePiece, lastAction, clearingLines, level]);

    const [showTetrisAnim, setShowTetrisAnim] = useState(false);

    // Christmas Lights Border Logic
    const getLightPulseClass = (lvl: number) => {
        if (lvl <= 3) return 'animate-pulse-slow';
        if (lvl <= 7) return 'animate-pulse';
        if (lvl <= 9) return 'animate-pulse-fast';
        return 'animate-sparkle'; // Custom class needed or just fast pulse
    };

    const lightPulseClass = getLightPulseClass(level);

    return (
        <div
            ref={containerRef}
            className="
      relative h-full w-full max-w-[90vw] md:max-w-none aspect-[10/20] 
      flex items-center justify-center 
      rounded-xl 
      p-0
      shadow-[0_0_30px_rgba(0,0,0,0.5)]
    ">
            {/* Christmas Lights Border */}
            <div className="absolute inset-[-6px] pointer-events-none z-20 rounded-xl overflow-hidden">
                {/* Top Lights */}
                <div className="absolute top-0 left-0 w-full h-2 flex justify-between px-1">
                    {[...Array(15)].map((_, i) => (
                        <div key={`t-${i}`} className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-red-500 shadow-[0_0_5px_red]' : i % 3 === 1 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-yellow-400 shadow-[0_0_5px_gold]'} ${lightPulseClass}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
                {/* Bottom Lights */}
                <div className="absolute bottom-0 left-0 w-full h-2 flex justify-between px-1">
                    {[...Array(15)].map((_, i) => (
                        <div key={`b-${i}`} className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-red-500 shadow-[0_0_5px_red]' : i % 3 === 1 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-yellow-400 shadow-[0_0_5px_gold]'} ${lightPulseClass}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
                {/* Left Lights */}
                <div className="absolute top-0 left-0 h-full w-2 flex flex-col justify-between py-1">
                    {[...Array(25)].map((_, i) => (
                        <div key={`l-${i}`} className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-red-500 shadow-[0_0_5px_red]' : i % 3 === 1 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-yellow-400 shadow-[0_0_5px_gold]'} ${lightPulseClass}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
                {/* Right Lights */}
                <div className="absolute top-0 right-0 h-full w-2 flex flex-col justify-between py-1">
                    {[...Array(25)].map((_, i) => (
                        <div key={`r-${i}`} className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-red-500 shadow-[0_0_5px_red]' : i % 3 === 1 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-yellow-400 shadow-[0_0_5px_gold]'} ${lightPulseClass}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
            </div>

            {/* Inner Content */}
            <div className="relative w-full h-full overflow-hidden rounded-lg">
                {/* Canvas scales to fit container */}
                <canvas ref={canvasRef} className="block w-full h-full object-contain relative z-0" />

                {/* TETRIS! Win Animation Overlay */}
                {showTetrisAnim && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-bounce-in-out">
                        <div className="relative">
                            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-red-600 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]"
                                style={{ WebkitTextStroke: '2px white' }}>
                                TETRIS!
                            </h1>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-full animate-ping bg-yellow-400/30 rounded-full blur-xl"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Penalty Animations */}
                {penaltyAnimations.map((anim) => {
                    const age = Date.now() - anim.timestamp;
                    const progress = Math.min(age / 2000, 1); // 2 second animation
                    const opacity = 1 - progress;
                    const translateY = -progress * 100; // Float upward

                    return (
                        <div
                            key={anim.id}
                            className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-pulse"
                            style={{
                                opacity,
                                transform: `translate(-50%, ${translateY}px)`,
                                transition: 'all 0.1s linear'
                            }}
                        >
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute inset-0 blur-md">
                                    <span className="text-4xl md:text-5xl font-black text-red-500">
                                        -{anim.penalty}
                                    </span>
                                </div>
                                {/* Main text */}
                                <span
                                    className="relative text-4xl md:text-5xl font-black text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                    style={{
                                        textShadow: '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(220, 38, 38, 0.6), 2px 2px 0 #7f1d1d'
                                    }}
                                >
                                    -{anim.penalty}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GameBoard;