import React, { useState, useEffect, useRef } from 'react';
import TitleScreen from './components/TitleScreen';
import RegistrationForm from './components/RegistrationForm';
import HUD from './components/HUD';
import GameBoard from './components/GameBoard';
import GameOverScreen from './components/GameOverScreen';
import SnowEffect, { SnowEffectHandle } from './components/SnowEffect';
import LeaderboardModal from './components/LeaderboardModal';
import { GameState, PlayerStats, TetrominoType, UserData, LeaderboardEntry, GameAction } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOS, TETROMINO_KEYS } from './constants';
import { supabase, submitScore, getLeaderboard } from './services/supabase';

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
  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
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

  const snowEffectRef = useRef<SnowEffectHandle>(null);

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { activePieceRef.current = activePiece; }, [activePiece]);
  useEffect(() => { nextPieceRef.current = nextPiece; }, [nextPiece]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { clearingLinesRef.current = clearingLines; }, [clearingLines]);

  // Load Leaderboard and User Session on Mount
  useEffect(() => {
    const init = async () => {
      // 1. Fetch Leaderboard
      const lb = await getLeaderboard();
      setLeaderboard(lb);

      // 2. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if verified
        if (session.user.email_confirmed_at) {
          const { name, city } = session.user.user_metadata;
          setUser({
            name: name || 'Speler',
            city: city || 'Onbekend',
            email: session.user.email || ''
          });
        }
      }
    };
    init();

    // Listen for auth changes (e.g. if they click the email link while app is open)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { name, city } = session.user.user_metadata;
        setUser({
          name: name || 'Speler',
          city: city || 'Onbekend',
          email: session.user.email || ''
        });
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
    const newLevel = Math.floor(newLines / 10) + 1;

    setStats({
      score: currentStats.score + points,
      lines: newLines,
      level: newLevel
    });

    // Speed up
    dropIntervalRef.current = Math.max(100, 1000 - ((newLevel - 1) * 100));

    spawnPiece();
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

      if (gameStateRef.current !== GameState.PLAYING || isPausedRef.current) return;

      if (e.key === 'ArrowLeft') movePiece({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') movePiece({ x: 1, y: 0 });
      if (e.key === 'ArrowDown') fastDrop();
      if (e.key === 'ArrowUp') rotatePiece();
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
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

    dropIntervalRef.current = 1000;
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

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-transparent overflow-hidden touch-none overscroll-none select-none">

      {/* Background Ambience */}
      <SnowEffect ref={snowEffectRef} />

      {/* Exit Button (Only in Gameplay) */}
      {gameState === GameState.PLAYING && (
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

      {gameState === GameState.TITLE && (
        <TitleScreen
          onStart={handleStartClick}
          leaderboard={leaderboard}
          onClearSnow={() => snowEffectRef.current?.triggerPlow()}
        />
      )}

      {gameState === GameState.REGISTRATION && (
        <RegistrationForm onSubmit={handleRegistration} onBack={() => setGameState(GameState.TITLE)} />
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

          <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8 w-full">

            <div className="flex-1 h-full w-full flex items-center justify-center min-h-0 relative">
              <GameBoard
                grid={grid}
                activePiece={activePiece}
                lastAction={lastAction}
                clearingLines={clearingLines}
              />
            </div>

            <div className="flex-none w-full md:w-auto h-auto md:h-full flex items-center justify-center md:items-start order-2 md:order-1">
              <HUD stats={stats} nextPiece={nextPiece} />
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

    </div>
  );
};

export default App;