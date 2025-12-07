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

                {/* Lantern Decoration */}
                <div className="absolute -top-4 -right-3 z-50 pointer-events-none transform rotate-12">
                    <div className="text-4xl filter drop-shadow-[0_0_5px_rgba(255,255,0,0.5)]">🏮</div>
                </div>

                {/* Container */}
                <div className="relative w-full h-full flex flex-col rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] overflow-hidden p-[2px] md:p-[3px]">
                    {/* Border */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/80 rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.5rem-3px)] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="shrink-0 p-6 md:p-8 pb-4 text-center">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3 drop-shadow-lg"
                                style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    WebkitTextStroke: '1px #b91c1c',
                                }}>
                                GAME OVER
                            </h1>

                            {/* Score & Tickets Display */}
                            <div className="flex gap-4 mb-4 justify-center">
                                {/* Score */}
                                <div className="bg-white/5 flex flex-col items-center px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-white/10 shadow-inner flex-1">
                                    <span className="text-gray-400 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold mb-1">Score</span>
                                    <span className="text-2xl md:text-3xl font-mono font-black text-white drop-shadow-md">
                                        {stats.score.toLocaleString()}
                                    </span>
                                </div>

                                {/* Tickets */}
                                <div className="bg-yellow-900/20 flex flex-col items-center px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-yellow-500/30 shadow-inner flex-1 bg-gradient-to-br from-yellow-900/10 to-red-900/10">
                                    <span className="text-yellow-500 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold mb-1">Loten</span>
                                    <span className="text-2xl md:text-3xl font-mono font-black text-yellow-400 drop-shadow-md flex items-center gap-2">
                                        <span className="text-xl">🎟️</span> {stats.lotteryTickets || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Tickets Explained */}
                            <div className="mb-4 text-center">
                                <p className="text-xs md:text-sm text-yellow-100/80 font-medium">
                                    {stats.lotteryTickets > 0
                                        ? `Gefeliciteerd! Je hebt ${stats.lotteryTickets} lot${stats.lotteryTickets > 1 ? 'en' : ''} verdiend voor de trekking.`
                                        : 'Helaas, geen loten verdiend. Probeer minimaal 5.000 punten te scoren!'}
                                </p>
                            </div>

                            {isNewHigh && (
                                <div className="animate-bounce bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 p-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                    🏆 Nieuwe Highscore! 🏆
                                </div>
                            )}
                        </div>

                        {/* Leaderboard Table (Brief) */}
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
                                                    ? 'bg-gradient-to-r from-red-900/60 to-orange-900/60 text-yellow-100 font-bold border border-yellow-500/30'
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

                                                <span className={`font-mono text-right ${entry.isMe ? 'text-yellow-300' : 'text-gray-400'}`}>
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
                                className="w-full py-4 md:py-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-lg md:text-xl tracking-widest hover:from-red-500 hover:to-red-700 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(220,38,38,0.4)] border border-red-400/30"
                            >
                                OPNIEUW SPELEN (€2,50)
                            </button>
                            <p className="text-center text-[10px] text-gray-500 mt-2">
                                Elke nieuwe poging kost 1 token. De opbrengst gaat naar het goede doel!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameOverScreen;