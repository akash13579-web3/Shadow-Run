
import React, { useRef, useEffect } from 'react';
import { GameState, Entity, Platform, GameLevel } from '../types';
import { 
  GRAVITY, MOVE_SPEED, JUMP_FORCE, FRICTION, MAX_JUMPS, 
  PLAYER_MAX_HP, COLORS, JUMP_TAP_WINDOW, ENEMY_DAMAGE, HEAVY_ENEMY_DAMAGE, BOSS_DAMAGE,
  ENEMY_SENSE_DIST, ENEMY_ATTACK_DIST, ENEMY_CHASE_ACCEL, ENEMY_MAX_CHASE_SPEED
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  levelData: GameLevel;
  onGameOver: () => void;
  onLevelClear: () => void;
  onHpChange: (hp: number) => void;
  onKillsChange: (kills: number) => void;
  externalAction?: 'sword' | null;
}

interface ExtendedEntity extends Entity {
  deathTime?: number;
  isDead?: boolean;
  hasSword?: boolean;
  isHeavy?: boolean;
  isChasing?: boolean;
  chaseSpeedMultiplier?: number;
  attackTimer?: number;
}

interface PlayerState extends ExtendedEntity {
  animFrame: number;
  attackType: 'sword' | null;
  attackTimer: number;
  rotation: number;
  isFlipping: boolean;
  invulnTimer: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  levelData, 
  onGameOver, 
  onLevelClear, 
  onHpChange, 
  onKillsChange,
  externalAction
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  const playerRef = useRef<PlayerState>({
    x: 100, y: 100, width: 35, height: 60, vx: 0, vy: 0, 
    type: 'player', hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
    facingRight: true, isJumping: false, jumpCount: 0,
    animFrame: 0, attackType: null, attackTimer: 0, rotation: 0,
    isFlipping: false, invulnTimer: 0
  });

  const entitiesRef = useRef<ExtendedEntity[]>([]);
  const platformsRef = useRef<(Platform & { windows: {x:number, y:number, lit:boolean}[] })[]>([]);
  const cameraX = useRef(0);
  const cameraY = useRef(0);
  const killCountRef = useRef(0);
  const inputRef = useRef({ left: false, right: false, lastTapTime: 0, tapCount: 0 });

  useEffect(() => {
    if (externalAction === 'sword' && playerRef.current.attackTimer <= 0) {
      playerRef.current.attackType = 'sword';
      playerRef.current.attackTimer = 15; 
    }
  }, [externalAction]);

  const initWorld = () => {
    const screenH = window.innerHeight;
    playerRef.current = {
      x: 100, y: screenH - 300, width: 35, height: 60, vx: 0, vy: 0, 
      type: 'player', hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
      facingRight: true, isJumping: false, jumpCount: 0,
      animFrame: 0, attackType: null, attackTimer: 0, rotation: 0,
      isFlipping: false, invulnTimer: 0
    };
    killCountRef.current = 0;
    cameraX.current = 0;
    cameraY.current = 0;
    onHpChange(PLAYER_MAX_HP);
    onKillsChange(0);

    const platforms: any[] = [];
    let curX = 0;
    // Massive level width to ensure plenty of enemies
    const levelWidth = 15000 + (levelData.levelNumber * 3000);

    platforms.push({ x: 0, y: screenH - 250, width: 800, height: 250, type: 'rooftop', windows: [] });
    curX = 850;

    const maxBuildingH = screenH * 0.45;
    const minBuildingH = screenH * 0.2;

    while (curX < levelWidth) {
      const isTree = Math.random() > 0.95;
      const width = isTree ? 60 : 300 + Math.random() * 400;
      const height = isTree ? 180 + Math.random() * 50 : minBuildingH + Math.random() * (maxBuildingH - minBuildingH);
      const gap = 120 + Math.random() * 80;

      const platWindows: any[] = [];
      if (!isTree) {
          for(let wx = 30; wx < width - 30; wx += 45) {
              for(let wy = 50; wy < height - 40; wy += 65) {
                  platWindows.push({ x: wx, y: wy, lit: Math.random() > 0.7 });
              }
          }
      }

      platforms.push({
        x: curX, y: screenH - height, width, height, type: isTree ? 'tree' : 'rooftop', windows: platWindows
      });
      curX += width + gap;
    }
    platformsRef.current = platforms;

    // High density enemy spawning
    const entities: ExtendedEntity[] = [];
    const entityCount = 60 + levelData.levelNumber * 10;
    const step = levelWidth / entityCount;
    
    for (let i = 2; i < entityCount; i++) {
      const isBoss = i > entityCount - levelData.bossCount - 2 && levelData.bossCount > 0;
      const x = i * step + (Math.random() * step * 0.5);
      const plat = platforms.find(p => x >= p.x && x <= p.x + p.width - 50);
      if (plat) {
        const isHeavy = !isBoss && Math.random() > 0.7;
        entities.push({
          x: x, y: plat.y - (isBoss ? 80 : 60),
          width: isBoss ? 45 : 35, height: isBoss ? 80 : 60,
          vx: 0, vy: 0,
          type: isBoss ? 'boss' : 'enemy',
          hp: isBoss ? levelData.bossHp : (isHeavy ? 1 : 1), // Standard enemies always 1 hit
          maxHp: isBoss ? levelData.bossHp : 1,
          facingRight: false, isJumping: false, jumpCount: 0, isDead: false,
          hasSword: true,
          isHeavy,
          isChasing: false,
          chaseSpeedMultiplier: 1.0,
          attackTimer: 0
        });
      }
    }

    const heartCount = 20 + levelData.levelNumber * 5;
    for (let i = 0; i < heartCount; i++) {
      const x = 1000 + Math.random() * (levelWidth - 2000);
      const plat = platforms.find(p => x >= p.x && x <= p.x + p.width);
      if (plat) {
        entities.push({
          x, y: plat.y - 75, width: 25, height: 25, vx: 0, vy: 0,
          type: 'heart', hp: 0, maxHp: 0, facingRight: true, isJumping: false, jumpCount: 0
        });
      }
    }
    entitiesRef.current = entities;
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) initWorld();
  }, [gameState, levelData]);

  useEffect(() => {
    const handleStart = (e: TouchEvent | MouseEvent) => {
      if (gameState !== GameState.PLAYING) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const screenWidth = window.innerWidth;
      const now = Date.now();

      if (now - inputRef.current.lastTapTime < JUMP_TAP_WINDOW) {
        inputRef.current.tapCount++;
      } else {
        inputRef.current.tapCount = 1;
      }
      inputRef.current.lastTapTime = now;

      const p = playerRef.current;
      if (inputRef.current.tapCount <= MAX_JUMPS) {
        p.vy = JUMP_FORCE * (1 + (inputRef.current.tapCount - 1) * 0.08);
        p.isJumping = true;
        if (inputRef.current.tapCount >= 3) { p.isFlipping = true; p.rotation = 0; }
      }

      if (clientX < screenWidth / 2) {
        inputRef.current.left = true; inputRef.current.right = false;
      } else {
        inputRef.current.right = true; inputRef.current.left = false;
      }
    };

    const handleEnd = () => { inputRef.current.left = false; inputRef.current.right = false; };

    window.addEventListener('touchstart', handleStart);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousedown', handleStart);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [gameState]);

  const update = () => {
    if (gameState !== GameState.PLAYING) return;
    const p = playerRef.current;
    const now = Date.now();

    if (inputRef.current.left) { p.vx = -MOVE_SPEED; p.facingRight = false; }
    else if (inputRef.current.right) { p.vx = MOVE_SPEED; p.facingRight = true; }
    else { p.vx *= FRICTION; }

    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.animFrame += Math.abs(p.vx) * 0.15;
    if (p.invulnTimer > 0) p.invulnTimer--;

    if (p.isFlipping) {
      p.rotation += p.facingRight ? 0.35 : -0.35;
      if (Math.abs(p.rotation) >= Math.PI * 2) { p.rotation = 0; p.isFlipping = false; }
    }

    if (p.attackTimer > 0) {
      p.attackTimer--;
      if (p.attackTimer === 0) p.attackType = null;
    }

    for (const plat of platformsRef.current) {
      if (p.x < plat.x + plat.width && p.x + p.width > plat.x &&
          p.y + p.height > plat.y && p.y + p.height < plat.y + 40 && p.vy >= 0) {
        p.y = plat.y - p.height; p.vy = 0;
        p.isJumping = false; p.isFlipping = false; p.rotation = 0;
        inputRef.current.tapCount = 0;
      }
    }

    if (p.y > window.innerHeight + 1000) onGameOver();

    entitiesRef.current = entitiesRef.current.filter(ent => {
      if (ent.isDead) return (now - (ent.deathTime || 0)) < 3000;

      if (ent.type === 'heart') {
        if (Math.abs(p.x - ent.x) < 45 && Math.abs(p.y - ent.y) < 45) {
          p.hp = Math.min(PLAYER_MAX_HP, p.hp + 20); onHpChange(p.hp); return false;
        }
        return true;
      }

      // AI Logic: Sensing and Chasing
      const dx = (p.x + p.width/2) - (ent.x + ent.width/2);
      const dy = (p.y + p.height/2) - (ent.y + ent.height/2);
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Sense only if hero is within distance and NOT high in the air
      const isHeroHigh = p.y + p.height < ent.y - 40;
      
      if (dist < ENEMY_SENSE_DIST && !isHeroHigh) {
        ent.isChasing = true;
        ent.facingRight = dx > 0;
        ent.chaseSpeedMultiplier = Math.min(ENEMY_MAX_CHASE_SPEED, (ent.chaseSpeedMultiplier || 1.0) + ENEMY_CHASE_ACCEL);
      } else {
        ent.isChasing = false;
        ent.chaseSpeedMultiplier = 1.0;
      }

      if (ent.isChasing) {
        ent.vx = (ent.facingRight ? 1.0 : -1.0) * ent.chaseSpeedMultiplier;
      } else {
        ent.vx = ent.facingRight ? 1.4 : -1.4;
      }

      ent.x += ent.vx;

      // Enemy Sword Attack
      if (ent.attackTimer && ent.attackTimer > 0) {
        ent.attackTimer--;
      } else if (!ent.isDead && dist < ENEMY_ATTACK_DIST && !isHeroHigh) {
        ent.attackTimer = 15; // Start attack spin
      }

      const plat = platformsRef.current.find(pl => ent.x >= pl.x && ent.x + ent.width <= pl.x + pl.width);
      if (!plat && !ent.isChasing) ent.facingRight = !ent.facingRight;

      // Check Combat
      if (p.attackType === 'sword' && Math.abs(dx) < 85 && Math.abs(dy) < 85) {
        ent.hp--;
        if (ent.hp <= 0) {
          ent.isDead = true;
          ent.deathTime = now;
          killCountRef.current++;
          onKillsChange(killCountRef.current);
        }
      }

      // Enemy hits Player
      if (!ent.isDead && ent.attackTimer && ent.attackTimer > 0 && Math.abs(dx) < 55 && Math.abs(dy) < 60 && p.invulnTimer <= 0) {
        const damage = ent.type === 'boss' ? BOSS_DAMAGE : (ent.isHeavy ? HEAVY_ENEMY_DAMAGE : ENEMY_DAMAGE);
        p.hp -= damage;
        p.invulnTimer = 45;
        p.vx = (p.x < ent.x ? -10 : 10);
        onHpChange(Math.max(0, p.hp));
        if (p.hp <= 0) onGameOver();
      }

      return true;
    });

    cameraX.current += (p.x - window.innerWidth / 3 - cameraX.current) * 0.1;
    const targetCamY = (window.innerHeight * 0.4); 
    cameraY.current += (targetCamY - cameraY.current) * 0.05;

    if (killCountRef.current >= levelData.targetEnemies + levelData.bossCount) onLevelClear();
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, ent: ExtendedEntity | PlayerState, isPlayer: boolean) => {
    const { x, y, width: w, height: h, facingRight, isDead, type } = ent;
    const pState = isPlayer ? (ent as PlayerState) : null;
    const eState = !isPlayer ? (ent as ExtendedEntity) : null;
    
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    
    if (isDead) {
       ctx.translate(0, h/2 - 5);
       ctx.rotate(Math.PI / 2);
    } else {
       if (pState?.rotation) ctx.rotate(pState.rotation);
       if (!facingRight) ctx.scale(-1, 1);
    }

    if (isPlayer) {
        const headW = 22; const headH = 22;
        const torsoW = 20; const torsoH = 28;
        ctx.fillStyle = COLORS.PLAYER_BODY;
        ctx.fillRect(-torsoW/2, -h/2 + headH - 2, torsoW, torsoH);
        ctx.fillStyle = COLORS.PLAYER_HEAD;
        ctx.fillRect(-headW/2, -h/2, headW, headH);
        ctx.fillStyle = '#fff';
        if (!isDead) ctx.fillRect(4, -h/2 + 6, 4, 3);

        if (!isDead) {
            const anim = pState!.animFrame;
            const legX = Math.sin(anim) * 5;
            ctx.fillStyle = COLORS.PLAYER_BODY;
            ctx.fillRect(-8 + legX/2, torsoH - 8, 6, 12);
            ctx.fillRect(2 - legX/2, torsoH - 8, 6, 12);

            const isAttacking = pState!.attackType === 'sword';
            if (isAttacking) {
                const prog = (15 - pState!.attackTimer) / 15;
                ctx.save();
                ctx.rotate(prog * Math.PI * 4);
                ctx.strokeStyle = COLORS.SWORD_NEON; ctx.lineWidth = 4; ctx.shadowBlur = 15; ctx.shadowColor = COLORS.SWORD_NEON;
                ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 0.6); ctx.stroke();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(45, 0); ctx.stroke();
                ctx.restore();
            } else {
                ctx.save(); ctx.rotate(-Math.PI / 4); ctx.translate(-5, 5);
                ctx.fillStyle = '#333'; ctx.fillRect(-2, -2, 10, 4);
                ctx.strokeStyle = COLORS.SWORD_BLADE; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(35, 0); ctx.stroke();
                ctx.restore();
            }
        }
    } else {
        const isHeavy = eState?.isHeavy;
        const mainColor = type === 'boss' ? COLORS.BOSS : (isHeavy ? COLORS.HEAVY_ENEMY : COLORS.ENEMY);
        ctx.fillStyle = mainColor;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 4;
        
        const headSize = isHeavy ? 20 : 16;
        ctx.beginPath(); ctx.arc(0, -h/2 + headSize/2, headSize/2, 0, Math.PI * 2); ctx.fill();
        
        if (!isDead) {
            ctx.fillStyle = '#ff1111';
            ctx.fillRect(3, -h/2 + 4, 3, 3);
            ctx.fillStyle = mainColor;
            ctx.fillRect(-w/3, -h/2 + headSize, w/1.5, h/2);
            
            // Legs
            const anim = Date.now() / 250;
            ctx.beginPath(); ctx.moveTo(-4, h/4); ctx.lineTo(-4 + Math.sin(anim)*4, h/2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(4, h/4); ctx.lineTo(4 + Math.sin(anim + Math.PI)*4, h/2); ctx.stroke();

            // Enemy Attack Spin (Old Hero Style)
            const isAttacking = eState?.attackTimer && eState.attackTimer > 0;
            if (isAttacking) {
                const prog = (15 - eState!.attackTimer!) / 15;
                ctx.save();
                ctx.rotate(prog * Math.PI * 4);
                ctx.strokeStyle = isHeavy ? '#991b1b' : '#3b82f6'; // Red for heavy, blue for standard
                ctx.lineWidth = isHeavy ? 5 : 3;
                ctx.shadowBlur = 10; ctx.shadowColor = ctx.strokeStyle as string;
                ctx.beginPath(); ctx.arc(0, 0, isHeavy ? 55 : 40, 0, Math.PI * 0.8); ctx.stroke();
                ctx.restore();
            } else {
                // Enemy idle sword
                ctx.save();
                ctx.translate(10, 0);
                ctx.strokeStyle = '#555'; ctx.lineWidth = isHeavy ? 4 : 2;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(isHeavy ? 40 : 25, 0); ctx.stroke();
                ctx.restore();
            }
        }
    }

    ctx.restore();

    if (isDead) {
      const bloodAge = (Date.now() - (ent.deathTime || 0)) / 3000;
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.fillStyle = `rgba(180, 0, 0, ${0.7 - bloodAge * 0.7})`;
      for(let i=0; i<8; i++) {
          const rx = Math.sin(i * 1.5 + Date.now() * 0.02) * 30;
          const ry = Math.cos(i * 0.8 + Date.now() * 0.02) * 20;
          ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const p = playerRef.current;

    ctx.fillStyle = COLORS.NIGHT_SKY;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for(let i=0; i<60; i++) {
        const sx = (i * 197) % ctx.canvas.width;
        const sy = (i * 311) % (ctx.canvas.height / 1.5);
        ctx.fillRect(sx, sy, 1, 1);
    }

    ctx.shadowBlur = 150; ctx.shadowColor = 'rgba(240, 242, 245, 0.03)';
    ctx.fillStyle = COLORS.MOON;
    ctx.beginPath(); ctx.arc(ctx.canvas.width * 0.85, 100, 60, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(-cameraX.current, -cameraY.current + (window.innerHeight * 0.4));

    platformsRef.current.forEach(plat => {
      if (plat.type === 'rooftop') {
          ctx.fillStyle = COLORS.BUILDING;
          ctx.fillRect(plat.x, plat.y + 10, plat.width, plat.height - 10);
          ctx.fillStyle = COLORS.ROOFTOP;
          ctx.fillRect(plat.x, plat.y, plat.width, 14);
          
          plat.windows.forEach(w => {
              ctx.fillStyle = w.lit ? COLORS.WINDOW_LIT : COLORS.WINDOW_DARK;
              ctx.fillRect(plat.x + w.x, plat.y + w.y, 16, 24);
          });
      } else {
          ctx.fillStyle = '#0a0a10';
          ctx.fillRect(plat.x + plat.width/2 - 5, plat.y, 10, plat.height);
          ctx.fillStyle = '#040804';
          ctx.beginPath(); ctx.arc(plat.x + plat.width/2, plat.y, 35, 0, Math.PI * 2); ctx.fill();
      }
    });

    entitiesRef.current.forEach(ent => {
      if (ent.type === 'heart') {
        ctx.fillStyle = COLORS.HEART;
        ctx.shadowBlur = 10; ctx.shadowColor = COLORS.HEART;
        ctx.beginPath(); ctx.arc(ent.x + 12, ent.y + 12, 10, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        const isBoss = ent.type === 'boss';
        drawCharacter(ctx, ent, false);
        if (isBoss && !ent.isDead) {
            ctx.fillStyle = '#000'; ctx.fillRect(ent.x, ent.y - 25, ent.width, 5);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(ent.x, ent.y - 25, (ent.hp/ent.maxHp)*ent.width, 5);
        }
      }
    });

    if (p.invulnTimer % 6 < 3) {
        drawCharacter(ctx, p, true);
    }

    ctx.restore();
  };

  const frame = () => {
    if (gameState !== GameState.PLAYING) return;
    update();
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(frame);
  };

  useEffect(() => {
    const resize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', resize);
    resize();
    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(frame);
    }
    return () => { 
        window.removeEventListener('resize', resize);
        if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, [gameState, levelData]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default GameCanvas;
