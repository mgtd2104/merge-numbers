
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Tile as TileType } from '../types';
import { GRID_SIZE } from '../constants';
import Tile from './Tile';

interface GameBoardProps {
  grid: Grid;
  onCellClick: (x: number, y: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ grid, onCellClick }) => {
  const tiles = grid.flat().filter(tile => tile !== null) as TileType[];

  return (
    <div 
      className="relative grid gap-2.5 p-3 bg-slate-800/90 rounded-2xl shadow-2xl border-4 border-slate-700/50"
      style={{ 
        width: 'min(90vw, 380px)', 
        height: 'min(90vw, 380px)',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
      }}
    >
      {/* Background cells */}
      {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
        <div 
          key={`bg-${i}`}
          onClick={() => onCellClick(i % GRID_SIZE, Math.floor(i / GRID_SIZE))}
          className="w-full h-full bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-600/60 transition-colors"
        />
      ))}

      {/* Floating Tiles */}
      <AnimatePresence mode="popLayout">
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;