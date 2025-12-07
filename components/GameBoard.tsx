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

const TEMPLE1_URL = "https://igpfvcihykgouwiulxwn.supabase.co/storage/v1/object/sign/kaschina/tempel1.svg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mNzVmMzliZS03OGY3LTRkNjQtYWMxZC02NzA5MTY2ZTJiYzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJrYXNjaGluYS90ZW1wZWwxLnN2ZyIsImlhdCI6MTc2NTA2MzM0NCwiZXhwIjoxODI4MTM1MzQ0fQ.5Vu_bv1wf5RcfV3fZhRUGgP2l93m1vncrKU8549mQ-M";
const TEMPLE2_URL = "https://igpfvcihykgouwiulxwn.supabase.co/storage/v1/object/sign/kaschina/tempel2.svg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mNzVmMzliZS03OGY3LTRkNjQtYWMxZC02NzA5MTY2ZTJiYzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJrYXNjaGluYS90ZW1wZWwyLnN2ZyIsImlhdCI6MTc2NTA2MzM4MCwiZXhwIjoxODI4MTM1MzgwfQ.WUkI6BceKJ5C1E4GFCP03DfrwgSWgtamGwJ4rboECxI";

// Frame Configuration
const FRAME_PADDING_X = 3; // Blocks of padding on left/right
const FRAME_PADDING_Y = 2; // Blocks of padding on top/bottom
const TOTAL_WIDTH_BLOCKS = BOARD_WIDTH + FRAME_PADDING_X * 2;
const TOTAL_HEIGHT_BLOCKS = BOARD_HEIGHT + FRAME_PADDING_Y * 2;

// ... (Interfaces remain same)
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number; // 0 to 1
    color: string;
    size: number;
    type?: 'block' | 'blossom'; // Discriminate particle type
    rotation?: number;
    rotationSpeed?: number;
}
// ... (FloatingText, MistParticle remain same)

const GameBoard: React.FC<GameBoardProps> = ({
    grid,
    activePiece,
    lastAction,
    clearingLines = [],
    ghostEnabled = true,
    penaltyAnimations = [],
    level
}) => {
    // ... (Refs remain same)

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [blockSize, setBlockSize] = useState(30);
    const animationFrameRef = useRef<number>(0);

    // Dynamic Sizing based on TOTAL frame size
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const availableWidth = width; // Use full width (padding handled in logic)
                const availableHeight = height;

                const sizeX = availableWidth / TOTAL_WIDTH_BLOCKS;
                const sizeY = availableHeight / TOTAL_HEIGHT_BLOCKS;
                const newSize = Math.floor(Math.min(sizeX, sizeY));
                setBlockSize(Math.max(10, newSize));
            }
        };

        const ro = new ResizeObserver(updateSize);
        if (containerRef.current) ro.observe(containerRef.current);
        setTimeout(updateSize, 0);
        return () => ro.disconnect();
    }, []);

    // ... (Physics refs, Background refs remain same)
    // Animation physics state
    const physicsRef = useRef({
        flashIntensity: 0,
        activeActionId: 0,
        shakeIntensity: 0,
    });

    const particlesRef = useRef<Particle[]>([]);
    const mistParticlesRef = useRef<MistParticle[]>([]);
    const snowAccumulationRef = useRef<number>(0);
    const breathingPhaseRef = useRef<number>(0);
    const prevClearingLinesRef = useRef<number[]>([]);
    const prevLevelRef = useRef<number>(level);

    // Background State Refs
    const currentBgRef = useRef<HTMLImageElement | null>(null);
    const nextBgRef = useRef<HTMLImageElement | null>(null);
    const bgTransitionStartRef = useRef<number>(0);
    const isTransitioningRef = useRef<boolean>(false);

    const setLevelBackground = (lvl: number) => {
        const isOdd = lvl % 2 !== 0;
        const url = isOdd ? TEMPLE1_URL : TEMPLE2_URL;

        if (currentBgRef.current && currentBgRef.current.src === url && !isTransitioningRef.current) {
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
            if (!currentBgRef.current) {
                currentBgRef.current = img;
            } else {
                nextBgRef.current = img;
                isTransitioningRef.current = true;
                bgTransitionStartRef.current = performance.now();
            }
        };
        img.onerror = () => { console.error("Failed to load bg:", url); };
    };

    useEffect(() => {
        setLevelBackground(level);
    }, [level]);

    useEffect(() => {
        const mist: MistParticle[] = [];
        for (let i = 0; i < 40; i++) {
            mist.push({
                x: Math.random() * TOTAL_WIDTH_BLOCKS * 30, // Updated to total width
                y: Math.random() * TOTAL_HEIGHT_BLOCKS * 30,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 20 + 10,
                opacity: Math.random() * 0.07 + 0.05
            });
        }
        mistParticlesRef.current = mist;
    }, []);


    const isTetrisFlashRef = useRef<boolean>(false);
    // ... (getGhostY, getRotatedShape remain same)

    const getGhostY = (
        currentGrid: (string | number)[][],
        piece: NonNullable<GameBoardProps['activePiece']>
    ): number | null => {
        const shape = TETROMINOS[piece.tetromino].shape;
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

        let ghostY = piece.pos.y;
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

        if (check(piece.pos.x, ghostY)) return null;

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

    // Spawn Blosoms - Coordinates are relative to Grid.
    const spawnBlossoms = (x: number, y: number, shape: number[][]) => {
        shape.forEach((row, dy) => {
            row.forEach((val, dx) => {
                if (val !== 0) {
                    const px = (x + dx) * blockSize;
                    const py = (y + dy) * blockSize;
                    for (let i = 0; i < 3; i++) {
                        particlesRef.current.push({
                            x: px + Math.random() * blockSize,
                            y: py,
                            vx: (Math.random() - 0.5) * 2 + 1,
                            vy: (Math.random() - 1) * 2,
                            life: 1.0,
                            color: Math.random() > 0.5 ? '#fbcfe8' : '#f472b6',
                            size: Math.random() * 4 + 2,
                            type: 'blossom',
                            rotation: Math.random() * 360,
                            rotationSpeed: (Math.random() - 0.5) * 10
                        });
                    }
                }
            });
        });
    };

    const createExplosion = (rows: number[], currentGrid: (string | number)[][]) => {
        const isMega = rows.length >= 4;
        if (isMega) physicsRef.current.shakeIntensity = 20;

        snowAccumulationRef.current = Math.min(10, snowAccumulationRef.current + rows.length * 0.5);

        rows.forEach(y => {
            currentGrid[y].forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'string') {
                    const color = TETROMINOS[cell as TetrominoType].color;
                    const centerX = x * blockSize + blockSize / 2;
                    const centerY = y * blockSize + blockSize / 2;
                    const particleCount = isMega ? 40 : 12;

                    for (let i = 0; i < particleCount; i++) {
                        let pColor = color;
                        if (isMega) {
                            const r = Math.random();
                            if (r > 0.7) pColor = '#fbbf24';
                            else if (r > 0.5) pColor = '#ffffff';
                            else if (r > 0.3) pColor = '#ef4444';
                        }
                        const speed = isMega ? 15 : 8;
                        particlesRef.current.push({
                            x: centerX + (Math.random() - 0.5) * blockSize,
                            y: centerY + (Math.random() - 0.5) * blockSize,
                            vx: (Math.random() - 0.5) * speed,
                            vy: (Math.random() - 0.5) * speed - (isMega ? 5 : 2),
                            life: 1.0,
                            color: pColor,
                            size: Math.random() * (isMega ? 10 : 6) + 2,
                            type: 'block'
                        });
                    }
                }
            });
        });
    };

    // DrawBlock draws at (x, y) grid coordinates (0-9, 0-19)
    const drawBlock = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        type: TetrominoType,
        pulseIntensity: number,
        flashLevel: number,
        overrideColor?: string
    ) => {
        const px = x * blockSize;
        const py = y * blockSize;
        const size = blockSize;
        const config = TETROMINOS[type];

        ctx.save();
        ctx.shadowColor = overrideColor || config.glowColor;
        ctx.shadowBlur = Math.max(5, (10 + pulseIntensity) + (flashLevel * 30));
        ctx.fillStyle = (overrideColor || config.color) + (overrideColor ? 'FF' : 'CC');
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

        if (flashLevel > 0.05) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashLevel * 0.8})`;
            ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        }

        // ... Details
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + (flashLevel * 0.4)})`;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 2);
        ctx.lineTo(px + size - 2, py + 2);
        ctx.lineTo(px + 2, py + size - 2);
        ctx.fill();

        ctx.strokeStyle = overrideColor ? '#ffffff' : config.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

        // Core
        const coreOpacity = 0.7 + (pulseIntensity / 40) + (flashLevel * 0.3);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, Math.max(0.5, coreOpacity))})`;
        ctx.beginPath();
        ctx.arc(px + size / 2, py + size / 2, 3 + (flashLevel * 2), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    // Ghost Logic Same as DrawBlock
    const drawGhostBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, type: TetrominoType) => {
        const px = x * blockSize;
        const py = y * blockSize;
        const size = blockSize;
        const config = TETROMINOS[type];

        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
        ctx.fillStyle = config.color;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        ctx.restore();
    };

    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Update Physics
        if (lastAction.id !== physicsRef.current.activeActionId) {
            physicsRef.current.activeActionId = lastAction.id;
            if (lastAction.type === 'LOCK') {
                physicsRef.current.flashIntensity = 1.5;
                if (lastAction.payload && lastAction.payload.tetromino) {
                    const { x, y, tetromino, rotation } = lastAction.payload;
                    if (x !== undefined && y !== undefined && tetromino !== undefined && rotation !== undefined) {
                        const shape = getRotatedShape(tetromino, rotation);
                        spawnBlossoms(x, y, shape);
                    }
                }
            } else if (lastAction.type === 'ROTATE') physicsRef.current.flashIntensity = 1.0;
            else if (lastAction.type === 'DROP') physicsRef.current.flashIntensity = 0.6;
            else if (lastAction.type === 'MOVE') physicsRef.current.flashIntensity = 0.3;
        }

        physicsRef.current.flashIntensity *= 0.85;
        if (physicsRef.current.flashIntensity < 0.01) physicsRef.current.flashIntensity = 0;
        physicsRef.current.shakeIntensity *= 0.9;
        if (physicsRef.current.shakeIntensity < 0.5) physicsRef.current.shakeIntensity = 0;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // --- BACKGROUND FRAME ---
        const now = performance.now();
        ctx.save();

        // Use Total Canvas for Background
        if (currentBgRef.current) {
            ctx.drawImage(currentBgRef.current, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Fade Transition
        if (isTransitioningRef.current && nextBgRef.current) {
            const progress = (now - bgTransitionStartRef.current) / 300;
            if (progress >= 1) {
                currentBgRef.current = nextBgRef.current;
                nextBgRef.current = null;
                isTransitioningRef.current = false;
                ctx.drawImage(currentBgRef.current, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.globalAlpha = progress;
                ctx.drawImage(nextBgRef.current, 0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0;
            }
        }
        ctx.restore();

        // --- MIST & ATMOSPHERE (Global) ---
        // Overlay Breathing Dark (Atmosphere)
        breathingPhaseRef.current += 0.002;
        const breath = Math.sin(breathingPhaseRef.current * Math.PI * 2) * 0.07;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + breath})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Mist Particles (Global)
        ctx.save();
        mistParticlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
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

        // --- PLAYFIELD ---
        // Prepare to draw grid and blocks

        // 1. Draw Playfield Backdrop (Semi-transparent dark to pop blocks)
        const gridX = FRAME_PADDING_X * blockSize;
        const gridY = FRAME_PADDING_Y * blockSize;
        const gridW = BOARD_WIDTH * blockSize;
        const gridH = BOARD_HEIGHT * blockSize;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(gridX, gridY, gridW, gridH);

        // 2. Translate Context to Grid Origin
        ctx.save();
        ctx.translate(gridX, gridY);

        // Shake inside grid logic? Or shake entire frame?
        // Let's shake the GRID ONLY for effect (or context?). 
        // If we shake the whole canvas, the temple shakes. Usually good.
        // But we are already translated. Let's add shake to translation.
        if (physicsRef.current.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * physicsRef.current.shakeIntensity;
            const dy = (Math.random() - 0.5) * physicsRef.current.shakeIntensity;
            ctx.translate(dx, dy);
        }

        // Spotlights effect (clamped to grid)
        ctx.save();
        // ... Gradient logic needs to be relative to 0,0 (which is now grid top-left)
        ctx.globalCompositeOperation = 'lighter';
        let beamOpacity = 0.05;
        if (level >= 4) beamOpacity = 0.1;
        if (level >= 7) beamOpacity = 0.15;
        if (level === 10) beamOpacity = 0.25;
        const beamGrad = ctx.createLinearGradient(0, 0, gridW, gridH); // Use gridW/H
        beamGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${beamOpacity})`);
        beamGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, 0, gridW, gridH); // Draw only on grid
        ctx.restore();

        const activePulse = 15 + Math.sin(now * 0.008) * 8;
        const megaPulse = Math.sin(now * 0.05);

        // Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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

        const brightness = 1.1;
        ctx.filter = `brightness(${brightness})`;

        // Draw Blocks
        const staticPulse = 10 + Math.sin(now * 0.003) * 5;
        grid.forEach((row, y) => {
            const isClearing = clearingLines.includes(y);
            if (isClearing) {
                if (isTetrisFlashRef.current) {
                    row.forEach((cell, x) => {
                        if (cell !== 0 && typeof cell === 'string') {
                            const strobeColor = megaPulse > 0 ? '#fbbf24' : '#ffffff';
                            drawBlock(ctx, x, y, cell as TetrominoType, 30, 0.8, strobeColor);
                        }
                    });
                }
                return;
            }
            row.forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'string') {
                    drawBlock(ctx, x, y, cell as TetrominoType, staticPulse, 0);
                }
            });
        });

        ctx.filter = 'none';

        // Draw Particles (Relative to Grid)
        if (particlesRef.current.length > 0) {
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.type === 'blossom') {
                    p.vx += 0.05;
                    p.vy += 0.02;
                    p.life -= 0.02;
                    p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
                } else {
                    p.vy += 0.5;
                    p.life -= 0.015;
                }

                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.translate(p.x, p.y);
                    if (p.rotation) ctx.rotate(p.rotation * Math.PI / 180);
                    else ctx.rotate(now * 0.01);

                    if (p.type === 'blossom') {
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = p.color;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.shadowColor = p.color;
                        ctx.shadowBlur = 10 * p.life;
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                        if (Math.random() > 0.8) {
                            ctx.fillStyle = 'white';
                            ctx.fillRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2);
                        }
                    }
                    ctx.restore();
                }
            }
        }

        // Active Piece / Ghost
        if (activePiece && clearingLines.length === 0) {
            if (ghostEnabled) {
                const ghostY = getGhostY(grid, activePiece);
                if (ghostY !== null && ghostY > activePiece.pos.y) {
                    const shape = getRotatedShape(activePiece.tetromino, activePiece.rotation);
                    shape.forEach((row, dy) => {
                        row.forEach((val, dx) => {
                            if (val) {
                                const x = activePiece.pos.x + dx;
                                const y = ghostY + dy;
                                if (y >= 0) drawGhostBlock(ctx, x, y, activePiece.tetromino);
                            }
                        });
                    });
                }
            }
            const shape = getRotatedShape(activePiece.tetromino, activePiece.rotation);
            shape.forEach((row, dy) => {
                row.forEach((val, dx) => {
                    if (val) {
                        const x = activePiece.pos.x + dx;
                        const y = activePiece.pos.y + dy;
                        if (y >= 0) drawBlock(ctx, x, y, activePiece.tetromino, activePulse, physicsRef.current.flashIntensity);
                    }
                });
            });
        }

        ctx.restore(); // End Grid Translation
    };

    // ... (useEffect for clearing lines remains same)
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
            canvas.width = TOTAL_WIDTH_BLOCKS * blockSize;
            canvas.height = TOTAL_HEIGHT_BLOCKS * blockSize;
        }

        const loop = () => {
            render();
            animationFrameRef.current = requestAnimationFrame(loop);
        }
        loop();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [grid, activePiece, lastAction, clearingLines, level, blockSize]);

    const [showTetrisAnim, setShowTetrisAnim] = useState(false);

    // Removed lights border JSX (implied)

    return (
        <div
            ref={containerRef}
            className="
      relative h-full w-full max-w-[90vw] md:max-w-none aspect-[16/24]
      flex items-center justify-center
      rounded-xl
      p-1
    "
        >
            {/* Inner Content */}
            <div className="relative w-full h-full overflow-hidden rounded-lg">
                <canvas ref={canvasRef} className="block w-full h-full object-contain relative z-0" />

                {/* Overlay Elements (Tetris / Penalty) - Position needs to generally work, centering is fine */}
                {showTetrisAnim && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-bounce-in-out">
                        {/* ... Tetris Anim */}
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

                {penaltyAnimations.map((anim) => {
                    // Float logic remains same
                    const age = Date.now() - anim.timestamp;
                    const progress = Math.min(age / 2000, 1); // 2 second animation
                    const opacity = 1 - progress;
                    const translateY = -progress * 100; // Float upward

                    return (
                        <div key={anim.id} className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-pulse"
                            style={{ opacity, transform: `translate(-50%, ${translateY}px)`, transition: 'all 0.1s linear' }}>
                            {/* ... */}
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
    // ... (Refs and setup remain same until render)

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [blockSize, setBlockSize] = useState(30);
    const animationFrameRef = useRef<number>(0);

    // Dynamic Sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
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
        setTimeout(updateSize, 0);
        return () => ro.disconnect();
    }, []);

    // Animation physics state
    const physicsRef = useRef({
        flashIntensity: 0,
        activeActionId: 0,
        shakeIntensity: 0,
    });

    const particlesRef = useRef<Particle[]>([]);
    const mistParticlesRef = useRef<MistParticle[]>([]);
    const snowAccumulationRef = useRef<number>(0);
    const breathingPhaseRef = useRef<number>(0);
    const prevClearingLinesRef = useRef<number[]>([]);
    const prevLevelRef = useRef<number>(level);

    // Background State Refs
    const currentBgRef = useRef<HTMLImageElement | null>(null);
    const nextBgRef = useRef<HTMLImageElement | null>(null);
    const bgTransitionStartRef = useRef<number>(0);
    const isTransitioningRef = useRef<boolean>(false);

    const setLevelBackground = (lvl: number) => {
        const isOdd = lvl % 2 !== 0; // Odd levels (1, 3...) use Temple 1
        const url = isOdd ? TEMPLE1_URL : TEMPLE2_URL;

        // If it's same as current, do nothing (unless init)
        if (currentBgRef.current && currentBgRef.current.src === url && !isTransitioningRef.current) {
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
            if (!currentBgRef.current) {
                // First load
                currentBgRef.current = img;
            } else {
                // Start transition
                nextBgRef.current = img;
                isTransitioningRef.current = true;
                bgTransitionStartRef.current = performance.now();
            }
        };
        img.onerror = () => {
            console.error("Failed to load background image:", url);
        };
    };

    // Initialize/Update Background on Level Change
    useEffect(() => {
        setLevelBackground(level);
    }, [level]);


    // Initialize Mist Particles (Keep this)
    useEffect(() => {
        const mist: MistParticle[] = [];
        for (let i = 0; i < 40; i++) {
            mist.push({
                x: Math.random() * BOARD_WIDTH * 30,
                y: Math.random() * BOARD_HEIGHT * 30,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 20 + 10,
                opacity: Math.random() * 0.07 + 0.05
            });
        }
        mistParticlesRef.current = mist;
    }, []);

    const isTetrisFlashRef = useRef<boolean>(false);
    const floatingTextRef = useRef<FloatingText | null>(null);

    // Helper to get ghost piece Y
    const getGhostY = (
        currentGrid: (string | number)[][],
        piece: NonNullable<GameBoardProps['activePiece']>
    ): number | null => {
        const shape = TETROMINOS[piece.tetromino].shape;
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

        let ghostY = piece.pos.y;
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

        if (check(piece.pos.x, ghostY)) return null;

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

    // Spawn Blossom Effect on Lock
    const spawnBlossoms = (x: number, y: number, shape: number[][]) => {
        shape.forEach((row, dy) => {
            row.forEach((val, dx) => {
                if (val !== 0) {
                    const px = (x + dx) * blockSize;
                    const py = (y + dy) * blockSize;
                    // Spawn petals at the top of the block
                    for (let i = 0; i < 3; i++) {
                        particlesRef.current.push({
                            x: px + Math.random() * blockSize,
                            y: py, // Top edge
                            vx: (Math.random() - 0.5) * 2 + 1, // Drift right predominantly or wind?
                            vy: (Math.random() - 1) * 2, // Up/Float
                            life: 1.0,
                            color: Math.random() > 0.5 ? '#fbcfe8' : '#f472b6', // Pink petals
                            size: Math.random() * 4 + 2,
                            type: 'blossom',
                            rotation: Math.random() * 360,
                            rotationSpeed: (Math.random() - 0.5) * 10
                        });
                    }
                }
            });
        });
    };

    const createExplosion = (rows: number[], currentGrid: (string | number)[][]) => {
        const isMega = rows.length >= 4;
        if (isMega) physicsRef.current.shakeIntensity = 20;

        snowAccumulationRef.current = Math.min(10, snowAccumulationRef.current + rows.length * 0.5);

        rows.forEach(y => {
            currentGrid[y].forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'string') {
                    const color = TETROMINOS[cell as TetrominoType].color;
                    const centerX = x * blockSize + blockSize / 2;
                    const centerY = y * blockSize + blockSize / 2;
                    const particleCount = isMega ? 40 : 12;

                    for (let i = 0; i < particleCount; i++) {
                        let pColor = color;
                        if (isMega) {
                            const r = Math.random();
                            if (r > 0.7) pColor = '#fbbf24';
                            else if (r > 0.5) pColor = '#ffffff';
                            else if (r > 0.3) pColor = '#ef4444';
                        }
                        const speed = isMega ? 15 : 8;
                        particlesRef.current.push({
                            x: centerX + (Math.random() - 0.5) * blockSize,
                            y: centerY + (Math.random() - 0.5) * blockSize,
                            vx: (Math.random() - 0.5) * speed,
                            vy: (Math.random() - 0.5) * speed - (isMega ? 5 : 2),
                            life: 1.0,
                            color: pColor,
                            size: Math.random() * (isMega ? 10 : 6) + 2,
                            type: 'block'
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
        overrideColor?: string
    ) => {
        const px = x * blockSize;
        const py = y * blockSize;
        const size = blockSize;
        const config = TETROMINOS[type];

        ctx.save();
        ctx.shadowColor = overrideColor || config.glowColor;
        ctx.shadowBlur = Math.max(5, (10 + pulseIntensity) + (flashLevel * 30));
        ctx.fillStyle = (overrideColor || config.color) + (overrideColor ? 'FF' : 'CC');
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

        if (flashLevel > 0.05) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashLevel * 0.8})`;
            ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + (flashLevel * 0.4)})`;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 2);
        ctx.lineTo(px + size - 2, py + 2);
        ctx.lineTo(px + 2, py + size - 2);
        ctx.fill();

        ctx.strokeStyle = overrideColor ? '#ffffff' : config.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

        const coreOpacity = 0.7 + (pulseIntensity / 40) + (flashLevel * 0.3);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, Math.max(0.5, coreOpacity))})`;
        ctx.beginPath();
        ctx.arc(px + size / 2, py + size / 2, 3 + (flashLevel * 2), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawGhostBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, type: TetrominoType) => {
        const px = x * blockSize;
        const py = y * blockSize;
        const size = blockSize;
        const config = TETROMINOS[type];

        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
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

            if (lastAction.type === 'LOCK') {
                physicsRef.current.flashIntensity = 1.5;
                // Spawn Blossoms if payload exists
                if (lastAction.payload && lastAction.payload.tetromino) {
                    const { x, y, tetromino, rotation } = lastAction.payload;
                    if (x !== undefined && y !== undefined && tetromino !== undefined && rotation !== undefined) {
                        const shape = getRotatedShape(tetromino, rotation);
                        spawnBlossoms(x, y, shape);
                    }
                }
            } else if (lastAction.type === 'ROTATE') physicsRef.current.flashIntensity = 1.0;
            else if (lastAction.type === 'DROP') physicsRef.current.flashIntensity = 0.6;
            else if (lastAction.type === 'MOVE') physicsRef.current.flashIntensity = 0.3;
        }

        physicsRef.current.flashIntensity *= 0.85;
        if (physicsRef.current.flashIntensity < 0.01) physicsRef.current.flashIntensity = 0;
        physicsRef.current.shakeIntensity *= 0.9;
        if (physicsRef.current.shakeIntensity < 0.5) physicsRef.current.shakeIntensity = 0;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Clear logic handled by bg draw

        // --- Background & Transition Handling ---
        const now = performance.now();

        ctx.save();

        // 1. Draw Current Background
        if (currentBgRef.current) {
            ctx.drawImage(currentBgRef.current, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback Gradient if image not loaded yet
            const baseBg = getPlayfieldBackground(level);
            ctx.fillStyle = baseBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. Handle Fade Transition
        if (isTransitioningRef.current && nextBgRef.current) {
            const progress = (now - bgTransitionStartRef.current) / 300; // 300ms duration

            if (progress >= 1) {
                // Done
                currentBgRef.current = nextBgRef.current;
                nextBgRef.current = null;
                isTransitioningRef.current = false;
                ctx.drawImage(currentBgRef.current, 0, 0, canvas.width, canvas.height);
            } else {
                // Fading
                ctx.globalAlpha = progress;
                ctx.drawImage(nextBgRef.current, 0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0;
            }
        }

        ctx.restore();

        // Overlay Breathing Dark (Atmosphere)
        breathingPhaseRef.current += 0.002;
        const breath = Math.sin(breathingPhaseRef.current * Math.PI * 2) * 0.07;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + breath})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ... (Spotlights - same)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
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
        if (level >= 7) {
            const beamGrad2 = ctx.createLinearGradient(canvas.width, 0, 0, canvas.height);
            beamGrad2.addColorStop(0, `rgba(255, 255, 255, 0)`);
            beamGrad2.addColorStop(0.5, `rgba(255, 255, 255, ${beamOpacity * 0.7})`);
            beamGrad2.addColorStop(1, `rgba(255, 255, 255, 0)`);
            ctx.fillStyle = beamGrad2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        // ... (Mist - same)
        ctx.save();
        mistParticlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
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

        // Shake
        if (physicsRef.current.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * physicsRef.current.shakeIntensity;
            const dy = (Math.random() - 0.5) * physicsRef.current.shakeIntensity;
            ctx.translate(dx, dy);
        }

        const activePulse = 15 + Math.sin(now * 0.008) * 8;
        const megaPulse = Math.sin(now * 0.05);

        // Grid Lines - Thinner and more subtle for overlaying bg
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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

        const brightness = 1.1;
        ctx.filter = `brightness(${brightness})`;

        // Draw Grid
        const staticPulse = 10 + Math.sin(now * 0.003) * 5;
        grid.forEach((row, y) => {
            const isClearing = clearingLines.includes(y);
            if (isClearing) {
                if (isTetrisFlashRef.current) {
                    row.forEach((cell, x) => {
                        if (cell !== 0 && typeof cell === 'string') {
                            const strobeColor = megaPulse > 0 ? '#fbbf24' : '#ffffff';
                            drawBlock(ctx, x, y, cell as TetrominoType, 30, 0.8, strobeColor);
                        }
                    });
                }
                return;
            }
            row.forEach((cell, x) => {
                if (cell !== 0 && typeof cell === 'string') {
                    drawBlock(ctx, x, y, cell as TetrominoType, staticPulse, 0);
                }
            });
        });

        ctx.filter = 'none';

        // Draw Particles (Blocks & Blossoms)
        if (particlesRef.current.length > 0) {
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.type === 'blossom') {
                    // Blossom physics: gentle drift, slight gravity but mostly wind
                    p.vx += 0.05; // Gentle wind to right
                    p.vy += 0.02; // Very slow gravity
                    p.life -= 0.02; // Fade out 
                    p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
                } else {
                    p.vy += 0.5; // Heavy gravity for blocks
                    p.life -= 0.015;
                }

                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.translate(p.x, p.y);

                    if (p.rotation) ctx.rotate(p.rotation * Math.PI / 180);
                    else ctx.rotate(now * 0.01);

                    if (p.type === 'blossom') {
                        // Draw Petal shape
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = p.color;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Draw Block Debris
                        ctx.shadowColor = p.color;
                        ctx.shadowBlur = 10 * p.life;
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                        if (Math.random() > 0.8) {
                            ctx.fillStyle = 'white';
                            ctx.fillRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2);
                        }
                    }

                    ctx.restore();
                }
            }
        }

        // ... (Active Piece / Ghost)
        if (activePiece && clearingLines.length === 0) {
            if (ghostEnabled) {
                const ghostY = getGhostY(grid, activePiece);
                if (ghostY !== null && ghostY > activePiece.pos.y) {
                    const shape = getRotatedShape(activePiece.tetromino, activePiece.rotation);
                    shape.forEach((row, dy) => {
                        row.forEach((val, dx) => {
                            if (val) {
                                const x = activePiece.pos.x + dx;
                                const y = ghostY + dy;
                                if (y >= 0) drawGhostBlock(ctx, x, y, activePiece.tetromino);
                            }
                        });
                    });
                }
            }
            const shape = getRotatedShape(activePiece.tetromino, activePiece.rotation);
            shape.forEach((row, dy) => {
                row.forEach((val, dx) => {
                    if (val) {
                        const x = activePiece.pos.x + dx;
                        const y = activePiece.pos.y + dy;
                        if (y >= 0) drawBlock(ctx, x, y, activePiece.tetromino, activePulse, physicsRef.current.flashIntensity);
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
    }, [grid, activePiece, lastAction, clearingLines, level, blockSize]); // Added blockSize as dep

    const [showTetrisAnim, setShowTetrisAnim] = useState(false);

    return (
        <div
            ref={containerRef}
            className="
      relative h-full w-full max-w-[90vw] md:max-w-none aspect-[10/20]
      flex items-center justify-center
      rounded-xl
      p-1
    "
        // Removed shadow here to let BG handle it
        >
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
