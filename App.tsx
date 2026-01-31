
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, AlertTriangle, Zap, Info } from 'lucide-react';
import { Direction, Tile, GameState, Position } from './types';
import { GRID_SIZE, WINNING_VALUE, getRandomValue, TILE_COLORS } from './constants';
import { createEmptyGrid, getEmptyCells, createTile, deepCloneGrid } from './utils';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getMaxTileValue = (grid: (Tile | null)[][]): number => {
    let max = 2;
    grid.flat().forEach(tile => {
      if (tile && tile.value > max) max = tile.value;
    });
    return max;
  };

  const generateInitialTiles = () => {
    const grid = createEmptyGrid();
    // Start with 5-8 random tiles for high immediate difficulty and randomness
    const initialCount = 5 + Math.floor(Math.random() * 4); 
    const initialPool = [2, 2, 4, 4, 8, 8, 16, 32]; // Varied starting values

    for (let i = 0; i < initialCount; i++) {
      const empty = getEmptyCells(grid);
      if (empty.length > 0) {
        const { x, y } = empty[Math.floor(Math.random() * empty.length)];
        const randomValue = initialPool[Math.floor(Math.random() * initialPool.length)];
        grid[y][x] = createTile(randomValue, { x, y });
      }
    }
    return grid;
  };

  const [gameState, setGameState] = useState<GameState>(() => {
    const initialGrid = generateInitialTiles();
    const currentMax = 2; // Default for first next value
    return {
      grid: initialGrid,
      score: 0,
      bestScore: Number(localStorage.getItem('mergeBlastBestScore')) || 0,
      nextValue: getRandomValue(getMaxTileValue(initialGrid)),
      gameOver: false,
      won: false,
    };
  });

  const [touchStart, setTouchStart] = useState<Position | null>(null);

  const updateBestScore = useCallback((score: number) => {
    if (score > gameState.bestScore) {
      localStorage.setItem('mergeBlastBestScore', score.toString());
      setGameState((prev: GameState) => ({ ...prev, bestScore: score }));
    }
  }, [gameState.bestScore]);

  const move = useCallback((direction: Direction) => {
    if (gameState.gameOver) return;

    setGameState((prev: GameState) => {
      let grid = deepCloneGrid(prev.grid);
      let score = prev.score;
      let moved = false;
      let won = prev.won;

      // Reset tile states
      grid.forEach(row => row.forEach(tile => {
        if (tile) {
          tile.mergedFrom = undefined;
          tile.isNew = false;
          tile.prevPosition = { ...tile.position };
        }
      }));

      const getLine = (i: number) => {
        if (direction === Direction.LEFT || direction === Direction.RIGHT) {
          return grid[i];
        } else {
          return grid.map(row => row[i]);
        }
      };

      const setLine = (i: number, line: (Tile | null)[]) => {
        if (direction === Direction.LEFT || direction === Direction.RIGHT) {
          grid[i] = line;
        } else {
          line.forEach((tile, y) => {
            grid[y][i] = tile;
          });
        }
      };

      for (let i = 0; i < GRID_SIZE; i++) {
        let line = getLine(i);
        const isReverse = direction === Direction.RIGHT || direction === Direction.DOWN;
        if (isReverse) line.reverse();

        // 1. Shift non-null items
        let nonNull = line.filter(t => t !== null) as Tile[];
        
        // 2. Merge identical adjacent items
        let newLine: (Tile | null)[] = [];
        for (let j = 0; j < nonNull.length; j++) {
          if (j < nonNull.length - 1 && nonNull[j].value === nonNull[j + 1].value) {
            const mergedValue = nonNull[j].value * 2;
            const newTile = createTile(mergedValue, { x: 0, y: 0 }); 
            newTile.mergedFrom = [nonNull[j], nonNull[j + 1]];
            newTile.isNew = false;
            newLine.push(newTile);
            score += mergedValue;
            
            if (mergedValue === WINNING_VALUE) won = true;
            j++;
            moved = true;
          } else {
            newLine.push(nonNull[j]);
          }
        }

        // 3. Re-fill with nulls
        while (newLine.length < GRID_SIZE) newLine.push(null);
        if (isReverse) newLine.reverse();

        // 4. Detect position changes
        newLine.forEach((tile, index) => {
          if (tile) {
            const newPos = (direction === Direction.LEFT || direction === Direction.RIGHT) 
              ? { x: index, y: i } 
              : { x: i, y: index };
            
            if (tile.position.x !== newPos.x || tile.position.y !== newPos.y) {
              moved = true;
              tile.position = newPos;
            }
          }
        });

        setLine(i, newLine);
      }

      if (moved) {
        return { ...prev, grid, score, won };
      }
      return prev;
    });
  }, [gameState.gameOver]);

  const handleDrop = useCallback((x: number, y: number) => {
    if (gameState.gameOver || gameState.grid[y][x]) return;

    setGameState((prev: GameState) => {
      const newGrid = deepCloneGrid(prev.grid);
      newGrid[y][x] = createTile(prev.nextValue, { x, y });
      
      const currentMax = getMaxTileValue(newGrid);
      const nextVal = getRandomValue(currentMax);
      
      const empty = getEmptyCells(newGrid);
      const isGameOver = empty.length === 0;

      return {
        ...prev,
        grid: newGrid,
        nextValue: nextVal,
        gameOver: isGameOver
      };
    });
  }, [gameState.gameOver, gameState.grid]);

  // Robust touch event management
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) > 25) {
        if (absX > absY) {
          move(dx > 0 ? Direction.RIGHT : Direction.LEFT);
        } else {
          move(dy > 0 ? Direction.DOWN : Direction.UP);
        }
      }
      setTouchStart(null);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [touchStart, move]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': move(Direction.UP); break;
        case 'ArrowDown': move(Direction.DOWN); break;
        case 'ArrowLeft': move(Direction.LEFT); break;
        case 'ArrowRight': move(Direction.RIGHT); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const restartGame = () => {
    const initialGrid = generateInitialTiles();
    setGameState({
      grid: initialGrid,
      score: 0,
      bestScore: Number(localStorage.getItem('mergeBlastBestScore')) || 0,
      nextValue: getRandomValue(getMaxTileValue(initialGrid)),
      gameOver: false,
      won: false,
    });
  };

  useEffect(() => {
    updateBestScore(gameState.score);
  }, [gameState.score, updateBestScore]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen p-4 select-none touch-none bg-slate-900 text-slate-100 overflow-hidden"
    >
      <div className="w-full max-w-sm mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
            MERGE BLAST 4x4
          </h1>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Info size={12} />
            <span>Target: {WINNING_VALUE.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 min-w-[60px] text-center">
            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Score</div>
            <div className="text-base font-bold">{gameState.score}</div>
          </div>
          <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 min-w-[60px] text-center">
            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Best</div>
            <div className="text-base font-bold text-yellow-400">{gameState.bestScore}</div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Blast:</span>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-2xl shadow-xl border-2 border-white/10 transition-all duration-300 transform hover:scale-105 ${
            TILE_COLORS[gameState.nextValue] || 'bg-slate-800'
          }`}>
            {gameState.nextValue}
          </div>
        </div>

        <GameBoard 
          grid={gameState.grid} 
          onCellClick={handleDrop}
        />

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <Zap size={14} className="text-orange-400" />
            <span>Tap to Drop</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <RefreshCw size={14} className="text-rose-400" />
            <span>Swipe to Merge</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button 
          onClick={restartGame}
          className="group flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700 hover:border-orange-500/50 shadow-lg"
        >
          <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500 text-orange-400" />
          <span className="font-black text-sm tracking-widest">RESTART</span>
        </button>
      </div>

      <AnimatePresence>
        {gameState.gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-xs w-full text-center"
            >
              <AlertTriangle className="mx-auto mb-4 text-rose-500" size={56} />
              <h2 className="text-3xl font-black mb-2 text-white italic">GAME OVER</h2>
              <p className="text-slate-400 mb-6 text-sm font-bold uppercase tracking-wide">No more space! Score: {gameState.score}</p>
              <button 
                onClick={restartGame}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform uppercase tracking-widest"
              >
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.won && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-500/20 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-slate-900 p-10 rounded-3xl border-4 border-yellow-400 shadow-2xl max-w-xs w-full text-center"
            >
              <Trophy className="mx-auto mb-4 text-yellow-400 drop-shadow-lg" size={70} />
              <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 italic">
                VICTORY!
              </h2>
              <p className="text-slate-300 mb-8 font-bold uppercase tracking-widest">You reached {WINNING_VALUE.toLocaleString()}!</p>
              <button 
                onClick={() => setGameState(prev => ({ ...prev, won: false }))}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-colors uppercase tracking-widest"
              >
                Keep Going
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;