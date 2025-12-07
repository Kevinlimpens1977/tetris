import { Tetromino, TetrominoType } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Kas China Sponsor Game / Oriental Palette
export const COLORS = {
  I: '#00e5ff', // Cyan (Modern China Neon)
  J: '#1e40af', // Deep Blue
  L: '#d97706', // Amber / Gold
  O: '#fbbf24', // Bright Gold
  S: '#10b981', // Jade Green
  T: '#9f1239', // Rose / Deep Red
  Z: '#ef4444', // Bright Red
};

// Glows for the neon effect
export const GLOWS = {
  I: '#a5f3fc',
  J: '#60a5fa',
  L: '#fde047',
  O: '#fef08a',
  S: '#86efac',
  T: '#fecdd3',
  Z: '#fca5a5',
};

// Lottery Thresholds (Config)
export const LOTTERY_THRESHOLDS = {
  TIER_1: 5000,   // 1 Ticket
  TIER_2: 15000,  // 2 Tickets
  TIER_3: 30000   // 5 Tickets
};

export const TETROMINOS: Record<TetrominoType, Tetromino> = {
  I: {
    type: 'I',
    shape: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    color: COLORS.I,
    glowColor: GLOWS.I,
  },
  J: {
    type: 'J',
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    color: COLORS.J,
    glowColor: GLOWS.J,
  },
  L: {
    type: 'L',
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    color: COLORS.L,
    glowColor: GLOWS.L,
  },
  O: {
    type: 'O',
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: COLORS.O,
    glowColor: GLOWS.O,
  },
  S: {
    type: 'S',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: COLORS.S,
    glowColor: GLOWS.S,
  },
  T: {
    type: 'T',
    shape: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: COLORS.T,
    glowColor: GLOWS.T,
  },
  Z: {
    type: 'Z',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: COLORS.Z,
    glowColor: GLOWS.Z,
  },
};

export const TETROMINO_KEYS = Object.keys(TETROMINOS) as TetrominoType[];