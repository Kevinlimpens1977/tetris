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

        // We want to show where the user landed.
        // If they made a highscore, they are already in the list (fetched from DB in App.tsx) 
        // BUT App.tsx fetches leaderboard AFTER submitScore.
        // So the leaderboard passed here SHOULD contain the new score if it was high enough.

        // However, to be safe and highlight the user:
        const myEntryIndex = list.findIndex(e => e.name === user.name && e.highscore === stats.score);

        if (myEntryIndex !== -1) {
            list[myEntryIndex].isMe = true;
        } else {
            // If not in top 10 (or whatever limit), append to show them at bottom
            list.push({
                name: user.name,
                city: user.city,
                highscore: stats.score,
                isMe: true
            });
        }

        // Sort just in case
        list.sort((a, b) => b.highscore - a.highscore);

        return list;
    }, [leaderboard, isNewHigh, stats, user]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4 overflow-hidden">

            {/* Wrapper for positioning + Snowflake */}
            <div className="relative w-full max-w-sm md:max-w-md max-h-[90vh] flex flex-col group">

                {/* Minimal Snowflake Decoration - Outside overflow-hidden */}
                <div className="absolute -top-4 -right-3 z-50 pointer-events-none transform rotate-12">
                    <div className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">❄️</div>
                </div>

                {/* Clipping Container for Border Effect */}
                <div className="relative w-full h-full flex flex-col rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] overflow-hidden p-[2.5px]">
                    {/* Animated Border - Reduced Opacity */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/80 rounded-[calc(1.5rem-2.5px)] flex flex-col overflow-hidden">

                        {/* Confetti / Celebration Header */}
                        <div className="shrink-0 p-4 md:p-6 pb-2 text-center">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-2 drop-shadow-lg">
                                GAME OVER
                            </h1>

                            {/* Main Score Display */}
                            <div className="bg-white/5 inline-flex flex-col items-center px-6 py-2 rounded-2xl border border-white/10 mb-4">
                                <span className="text-cyan-400/60 uppercase tracking-widest text-[10px] font-bold">Jouw Score</span>
                                <span className="text-2xl md:text-3xl font-mono font-black text-cyan-400 shadow-cyan-400/20 drop-shadow-md">
                                    {stats.score.toLocaleString()}
                                </span>
                            </div>

                            {isNewHigh && (
                                <div className="animate-bounce bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 p-2 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                                    🏆 Nieuwe Highscore! 🏆
                                </div>
                            )}
                        </div>

                        {/* Leaderboard Table Area */}
                        <div className="flex-1 min-h-0 flex flex-col bg-black/40 mx-4 md:mx-6 rounded-xl border border-white/5 relative overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 bg-white/5 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-white/10 shrink-0">
                                <span className="w-6 text-center">#</span>
                                <span>Naam</span>
                                <span className="text-right">Score</span>
                            </div>

                            {/* Scrollable List */}
                            <div className="overflow-y-auto scrollbar-hide p-1 flex-1">
                                {displayList.map((entry, idx) => {
                                    const isLastAndNotInTop10 = idx >= 10;
                                    return (
                                        <div key={idx} className="relative">
                                            {isLastAndNotInTop10 && (
                                                <div className="h-px bg-white/10 w-full my-1"></div>
                                            )}

                                            <div className={`
                                        grid grid-cols-[auto_1fr_auto] gap-3 p-2 rounded-lg text-xs md:text-sm items-center transition-colors
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
                                                    <span className="truncate">{entry.name}</span>
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
                        <div className="shrink-0 p-4 md:p-6 pt-4">
                            <button
                                onClick={onRestart}
                                className="w-full py-3 md:py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-md md:text-lg tracking-widest hover:from-cyan-500 hover:to-blue-500 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.4)]"
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