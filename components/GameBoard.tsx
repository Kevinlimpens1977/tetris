import React, { useRef, useEffect, useState } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, COLORS } from '../constants';
import { TetrominoType, GameAction } from '../types';

interface GameBoardProps {
  grid: (string | number)[][];
  activePiece: {
    pos: { x: number; y: number };
    tetromino: TetrominoType;
    rotation: number; 
  } | null;
  lastAction: GameAction;
  clearingLines?: number[]; // Optional prop for animation
}

const BLOCK_SIZE = 36; 

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

const GameBoard: React.FC<GameBoardProps> = ({ grid, activePiece, lastAction, clearingLines = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Animation physics state
  const physicsRef = useRef({
      flashIntensity: 0,
      activeActionId: 0,
      shakeIntensity: 0,
  });

  // Particle System Ref
  const particlesRef = useRef<Particle[]>([]);
  const prevClearingLinesRef = useRef<number[]>([]);
  
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

  const createExplosion = (rows: number[], currentGrid: (string|number)[][]) => {
      const isMega = rows.length >= 4;
      
      if (isMega) {
          physicsRef.current.shakeIntensity = 20; // Massive shake
          floatingTextRef.current = { text: "TETRIS!", y: BOARD_HEIGHT * BLOCK_SIZE / 2, opacity: 1 };
      }

      // For each block in the clearing rows, spawn particles
      rows.forEach(y => {
          currentGrid[y].forEach((cell, x) => {
              if (cell !== 0 && typeof cell === 'string') {
                  const color = TETROMINOS[cell as TetrominoType].color;
                  const centerX = x * BLOCK_SIZE + BLOCK_SIZE / 2;
                  const centerY = y * BLOCK_SIZE + BLOCK_SIZE / 2;
                  
                  // Mega clear uses Gold/Festive confetti colors
                  const particleCount = isMega ? 40 : 12;
                  
                  for(let i=0; i<particleCount; i++) {
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
                          x: centerX + (Math.random() - 0.5) * BLOCK_SIZE,
                          y: centerY + (Math.random() - 0.5) * BLOCK_SIZE,
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
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    const size = BLOCK_SIZE;
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
    ctx.arc(px + size/2, py + size/2, 3 + (flashLevel * 2), 0, Math.PI * 2);
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
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    const size = BLOCK_SIZE;
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Shake Effect ---
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

    // Draw Grid Background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let x=0; x<=BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
    }
    for(let y=0; y<=BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }

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
          const hasSnow = y === 0 || grid[y-1][x] === 0;
          drawBlock(ctx, x, y, cell as TetrominoType, staticPulse, 0, hasSnow);
        }
      });
    });

    // Draw Particles (Explosion)
    if (particlesRef.current.length > 0) {
        for(let i = particlesRef.current.length - 1; i >= 0; i--) {
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
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                
                // Add sparkle
                if (Math.random() > 0.8) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(-p.size/4, -p.size/4, p.size/2, p.size/2);
                }
                
                ctx.restore();
            }
        }
    }

    // Draw Floating Text (TETRIS!)
    if (floatingTextRef.current) {
        const ft = floatingTextRef.current;
        ft.y -= 1; // Float up
        ft.opacity -= 0.01;
        
        if (ft.opacity <= 0) {
            floatingTextRef.current = null;
        } else {
            ctx.save();
            ctx.globalAlpha = ft.opacity;
            ctx.translate(canvas.width / 2, ft.y);
            
            // Text Scale Pulse
            const scale = 1 + Math.sin(now * 0.02) * 0.1;
            ctx.scale(scale, scale);

            // Text Styles
            ctx.font = "900 60px Montserrat";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Stroke
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#b91c1c'; // Dark Red
            ctx.strokeText(ft.text, 0, 0);

            // Fill (Gradient)
            const gradient = ctx.createLinearGradient(0, -30, 0, 30);
            gradient.addColorStop(0, "#fef08a"); // Yellow
            gradient.addColorStop(0.5, "#facc15"); // Gold
            gradient.addColorStop(1, "#ef4444"); // Red
            ctx.fillStyle = gradient;
            ctx.fillText(ft.text, 0, 0);
            
            // Shine
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 20;
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.fillText(ft.text, 0, 0);

            ctx.restore();
        }
    }

    // Draw Active Piece + Ghost
    if (activePiece && clearingLines.length === 0) {
      // 1. Draw Ghost
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
        canvas.width = BOARD_WIDTH * BLOCK_SIZE;
        canvas.height = BOARD_HEIGHT * BLOCK_SIZE;
    }
    
    const loop = () => {
        render();
        animationFrameRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [grid, activePiece, lastAction, clearingLines]);

  return (
    <div className="
      relative h-full aspect-[10/20] 
      flex items-center justify-center 
      rounded-xl overflow-hidden 
      p-[2.5px]
      shadow-[0_0_30px_rgba(239,68,68,0.4)]
    ">
        {/* Animated Border - Reduced Opacity */}
        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>
        
        {/* Inner Content */}
        <div className="relative w-full h-full bg-black/60 backdrop-blur-xl rounded-[calc(0.75rem-2.5px)] overflow-hidden">
             {/* Frost Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            {/* Canvas scales to fit container */}
            <canvas ref={canvasRef} className="block w-full h-full object-contain relative z-0" />
        </div>
    </div>
  );
};

export default GameBoard;