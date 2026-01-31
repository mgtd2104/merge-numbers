
import React from 'react';
import { motion } from 'framer-motion';
import { Tile as TileType } from '../types';
import { TILE_COLORS, GRID_SIZE } from '../constants';

interface TileProps {
  tile: TileType;
}

const Tile: React.FC<TileProps> = ({ tile }) => {
  const { value, position } = tile;
  
  const left = `${(position.x / GRID_SIZE) * 100}%`;
  const top = `${(position.y / GRID_SIZE) * 100}%`;
  const size = `${(1 / GRID_SIZE) * 100}%`;

  const colorClass = TILE_COLORS[value] || 'bg-slate-800 text-white';

  const getFontSize = (val: number) => {
    if (val < 100) return 'text-3xl sm:text-4xl font-black';
    if (val < 1000) return 'text-2xl sm:text-3xl font-black';
    if (val < 10000) return 'text-xl sm:text-2xl font-black';
    return 'text-lg sm:text-xl font-black';
  };

  return (
    <motion.div
      layoutId={tile.id}
      initial={tile.isNew ? { scale: 0, opacity: 0 } : false}
      animate={{ 
        scale: 1, 
        opacity: 1,
        left,
        top
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.8
      }}
      className={`absolute flex items-center justify-center p-2 z-10`}
      style={{ width: size, height: size }}
    >
      <div className={`w-full h-full rounded-xl shadow-xl flex items-center justify-center transition-all duration-300 ${colorClass} ${getFontSize(value)} tracking-tight`}>
        {value}
      </div>
    </motion.div>
  );
};

export default Tile;
