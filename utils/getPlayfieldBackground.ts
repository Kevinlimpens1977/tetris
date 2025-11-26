export const getPlayfieldBackground = (level: number): string => {
    // Cap level at 10 for color selection, or loop/clamp if level > 10
    const normalizedLevel = Math.min(10, Math.max(1, level));

    switch (normalizedLevel) {
        case 1: return 'rgba(35, 25, 25, 0.65)';
        case 2: return 'rgba(30, 30, 40, 0.65)';
        case 3: return 'rgba(32, 28, 18, 0.65)';
        case 4: return 'rgba(24, 32, 26, 0.65)';
        case 5: return 'rgba(40, 22, 32, 0.65)';
        case 6: return 'rgba(28, 28, 45, 0.65)';
        case 7: return 'rgba(45, 24, 24, 0.65)';
        case 8: return 'rgba(18, 38, 42, 0.65)';
        case 9: return 'rgba(36, 18, 44, 0.65)';
        case 10: return 'rgba(12, 12, 18, 0.70)';
        default: return 'rgba(35, 25, 25, 0.65)';
    }
};
