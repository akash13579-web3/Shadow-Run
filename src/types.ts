
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: 'player' | 'enemy' | 'boss' | 'heart';
  hp: number;
  maxHp: number;
  facingRight: boolean;
  isJumping: boolean;
  jumpCount: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rooftop' | 'tree';
}

export interface GameLevel {
  levelNumber: number;
  targetEnemies: number;
  bossCount: number;
  bossHp: number;
  heartSpawnRate: number;
}
