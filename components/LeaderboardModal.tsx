import React, { useMemo } from 'react';
import { UserData, LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
    isOpen: boolean;
    user: UserData;
    currentScore: number;
    leaderboard: LeaderboardEntry[];
    onResume: () => void;
    onQuit: () => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
    isOpen, user, currentScore, leaderboard, onResume, onQuit
}) => {
    if (!isOpen) return null;

    // Combine current live score with stored leaderboard for display purposes in the modal
    const displayList = useMemo(() => {
        // Check if user is already in top 10 with a better score
        // If current score is better than what's in leaderboard, we want to visualize where they WOULD be.

        // Create a temporary entry for the current game
        const currentEntry = {
            name: user.name,
            city: user.city,
            highscore: currentScore,
            isMe: true
        };

        // Merge with existing leaderboard
        // Note: The passed 'leaderboard' is the saved top 10.
        // We combine them to show where the user ranks RIGHT NOW.

        let combined = leaderboard.map(e => ({ ...e, isMe: false }));
        combined.push(currentEntry);

        // Sort descending
        combined.sort((a, b) => b.highscore - a.highscore);

        return combined;
    }, [user, currentScore, leaderboard]);

    const top10 = displayList.slice(0, 10);
    const myRank = displayList.findIndex(x => x.isMe) + 1;
    const myEntry = displayList.find(x => x.isMe);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">

            {/* Wrapper for positioning + Snowflake */}
            <div className="relative group max-w-md w-full">

                {/* Minimal Snowflake Decoration - Outside overflow-hidden */}
                <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12">
                    <div className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">❄️</div>
                </div>

                {/* Clipping Container for Border Effect */}
                <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] p-[2.5px]">
                    {/* Animated Border - Reduced Opacity */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/80 rounded-[calc(1.5rem-2.5px)] p-6 md:p-8">

                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white uppercase tracking-tighter">
                                Pauze & Ranking
                            </h2>
                            <div className="text-cyan-300 text-xs tracking-widest uppercase mt-1">Omroep Parkstad Top 10</div>
                        </div>

                        {/* Leaderboard List */}
                        <div className="bg-black/40 rounded-xl overflow-hidden mb-6 border border-white/5">
                            <div className="grid grid-cols-[auto_1fr_auto] gap-2 p-3 bg-white/5 text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-white/5">
                                <span>#</span>
                                <span>Naam</span>
                                <span>Score</span>
                            </div>
                            <div className="max-h-[30vh] overflow-y-auto scrollbar-hide">
                                {top10.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-xs">Nog geen scores. Speel om de eerste te zijn!</div>
                                ) : (
                                    top10.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                        grid grid-cols-[auto_1fr_auto] gap-2 p-3 text-sm border-b border-white/5 items-center
                                        ${entry.isMe ? 'bg-cyan-500/20 text-cyan-200 font-bold' : 'text-gray-300'}
                                    `}
                                        >
                                            <span className={`w-6 text-center ${idx < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate">{entry.name}</span>
                                                <span className="text-[10px] text-gray-500 truncate">{entry.city}</span>
                                            </div>
                                            <span className="font-mono">{entry.highscore.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* If user is not in top 10, show them at bottom */}
                            {myRank > 10 && myEntry && (
                                <div className="grid grid-cols-[auto_1fr_auto] gap-2 p-3 text-sm bg-cyan-900/40 text-cyan-200 font-bold border-t border-white/10 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-black px-2 rounded-full text-gray-500">...</div>
                                    <span className="w-6 text-center">{myRank}</span>
                                    <span className="truncate">Jij ({user.name})</span>
                                    <span className="font-mono">{myEntry.highscore.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onQuit}
                                className="flex-1 py-3 rounded-xl bg-red-900/50 hover:bg-red-800/50 border border-red-500/30 text-red-200 font-bold text-sm transition-colors"
                            >
                                STOPPEN
                            </button>
                            <button
                                onClick={onResume}
                                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg transition-transform transform hover:scale-105"
                            >
                                DOORGAAN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;