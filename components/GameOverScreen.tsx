import React, { useMemo } from 'react';
import { PlayerStats, UserData, LeaderboardEntry } from '../types';

interface GameOverScreenProps {
    stats: PlayerStats;
    user: UserData;
    onRestart: () => void;
    isNewHigh: boolean;
    leaderboard: LeaderboardEntry[];
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, user, onRestart, isNewHigh, leaderboard }) => {

    const displayList = useMemo(() => {
        const list = leaderboard.map(e => ({ ...e, isMe: false }));
        const myEntryIndex = list.findIndex(e => e.name === user.name && e.highscore === stats.score);

        if (myEntryIndex !== -1) {
            list[myEntryIndex].isMe = true;
        } else {
            list.push({
                name: user.name,
                city: user.city,
                highscore: stats.score,
                isMe: true
            });
        }
        list.sort((a, b) => b.highscore - a.highscore);
        return list;
    }, [leaderboard, isNewHigh, stats, user]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4 overflow-hidden">

            {/* Wrapper */}
            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col group">

                {/* Snowflake */}
                <div className="absolute -top-4 -right-3 z-50 pointer-events-none transform rotate-12">
                    <div className="text-4xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">❄️</div>
                </div>

                {/* Container */}
                <div className="relative w-full h-full flex flex-col rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] overflow-hidden p-[2px] md:p-[3px]">
                    {/* Border */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/80 rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.5rem-3px)] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="shrink-0 p-6 md:p-8 pb-4 text-center">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3 drop-shadow-lg">
                                GAME OVER
                            </h1>

                            {/* Score Display */}
                            <div className="bg-white/5 inline-flex flex-col items-center px-8 py-3 rounded-2xl border border-white/10 mb-4 shadow-inner">
                                <span className="text-cyan-400/60 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold mb-1">Jouw Score</span>
                                <span className="text-3xl md:text-5xl font-mono font-black text-cyan-400 shadow-cyan-400/20 drop-shadow-md">
                                    {stats.score.toLocaleString()}
                                </span>
                            </div>

                            {isNewHigh && (
                                <div className="animate-bounce bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 p-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                    🏆 Nieuwe Highscore! 🏆
                                </div>
                            )}
                        </div>

                        {/* Leaderboard Table */}
                        <div className="flex-1 min-h-0 flex flex-col bg-black/40 mx-4 md:mx-8 rounded-xl border border-white/5 relative overflow-hidden mb-4">
                            <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 bg-white/5 text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-white/10 shrink-0">
                                <span className="w-6 text-center">#</span>
                                <span>Naam</span>
                                <span className="text-right">Score</span>
                            </div>

                            <div className="overflow-y-auto scrollbar-hide p-1 flex-1">
                                {displayList.map((entry, idx) => {
                                    const isLastAndNotInTop10 = idx >= 10;
                                    return (
                                        <div key={idx} className="relative">
                                            {isLastAndNotInTop10 && (
                                                <div className="h-px bg-white/10 w-full my-1"></div>
                                            )}

                                            <div className={`
                                        grid grid-cols-[auto_1fr_auto] gap-3 p-2.5 md:p-3 rounded-lg text-xs md:text-sm items-center transition-colors
                                        ${entry.isMe
                                                    ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 text-cyan-100 font-bold border border-cyan-500/30'
                                                    : 'text-gray-300 hover:bg-white/5'
                                                }
                                    `}>
                                                <span className={`w-6 text-center font-bold ${idx === 0 ? 'text-yellow-400' :
                                                    idx === 1 ? 'text-gray-300' :
                                                        idx === 2 ? 'text-amber-600' : 'text-gray-500'
                                                    }`}>
                                                    {isLastAndNotInTop10 ? '-' : idx + 1}
                                                </span>

                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate font-medium">{entry.name}</span>
                                                    <span className="text-[10px] text-gray-500 truncate">{entry.city}</span>
                                                </div>

                                                <span className={`font-mono text-right ${entry.isMe ? 'text-cyan-300' : 'text-gray-400'}`}>
                                                    {entry.highscore.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="shrink-0 p-4 md:p-8 pt-0">
                            <button
                                onClick={onRestart}
                                className="w-full py-4 md:py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-lg md:text-xl tracking-widest hover:from-cyan-500 hover:to-blue-500 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30"
                            >
                                OPNIEUW SPELEN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameOverScreen;