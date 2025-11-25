import React, { useState } from 'react';

interface DebugPanelProps {
    currentLevel: number;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ currentLevel }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-4 left-4 z-[300] font-mono text-xs">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-black/80 backdrop-blur-md border border-yellow-500/50 text-yellow-400 px-3 py-2 rounded-lg hover:bg-yellow-900/30 transition-all shadow-lg flex items-center gap-2"
            >
                <span className="text-base">🎮</span>
                <span className="font-bold">DEBUG</span>
                {!isExpanded && <span className="text-[10px] opacity-70">({currentLevel}/10)</span>}
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="mt-2 bg-black/90 backdrop-blur-xl border border-yellow-500/50 rounded-lg p-4 shadow-2xl max-w-xs animate-fade-in-up">
                    <div className="text-yellow-400 font-bold mb-3 flex items-center gap-2 border-b border-yellow-500/30 pb-2">
                        <span className="text-lg">⌨️</span>
                        <span>KEYBOARD SHORTCUTS</span>
                    </div>

                    <div className="space-y-2 text-gray-300">
                        {/* Level Skip */}
                        <div className="flex items-start gap-2">
                            <kbd className="bg-yellow-900/30 border border-yellow-500/50 px-2 py-1 rounded text-yellow-400 text-[10px] font-bold min-w-[60px] text-center">
                                Ctrl + L
                            </kbd>
                            <span className="text-[11px] leading-tight">
                                Skip to next level
                            </span>
                        </div>

                        {/* Jump to Level */}
                        <div className="flex items-start gap-2">
                            <kbd className="bg-yellow-900/30 border border-yellow-500/50 px-2 py-1 rounded text-yellow-400 text-[10px] font-bold min-w-[60px] text-center">
                                Ctrl + 1-0
                            </kbd>
                            <span className="text-[11px] leading-tight">
                                Jump to level 1-10
                            </span>
                        </div>

                        {/* Toggle Ghost */}
                        <div className="flex items-start gap-2">
                            <kbd className="bg-yellow-900/30 border border-yellow-500/50 px-2 py-1 rounded text-yellow-400 text-[10px] font-bold min-w-[60px] text-center">
                                Ctrl + G
                            </kbd>
                            <span className="text-[11px] leading-tight">
                                Toggle ghost piece
                            </span>
                        </div>

                        {/* Pause */}
                        <div className="flex items-start gap-2">
                            <kbd className="bg-gray-700/50 border border-gray-500/50 px-2 py-1 rounded text-gray-300 text-[10px] font-bold min-w-[60px] text-center">
                                P
                            </kbd>
                            <span className="text-[11px] leading-tight">
                                Pause game
                            </span>
                        </div>
                    </div>

                    {/* Current Info */}
                    <div className="mt-3 pt-3 border-t border-yellow-500/30">
                        <div className="text-[10px] text-gray-400 space-y-1">
                            <div className="flex justify-between">
                                <span>Current Level:</span>
                                <span className="text-yellow-400 font-bold">{currentLevel}/10</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Mode:</span>
                                <span className="text-green-400 font-bold">DEVELOPMENT</span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="mt-3 text-[9px] text-orange-400/70 italic">
                        ⚠️ Debug mode only - not in production
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugPanel;
