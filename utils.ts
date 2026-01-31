
import { v4 as uuidv4 } from 'uuid';
import { Tile, Grid, Position } from './types';
import { GRID_SIZE } from './constants';

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: GRID_SIZE }, () => 
    Array.from({ length: GRID_SIZE }, () => null)
  );
};

export const getEmptyCells = (grid: Grid): Position[] => {
  const cells: Position[] = [];
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) cells.push({ x, y });
    });
  });
  return cells;
};

export const createTile = (value: number, position: Position): Tile => ({
  id: uuidv4(),
  value,
  position,
  isNew: true
});

export const deepCloneGrid = (grid: Grid): Grid => {
  return grid.map(row => row.map(tile => tile ? { ...tile } : null));
};