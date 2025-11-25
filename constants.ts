import { Tetromino, TetrominoType } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Christmas / Winter "Crystalline" Palette
export const COLORS = {
  I: '#00ffff', // Ice Cyan
  J: '#1e3a8a', // Deep Winter Blue
  L: '#ca8a04', // Gingerbread Gold
  O: '#fbbf24', // Star Yellow
  S: '#16a34a', // Pine Green
  T: '#9333ea', // Royal Purple
  Z: '#dc2626', // Santa Red
};

// Glows for the neon effect
export const GLOWS = {
  I: '#a5f3fc',
  J: '#60a5fa',
  L: '#fde047',
  O: '#fef08a',
  S: '#86efac',
  T: '#d8b4fe',
  Z: '#fca5a5',
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