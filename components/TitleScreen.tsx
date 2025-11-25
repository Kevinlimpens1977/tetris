import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserData } from '../types';
import GhostInfoPanel from './GhostInfoPanel';

interface TitleScreenProps {
    onStart: () => void;
    leaderboard: LeaderboardEntry[];
    user: UserData | null;
    onLogout: () => void;
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
        <div
            className={`relative group ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Minimal Snowflake Decoration */}
            <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <div className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">❄️</div>
            </div>

            {/* Clipping Container for Border Effect */}
            <div className="relative w-full h-full overflow-hidden rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.4)] p-[2px] md:p-[3px]">
                {/* Animated Spinning Border */}
                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#ef4444_20%,#ffffff_25%,#ef4444_30%,#b91c1c_50%,#ef4444_70%,#ffffff_75%,#ef4444_80%,#b91c1c_100%)] animate-spin-slow opacity-50"></div>

                {/* Inner Content */}
                <div className={`relative h-full w-full bg-black/80 backdrop-blur-xl rounded-[calc(0.75rem-2px)] md:rounded-[calc(0.75rem-3px)] overflow-hidden ${noPadding ? "" : "p-4 md:p-6"}`}>
                    {/* Frosty shine on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Helper: Upgraded Christmas Lights (SVG)
const ChristmasLights = () => {
    // We want a curve that hangs from the top corners, dips in the middle, and has "loose ends" at the sides.
    // Let's define a path: 
    // Start top-left (-10, -10) -> Drop to (5%, 30) -> Curve up to (20%, 10) -> Arc across to (80%, 10) -> Curve down to (95%, 30) -> End top-right (110, -10)

    // We'll use percentages for X and fixed pixels for Y to keep it looking good on resize.
    // Since SVG paths inside a responsive SVG can use viewbox, let's use a viewbox of 1000 100.

    const lights = 20;
    const pathId = "light-wire";

    return (
        <div className="absolute top-0 left-0 w-full h-32 pointer-events-none z-0 overflow-hidden">
            <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full">
                {/* The Wire */}
                <path
                    d="M -10,-10 Q 50,60 150,20 T 500,20 T 850,20 Q 950,60 1010,-10"
                    fill="none"
                    stroke="#4b5563"
                    strokeWidth="2"
                    id={pathId}
                />

                {/* The Lights */}
                {/* We place them manually along the curve approximation or using motion path if we could, but manual is safer for React/SVG compat without heavy libs */}
                {[...Array(lights)].map((_, i) => {
                    // Calculate position along the curve roughly
                    // This is a simplification. For a perfect fit we'd need getPointAtLength.
                    // Instead, let's just place them at X intervals and calculate Y based on a similar curve function.

                    const t = i / (lights - 1); // 0 to 1
                    const x = t * 1000;

                    // Bezier-ish approximation for Y
                    // Left dip: x=50, y=60. Center: x=500, y=20. Right dip: x=950, y=60.
                    // Let's just use a math function: y = 20 + 40 * (sin(x * freq) ... )
                    // Actually, let's just use the 'motion offset' trick with CSS if possible, but that's risky.
                    // Let's try to just distribute them evenly on X and guess Y.

                    let y = 20;
                    if (x < 150) {
                        // Left hanging part
                        // Parabola from (-10,-10) to (150, 20) via (50, 60)
                        const p = x / 150;
                        y = -10 * (1 - p) * (1 - p) + 60 * 2 * (1 - p) * p + 20 * p * p;
                    } else if (x > 850) {
                        // Right hanging part
                        const p = (x - 850) / 150;
                        y = 20 * (1 - p) * (1 - p) + 60 * 2 * (1 - p) * p + -10 * p * p;
                    } else {
                        // Center Arc
                        // (150, 20) to (850, 20) with a slight dip in middle?
                        // The SVG path T command implies smooth continuation.
                        // Let's just add a sine wave wobble
                        y = 20 + Math.sin((x - 150) * 0.01) * 10;
                    }

                    const colorClass = i % 3 === 0 ? 'text-red-500' : i % 3 === 1 ? 'text-green-500' : 'text-yellow-400';
                    const glowClass = i % 3 === 0 ? 'shadow-red-500' : i % 3 === 1 ? 'shadow-green-500' : 'shadow-yellow-400';

                    return (
                        <g key={i} transform={`translate(${x}, ${y})`}>
                            {/* Socket */}
                            <rect x="-2" y="-4" width="4" height="6" fill="#1f2937" />
                            {/* Bulb */}
                            <circle
                                cx="0" cy="4" r="5"
                                className={`${colorClass} fill-current animate-pulse`}
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '2s',
                                    filter: `drop-shadow(0 0 8px currentColor)`
                                }}
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, leaderboard, user, onLogout }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [showGhostInfo, setShowGhostInfo] = useState(false);

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
        <div className="relative z-10 flex flex-col items-center w-full h-full min-h-[100dvh] overflow-y-auto overflow-x-hidden py-4 px-4 md:py-8">

            {/* Lights Decoration */}
            <ChristmasLights />

            {/* Top Right: Logout Button */}
            {user && (
                <button
                    onClick={onLogout}
                    className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-red-900/40 backdrop-blur-md border border-white/20 text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                    title="Uitloggen"
                >
                    <span>🚪</span>
                    <span className="hidden md:inline group-hover:text-red-200 transition-colors">Log uit</span>
                </button>
            )}

            {/* HEADER SECTION */}
            <div className="flex flex-col items-center justify-center mt-8 md:mt-12 w-full shrink-0 relative z-10">

                {/* Badge */}
                <div className="relative inline-block mb-4 animate-float">
                    <div className="absolute inset-0 bg-red-600 blur-md opacity-50 rounded-full"></div>
                    <h2 className="relative text-white drop-shadow-md tracking-[0.2em] text-[10px] md:text-xs font-bold uppercase bg-gradient-to-r from-red-800 to-red-600 px-4 py-1.5 rounded-full border border-red-400/50 shadow-lg">
                        Omroep Parkstad Presenteert
                    </h2>
                </div>

                {/* 3D Title */}
                <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black leading-none mb-8 relative z-10 text-center select-none"
                    style={{
                        fontFamily: 'Montserrat, sans-serif',
                        color: '#ef4444',
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

                {/* Countdown & Action */}
                <div className="w-full max-w-md mx-auto mb-8">
                    <SnowyContainer className="w-full">
                        <div className="flex flex-col gap-6 items-center p-2">
                            {/* Timer */}
                            <div className="flex gap-2 sm:gap-4 md:gap-6 items-center justify-center w-full">
                                {[
                                    { label: 'Dagen', value: timeLeft.days },
                                    { label: 'Uur', value: timeLeft.hours },
                                    { label: 'Min', value: timeLeft.minutes },
                                    { label: 'Sec', value: timeLeft.seconds }
                                ].map((item, i, arr) => (
                                    <React.Fragment key={item.label}>
                                        <div className="text-center min-w-[3rem]">
                                            <div className="text-lg sm:text-xl md:text-3xl font-mono font-bold text-white drop-shadow-md">
                                                {item.value.toString().padStart(2, '0')}
                                            </div>
                                            <div className="text-[8px] md:text-[10px] uppercase text-red-200 font-bold tracking-wider opacity-80">
                                                {item.label}
                                            </div>
                                        </div>
                                        {i < arr.length - 1 && (
                                            <div className="text-lg sm:text-xl md:text-3xl font-light text-red-500 animate-pulse pb-4">:</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Welcome User */}
                            {user && (
                                <div className="text-center">
                                    <p className="text-xs md:text-sm text-cyan-300">
                                        Welkom terug, <span className="font-bold text-white text-base md:text-lg">{user.name}</span>! 🎮
                                    </p>
                                </div>
                            )}

                            {/* CTA Button */}
                            <button
                                onClick={onStart}
                                className="group relative w-full sm:w-auto px-8 py-3 md:py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-lg md:text-2xl shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border border-red-400/30"
                            >
                                <span className="animate-bounce">🎅</span>
                                {user ? 'START SPEL' : 'SPEEL MEE'}
                                <span className="animate-bounce delay-100">🎁</span>
                                <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full blur-sm opacity-50 group-hover:opacity-100 animate-pulse"></div>
                            </button>

                            {/* Ghost Info Button */}
                            <button
                                onClick={() => setShowGhostInfo(true)}
                                className="group relative w-full sm:w-auto px-6 py-2 md:py-3 rounded-full bg-gradient-to-r from-green-700/80 to-emerald-700/80 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm md:text-base shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-green-400/20"
                            >
                                <span className="text-lg">👻</span>
                                <span>Ghost & Strafpunten Info</span>
                                <span className="text-lg">🎄</span>
                                <div className="absolute top-1 right-1 w-2 h-2 bg-green-300 rounded-full blur-sm opacity-50 group-hover:opacity-100 animate-pulse"></div>
                            </button>
                        </div>
                    </SnowyContainer>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-8">

                {/* Left Column: Info Boxes */}
                <div className="flex flex-col gap-4 md:gap-6">
                    <SnowyContainer className="bg-gradient-to-br from-yellow-950/40 to-black/60">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl md:text-4xl filter drop-shadow-md">🏆</div>
                            <div>
                                <h3 className="text-yellow-400 font-black text-sm md:text-lg mb-1">Top 3 Winnaars</h3>
                                <p className="text-xs md:text-sm text-yellow-100/80 leading-relaxed font-medium">
                                    Eindig op 31 december in de top 3 en win een exclusief prijzenpakket!
                                </p>
                            </div>
                        </div>
                    </SnowyContainer>

                    <SnowyContainer className="bg-gradient-to-br from-purple-950/40 to-black/60" delay={200}>
                        <div className="flex items-start gap-4">
                            <div className="text-3xl md:text-4xl filter drop-shadow-md">🎁</div>
                            <div>
                                <h3 className="text-purple-300 font-black text-sm md:text-lg mb-1">5 Random Winnaars</h3>
                                <p className="text-xs md:text-sm text-purple-100/80 leading-relaxed font-medium">
                                    Op 1 januari trekken we 5 gelukkige winnaars uit álle deelnemers. Iedereen maakt kans!
                                </p>
                            </div>
                        </div>
                    </SnowyContainer>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="h-full min-h-[300px]">
                    <SnowyContainer className="h-full flex flex-col" noPadding={true}>
                        <div className="bg-red-900/20 p-3 md:p-4 border-b border-red-500/30 flex justify-between items-center shrink-0">
                            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                <span className="text-lg">📜</span> Top 10 Spelers
                            </span>
                            <span className="text-[10px] text-red-100 font-bold bg-red-600 px-2 py-0.5 rounded shadow-sm animate-pulse">LIVE</span>
                        </div>

                        <div className="flex-1 p-2 overflow-y-auto scrollbar-hide">
                            {leaderboard.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                    <span className="text-4xl mb-2 opacity-50">⛄</span>
                                    <p className="text-sm italic">Nog geen scores. Wees de eerste!</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {leaderboard.map((entry, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 md:p-3 rounded-lg bg-black/20 hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 group">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <span className={`
                                                    w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-[10px] md:text-xs font-black border
                                                    ${idx === 0 ? 'bg-yellow-400 text-yellow-900 border-yellow-200 shadow-yellow-500/50 shadow-sm' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-800 border-gray-100' :
                                                            idx === 2 ? 'bg-amber-600 text-amber-100 border-amber-400' : 'bg-white/10 text-gray-400 border-transparent'}
                                                `}>
                                                    {idx + 1}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-xs md:text-sm font-bold text-gray-100 truncate max-w-[120px] md:max-w-[150px] group-hover:text-white transition-colors">{entry.name}</span>
                                                    <span className="text-[10px] text-gray-500 truncate max-w-[120px] md:max-w-[150px]">{entry.city}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs md:text-sm font-mono text-cyan-300 font-bold drop-shadow-sm">{entry.highscore.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SnowyContainer>
                </div>
            </div>

            {/* Ghost Info Panel Modal */}
            {showGhostInfo && (
                <GhostInfoPanel onClose={() => setShowGhostInfo(false)} />
            )}
        </div>
    );
};

export default TitleScreen;