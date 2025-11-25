import React from 'react';

interface LevelUpScreenProps {
    level: number;
    onContinue: () => void;
}

// Level-specific messages that get more positive as levels increase
const getLevelMessage = (level: number): string => {
    const messages: { [key: number]: string } = {
        1: "Een frisse start!",
        2: "Goed op weg!",
        3: "Je bouwt momentum!",
        4: "Fantastisch gespeeld!",
        5: "Je wordt echt warm!",
        6: "Ongelooflijke snelheid!",
        7: "Je vliegt door de sneeuw!",
        8: "Pro-niveau bereikt!",
        9: "Je staat in vuur en vlam!",
        10: "Onverslaanbare master! 🎄🔥"
    };
    return messages[level] || "Geweldig!";
};

const LevelUpScreen: React.FC<LevelUpScreenProps> = ({ level, onContinue }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in">

            {/* Snowflakes Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-white/30 animate-snow-fall"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-${Math.random() * 20}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                            fontSize: `${10 + Math.random() * 20}px`
                        }}
                    >
                        ❄
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center px-4 animate-scale-bounce">

                {/* 3D Level Title */}
                <div className="relative mb-8">
                    {/* Glow layers */}
                    <div className="absolute inset-0 blur-3xl opacity-60">
                        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-yellow-400">
                            LEVEL {level}
                        </h1>
                    </div>

                    {/* Main 3D Text */}
                    <h1
                        className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black select-none"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            color: '#ffd65a',
                            WebkitTextStroke: '3px #fff',
                            textShadow: `
                                0 0 30px rgba(255, 214, 90, 0.8),
                                0 0 60px rgba(255, 60, 60, 0.6),
                                3px 3px 0 #ff3c3c,
                                6px 6px 0 #c41e1e,
                                9px 9px 0 #8b1515,
                                12px 12px 0 #5a0d0d,
                                15px 15px 30px rgba(0,0,0,0.7)
                            `
                        }}
                    >
                        LEVEL {level}
                    </h1>

                    {/* Animated sparkles */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-300 rounded-full blur-md opacity-70 animate-pulse"></div>
                    <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-red-400 rounded-full blur-md opacity-70 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>

                {/* Subtitle Message */}
                <div className="mb-8">
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-cyan-300 animate-pulse drop-shadow-[0_0_15px_rgba(55,255,139,0.6)]">
                        {getLevelMessage(level)}
                    </p>
                </div>

                {/* Ghost Availability Notice (Level 7+) */}
                {level >= 7 && (
                    <div className="mb-8 max-w-md mx-auto">
                        <div className="relative group overflow-hidden rounded-2xl p-[2px] shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                            {/* Animated Border */}
                            <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#22c55e_0%,#10b981_50%,#22c55e_100%)] animate-spin-slow opacity-60"></div>

                            {/* Content */}
                            <div className="relative bg-gradient-to-br from-green-900/80 to-emerald-900/80 backdrop-blur-xl rounded-[calc(1rem-2px)] p-4 md:p-6">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <span className="text-3xl md:text-4xl animate-pulse">👻</span>
                                    <h3 className="text-lg md:text-xl font-black text-green-300 uppercase tracking-wider">
                                        Ghost Beschikbaar!
                                    </h3>
                                    <span className="text-3xl md:text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>🎄</span>
                                </div>

                                <p className="text-xs md:text-sm text-green-200/90 text-center leading-relaxed">
                                    Je kunt nu de <span className="font-bold text-green-300">ghost piece</span> gebruiken in de HUD.
                                    <br />
                                    <span className="text-red-300 font-bold">Let op:</span> Ghost kost <span className="font-black text-red-400">-{level === 7 ? '10' : level === 8 ? '12' : level === 9 ? '15' : '20'} punten</span> per stuk!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Continue Button */}
                <button
                    onClick={onContinue}
                    className="group relative px-12 py-5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-black text-xl md:text-2xl shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:shadow-[0_0_60px_rgba(220,38,38,0.9)] hover:from-red-500 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 active:scale-95 border-4 border-yellow-300/50"
                >
                    {/* Button glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/30 to-yellow-400/0 animate-shimmer"></div>

                    {/* Button text */}
                    <span className="relative flex items-center justify-center gap-3">
                        <span className="text-3xl animate-bounce">🎄</span>
                        START VOLGEND LEVEL
                        <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎁</span>
                    </span>

                    {/* Corner decorations */}
                    <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full blur-sm opacity-70 group-hover:opacity-100 animate-pulse"></div>
                    <div className="absolute bottom-2 left-2 w-3 h-3 bg-green-300 rounded-full blur-sm opacity-70 group-hover:opacity-100 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                </button>

                {/* Level indicator dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${i < level
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(255,214,90,0.8)]'
                                : 'bg-gray-600/50'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LevelUpScreen;
