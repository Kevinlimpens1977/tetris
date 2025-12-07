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
      shadow-[0_0_15px_rgba(220,38,38,0.2)]
      transition-all duration-300
    `}>
      {/* China Theme Border Gradient */}
      <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-60"></div>
      <div className="relative w-full h-full bg-black/80 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-2 md:p-3">
        <div className={`text-[9px] md:text-xs font-bold text-${color}-300 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5 opacity-90`}>
          {icon && <span className="hidden sm:inline text-base">{icon}</span>} {label}
        </div>
        <div className="flex items-baseline gap-1 relative z-10 w-full justify-center">
          <span className={`text-lg sm:text-2xl md:text-3xl lg:text-4xl font-mono font-black text-white drop-shadow-md truncate tracking-tight ${label === 'Loten' ? 'text-yellow-400' : ''}`}>
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

    // Calculate block size based on shape dimensions
    const getBlockSize = () => {
      if (!type) return 12;
      const rows = shape.length;
      const cols = shape[0].length;
      // Scale down larger pieces
      if (rows >= 4 || cols >= 4) return 8;
      if (rows >= 3 || cols >= 3) return 10;
      return 12;
    };

    const blockSize = getBlockSize();

    return (
      <div className={`
        relative group overflow-hidden
        rounded-xl md:rounded-2xl 
        p-[1px] md:p-[2px]
        w-full flex-[1.5] min-h-[100px] md:min-h-[140px]
        shadow-[0_0_15px_rgba(234,179,8,0.2)]
        transition-all duration-300
      `}>
        <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-60"></div>
        <div className="relative w-full h-full bg-black/80 backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-3 md:p-4">
          <div className="text-[9px] md:text-xs font-bold text-yellow-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-1 opacity-90">
            VOLGENDE
          </div>
          <div className="flex items-center justify-center flex-1 w-full relative z-10">
            {type && (
              <div style={{
                display: 'grid',
                gridTemplateRows: `repeat(${shape.length}, ${blockSize}px)`,
                gridTemplateColumns: `repeat(${shape[0].length}, ${blockSize}px)`,
                gap: '2px',
              }}>
                {shape.map((row, y) => row.map((cell, x) => (
                  <div key={`${y}-${x}`} style={{
                    width: `${blockSize}px`,
                    height: `${blockSize}px`,
                    backgroundColor: cell ? color : 'transparent',
                    boxShadow: cell ? `0 0 10px ${glow}, inset 0 0 5px rgba(255,255,255,0.3)` : 'none',
                    borderRadius: '2px',
                    opacity: cell ? 1 : 0,
                    border: cell ? `1px solid rgba(255,255,255,0.2)` : 'none'
                  }} />
                )))}
              </div>
            )}
            {!type && <span className="text-white/20 text-2xl font-black">?</span>}
          </div>
          {/* Soft gold spotlight at bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-t from-yellow-500/10 to-transparent blur-sm pointer-events-none"></div>
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
            <span className="text-[8px] md:text-[10px] text-red-400/80 uppercase">p/stuk</span>
          </div>
        </div>
      </div>
    );
  };

  // Ghost Toggle Button (Lantern Style)
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
        <div className={`relative w-full h-full backdrop-blur-xl rounded-[calc(0.75rem-1px)] md:rounded-[calc(1rem-2px)] flex flex-col items-center justify-center p-2 md:p-3 transition-colors ${ghostEnabled ? 'bg-red-900/60' : 'bg-gray-900/60'
          }`}>
          <div className="text-[9px] md:text-xs font-bold text-red-300 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5 opacity-80">
            <span className="text-base">👻</span> GHOST
          </div>
          <div className="flex items-center justify-center relative z-10 w-full mb-1">
            <span className={`text-2xl md:text-3xl transition-all duration-300 ${ghostEnabled ? 'filter drop-shadow-[0_0_10px_rgba(255,20,20,0.8)]' : 'opacity-30 grayscale'
              }`}>
              🏮
            </span>
          </div>
          <div className={`text-[8px] md:text-[9px] font-bold uppercase ${ghostEnabled ? 'text-red-400' : 'text-gray-500'
            }`}>
            {ghostEnabled ? 'AAN' : 'UIT'}
          </div>
        </div>
      </button>
    );
  };

  const showGhostToggle = isGhostAllowedForLevel(stats.level);

  return (
    <div className="flex flex-row md:flex-col gap-2 md:gap-4 w-full h-auto md:h-full justify-between md:justify-start items-stretch md:items-stretch py-1 md:py-0">

      {/* Mobile: Left Side (Stats), Desktop: Top (Next Piece) */}
      <div className="flex flex-row md:flex-col gap-2 flex-[2] md:flex-none order-1 md:order-2">
        {/* SCORE */}
        <StatBox
          label="Score"
          value={stats.score.toLocaleString()}
          color="cyan"
          icon="🐉"
        />

        {/* LOTTERY TICKETS */}
        <StatBox
          label="Loten"
          value={stats.lotteryTickets}
          color="yellow"
          icon="🎟️"
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
          icon="🎋"
        />
      </div>

      {/* Mobile: Right Side (Next Piece + Ghost), Desktop: Top (Next Piece) */}
      <div className="flex flex-row md:flex-col gap-2 flex-1 md:flex-none justify-end order-2 md:order-1">
        {/* GHOST TOGGLE */}
        {showGhostToggle && (
          <div className="w-16 md:w-full">
            <GhostToggle />
          </div>
        )}

        {/* NEXT PIECE */}
        <div className="w-16 md:w-full">
          <NextPieceBox type={nextPiece} />
        </div>
      </div>

      {/* Ghost Active Badge */}
      {ghostEnabled && (
        <div className="hidden md:block order-3">
          <GhostActiveBadge />
        </div>
      )}

    </div>
  );
};

export default HUD;