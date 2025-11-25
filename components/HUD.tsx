import React from 'react';
import { PlayerStats, TetrominoType } from '../types';
import { TETROMINOS } from '../constants';

interface HUDProps {
  stats: PlayerStats;
  nextPiece: TetrominoType | null;
  ghostEnabled?: boolean;
  onToggleGhost?: () => void;
}

// Helper function to get ghost penalty for level
const getGhostPenalty = (level: number): number => {
  const penalties: { [key: number]: number } = {
    1: 3, 2: 5, 3: 0, 4: 0, 5: 0, 6: 0, 7: 10, 8: 12, 9: 15, 10: 20
  };
  return penalties[level] || 0;
};

// Check if ghost is allowed for level
const isGhostAllowedForLevel = (level: number): boolean => {
  return level <= 2 || level >= 7;
};

const HUD: React.FC<HUDProps> = ({ stats, nextPiece, ghostEnabled = false, onToggleGhost }) => {
  const StatBox = ({ label, value, color, icon }: { label: string, value: string | number, color: string, icon?: string }) => (
    <div className={`
      relative group overflow-hidden
      rounded-xl md:rounded-2xl 
      p-[1px] md:p-[2px]
      w-full flex-1 min-h-0
      shadow-[0_0_15px_rgba(239,68,68,0.15)]
      transition-all duration-300
    `}>
      <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>
      <div className="relative w-full h-full bg-black/60 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-2 md:p-3">
        <div className={`text-[9px] md:text-xs font-bold text-${color}-300 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5 opacity-80`}>
          {icon && <span className="hidden sm:inline text-base">{icon}</span>} {label}
        </div>
        <div className="flex items-baseline gap-1 relative z-10">
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-mono font-black text-white drop-shadow-md truncate tracking-tight">
            {value}
          </span>
        </div>
      </div>
    </div>
  );

  const NextPieceBox = ({ type }: { type: TetrominoType | null }) => {
    const shape = type ? TETROMINOS[type].shape : [];
    const color = type ? TETROMINOS[type].color : 'transparent';
    const glow = type ? TETROMINOS[type].glowColor : 'transparent';

    return (
      <div className={`
        relative group overflow-hidden
        rounded-xl md:rounded-2xl 
        p-[1px] md:p-[2px]
        w-full flex-[1.5] min-h-[100px] md:min-h-[140px]
        shadow-[0_0_15px_rgba(239,68,68,0.15)]
        transition-all duration-300
      `}>
        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>
        <div className="relative w-full h-full bg-black/60 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-3 md:p-4">
          <div className="text-[9px] md:text-xs font-bold text-blue-300 uppercase tracking-[0.15em] mb-2 flex items-center gap-1 opacity-80">
            VOLGENDE
          </div>
          <div className="flex items-center justify-center flex-1 w-full relative z-10">
            {type && (
              <div style={{
                display: 'grid',
                gridTemplateRows: `repeat(${shape.length}, 1fr)`,
                gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`,
                gap: '2px',
                transform: 'scale(0.9)'
              }}>
                {shape.map((row, y) => row.map((cell, x) => (
                  <div key={`${y}-${x}`} style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: cell ? color : 'transparent',
                    boxShadow: cell ? `0 0 8px ${glow}` : 'none',
                    borderRadius: '2px',
                    opacity: cell ? 1 : 0,
                    border: cell ? `1px solid ${color}` : 'none'
                  }} />
                )))}
              </div>
            )}
            {!type && <span className="text-white/20 text-2xl font-black">?</span>}
          </div>
        </div>
      </div>
    );
  };

  // Ghost Active Badge (shown when ghost is ON)
  const GhostActiveBadge = () => {
    const penalty = getGhostPenalty(stats.level);

    return (
      <div className="relative group overflow-hidden rounded-xl md:rounded-2xl p-[1px] md:p-[2px] w-full flex-1 min-h-0 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#dc2626_0%,#ef4444_50%,#dc2626_100%)] animate-spin-slow opacity-70"></div>
        <div className="relative w-full h-full bg-gradient-to-r from-red-900/80 to-orange-900/80 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-2 md:p-3">
          <div className="text-[8px] md:text-[9px] font-bold text-red-200 uppercase tracking-[0.15em] mb-1 flex items-center gap-1">
            <span className="text-sm">👻</span> GHOST ACTIEF
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-lg sm:text-xl md:text-2xl font-mono font-black text-red-300 drop-shadow-md">
              -{penalty}
            </span>
            <span className="text-[8px] md:text-[10px] text-red-400/80 uppercase">per stuk</span>
          </div>
        </div>
      </div>
    );
  };

  // Ghost Toggle Button (Christmas Tree Style)
  const GhostToggle = () => {
    if (!onToggleGhost) return null;

    return (
      <button
        onClick={onToggleGhost}
        className={`
          relative group overflow-hidden
          rounded-xl md:rounded-2xl 
          p-[1px] md:p-[2px]
          w-full flex-1 min-h-0
          shadow-[0_0_15px_rgba(239,68,68,0.15)]
          transition-all duration-300
          hover:scale-105 active:scale-95
        `}
      >
        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>
        <div className={`relative w-full h-full backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-2 md:p-3 transition-colors ${ghostEnabled ? 'bg-green-900/60' : 'bg-gray-900/60'
          }`}>
          <div className="text-[9px] md:text-xs font-bold text-green-300 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5 opacity-80">
            <span className="text-base">👻</span> GHOST
          </div>
          <div className="flex items-center justify-center relative z-10">
            <span className={`text-3xl md:text-4xl transition-all duration-300 ${ghostEnabled ? 'filter drop-shadow-[0_0_10px_rgba(55,255,139,0.8)]' : 'opacity-30 grayscale'
              }`}>
              🎄
            </span>
          </div>
          <div className={`text-[8px] md:text-[9px] font-bold uppercase mt-1 ${ghostEnabled ? 'text-green-400' : 'text-gray-500'
            }`}>
            {ghostEnabled ? 'AAN' : 'UIT'}
          </div>
        </div>
      </button>
    );
  };

  const showGhostToggle = isGhostAllowedForLevel(stats.level);

  return (
    <div className="flex flex-col gap-3 md:gap-4 w-full h-full justify-between py-2 md:py-0">

      {/* NEXT PIECE */}
      <NextPieceBox type={nextPiece} />

      {/* GHOST ACTIVE BADGE (only when ghost is ON) */}
      {ghostEnabled && <GhostActiveBadge />}

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

      {/* GHOST TOGGLE (only levels 1-2 and 7-10) */}
      {showGhostToggle && <GhostToggle />}

    </div>
  );
};

export default HUD;