import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserData } from '../types';
import GhostInfoPanel from './GhostInfoPanel';

interface TitleScreenProps {
    onStart: () => void;
    leaderboard: LeaderboardEntry[];
    user: UserData | null;
    onLogout: () => void;
}

interface ChinaContainerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    noPadding?: boolean;
}

// Helper: Festive Container with Animated Gradient Border (China Theme)
const ChinaContainer: React.FC<ChinaContainerProps> = ({
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
            {/* Minimal Lantern Decoration */}
            <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <div className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,0,0.5)]">🧧</div>
            </div>

            {/* Clipping Container for Border Effect */}
            <div className="relative w-full h-full overflow-hidden rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] p-[2px] md:p-[3px]">
                {/* Animated Spinning Border - Red & Gold */}
                <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-80"></div>

                {/* Inner Content */}
                <div className={`relative h-full w-full bg-black/80 backdrop-blur-xl rounded-[calc(0.75rem-2px)] md:rounded-[calc(0.75rem-3px)] overflow-hidden ${noPadding ? "" : "p-4 md:p-6"}`}>
                    {/* Golden shine on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/0 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    {children}
                </div>
            </div>
        </div>
    );
};

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, leaderboard, user, onLogout }) => {
    const [showGhostInfo, setShowGhostInfo] = useState(false);

    // Mocked Money Raised (in real app, fetch from DB)
    const moneyRaised = 1250.00;

    return (
        <div className="relative z-10 flex flex-col items-center w-full h-full min-h-[100dvh] overflow-y-auto overflow-x-hidden py-4 px-4 md:py-8">

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
                        Steun Kas Limpens
                    </h2>
                </div>

                {/* 3D Title */}
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-none mb-6 md:mb-8 relative z-10 text-center select-none"
                    style={{
                        fontFamily: 'Montserrat, sans-serif',
                        color: '#ef4444',
                        WebkitTextStroke: '2px #fbbf24',
                        textShadow: `
                            0 0 20px rgba(220, 38, 38, 0.5),
                            2px 2px 0 #991b1b,
                            4px 4px 0 #450a0a,
                            6px 6px 15px rgba(0,0,0,0.5)
                        `
                    }}>
                    CHINA<br />TETRIS
                </h1>

                {/* Dashboard & Action */}
                <div className="w-full max-w-md mx-auto mb-8">
                    <ChinaContainer className="w-full">
                        <div className="flex flex-col gap-6 items-center p-4 md:p-2">

                            {/* Money Raised Dashboard */}
                            <div className="flex flex-col items-center">
                                <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1">Totaal Opgehaald</span>
                                <div className="text-4xl md:text-5xl font-mono font-bold text-white drop-shadow-md text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                                    € {moneyRaised.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] md:text-xs text-gray-400">
                                    <span>🏆 Pot: €{(moneyRaised * 0.25).toLocaleString('nl-NL')}</span>
                                    <span>✈️ Kas: €{(moneyRaised * 0.75).toLocaleString('nl-NL')}</span>
                                </div>
                            </div>

                            {/* Welcome User */}
                            {user && (
                                <div className="text-center">
                                    <p className="text-sm md:text-sm text-yellow-100/80">
                                        Ni hao, <span className="font-bold text-white text-lg md:text-lg">{user.name}</span>! 🇨🇳
                                    </p>
                                </div>
                            )}

                            {/* CTA Button */}
                            <button
                                onClick={onStart}
                                className="group relative w-full px-8 py-4 md:py-4 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xl md:text-2xl shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border border-red-400/30"
                            >
                                <span className="animate-bounce">🪙</span>
                                {user ? 'START SPEL (€2,50)' : 'SPEEL MEE'}
                                <span className="animate-bounce delay-100">🐉</span>
                                <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full blur-sm opacity-50 group-hover:opacity-100 animate-pulse"></div>
                            </button>

                            {/* Ghost Info Button */}
                            <button
                                onClick={() => setShowGhostInfo(true)}
                                className="group relative w-full sm:w-auto px-6 py-2 md:py-3 rounded-full bg-gradient-to-r from-yellow-700/80 to-amber-700/80 hover:from-yellow-600 hover:to-amber-600 text-white font-bold text-sm md:text-base shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-yellow-400/20"
                            >
                                <span className="text-lg">👻</span>
                                <span>Ghost & Strafpunten Info</span>
                            </button>
                        </div>
                    </ChinaContainer>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-8">

                {/* Left Column: Info Boxes */}
                <div className="flex flex-col gap-4 md:gap-6">
                    <ChinaContainer className="bg-gradient-to-br from-red-950/40 to-black/60">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl md:text-4xl filter drop-shadow-md">👑</div>
                            <div>
                                <h3 className="text-yellow-400 font-black text-sm md:text-lg mb-1">Hoogste Score Prijs</h3>
                                <p className="text-xs md:text-sm text-yellow-100/80 leading-relaxed font-medium">
                                    De speler met de allerhoogste score wint <strong>10%</strong> van de totale opbrengst!
                                </p>
                            </div>
                        </div>
                    </ChinaContainer>

                    <ChinaContainer className="bg-gradient-to-br from-yellow-950/40 to-black/60" delay={200}>
                        <div className="flex items-start gap-4">
                            <div className="text-3xl md:text-4xl filter drop-shadow-md">🎟️</div>
                            <div>
                                <h3 className="text-yellow-200 font-black text-sm md:text-lg mb-1">Loterij Prijzen</h3>
                                <p className="text-xs md:text-sm text-yellow-100/80 leading-relaxed font-medium">
                                    Verdien lotnummers met je score. We verloten <strong>3x 5%</strong> van de pot onder alle loten via de AI Notaris.
                                </p>
                            </div>
                        </div>
                    </ChinaContainer>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="h-full min-h-[300px]">
                    <ChinaContainer className="h-full flex flex-col" noPadding={true}>
                        <div className="bg-red-900/20 p-3 md:p-4 border-b border-red-500/30 flex justify-between items-center shrink-0">
                            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                <span className="text-lg">📜</span> Top 10 Highscores
                            </span>
                            <span className="text-[10px] text-red-100 font-bold bg-red-600 px-2 py-0.5 rounded shadow-sm animate-pulse">LIVE</span>
                        </div>

                        <div className="flex-1 p-2 overflow-y-auto scrollbar-hide">
                            {leaderboard.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                    <span className="text-4xl mb-2 opacity-50">🐉</span>
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
                    </ChinaContainer>
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