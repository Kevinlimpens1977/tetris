export enum GameState {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  REGISTRATION = 'REGISTRATION',
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface UserData {
  name: string;
  email: string;
  city: string;
}

export interface HighScore {
  name: string;
  score: number;
}

export interface LeaderboardEntry {
  name: string;
  city: string;
  highscore: number;
}

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  shape: number[][];
  color: string;
  glowColor: string;
  type: TetrominoType;
}

export interface PlayerStats {
  score: number;
  lines: number;
  level: number;
}

export type ActionType = 'ROTATE' | 'DROP' | 'MOVE' | 'LOCK' | 'NONE';

export interface GameAction {
  type: ActionType;
  id: number; // Timestamp to trigger unique effects
}