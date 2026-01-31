
export type Position = {
  x: number;
  y: number;
};

export interface Tile {
  id: string;
  value: number;
  position: Position;
  prevPosition?: Position;
  mergedFrom?: Tile[];
  isNew?: boolean;
}

export type Grid = (Tile | null)[][];

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  nextValue: number;
  gameOver: boolean;
  won: boolean;
}
