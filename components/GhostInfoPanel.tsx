import React from 'react';

interface GhostInfoPanelProps {
    onClose?: () => void;
}

const GhostInfoPanel: React.FC<GhostInfoPanelProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">

            {/* Wrapper */}
            <div className="relative group max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                {/* Lantern Decoration */}
                <div className="absolute -top-3 -right-2 z-50 pointer-events-none transform rotate-12">
                    <div className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">🏮</div>
                </div>

                {/* Container */}
                <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.3)] p-[2px] md:p-[3px]">
                    {/* Border */}
                    <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#b91c1c_0%,#fbbf24_20%,#b91c1c_40%,#fbbf24_60%,#b91c1c_80%,#fbbf24_100%)] animate-spin-slow opacity-60"></div>

                    {/* Content */}
                    <div className="relative w-full h-full bg-black/90 rounded-[calc(1.5rem-2px)] md:rounded-[calc(1.5rem-3px)] p-4 md:p-8">

                        {/* Header */}
                        <div className="text-center mb-4 md:mb-6">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="text-4xl animate-pulse">👻</span>
                                <h2
                                    className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 uppercase tracking-tight"
                                    style={{
                                        textShadow: '0 0 30px rgba(220, 38, 38, 0.4)'
                                    }}
                                >
                                    Ghost & Strafpunten
                                </h2>
                                <span className="text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>🐲</span>
                            </div>
                            <div className="text-yellow-500 text-xs md:text-sm tracking-[0.2em] uppercase font-bold opacity-80">
                                Strategische Keuze: Hulp of Puntenverlies
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="bg-white/5 rounded-xl p-4 md:p-6 mb-6 border border-yellow-500/20">
                            <p className="text-sm md:text-base text-gray-300 leading-relaxed text-center">
                                <span className="font-bold text-yellow-400">Ghost stones</span> helpen je zien waar een blokje landt,
                                maar kosten <span className="font-bold text-red-400">punten</span>.
                                Hoe hoger het level, hoe hoger de straf.
                                Vanaf <span className="font-bold text-red-400">level 7</span> kun je ghost weer gebruiken —
                                <span className="font-bold text-yellow-400"> jij kiest: hulp of puntenverlies</span>.
                            </p>
                        </div>

                        {/* Penalty Table */}
                        <div className="bg-gradient-to-br from-gray-900/50 to-red-900/10 rounded-xl overflow-hidden border border-white/10 mb-6">
                            {/* Table Header */}
                            <div className="grid grid-cols-3 gap-3 p-3 md:p-4 bg-black/40 border-b border-white/10">
                                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                    Level
                                </div>
                                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                    Ghost Status
                                </div>
                                <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
                                    Strafpunten
                                </div>
                            </div>

                            {/* Table Rows */}
                            {[
                                { level: '1', status: 'Toegestaan', penalty: '-3', color: 'green' },
                                { level: '2', status: 'Toegestaan', penalty: '-5', color: 'green' },
                                { level: '3-6', status: 'VERBODEN', penalty: '—', color: 'red' },
                                { level: '7', status: 'Toegestaan', penalty: '-10', color: 'yellow' },
                                { level: '8', status: 'Toegestaan', penalty: '-12', color: 'yellow' },
                                { level: '9', status: 'Toegestaan', penalty: '-15', color: 'orange' },
                                { level: '10', status: 'Toegestaan', penalty: '-20', color: 'red' },
                            ].map((row, idx) => (
                                <div
                                    key={idx}
                                    className={`grid grid-cols-3 gap-3 p-3 md:p-4 text-xs md:text-sm border-b border-white/5 last:border-0 items-center ${row.status === 'VERBODEN' ? 'bg-red-900/20' : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="text-center font-bold text-yellow-200">
                                        {row.level}
                                    </div>
                                    <div className={`text-center font-medium ${row.status === 'VERBODEN'
                                        ? 'text-red-400 font-black'
                                        : 'text-green-400'
                                        }`}>
                                        {row.status}
                                    </div>
                                    <div className={`text-center font-mono font-black ${row.color === 'green' ? 'text-green-400' :
                                        row.color === 'yellow' ? 'text-yellow-400' :
                                            row.color === 'orange' ? 'text-orange-400' :
                                                row.color === 'red' ? 'text-red-400' :
                                                    'text-gray-500'
                                        }`}>
                                        {row.penalty}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-r from-red-900/30 to-yellow-900/30 rounded-xl p-4 md:p-5 border border-yellow-500/20 mb-6">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                    <h3 className="text-sm md:text-base font-bold text-yellow-500 mb-2">Pro Tips:</h3>
                                    <ul className="text-xs md:text-sm text-gray-300 space-y-1 list-disc list-inside">
                                        <li>Ghost is <span className="font-bold text-yellow-400">standaard UIT</span> - jij beslist wanneer je het gebruikt</li>
                                        <li>In <span className="font-bold text-red-500">level 3-6</span> is ghost volledig uitgeschakeld</li>
                                        <li>Vanaf <span className="font-bold text-green-400">level 7</span> krijg je een melding dat ghost weer beschikbaar is</li>
                                        <li>Gebruik ghost <span className="font-bold text-yellow-400">strategisch</span> - alleen wanneer je het echt nodig hebt!</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold text-sm md:text-base shadow-lg transition-transform transform hover:scale-[1.02] uppercase tracking-wider border border-red-500/30"
                            >
                                Begrepen! 🐉
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GhostInfoPanel;
