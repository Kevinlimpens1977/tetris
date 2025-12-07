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

    const displayList = useMemo(() => {
        const currentEntry = {
            name: user.name,
            city: user.city,
            highscore: currentScore,
            isMe: true
        };

        let combined = leaderboard.map(e => ({ ...e, isMe: false }));
        combined.push(currentEntry);
        combined.sort((a, b) => b.highscore - a.highscore);

        return combined;
    }, [user, currentScore, leaderboard]);

    const top10 = displayList.slice(0, 10);
    const myRank = displayList.findIndex(x => x.isMe) + 1;
    const myEntry = displayList.find(x => x.isMe);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">

            {/* Wrapper */}
            <div className="relative group max-w-lg w-full">

                {/* Lantern */}
                <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12">
                    <div className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,255,0,0.5)]">🏮</div>
                </div>

                {/* Container */}
                <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] p-[2px] md:p-[3px]">
                    {/* Border */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/90 rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.5rem-3px)] p-4 md:p-8 flex flex-col max-h-[85vh]">

                        {/* Header */}
                        <div className="text-center mb-4 md:mb-6 shrink-0">
                            <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-200 uppercase tracking-tighter drop-shadow-sm">
                                Pauze & Ranking
                            </h2>
                            <div className="text-yellow-500 text-[10px] md:text-xs tracking-[0.2em] uppercase mt-2 font-bold">China Reis Top 10</div>
                        </div>

                        {/* Leaderboard List */}
                        <div className="bg-white/5 rounded-xl overflow-hidden mb-4 md:mb-6 border border-white/10 flex-1 min-h-0 flex flex-col">
                            <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 bg-black/40 text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-white/5 shrink-0">
                                <span className="w-6 text-center">#</span>
                                <span>Naam</span>
                                <span className="text-right">Score</span>
                            </div>
                            <div className="overflow-y-auto scrollbar-hide p-1">
                                {top10.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-xs italic">Nog geen scores. Speel om de eerste te zijn!</div>
                                ) : (
                                    top10.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                        grid grid-cols-[auto_1fr_auto] gap-3 p-2.5 md:p-3 text-xs md:text-sm border-b border-white/5 items-center last:border-0
                                        ${entry.isMe ? 'bg-red-900/40 text-yellow-200 font-bold border border-yellow-500/20' : 'text-gray-300'}
                                    `}
                                        >
                                            <span className={`w-6 text-center font-bold ${idx < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate font-medium">{entry.name}</span>
                                                <span className="text-[10px] text-gray-500 truncate">{entry.city}</span>
                                            </div>
                                            <span className="font-mono text-right">{entry.highscore.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* User Rank Footer */}
                            {myRank > 10 && myEntry && (
                                <div className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 text-xs md:text-sm bg-red-900/40 text-yellow-200 font-bold border-t border-yellow-500/20 relative shrink-0">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-black px-2 rounded-full text-gray-500">...</div>
                                    <span className="w-6 text-center">{myRank}</span>
                                    <span className="truncate">Jij ({user.name})</span>
                                    <span className="font-mono text-right">{myEntry.highscore.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 shrink-0">
                            <button
                                onClick={onQuit}
                                className="flex-1 py-4 md:py-4 rounded-xl bg-gray-800/50 hover:bg-gray-800/80 border border-white/10 text-gray-300 font-bold text-xs md:text-sm transition-colors uppercase tracking-wider"
                            >
                                Stoppen
                            </button>
                            <button
                                onClick={onResume}
                                className="flex-[2] py-4 md:py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-sm md:text-base shadow-lg transition-transform transform hover:scale-[1.02] uppercase tracking-wider border border-red-500/30"
                            >
                                Doorgaan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;