import React from 'react';
import { PlayerStats, TetrominoType } from '../types';
import { TETROMINOS } from '../constants';

interface HUDProps {
  stats: PlayerStats;
  nextPiece: TetrominoType | null;
}

const HUD: React.FC<HUDProps> = ({ stats, nextPiece }) => {
  const StatBox = ({ label, value, color, icon }: { label: string, value: string | number, color: string, icon?: string }) => (
    <div className={`
      relative group overflow-hidden
      rounded-xl md:rounded-2xl 
      p-[1px] md:p-[1.5px]
      w-full flex-1 min-h-0
      shadow-[0_0_20px_rgba(239,68,68,0.2)]
      transition-all duration-300
    `}>
        {/* Animated Border - Reduced Opacity */}
        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

        {/* Content */}
        <div className="relative w-full h-full bg-black/60 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-1.5px)] flex flex-col items-center justify-center p-1 md:p-2">
            
            {/* Label */}
            <div className={`text-[8px] md:text-[10px] font-bold text-${color}-300 uppercase tracking-[0.1em] mb-0.5 md:mb-1 flex items-center gap-1`}>
                {icon && <span className="hidden md:inline">{icon}</span>} {label}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-sm sm:text-base md:text-2xl lg:text-3xl font-mono font-black text-white drop-shadow-md truncate">
                    {value}
                </span>
            </div>
        </div>
    </div>
  );

  const NextPieceBox = ({ type }: { type: TetrominoType | null }) => {
    // Render the mini grid for the next piece
    const shape = type ? TETROMINOS[type].shape : [];
    const color = type ? TETROMINOS[type].color : 'transparent';
    const glow = type ? TETROMINOS[type].glowColor : 'transparent';

    return (
      <div className={`
        relative group overflow-hidden
        rounded-xl md:rounded-2xl 
        p-[1px] md:p-[1.5px]
        w-full flex-[1.5] min-h-0
        shadow-[0_0_20px_rgba(239,68,68,0.2)]
        transition-all duration-300
      `}>
          {/* Animated Border - Reduced Opacity */}
          <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

          {/* Content */}
          <div className="relative w-full h-full bg-black/60 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-1.5px)] flex flex-col items-center justify-center p-2">
            
            <div className="text-[8px] md:text-[10px] font-bold text-blue-300 uppercase tracking-[0.1em] mb-1 flex items-center gap-1">
                NEXT
            </div>

            <div className="flex items-center justify-center flex-1 w-full relative z-10">
                {type && (
                    <div style={{
                        display: 'grid',
                        gridTemplateRows: `repeat(${shape.length}, 1fr)`,
                        gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`,
                        gap: '2px',
                        transform: 'scale(0.8)' /* Slight scale down for mobile tightness */
                    }}>
                        {shape.map((row, y) => row.map((cell, x) => (
                            <div key={`${y}-${x}`} style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: cell ? color : 'transparent',
                                boxShadow: cell ? `0 0 5px ${glow}` : 'none',
                                borderRadius: '1px',
                                opacity: cell ? 1 : 0,
                                border: cell ? `1px solid ${color}` : 'none'
                            }} />
                        )))}
                    </div>
                )}
                {!type && <span className="text-white/20 text-xl">?</span>}
            </div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full justify-between">
      
      {/* NEXT PIECE */}
      <NextPieceBox type={nextPiece} />

      {/* SCORE */}
      <StatBox 
        label="Score" 
        value={stats.score.toLocaleString()} 
        color="cyan" 
        icon="⭐"
      />

      {/* LINES */}
      <StatBox 
        label="Lijnen" 
        value={stats.lines} 
        color="green"
        icon="☰" 
      />

      {/* LEVEL */}
      <StatBox 
        label="Niveau" 
        value={stats.level} 
        color="purple" 
        icon="📶"
      />

    </div>
  );
};

export default HUD;