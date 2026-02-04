
export const GRAVITY = 0.6;
export const MOVE_SPEED = 5.5;
export const JUMP_FORCE = -12;
export const FRICTION = 0.8;
export const MAX_JUMPS = 4;
export const PLAYER_MAX_HP = 100;

// 5 hits from standard = 20 damage. 3 hits from heavy = 34 damage.
export const ENEMY_DAMAGE = 20; 
export const HEAVY_ENEMY_DAMAGE = 34;
export const BOSS_DAMAGE = 40;

export const ENEMY_SENSE_DIST = 180;
export const ENEMY_ATTACK_DIST = 60;
export const ENEMY_CHASE_ACCEL = 0.05;
export const ENEMY_MAX_CHASE_SPEED = 4.0;

export const JUMP_TAP_WINDOW = 350; 

export const COLORS = {
  NIGHT_SKY: '#0a0a14',
  MOON: '#f0f2f5',
  MOON_GLOW: 'rgba(240, 242, 245, 0.05)',
  ROOFTOP: '#1e1e26',
  BUILDING: '#12121d',
  WINDOW_LIT: '#d4af37',
  WINDOW_DARK: '#050505',
  PLAYER_BODY: '#1a1a2e',
  PLAYER_HEAD: '#ef4444', 
  ENEMY: '#111111',
  HEAVY_ENEMY: '#1a0505',
  BOSS: '#1e0a2e',
  HEART: '#fb7185',
  SWORD_BLADE: '#e2e8f0',
  SWORD_NEON: '#ef4444', 
};

export const LEVELS = [
  { levelNumber: 1, targetEnemies: 5, bossCount: 0, bossHp: 0, heartSpawnRate: 0.15 },
  { levelNumber: 2, targetEnemies: 10, bossCount: 0, bossHp: 0, heartSpawnRate: 0.2 },
  { levelNumber: 3, targetEnemies: 15, bossCount: 0, bossHp: 0, heartSpawnRate: 0.25 },
  { levelNumber: 4, targetEnemies: 20, bossCount: 1, bossHp: 5, heartSpawnRate: 0.4 },
  { levelNumber: 5, targetEnemies: 25, bossCount: 2, bossHp: 5, heartSpawnRate: 0.5 },
];
