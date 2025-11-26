import React, { useState, useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import TitleScreen from './components/TitleScreen';
import RegistrationForm from './components/RegistrationForm';
import HUD from './components/HUD';
import GameBoard from './components/GameBoard';
import GameOverScreen from './components/GameOverScreen';
import LevelUpScreen from './components/LevelUpScreen';
import DebugPanel from './components/DebugPanel';
import SnowEffect, { SnowEffectHandle } from './components/SnowEffect';
import LeaderboardModal from './components/LeaderboardModal';
import { GameState, PlayerStats, TetrominoType, UserData, LeaderboardEntry, GameAction, PenaltyAnimation } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, TETROMINO_KEYS } from './constants';
import { supabase, submitScore, getLeaderboard, ensurePlayerVerified } from './services/supabase';

// -- Gravity Function: Professional 10-level system --
const getGravityForLevel = (level: number): number => {
  // Level 1-10 with exponential but playable scaling
  // Returns drop interval in milliseconds
  const baseSpeed = 1000; // Level 1 speed
  const minSpeed = 150;   // Level 10 speed (still playable)

  // Exponential decay formula for smooth progression
  const speed = baseSpeed * Math.pow(minSpeed / baseSpeed, (level - 1) / 9);
  return Math.max(minSpeed, Math.round(speed));
};

// -- Ghost Penalty Function: Level-based penalties --
const getGhostPenalty = (level: number): number => {
  const penalties: { [key: number]: number } = {
    1: 3,
    2: 5,
    3: 0,  // Forbidden
    4: 0,  // Forbidden
    5: 0,  // Forbidden
    6: 0,  // Forbidden
    7: 10,
    8: 12,
    9: 15,
    10: 20
  };
  return penalties[level] || 0;
};

// -- Check if ghost is allowed for level --
const isGhostAllowedForLevel = (level: number): boolean => {
  return level <= 2 || level >= 7;
};

// -- Helper for shape rotation --
const rotateMatrix = (matrix: number[][]) => {
  const N = matrix.length;
  const M = matrix[0].length;
  const result = Array(M).fill(0).map(() => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < M; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
};

const getShapeMatrix = (type: TetrominoType, rotation: number) => {
  let mat = TETROMINOS[type].shape;
  for (let i = 0; i < rotation; i++) {
    mat = rotateMatrix(mat);
  }
  return mat;
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [user, setUser] = useState<UserData | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Game State
  const [grid, setGrid] = useState<(string | number)[][]>(
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
  );
  const [activePiece, setActivePiece] = useState<{
    pos: { x: number; y: number };
    tetromino: TetrominoType;
    rotation: number;
  } | null>(null);

  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);

  // Animation State for Line Clearing
  const [clearingLines, setClearingLines] = useState<number[]>([]);

  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    lines: 0,
    level: 1,
  });

  // Ghost piece control - default OFF, allowed for levels 1-2 and 7-10
  const [ghostEnabled, setGhostEnabled] = useState(false);

  // Penalty animations (floating red numbers)
  const [penaltyAnimations, setPenaltyAnimations] = useState<PenaltyAnimation[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Visual Feedback State
  const [lastAction, setLastAction] = useState<GameAction>({ type: 'NONE', id: 0 });

  // Refs
  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);
  const activePieceRef = useRef(activePiece);
  const nextPieceRef = useRef(nextPiece);
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const clearingLinesRef = useRef(clearingLines); // Ref to block inputs during animation
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(1000);
  const ghostEnabledRef = useRef(ghostEnabled);

  const snowEffectRef = useRef<SnowEffectHandle>(null);

  // Touch Handling Refs
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    isMoving: false
  });

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { activePieceRef.current = activePiece; }, [activePiece]);
  useEffect(() => { nextPieceRef.current = nextPiece; }, [nextPiece]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { clearingLinesRef.current = clearingLines; }, [clearingLines]);
  useEffect(() => { ghostEnabledRef.current = ghostEnabled; }, [ghostEnabled]);

  // Load Leaderboard and User Session on Mount
  useEffect(() => {
    const init = async () => {
      // 1. Fetch Leaderboard
      const lb = await getLeaderboard();
      setLeaderboard(lb);

      // 2. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session check:', session);

      if (session?.user) {
        // Check if verified
        if (session.user.email_confirmed_at) {
          const { name, city } = session.user.user_metadata;
          const userData = {
            name: name || 'Speler',
            city: city || 'Onbekend',
            email: session.user.email || ''
          };
          setUser(userData);
          setUser(userData);
          console.log('User already verified on mount:', userData);

          // Ensure DB knows user is verified
          ensurePlayerVerified(session.user.email || '');

          // Redirect to TITLE if verified
          setGameState(GameState.TITLE);
        } else {
          console.log('User session found but email not confirmed');
        }
      }
    };
    init();

    // Listen for auth changes (e.g. if they click the email link while app is open)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session);

      if (event === 'PASSWORD_RECOVERY') {
        setGameState(GameState.RESET_PASSWORD);
        return;
      }

      // Handle any auth event where user is verified
      if (session?.user && session.user.email_confirmed_at) {
        const { name, city } = session.user.user_metadata;
        const userData = {
          name: name || 'Speler',
          city: city || 'Onbekend',
          email: session.user.email || ''
        };
        setUser(userData);

        setUser(userData);

        console.log('User verified and logged in:', userData);

        // Ensure DB knows user is verified
        ensurePlayerVerified(session.user.email || '');

        // If we're on welcome, login, or registration screen, automatically go to title
        // so user can click "START SPEL" to start
        if (gameStateRef.current === GameState.WELCOME ||
          gameStateRef.current === GameState.LOGIN ||
          gameStateRef.current === GameState.REGISTRATION ||
          gameStateRef.current === GameState.FORGOT_PASSWORD) {
          console.log('Redirecting to TITLE screen');
          setGameState(GameState.TITLE);
        }
      } else if (session?.user && !session.user.email_confirmed_at) {
        console.log('User signed in but email not confirmed yet');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- Logic ---

  const triggerVisualAction = (type: 'ROTATE' | 'DROP' | 'MOVE' | 'LOCK') => {
    setLastAction({ type, id: Date.now() });
  };

  const checkCollision = (
    pos: { x: number; y: number },
    matrix: number[][],
    board: (string | number)[][]
  ) => {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x] !== 0) {
          const boardX = pos.x + x;
          const boardY = pos.y + y;
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return true;
          if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
        }
      }
    }
    return false;
  };

  const lockPiece = () => {
    const piece = activePieceRef.current;
    if (!piece) return;

    const matrix = getShapeMatrix(piece.tetromino, piece.rotation);
    // Create a working copy of the grid
    const tempGrid = gridRef.current.map(row => [...row]);

    let gameOver = false;
    matrix.forEach((row, dy) => {
      row.forEach((val, dx) => {
        if (val !== 0) {
          const y = piece.pos.y + dy;
          const x = piece.pos.x + dx;
          if (y < 0) {
            gameOver = true;
          } else {
            tempGrid[y][x] = piece.tetromino;
          }
        }
      });
    });

    if (gameOver) {
      handleGameOver();
      return;
    }

    triggerVisualAction('LOCK');

    // === GHOST PENALTY SYSTEM ===
    // Apply penalty if ghost is enabled
    if (ghostEnabledRef.current) {
      const currentLevel = statsRef.current.level;
      const penalty = getGhostPenalty(currentLevel);

      if (penalty > 0) {
        // Apply penalty to score
        const currentStats = statsRef.current;
        const newScore = Math.max(0, currentStats.score - penalty);

        setStats({
          ...currentStats,
          score: newScore
        });

        // Trigger floating penalty animation
        const penaltyAnim: PenaltyAnimation = {
          id: Date.now(),
          penalty: penalty,
          timestamp: Date.now()
        };
        setPenaltyAnimations(prev => [...prev, penaltyAnim]);

        // Remove animation after 2 seconds
        setTimeout(() => {
          setPenaltyAnimations(prev => prev.filter(p => p.id !== penaltyAnim.id));
        }, 2000);

        console.log(`👻 Ghost Penalty: -${penalty} points (Level ${currentLevel})`);
      }
    }

    // 1. Identify Full Lines
    const linesToClear: number[] = [];
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (tempGrid[y].every(cell => cell !== 0)) {
        linesToClear.push(y);
      }
    }

    // Update grid immediately with the locked piece so it draws before explosion
    setGrid(tempGrid);
    setActivePiece(null); // Remove active piece immediately

    // 2. If lines need clearing, trigger animation phase
    if (linesToClear.length > 0) {
      setClearingLines(linesToClear);

      // Logic Update: If it's a Tetris (4 lines), give more time for the "Euphoric" animation
      const isTetris = linesToClear.length >= 4;
      const animationDelay = isTetris ? 1000 : 500;

      // Wait for explosion animation before processing score and shift
      setTimeout(() => {
        processClearedLines(tempGrid, linesToClear);
      }, animationDelay);
    } else {
      spawnPiece();
    }
  };

  const processClearedLines = (currentGrid: (string | number)[][], linesToClear: number[]) => {
    // Remove lines
    const newGrid = currentGrid.filter((_, index) => !linesToClear.includes(index));
    // Add new empty lines at top
    while (newGrid.length < BOARD_HEIGHT) {
      newGrid.unshift(Array(BOARD_WIDTH).fill(0));
    }

    setGrid(newGrid);
    setClearingLines([]); // End animation state

    // Calculate Score
    const linesCleared = linesToClear.length;
    const linePoints = [0, 100, 300, 500, 800]; // Tetris is index 4 -> 800
    const currentStats = statsRef.current;
    const levelMultiplier = currentStats.level;
    const points = linePoints[linesCleared] * levelMultiplier;

    const newLines = currentStats.lines + linesCleared;
    const newLevel = Math.min(10, Math.floor(newLines / 10) + 1); // Cap at level 10

    const leveledUp = newLevel > currentStats.level;

    // Update stats (score persists across levels)
    setStats({
      score: currentStats.score + points,
      lines: newLines,
      level: newLevel
    });

    // Update gravity for new level
    dropIntervalRef.current = getGravityForLevel(newLevel);

    // Update ghost allowed state based on level (but keep it OFF - user must enable)
    // Ghost is allowed for levels 1-2 and 7-10, forbidden for 3-6
    if (!isGhostAllowedForLevel(newLevel)) {
      setGhostEnabled(false); // Force disable for forbidden levels
    }
    // Note: We don't auto-enable ghost for allowed levels - user must choose

    if (leveledUp) {
      // Level up! Show level-up screen and reset board
      setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
      setActivePiece(null);
      setGameState(GameState.LEVEL_UP);
      // Don't spawn piece yet - wait for user to click continue
    } else {
      // Normal progression - spawn next piece
      spawnPiece();
    }
  };

  const getRandomType = () => TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];

  const spawnPiece = () => {
    // If we are in game over state (can happen during async timeout), stop.
    if (gameStateRef.current === GameState.GAME_OVER) return;

    const typeToSpawn = nextPieceRef.current || getRandomType();
    const newNextType = getRandomType();
    setNextPiece(newNextType);

    const piece = {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: -2 },
      tetromino: typeToSpawn,
      rotation: 0
    };

    const matrix = getShapeMatrix(typeToSpawn, 0);
    if (checkCollision(piece.pos, matrix, gridRef.current)) {
      handleGameOver();
      return;
    }

    setActivePiece(piece);
    dropCounterRef.current = 0;
  };

  const handleGameOver = async () => {
    setGameState(GameState.GAME_OVER);
    setIsPaused(false);
    setClearingLines([]);

    const newScore = statsRef.current.score;

    // Submit to Supabase
    await submitScore(newScore);

    // Refresh Leaderboard
    const newLeaderboard = await getLeaderboard();
    setLeaderboard(newLeaderboard);

    // Check if new high (simple check against top 10)
    const madeTop10 = newLeaderboard.some(entry => entry.highscore <= newScore); // This logic is a bit loose, but okay for visual
    setIsNewHigh(madeTop10);
  };

  const movePiece = (dir: { x: number; y: number }) => {
    // Prevent movement during line clear animation
    if (clearingLinesRef.current.length > 0) return false;
    if (!activePieceRef.current || gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return false;

    const piece = activePieceRef.current;
    const matrix = getShapeMatrix(piece.tetromino, piece.rotation);

    if (!checkCollision({ x: piece.pos.x + dir.x, y: piece.pos.y + dir.y }, matrix, gridRef.current)) {
      setActivePiece({ ...piece, pos: { x: piece.pos.x + dir.x, y: piece.pos.y + dir.y } });
      triggerVisualAction('MOVE');
      return true;
    }
    return false;
  };

  const rotatePiece = () => {
    if (clearingLinesRef.current.length > 0) return;
    if (!activePieceRef.current || gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

    const piece = activePieceRef.current;
    const newRotation = (piece.rotation + 1) % 4;
    const matrix = getShapeMatrix(piece.tetromino, newRotation);

    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
      if (!checkCollision({ x: piece.pos.x + kick, y: piece.pos.y }, matrix, gridRef.current)) {
        setActivePiece({ ...piece, pos: { x: piece.pos.x + kick, y: piece.pos.y }, rotation: newRotation });
        triggerVisualAction('ROTATE');
        return;
      }
    }
  };

  const drop = () => {
    if (isPausedRef.current) return;
    // Don't drop if we are animating lines
    if (clearingLinesRef.current.length > 0) return;

    if (!movePiece({ x: 0, y: 1 })) {
      lockPiece();
    } else {
      dropCounterRef.current = 0;
    }
  };

  const fastDrop = () => {
    if (isPausedRef.current || clearingLinesRef.current.length > 0) return;
    drop();
    triggerVisualAction('DROP');
  };

  // --- Touch Controls ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: Date.now(),
      isMoving: true
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current.isMoving || gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchRef.current.lastX;
    const deltaY = touch.clientY - touchRef.current.lastY;

    // Horizontal Move (Threshold 20px)
    if (Math.abs(deltaX) > 20) {
      if (deltaX > 0) movePiece({ x: 1, y: 0 });
      else movePiece({ x: -1, y: 0 });
      touchRef.current.lastX = touch.clientX;
    }

    // Soft Drop (Threshold 30px)
    if (deltaY > 30) {
      drop();
      touchRef.current.lastY = touch.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current.isMoving) return;
    touchRef.current.isMoving = false;

    const duration = Date.now() - touchRef.current.startTime;
    const totalDeltaX = Math.abs(e.changedTouches[0].clientX - touchRef.current.startX);
    const totalDeltaY = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);

    // Tap to Rotate (Short duration, minimal movement)
    if (duration < 300 && totalDeltaX < 10 && totalDeltaY < 10) {
      rotatePiece();
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    const loop = (time: number) => {
      if (gameStateRef.current === GameState.PLAYING && !isPausedRef.current && clearingLinesRef.current.length === 0) {
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;
        dropCounterRef.current += deltaTime;
        if (dropCounterRef.current > dropIntervalRef.current) {
          drop();
          dropCounterRef.current = 0;
        }
      } else {
        lastTimeRef.current = time;
      }
      requestAnimationFrame(loop);
    };
    const reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, []);

  // --- Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // === DEBUG MODE: Keyboard Shortcuts ===
      // Only in PLAYING state
      if (gameStateRef.current === GameState.PLAYING) {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Ctrl/Cmd + L: Skip to next level (add 10 lines)
        if (isCtrlOrCmd && e.key === 'l') {
          e.preventDefault();
          const currentStats = statsRef.current;
          const linesToAdd = 10 - (currentStats.lines % 10); // Lines needed to reach next level
          const newLines = currentStats.lines + linesToAdd;
          const newLevel = Math.min(10, Math.floor(newLines / 10) + 1);

          console.log(`🎮 DEBUG: Skipping to Level ${newLevel}`);

          setStats({
            ...currentStats,
            lines: newLines,
            level: newLevel
          });

          dropIntervalRef.current = getGravityForLevel(newLevel);
          setGhostEnabled(newLevel <= 2);

          // Show level-up screen
          setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
          setActivePiece(null);
          setGameState(GameState.LEVEL_UP);
          return;
        }

        // Ctrl/Cmd + 1-9,0: Jump to specific level
        if (isCtrlOrCmd && /^[0-9]$/.test(e.key)) {
          e.preventDefault();
          const targetLevel = e.key === '0' ? 10 : parseInt(e.key);
          const linesNeeded = (targetLevel - 1) * 10;

          console.log(`🎮 DEBUG: Jumping to Level ${targetLevel}`);

          setStats({
            ...statsRef.current,
            lines: linesNeeded,
            level: targetLevel
          });

          dropIntervalRef.current = getGravityForLevel(targetLevel);
          setGhostEnabled(targetLevel <= 2);

          // Show level-up screen
          setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
          setActivePiece(null);
          setGameState(GameState.LEVEL_UP);
          return;
        }

        // Ctrl/Cmd + G: Toggle ghost (for testing)
        if (isCtrlOrCmd && e.key === 'g') {
          e.preventDefault();
          setGhostEnabled(!ghostEnabled);
          console.log(`🎮 DEBUG: Ghost ${!ghostEnabled ? 'enabled' : 'disabled'}`);
          return;
        }
      }

      if (gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

      if (e.key === 'ArrowLeft') movePiece({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') movePiece({ x: 1, y: 0 });
      if (e.key === 'ArrowDown') fastDrop();
      if (e.key === 'ArrowUp') rotatePiece();
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ghostEnabled]); // Add ghostEnabled to dependencies

  // Automatic Snow Clearing (Every 110 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (snowEffectRef.current) {
        snowEffectRef.current.triggerPlow();
      }
    }, 110000); // 110 seconds

    return () => clearInterval(interval);
  }, []);

  // --- Flow ---
  const handleStartClick = async () => {
    // Check if we have a user from Supabase session
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser && authUser.email_confirmed_at) {
      // Ensure local state is synced
      const { name, city } = authUser.user_metadata;
      setUser({
        name: name || 'Speler',
        city: city || 'Onbekend',
        email: authUser.email || ''
      });
      startGame();
    } else {
      setGameState(GameState.REGISTRATION);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGameState(GameState.WELCOME);
  };

  const handleRegistration = (data: UserData) => {
    // RegistrationForm handles the Supabase signup. 
    // After success, it shows "Check Email". 
    // We don't auto-login here because they need to verify first.
    // So we might just go back to Title or stay there.
    // Actually RegistrationForm handles its own success state.
    // If we want to force them back to title:
    // setGameState(GameState.TITLE);
  };

  const startGame = () => {
    setGrid(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
    setStats({ score: 0, lines: 0, level: 1 });
    statsRef.current = { score: 0, lines: 0, level: 1 };

    dropIntervalRef.current = getGravityForLevel(1); // Use gravity function
    setGhostEnabled(false); // Ghost starts OFF - user must enable manually
    setGameState(GameState.PLAYING);
    setIsPaused(false);
    setShowLeaderboard(false);
    setClearingLines([]);

    const firstPieceType = getRandomType();
    const nextPieceType = getRandomType();

    setNextPiece(nextPieceType);
    nextPieceRef.current = nextPieceType;

    const piece = {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: -2 },
      tetromino: firstPieceType,
      rotation: 0
    };

    const matrix = getShapeMatrix(firstPieceType, 0);
    if (checkCollision(piece.pos, matrix, Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)))) {
      handleGameOver();
      return;
    }

    setActivePiece(piece);
    dropCounterRef.current = 0;
  };

  const handleExitClick = () => {
    setIsPaused(true);
    setShowLeaderboard(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    setShowLeaderboard(false);
  };

  const handleQuitGame = () => {
    setGameState(GameState.TITLE);
    setIsPaused(false);
    setShowLeaderboard(false);
  };

  const handleLevelUpContinue = () => {
    // Resume game after level-up, spawn new piece
    setGameState(GameState.PLAYING);
    spawnPiece();
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-transparent overflow-hidden touch-none overscroll-none select-none">

      {/* Background Ambience */}
      <SnowEffect ref={snowEffectRef} />

      {/* Exit Button (Only in Gameplay) */}
      {gameState === GameState.PLAYING && (
        <>
          <button
            onClick={handleExitClick}
            className="absolute top-3 right-3 z-50 group hover:scale-110 transition-transform"
            title="Verlaten / Pauze"
          >
            <div className="relative w-12 h-12 md:w-16 md:h-16">
              <div className="absolute inset-0 text-4xl md:text-5xl drop-shadow-md">🎅</div>
              <div className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-xs font-bold border border-white shadow-lg animate-pulse-fast">
                ✕
              </div>
            </div>
          </button>

          {/* Mobile Rotate Button */}
          <button
            className="md:hidden absolute bottom-6 right-6 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center active:bg-white/30 transition-all z-50 touch-none shadow-lg active:scale-95"
            onTouchStart={(e) => { e.preventDefault(); rotatePiece(); }}
            onClick={(e) => { e.preventDefault(); rotatePiece(); }} // Fallback
          >
            <span className="text-3xl text-white drop-shadow-md">↻</span>
          </button>
        </>
      )}

      {/* Leaderboard / Pause Modal */}
      {user && (
        <LeaderboardModal
          isOpen={showLeaderboard}
          user={user}
          currentScore={stats.score}
          leaderboard={leaderboard}
          onResume={handleResume}
          onQuit={handleQuitGame}
        />
      )}

      {gameState === GameState.WELCOME && (
        <WelcomeScreen
          onLogin={() => setGameState(GameState.LOGIN)}
          onRegister={() => setGameState(GameState.REGISTRATION)}
        />
      )}

      {gameState === GameState.LOGIN && (
        <LoginScreen
          onBack={() => setGameState(GameState.WELCOME)}
          onLoginSuccess={() => setGameState(GameState.TITLE)}
          onForgotPassword={() => setGameState(GameState.FORGOT_PASSWORD)}
        />
      )}

      {gameState === GameState.FORGOT_PASSWORD && (
        <ForgotPasswordScreen
          onBack={() => setGameState(GameState.LOGIN)}
        />
      )}

      {gameState === GameState.RESET_PASSWORD && (
        <ResetPasswordScreen
          onSuccess={() => setGameState(GameState.TITLE)}
        />
      )}

      {gameState === GameState.TITLE && (
        <TitleScreen
          onStart={handleStartClick}
          leaderboard={leaderboard}
          onLogout={handleLogout}
          user={user}
        />
      )}

      {gameState === GameState.REGISTRATION && (
        <RegistrationForm
          onSubmit={handleRegistration}
          onBack={() => setGameState(GameState.WELCOME)}
          onGoToLogin={() => setGameState(GameState.LOGIN)}
        />
      )}

      {gameState === GameState.LEVEL_UP && (
        <LevelUpScreen
          level={stats.level}
          onContinue={handleLevelUpContinue}
        />
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
        <div className="flex flex-col w-full h-full max-w-7xl mx-auto p-1 md:p-4 overflow-hidden animate-fade-in-up">

          <div className="flex-none flex justify-between items-center bg-black/60 backdrop-blur-xl rounded-xl p-2 md:p-3 border border-red-500/30 z-20 mr-12 md:mr-0 mb-2 max-w-lg mx-auto w-full shadow-lg relative overflow-hidden">
            {/* Subtle red glow at top */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

            <div className="flex flex-col">
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 truncate mr-2">
                Speler: <span className="text-white font-bold">{user?.name}</span>
              </div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 whitespace-nowrap">
                Top Score: <span className="text-yellow-400 font-bold">{leaderboard[0]?.highscore?.toLocaleString() || 0}</span>
              </div>
            </div>

            {/* Santa Icon */}
            <div className="text-3xl filter drop-shadow-md animate-float">🎅</div>
          </div>

          <div
            className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8 w-full touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >

            <div className="flex-1 h-full w-full flex items-center justify-center min-h-0 relative order-2 md:order-1">
              <GameBoard
                grid={grid}
                activePiece={activePiece}
                lastAction={lastAction}
                clearingLines={clearingLines}
                ghostEnabled={ghostEnabled}
                penaltyAnimations={penaltyAnimations}
                level={stats.level}
              />
            </div>

            <div className="flex-none w-full md:w-auto h-auto md:h-full flex items-center justify-center md:items-start order-1 md:order-2">
              <HUD
                stats={stats}
                nextPiece={nextPiece}
                ghostEnabled={ghostEnabled}
                onToggleGhost={() => {
                  // Only allow toggle if ghost is allowed for current level
                  if (isGhostAllowedForLevel(stats.level)) {
                    setGhostEnabled(!ghostEnabled);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && user && (
        <GameOverScreen
          stats={stats}
          user={user}
          onRestart={startGame}
          isNewHigh={isNewHigh}
          leaderboard={leaderboard}
        />
      )}

      {/* Debug Panel - Only visible during gameplay */}
      {gameState === GameState.PLAYING && (
        <DebugPanel currentLevel={stats.level} />
      )}

    </div>
  );
};

export default App;