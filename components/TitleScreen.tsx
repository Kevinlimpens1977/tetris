import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';

interface TitleScreenProps {
    onStart: () => void;
    leaderboard: LeaderboardEntry[];
    onClearSnow: () => void;
}

interface SnowyContainerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    noPadding?: boolean;
}

// Helper: Festive Container with Animated Gradient Border
const SnowyContainer: React.FC<SnowyContainerProps> = ({
    children,
    className = "",
    delay = 0,
    noPadding = false
}) => {
    return (
        // Wrapper for positioning (className) and holding the snowflake outside the clip
        <div
            className={`relative group ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Minimal Snowflake Decoration - Outside overflow-hidden */}
            <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <div className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">❄️</div>
            </div>

            {/* Clipping Container for Border Effect */}
            <div className="relative w-full h-full overflow-hidden rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.4)] p-[2.5px]">
                {/* Animated Spinning Border - Reduced opacity for 'half visible' light */}
                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

                {/* Inner Content Content */}
                <div className={`relative h-full w-full bg-black/80 backdrop-blur-xl rounded-[calc(0.75rem-2.5px)] overflow-hidden ${noPadding ? "" : "p-4"}`}>

                    {/* Frosty shine on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    {children}
                </div>
            </div>
        </div>
    );
};

// Helper: Christmas Lights String
const ChristmasLights = () => (
    <div className="absolute top-0 left-0 w-full h-12 overflow-hidden pointer-events-none z-0">
        <div className="relative w-[120%] -left-[10%] h-4 border-b-2 border-gray-600 rounded-[50%]"></div>
        <div className="flex justify-around px-4 -mt-1 relative z-10">
            {[...Array(12)].map((_, i) => (
                <div key={i} className={`
                    w-3 h-3 md:w-4 md:h-4 rounded-full shadow-[0_0_10px_currentColor] animate-lights
                    ${i % 3 === 0 ? 'bg-red-500 text-red-500' :
                        i % 3 === 1 ? 'bg-green-500 text-green-500' :
                            'bg-yellow-400 text-yellow-400'}
                 `}
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}
        </div>
    </div>
);

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, leaderboard, onClearSnow }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const target = new Date(`December 31, ${new Date().getFullYear()} 23:59:59`).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(interval);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative z-10 flex flex-col items-center justify-between w-full h-full overflow-hidden py-4 px-4 md:py-8">

            {/* Lights Decoration */}
            <ChristmasLights />

            {/* Top Left: Snow Clearing Button */}
            <button
                onClick={onClearSnow}
                className="absolute top-4 left-4 z-50 bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                title="Verwijder sneeuw van de grond"
            >
                <span>❄️</span> Ruim Sneeuw
            </button>

            {/* Brand Header */}
            <div className="text-center relative animate-float shrink-0 flex flex-col items-center justify-center mt-4 w-full">

                <div className="relative inline-block mb-2">
                    <h2 className="text-white drop-shadow-md tracking-[0.3em] text-[10px] md:text-xs font-bold uppercase bg-red-700/80 px-3 py-1 rounded-full border border-red-500/50">Omroep Parkstad Presenteert</h2>
                </div>

                {/* 3D Christmas Text */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6 relative z-10"
                    style={{
                        fontFamily: 'Montserrat, sans-serif',
                        color: '#ef4444', // Red-500
                        WebkitTextStroke: '2px #fff',
                        textShadow: `
                0 0 20px rgba(220, 38, 38, 0.5),
                2px 2px 0 #991b1b,
                4px 4px 0 #7f1d1d,
                6px 6px 15px rgba(0,0,0,0.5)
              `
                    }}>
                    KERST<br />TETRIS
                </h1>

                {/* Countdown Module */}
                <SnowyContainer className="w-full max-w-lg mx-auto">
                    <div className="flex flex-col gap-6 items-center p-2">
                        {/* Timer */}
                        <div className="flex gap-3 md:gap-6 items-center justify-center w-full">
                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-mono font-bold text-white drop-shadow-md">{timeLeft.days}</div>
                                <div className="text-[8px] md:text-[10px] uppercase text-red-200 font-bold tracking-wider">Dagen</div>
                            </div>
                            <div className="text-xl md:text-2xl font-light text-red-500 animate-pulse">:</div>
                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-mono font-bold text-white drop-shadow-md">{timeLeft.hours}</div>
                                <div className="text-[8px] md:text-[10px] uppercase text-red-200 font-bold tracking-wider">Uur</div>
                            </div>
                            <div className="text-xl md:text-2xl font-light text-red-500 animate-pulse">:</div>
                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-mono font-bold text-white drop-shadow-md">{timeLeft.minutes}</div>
                                <div className="text-[8px] md:text-[10px] uppercase text-red-200 font-bold tracking-wider">Min</div>
                            </div>
                            <div className="text-xl md:text-2xl font-light text-red-500 animate-pulse">:</div>
                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-mono font-bold text-white drop-shadow-md">{timeLeft.seconds}</div>
                                <div className="text-[8px] md:text-[10px] uppercase text-red-200 font-bold tracking-wider">Sec</div>
                            </div>
                        </div>

                        {/* Main Action Button (Moved here) */}
                        <button
                            onClick={onStart}
                            className="group relative w-full md:w-auto px-10 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-lg md:text-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border border-red-400/30"
                        >
                            <span className="animate-bounce">🎅</span> SPEEL MEE <span className="animate-bounce delay-100">🎁</span>

                            {/* Button Decoration */}
                            <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-yellow-400 rounded-full blur-sm opacity-50 group-hover:opacity-100"></div>
                        </button>
                    </div>
                </SnowyContainer>
            </div>

            {/* Main Content Grid */}
            <div className="w-full max-w-5xl flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 my-6 items-center overflow-visible p-4">

                {/* Left Side: Prizes (Snowy Containers) */}
                <div className="flex flex-col gap-6 justify-center">
                    {/* Box 1: Top 3 */}
                    <SnowyContainer className="bg-gradient-to-br from-yellow-950/40 to-black/60">
                        <h3 className="text-yellow-400 font-black mb-1 text-base flex items-center gap-2">
                            <span className="text-2xl drop-shadow-md">🏆</span> Top 3 Winnaars
                        </h3>
                        <p className="text-xs text-yellow-100/80 leading-relaxed font-medium">
                            Eindig op 31 dec in de top 3 en win een exclusief prijzenpakket!
                        </p>
                    </SnowyContainer>

                    {/* Box 2: Random Winners */}
                    <SnowyContainer className="bg-gradient-to-br from-purple-950/40 to-black/60" delay={200}>
                        <h3 className="text-purple-300 font-black mb-1 text-base flex items-center gap-2">
                            <span className="text-2xl drop-shadow-md">🎁</span> 5 Random Winnaars
                        </h3>
                        <p className="text-xs text-purple-100/80 leading-relaxed font-medium">
                            Op 1 januari trekken we 5 gelukkige winnaars uit álle deelnemers. Iedereen maakt kans!
                        </p>
                    </SnowyContainer>
                </div>

                {/* Right Side: Leaderboard Tile (Snowy Container) */}
                <SnowyContainer className="h-full max-h-[280px] md:max-h-[350px] flex flex-col" noPadding={true}>
                    <div className="bg-red-900/20 p-3 border-b border-red-500/30 flex justify-between items-center shrink-0 rounded-t-lg mt-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                            <span className="text-lg">📜</span> Top 10 Spelers
                        </span>
                        <span className="text-[9px] text-red-200 font-bold bg-red-600 px-2 py-0.5 rounded shadow-sm animate-pulse">LIVE</span>
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto scrollbar-hide">
                        {leaderboard.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <span className="text-3xl mb-2 opacity-50">⛄</span>
                                <p className="text-xs italic">Nog geen scores. Wees de eerste!</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {leaderboard.map((entry, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/20 hover:bg-white/10 transition-colors border border-transparent hover:border-white/20">
                                        <div className="flex items-center gap-3">
                                            <span className={`
                                        w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black border
                                        ${idx === 0 ? 'bg-yellow-400 text-yellow-900 border-yellow-200 shadow-yellow-500/50 shadow-sm' :
                                                    idx === 1 ? 'bg-gray-300 text-gray-800 border-gray-100' :
                                                        idx === 2 ? 'bg-amber-600 text-amber-100 border-amber-400' : 'bg-white/10 text-gray-400 border-transparent'}
                                    `}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-100 truncate max-w-[100px]">{entry.name}</span>
                                                <span className="text-[9px] text-gray-400 truncate max-w-[100px]">{entry.city}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono text-cyan-300 font-bold drop-shadow-sm">{entry.highscore.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SnowyContainer>
            </div>

        </div>
    );
};

export default TitleScreen;