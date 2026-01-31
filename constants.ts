
export const GRID_SIZE = 4;
export const WINNING_VALUE = 65536;

export const TILE_COLORS: Record<number, string> = {
  2: 'bg-slate-200 text-slate-900',
  4: 'bg-emerald-200 text-emerald-900',
  8: 'bg-cyan-300 text-cyan-900',
  16: 'bg-sky-400 text-white',
  32: 'bg-blue-500 text-white',
  64: 'bg-indigo-500 text-white',
  128: 'bg-violet-600 text-white',
  256: 'bg-purple-600 text-white',
  512: 'bg-fuchsia-600 text-white',
  1024: 'bg-pink-600 text-white',
  2048: 'bg-rose-500 text-white',
  4096: 'bg-orange-500 text-white',
  8192: 'bg-amber-500 text-white',
  16384: 'bg-yellow-400 text-slate-900',
  32768: 'bg-lime-500 text-slate-900',
  65536: 'bg-red-600 text-white border-4 border-yellow-400 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)]',
};

/**
 * Generates a random value based on the current maximum tile value.
 * Difficulty is increased by narrowing the range of "next" values and forcing 
 * higher starting numbers more often as the player progresses.
 */
export const getRandomValue = (maxTile: number = 2): number => {
  const currentExp = Math.floor(Math.log2(maxTile));
  
  // Broaden the randomness while following a difficulty curve.
  // minExp starts at 1 (val 2) and increases as maxTile grows.
  const minExp = Math.max(1, currentExp - 4); 
  // maxExp follows closely but allows for bigger "blasts".
  const maxExp = Math.max(minExp, currentExp - 1);
  
  const randomExp = Math.floor(Math.random() * (maxExp - minExp + 1)) + minExp;
  
  // Occasional "wildcard" extra high value for chaotic randomness
  if (Math.random() > 0.92) {
      return Math.pow(2, Math.max(1, currentExp - 1));
  }

  return Math.pow(2, randomExp);
};