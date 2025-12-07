import React from 'react';
import { LOTTERY_THRESHOLDS } from '../constants';

interface WelcomeScreenProps {
    onLogin: () => void;
    onRegister: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onRegister }) => {
    return (
        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in p-4 md:p-8 overflow-y-auto">

            {/* Main Container */}
            <div className="glass-panel p-6 md:p-10 rounded-3xl max-w-4xl w-full shadow-2xl border border-yellow-500/20 relative bg-black/60 backdrop-blur-md">

                {/* Festive Decor */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-6xl animate-float">🏮</div>

                {/* Header */}
                <div className="text-center mb-8 mt-4">
                    <h2 className="text-xs md:text-sm uppercase tracking-widest text-yellow-200 mb-2">Steun Kas Limpens</h2>
                    <h1 className="text-4xl md:text-6xl font-black leading-none mb-4 relative z-10"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            color: '#dc2626', // Red
                            WebkitTextStroke: '1px #fbbf24', // Gold Stroke
                            textShadow: `
                  0 0 20px rgba(220, 38, 38, 0.5),
                  2px 2px 0 #7f1d1d,
                  4px 4px 0 #450a0a,
                  6px 6px 15px rgba(0,0,0,0.5)
                `
                        }}>
                        CHINA REIS<br />SPONSOR GAME
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Left Column: Story & Photo */}
                    <div className="space-y-6">
                        <div className="flyer-zoom-container bg-red-950/40 rounded-xl border border-yellow-500/30 overflow-hidden relative group cursor-zoom-in">
                            <div className="aspect-[4/5] w-full relative overflow-hidden">
                                <img
                                    src="/afbeeldingen/PHOTO-2025-12-03-11-29-15.jpg"
                                    alt="Kas Limpens met uitleg"
                                    className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="text-yellow-100 font-medium text-sm italic">
                                        "Samen met Global Exploration op wereldburgerstage naar China!"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-invert prose-sm leading-relaxed text-gray-200 bg-black/20 p-4 rounded-xl border border-white/5">
                            <p>
                                Dit spel is speciaal gemaakt om mijn reis naar China te sponsoren.
                                Scan de QR code hiernaast (of klik erop) om een donatie te doen via de officiële website van
                                <a href="https://global-exploration.nl" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 ml-1 font-bold">Global Exploration</a>.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: QR & Actions */}
                    <div className="flex flex-col h-full space-y-6">
                        {/* Donation Box */}
                        <div className="bg-white p-4 rounded-xl border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] flex flex-col items-center text-center transform hover:scale-[1.02] transition-transform duration-300">
                            <h3 className="text-red-900 font-black text-xl mb-2 uppercase tracking-wide">Doneer Direct</h3>
                            <p className="text-gray-600 text-xs mb-4 font-medium">Scan met je camera of klik op de knop</p>

                            <a href="https://donatie.global-exploration.nl/sponsor/GE-2806?back=true&donation=true" target="_blank" rel="noopener noreferrer" className="block w-full max-w-[200px] aspect-square mb-4 relative group cursor-pointer">
                                <img
                                    src="/afbeeldingen/QR.jpg"
                                    alt="Scan om te doneren"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-red-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">Klik hier</span>
                                </div>
                            </a>

                            <a
                                href="https://donatie.global-exploration.nl/sponsor/GE-2806?back=true&donation=true"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <span>❤</span> DONEER NU
                            </a>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-yellow-500/30 flex-1"></div>
                            <span className="text-yellow-500/50 text-sm font-serif italic">of</span>
                            <div className="h-px bg-yellow-500/30 flex-1"></div>
                        </div>

                        {/* Game Actions */}
                        <div className="bg-black/40 rounded-xl p-6 border border-yellow-500/10 flex-1 flex flex-col justify-center relative">
                            {/* Animated Arrow */}
                            <div className="absolute -right-10 -top-8 md:-right-24 md:-top-16 z-50 pointer-events-none animate-arrow-bounce">
                                <svg width="220" height="220" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-[15deg] drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] filter">
                                    {/* Definition of a clear, solid arrow */}
                                    <defs>
                                        <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="2" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>

                                    {/* Main Arrow Body - Green #22c55e (Tailwind green-500) */}
                                    <path
                                        d="M85 10 C 85 10, 80 40, 50 60 L 65 65 L 20 80 L 35 45 L 45 55 C 70 35, 75 10, 75 10"
                                        fill="#22c55e"
                                        stroke="#15803d"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Inner Highlight for 3D effect */}
                                    <path
                                        d="M75 15 C 70 35, 50 50, 40 55"
                                        stroke="#86efac"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        fill="none"
                                        className="opacity-60"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-yellow-400 font-bold text-lg mb-4 text-center flex items-center justify-center gap-2">
                                <span className="text-2xl">🎮</span> Speel het spel
                            </h3>

                            <div className="space-y-3">
                                <button
                                    onClick={onRegister}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2 border border-red-500/50"
                                >
                                    <span className="text-2xl">🐲</span>
                                    SPEEL MEE & STEUN KAS
                                </button>

                                <button
                                    onClick={onLogin}
                                    className="w-full py-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200 font-bold transition-colors flex items-center justify-center gap-2 border border-yellow-500/20"
                                >
                                    <span className="text-xl">🔑</span>
                                    AL EEN ACCOUNT? INLOGGEN
                                </button>
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-4">
                                Win loten en maak kans op prijzen!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 border-t border-white/5 pt-4">
                    <p>Mogelijk gemaakt door Global Exploration & Sponsors</p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
