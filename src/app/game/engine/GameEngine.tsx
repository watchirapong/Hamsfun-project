'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import playerSprite from '../assets/player.png';
import type { PlayerStats } from '../Player';
import type {
  LevelConfig,
  Vector2,
  Bullet,
  Minion,
  Laser,
  BossAttackPattern,
  MinionAttackPattern,
  BossAttackContext,
  MinionAttackContext,
  LaserPatternContext,
  BombDefinition,
} from './types';

interface OtherPlayer {
  discordId: string;
  name: string;
  avatarUrl?: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
}

interface GameEngineProps {
  config: LevelConfig;
  playerStats: PlayerStats;
  externalBossHp?: number; // For multiplayer - sync boss HP from API
  onBossDamage?: (damage: number) => Promise<void>; // Callback when boss takes damage
  onBossDefeated?: () => void; // Callback when boss is defeated
  onPlayerDefeated?: () => void; // Callback when player is defeated
  otherPlayers?: OtherPlayer[]; // Other players in multiplayer mode
  currentPlayerId?: string; // Current player's Discord ID
  onPositionUpdate?: (position: { x: number; y: number }, health: number) => void; // Callback to sync position
}

const DEFAULT_BOSS_ATTACK: BossAttackPattern = ({ bossRef, config, spawnBullet }) => {
  const { boss } = config;
  const color = config.colors?.bossBullet ?? '#ff0066';
  for (let i = -2; i <= 2; i++) {
    spawnBullet({
      x: bossRef.current.x + i * (boss.size * 0.25),
      y: bossRef.current.y + boss.size * 0.8,
      vx: i * 1.5,
      vy: boss.bulletSpeed,
      radius: 6,
      color,
    });
  }
};

const DEFAULT_MINION_ATTACK: MinionAttackPattern = ({ minion, config, spawnBullet }) => {
  const color = config.colors?.minionBullet ?? '#ffaa00';
  spawnBullet({
    x: minion.x,
    y: minion.y + minion.radius,
    vx: 0,
    vy: config.minions.bulletSpeed,
    radius: 3,
    color,
  });
};

const DEFAULT_LASER_PATTERN = ({ bossRef, config, lasersRef }: LaserPatternContext) => {
  const { boss } = config;
  const laserConfig = boss.laser;
  if (!laserConfig) return;
  const width = boss.size * (laserConfig.widthRatio ?? 0.8);
  lasersRef.current.forEach((laser) => {
    laser.x = bossRef.current.x - width / 2;
    laser.y = bossRef.current.y + boss.size * 0.8;
    laser.width = width;
    laser.height = config.canvas.height - bossRef.current.y - boss.size * 0.8;
  });
};

const COUNTDOWN_START = 3;
const PLAYER_SPRITE_SRC = '/game/assets/player.png';

export default function GameEngine({ 
  config, 
  playerStats,
  externalBossHp,
  onBossDamage,
  onBossDefeated,
  onPlayerDefeated,
  otherPlayers = [],
  currentPlayerId,
  onPositionUpdate,
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'victory' | 'gameover'>('countdown');
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [health, setHealth] = useState(playerStats.maxHealth);
  const lastPositionUpdateRef = useRef<number>(0);
  const isDeadRef = useRef<boolean>(false);

  const keysRef = useRef<Record<string, boolean>>({});
  const playerRef = useRef<Vector2>({ ...config.player.startPosition });
  const playerHealthRef = useRef<number>(playerStats.maxHealth);
  const bossRef = useRef<Vector2>({ ...config.boss.startPosition });

  const playerBulletsRef = useRef<Bullet[]>([]);
  const bossBulletsRef = useRef<Bullet[]>([]);
  const bossHealthRef = useRef<number>(externalBossHp ?? config.boss.maxHealth);
  const accumulatedDamageRef = useRef<number>(0);
  const lastDamageSyncRef = useRef<number>(0);
  const minionsRef = useRef<Minion[]>([]);
  const minionBulletsRef = useRef<Bullet[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const bombsRef = useRef<Map<string, BombDefinition>>(new Map());
  const minionCountRef = useRef<number>(0);

  const lastShotRef = useRef<number>(0);
  const lastBossShotRef = useRef<number>(0);
  const lastMinionSpawnRef = useRef<number>(0);
  const lastLaserRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const playerInitializedRef = useRef<boolean>(false);
  const lastDamageTimeRef = useRef<number>(0);
  const levelStateRef = useRef<Record<string, unknown>>({});
  const winRewardedRef = useRef<boolean>(false);
  const playerImageRef = useRef<HTMLImageElement | null>(null);

  const invincibilityTime = config.player.invincibilityTime;
  const starCount = config.canvas.starCount ?? 50;
  const backgroundColor = config.colors?.background ?? '#000011';
  const bossColor = config.colors?.boss ?? '#ff0000';
  const bossAccent = config.colors?.bossAccent ?? '#cc0000';
  const minionColor = config.colors?.minion ?? '#ffaa00';
  const minionAccent = config.colors?.minionAccent ?? '#ff6600';
  const playerColor = config.colors?.player ?? '#00ff00';

  const bossAttack = config.boss.attackPattern ?? DEFAULT_BOSS_ATTACK;
  const minionAttack = config.minions.attackPattern ?? DEFAULT_MINION_ATTACK;
  const laserPattern = config.boss.laser?.pattern ?? DEFAULT_LASER_PATTERN;

    const resetLevelState = () => {
      playerRef.current = { ...config.player.startPosition };
      playerHealthRef.current = playerStats.maxHealth;
      bossRef.current = { ...config.boss.startPosition };
      bossBulletsRef.current = [];
      bossHealthRef.current = externalBossHp ?? config.boss.maxHealth;
      playerBulletsRef.current = [];
      minionBulletsRef.current = [];
      minionsRef.current = [];
      lasersRef.current = [];
      lastShotRef.current = 0;
      lastBossShotRef.current = 0;
      lastMinionSpawnRef.current = 0;
      lastLaserRef.current = 0;
      lastFrameRef.current = 0;
      lastDamageTimeRef.current = 0;
      levelStateRef.current = {};
      accumulatedDamageRef.current = 0;
      lastDamageSyncRef.current = 0;
      lastPositionUpdateRef.current = 0;
      isDeadRef.current = false;
      setHealth(playerStats.maxHealth);
      winRewardedRef.current = false;
    };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!playerInitializedRef.current || gameState === 'countdown') {
      resetLevelState();
      playerInitializedRef.current = true;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (!playerImageRef.current && typeof window !== 'undefined') {
      const img = new Image();
      img.src = playerSprite.src ?? PLAYER_SPRITE_SRC;
      img.onload = () => {
        playerImageRef.current = img;
      };
      img.onerror = () => {
        playerImageRef.current = null;
      };
    }

    const gameLoop = (timestamp: number) => {
      const delta = lastFrameRef.current ? timestamp - lastFrameRef.current : 16;
      lastFrameRef.current = timestamp;

      if (gameState !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Check if player is dead at the start of each frame
      if (playerHealthRef.current <= 0 && !isDeadRef.current) {
        isDeadRef.current = true;
        if (onPlayerDefeated) {
          onPlayerDefeated();
        } else {
          setGameState('gameover');
        }
        return; // Stop processing this frame
      }

      // If already dead, don't continue game loop
      if (isDeadRef.current) {
        return;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < starCount; i++) {
        const x = (i * 37) % config.canvas.width;
        const y = (i * 53 + timestamp / 10) % config.canvas.height;
        ctx.fillRect(x, y, 2, 2);
      }

      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        playerRef.current.x = Math.max(20, playerRef.current.x - playerStats.moveSpeed);
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        playerRef.current.x = Math.min(config.canvas.width - 20, playerRef.current.x + playerStats.moveSpeed);
      }
      if (keysRef.current['w'] || keysRef.current['arrowup']) {
        playerRef.current.y = Math.max(20, playerRef.current.y - playerStats.moveSpeed);
      }
      if (keysRef.current['s'] || keysRef.current['arrowdown']) {
        playerRef.current.y = Math.min(config.canvas.height - 20, playerRef.current.y + playerStats.moveSpeed);
      }

      if (timestamp - lastShotRef.current > playerStats.shootInterval) {
        playerBulletsRef.current.push({
          x: playerRef.current.x,
          y: playerRef.current.y - 20,
          vx: 0,
          vy: -playerStats.bulletSpeed,
          radius: playerStats.bulletRadius,
          color: playerStats.bulletColor,
        });
        lastShotRef.current = timestamp;
      }

      playerBulletsRef.current = playerBulletsRef.current.filter((bullet) => {
        bullet.y += bullet.vy;
        if (bullet.y < 0) return false;

        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      bossRef.current.x =
        config.canvas.width / 2 +
        Math.sin(timestamp * config.boss.moveSpeed) * config.boss.horizontalAmplitude;

      if (timestamp - lastBossShotRef.current > config.boss.shootInterval) {
        const attackContext: BossAttackContext = {
          timestamp,
          delta,
          config,
          levelState: levelStateRef,
          bossRef,
          playerRef,
          spawnBullet: (bullet) => bossBulletsRef.current.push(bullet),
          registerBomb: (bomb) => {
            bombsRef.current.set(bomb.id, { ...bomb, startTime: timestamp });
            config.effects?.onBombRegister?.(bomb);
          },
          updateBomb: () => undefined,
          explodeBomb: () => undefined,
        };
        bossAttack(attackContext);
        lastBossShotRef.current = timestamp;
      }

      const laserConfig = config.boss.laser;
      if (laserConfig && timestamp - lastLaserRef.current > laserConfig.interval) {
        const width = config.boss.size * (laserConfig.widthRatio ?? 0.8);
        lasersRef.current.push({
          x: bossRef.current.x - width / 2,
          y: bossRef.current.y + config.boss.size * 0.8,
          width,
          height: config.canvas.height - bossRef.current.y - config.boss.size * 0.8,
          active: true,
          duration: laserConfig.duration,
          timer: 0,
        });
        lastLaserRef.current = timestamp;
      }

      lasersRef.current = lasersRef.current.filter((laser) => {
        laser.timer += delta;
        if (laser.timer < (laserConfig?.duration ?? 0)) {
          laserPattern({
            timestamp,
            delta,
            config,
            levelState: levelStateRef,
            bossRef,
            lasersRef,
          });

          ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
          ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
          ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
          ctx.fillRect(laser.x + 10, laser.y, laser.width - 20, laser.height);
          return true;
        }
        return false;
      });

      if (timestamp - lastMinionSpawnRef.current > config.minions.spawnInterval) {
        for (let i = 0; i < config.minions.spawnCount; i++) {
          const horizontalOffset = (i - Math.floor(config.minions.spawnCount / 2)) * config.minions.horizontalSpacing;
          minionsRef.current.push({
            x: bossRef.current.x + horizontalOffset,
            y: bossRef.current.y + config.boss.size * 0.8 + 20,
            vx: 0,
            vy: config.minions.moveSpeed,
            radius: 15,
            health: config.minions.maxHealth,
            maxHealth: config.minions.maxHealth,
            lastShotTime: timestamp,
            horizontalOffset,
          });
        }
        lastMinionSpawnRef.current = timestamp;
      }

      minionsRef.current = minionsRef.current.filter((minion) => {
        const bossPatternX =
          config.canvas.width / 2 +
          Math.sin(timestamp * config.boss.moveSpeed) * config.boss.horizontalAmplitude;
        minion.x = bossPatternX + minion.horizontalOffset;
        minion.y += minion.vy;
        if (minion.y > config.canvas.height || minion.x < 0 || minion.x > config.canvas.width) {
          return false;
        }

        if (timestamp - minion.lastShotTime > config.minions.shootInterval) {
          const minionContext: MinionAttackContext = {
            timestamp,
            delta,
            config,
            levelState: levelStateRef,
            minion,
            spawnBullet: (bullet) => minionBulletsRef.current.push(bullet),
          };
          minionAttack(minionContext);
          minion.lastShotTime = timestamp;
        }

        ctx.fillStyle = minionColor;
        ctx.beginPath();
        ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = minionAccent;
        ctx.lineWidth = 2;
        ctx.stroke();

        return true;
      });
      minionCountRef.current = minionsRef.current.length;

      minionBulletsRef.current = minionBulletsRef.current.filter((bullet) => {
        bullet.y += bullet.vy;
        if (bullet.y > config.canvas.height || bullet.x < 0 || bullet.x > config.canvas.width) {
          return false;
        }

        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      bossBulletsRef.current = bossBulletsRef.current.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        if (bullet.y > config.canvas.height || bullet.x < 0 || bullet.x > config.canvas.width) {
          return false;
        }

        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Draw other players (multiplayer) - draw before current player
      otherPlayers.forEach((otherPlayer) => {
        if (otherPlayer.discordId === currentPlayerId) return; // Skip self
        
        ctx.globalAlpha = 1.0;
        // Draw other player ship
        ctx.fillStyle = '#8888ff'; // Different color for other players
        ctx.beginPath();
        ctx.moveTo(otherPlayer.position.x, otherPlayer.position.y - 15);
        ctx.lineTo(otherPlayer.position.x - 10, otherPlayer.position.y + 10);
        ctx.lineTo(otherPlayer.position.x, otherPlayer.position.y + 5);
        ctx.lineTo(otherPlayer.position.x + 10, otherPlayer.position.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4444ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw other player name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(otherPlayer.name, otherPlayer.position.x, otherPlayer.position.y - 25);
        ctx.textAlign = 'left';
      });

      // Draw current player
      const isInvincible = timestamp - lastDamageTimeRef.current < invincibilityTime;
      const alpha = isInvincible && Math.floor(timestamp / 100) % 2 === 0 ? 0.5 : 1.0;
      ctx.globalAlpha = alpha;

      const image = playerImageRef.current;
      const desiredWidth = 140;
      const aspectRatio = playerSprite.width ? playerSprite.height / playerSprite.width : 1;
      const shipWidth = desiredWidth;
      const shipHeight = desiredWidth * aspectRatio;
      if (image) {
        ctx.save();
        ctx.translate(playerRef.current.x, playerRef.current.y);
        ctx.rotate((Math.sin(timestamp / 500) * Math.PI) / 32);
        ctx.drawImage(image, -shipWidth / 2, -shipHeight / 2, shipWidth, shipHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.moveTo(playerRef.current.x, playerRef.current.y - 15);
        ctx.lineTo(playerRef.current.x - 10, playerRef.current.y + 10);
        ctx.lineTo(playerRef.current.x, playerRef.current.y + 5);
        ctx.lineTo(playerRef.current.x + 10, playerRef.current.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#00cc00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Sync position to API (multiplayer mode)
      if (onPositionUpdate && currentPlayerId) {
        const now = Date.now();
        // Update position every 200ms
        if (now - lastPositionUpdateRef.current > 200) {
          lastPositionUpdateRef.current = now;
          onPositionUpdate(
            { x: playerRef.current.x, y: playerRef.current.y },
            playerHealthRef.current
          );
        }
      }

      ctx.fillStyle = bossColor;
      ctx.fillRect(
        bossRef.current.x - config.boss.size / 2,
        bossRef.current.y,
        config.boss.size,
        config.boss.size * 0.8
      );
      ctx.strokeStyle = bossAccent;
      ctx.lineWidth = 4;
      ctx.strokeRect(
        bossRef.current.x - config.boss.size / 2,
        bossRef.current.y,
        config.boss.size,
        config.boss.size * 0.8
      );

      if (config.boss.shield && minionCountRef.current > 0) {
        ctx.save();
        ctx.strokeStyle = config.boss.shield.color ?? 'rgba(0, 200, 255, 0.7)';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(
          bossRef.current.x,
          bossRef.current.y + (config.boss.size * 0.4),
          config.boss.shield.radius,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();
      }

      if (timestamp - lastBossShotRef.current < config.boss.shootInterval) {
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(
          bossRef.current.x - config.boss.size * 0.3,
          bossRef.current.y + config.boss.size * 0.15,
          config.boss.size * 0.6,
          config.boss.size * 0.3
        );
        ctx.fillRect(
          bossRef.current.x - config.boss.size * 0.2,
          bossRef.current.y + config.boss.size * 0.5,
          config.boss.size * 0.4,
          config.boss.size * 0.2
        );
      }

      const bossBarWidth = 200;
      const bossBarHeight = 12;
      const bossBarX = config.canvas.width / 2 - bossBarWidth / 2;
      const bossBarY = 30; // Increased from 10 to 30 to prevent text cutoff
      ctx.fillStyle = '#330000';
      ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(bossBarX + 2, bossBarY + 2, bossBarWidth - 4, bossBarHeight - 4);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        bossBarX + 2,
        bossBarY + 2,
        (bossHealthRef.current / config.boss.maxHealth) * (bossBarWidth - 4),
        bossBarHeight - 4
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', config.canvas.width / 2, bossBarY - 8); // Adjusted to bossBarY - 8 for better spacing
      ctx.textAlign = 'left';

      // Sync external boss HP if provided (multiplayer mode) - update every frame
      if (externalBossHp !== undefined) {
        bossHealthRef.current = externalBossHp;
      }

      playerBulletsRef.current = playerBulletsRef.current.filter((bullet) => {
        const dist = Math.hypot(bullet.x - bossRef.current.x, bullet.y - bossRef.current.y);
        if (dist < config.boss.size / 2 + bullet.radius) {
          const damage = playerStats.attackPowerBoss;
          
          if (onBossDamage) {
            // Multiplayer mode: send damage to API
            accumulatedDamageRef.current += damage;
            const now = Date.now();
            // Throttle API calls - sync every 500ms
            if (now - lastDamageSyncRef.current > 500) {
              const totalDamage = accumulatedDamageRef.current;
              accumulatedDamageRef.current = 0;
              lastDamageSyncRef.current = now;
              onBossDamage(totalDamage).catch(console.error);
            }
          } else {
            // Solo mode: local damage
            bossHealthRef.current -= damage;
          }
          
          if (bossHealthRef.current <= 0 || (externalBossHp !== undefined && externalBossHp <= 0)) {
            console.log('🔥 Boss HP reached 0!', {
              bossHealthRef: bossHealthRef.current,
              externalBossHp,
              hasCallback: !!onBossDefeated,
            });
            if (onBossDefeated) {
              console.log('🎯 Calling onBossDefeated callback');
              onBossDefeated();
            } else {
              console.log('⚠️ No onBossDefeated callback, setting victory state');
              setGameState('victory');
            }
          }
          return false;
        }
        return true;
      });

      playerBulletsRef.current = playerBulletsRef.current.filter((bullet) => {
        let hit = false;
        minionsRef.current = minionsRef.current.filter((minion) => {
          const dist = Math.hypot(bullet.x - minion.x, bullet.y - minion.y);
          if (dist < minion.radius + bullet.radius) {
            minion.health -= playerStats.attackPowerMinion;
            hit = true;
            return minion.health > 0;
          }
          return true;
        });
        return !hit;
      });

      bossBulletsRef.current = bossBulletsRef.current.filter((bullet) => {
        const dist = Math.hypot(bullet.x - playerRef.current.x, bullet.y - playerRef.current.y);
        if (dist < 15 + bullet.radius && timestamp - lastDamageTimeRef.current > invincibilityTime) {
          playerHealthRef.current = Math.max(0, playerHealthRef.current - config.damage.bossBullet);
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            if (onPlayerDefeated) {
              onPlayerDefeated();
            } else {
              setGameState('gameover');
            }
          }
          return false;
        }
        return true;
      });

      if (bombsRef.current.size > 0) {
        const bombsToRemove: string[] = [];
        bombsRef.current.forEach((bomb, id) => {
          const start = bomb.startTime ?? timestamp;
          const elapsedMs = timestamp - start;
          const dt = delta / 16;

          if (!bomb.triggered) {
            const settleFrame = bomb.settleFrame ?? 140;
            if (elapsedMs < settleFrame * 16) {
              bomb.x += bomb.vx * dt;
              bomb.y += bomb.vy * dt;
              const air = Math.pow(bomb.airResistance ?? 0.99, dt);
              bomb.vx *= air;
              bomb.vy = bomb.vy * air + (bomb.gravity ?? 0.12) * dt;
            } else {
              const settle = Math.pow(bomb.settleResistance ?? 0.9, dt);
              bomb.vx *= settle;
              bomb.vy *= settle;
              bomb.x += bomb.vx * dt;
              bomb.y += bomb.vy * dt;
            }
            if (bomb.targetY !== undefined && bomb.y >= bomb.targetY) {
              bomb.y = bomb.targetY;
              bomb.vy = 0;
              bomb.vx *= bomb.settleResistance ?? 0.9;
            }
          }

          const timeLeft = bomb.triggerTime - timestamp;
          const normalized = Math.max(0, Math.min(1, timeLeft / 1000));
          const pulse = 0.75 + 0.25 * Math.sin(timestamp / 100);
          const radius = bomb.radius * (0.55 + 0.45 * pulse * (1 - normalized));

          const color = bomb.color ?? '#ffcf41';
          ctx.save();
          ctx.globalAlpha = 0.35 + 0.45 * (1 - normalized);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(bomb.x, bomb.y, radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.arc(bomb.x, bomb.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (timestamp >= bomb.triggerTime && !bomb.triggered) {
            bomb.triggered = true;
            bombsToRemove.push(id);
            const dist = Math.hypot(bomb.x - playerRef.current.x, bomb.y - playerRef.current.y);
            if (dist < bomb.radius && timestamp - lastDamageTimeRef.current > invincibilityTime) {
          playerHealthRef.current = Math.max(0, playerHealthRef.current - bomb.damage);
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
              if (playerHealthRef.current <= 0) {
                if (onPlayerDefeated) {
                  onPlayerDefeated();
                } else {
                  setGameState('gameover');
                }
              }
            }

            const shards = bomb.shrapnelCount ?? 0;
            const speed = bomb.shrapnelSpeed ?? 0;
            if (shards > 0 && speed > 0) {
              for (let i = 0; i < shards; i++) {
                const angle = (Math.PI * 2 * i) / shards;
                bossBulletsRef.current.push({
                  x: bomb.x,
                  y: bomb.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  radius: 4,
                  color: bomb.shrapnelColor ?? '#ffe98a',
                });
              }
            }
          }
        });

        bombsToRemove.forEach((id) => bombsRef.current.delete(id));
      }

      lasersRef.current.forEach((laser) => {
        if (
          playerRef.current.x > laser.x &&
          playerRef.current.x < laser.x + laser.width &&
          playerRef.current.y < laser.y + laser.height &&
          playerRef.current.y > laser.y &&
          timestamp - lastDamageTimeRef.current > 100
        ) {
          playerHealthRef.current = Math.max(0, playerHealthRef.current - config.damage.bossLaser);
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            if (onPlayerDefeated) {
              onPlayerDefeated();
            } else {
              setGameState('gameover');
            }
          }
        }
      });

      minionBulletsRef.current = minionBulletsRef.current.filter((bullet) => {
        const dist = Math.hypot(bullet.x - playerRef.current.x, bullet.y - playerRef.current.y);
        if (dist < 15 + bullet.radius && timestamp - lastDamageTimeRef.current > invincibilityTime) {
          playerHealthRef.current = Math.max(0, playerHealthRef.current - config.damage.minion);
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            if (onPlayerDefeated) {
              onPlayerDefeated();
            } else {
              setGameState('gameover');
            }
          }
          return false;
        }
        return true;
      });

      minionsRef.current = minionsRef.current.filter((minion) => {
        const dist = Math.hypot(minion.x - playerRef.current.x, minion.y - playerRef.current.y);
        if (dist < minion.radius + 15 && timestamp - lastDamageTimeRef.current > invincibilityTime) {
          playerHealthRef.current = Math.max(0, playerHealthRef.current - config.damage.minion);
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            if (onPlayerDefeated) {
              onPlayerDefeated();
            } else {
              setGameState('gameover');
            }
          }
          return false;
        }
        return true;
      });


      // Draw player health bar - ensure health is synced
      const currentHealth = Math.max(0, Math.min(playerHealthRef.current, playerStats.maxHealth));
      const playerBarWidth = 200;
      const playerBarHeight = 12;
      const playerBarX = config.canvas.width / 2 - playerBarWidth / 2;
      const playerBarY = config.canvas.height - 30;
      ctx.fillStyle = '#003300';
      ctx.fillRect(playerBarX, playerBarY, playerBarWidth, playerBarHeight);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(playerBarX + 2, playerBarY + 2, playerBarWidth - 4, playerBarHeight - 4);
      ctx.fillStyle = '#00ff00';
      const healthPercentage = currentHealth / playerStats.maxHealth;
      ctx.fillRect(
        playerBarX + 2,
        playerBarY + 2,
        healthPercentage * (playerBarWidth - 4),
        playerBarHeight - 4
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerBarX, playerBarY, playerBarWidth, playerBarHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`PLAYER ${Math.ceil(currentHealth)}/${playerStats.maxHealth}`, config.canvas.width / 2, playerBarY - 5);
      ctx.textAlign = 'left';

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, gameState, playerStats]);

  useEffect(() => {
    if (gameState !== 'countdown') return;

    resetLevelState();
    setCountdown(COUNTDOWN_START);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Calculate scale to fill viewport while maintaining aspect ratio
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const canvasWidth = config.canvas.width;
      const canvasHeight = config.canvas.height;
      
      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [config.canvas.width, config.canvas.height]);

  return (
    <main ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={config.canvas.width}
        height={config.canvas.height}
        className="block"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          imageRendering: 'pixelated'
        }}
      />

      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
          <p className="mb-4 text-lg uppercase tracking-widest text-white/60">Get Ready</p>
          <p className="text-7xl font-extrabold">{countdown || 'GO!'}</p>
        </div>
      )}

      {gameState === 'victory' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-8">
          <h1 className="text-5xl font-extrabold mb-4 text-yellow-400 drop-shadow-lg">Victory!</h1>
          <p className="text-lg mb-6 text-white/80">You defeated the boss.</p>
          <button
            onClick={() => setGameState('countdown')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Play Again
          </button>
          <button
            onClick={() => {
              if (!winRewardedRef.current) {
                config.onLevelComplete?.();
                winRewardedRef.current = true;
              }
            }}
            className="mt-3 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            Return to Level Select
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-8">
          <h1 className="text-5xl font-extrabold mb-4 text-red-400 drop-shadow-lg">Game Over</h1>
          <p className="text-lg mb-6 text-white/80">Your ship was destroyed.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setGameState('countdown')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Retry Level
            </button>
            <button
              onClick={() => {
                config.onPlayerDefeated?.();
              }}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Return to Level Select
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
