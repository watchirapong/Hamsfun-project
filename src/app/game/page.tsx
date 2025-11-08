'use client';

import { useEffect, useRef, useState } from 'react';
import { Player } from './Player';

interface Vector2 {
  x: number;
  y: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Minion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  lastShotTime: number;
  horizontalOffset: number; // Offset from boss center to maintain pattern
}

interface Laser {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  duration: number;
  timer: number;
}

export default function Game() {
  // Player stats are now imported from Player class (see ./Player.ts)
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [health, setHealth] = useState(Player.MAX_HEALTH);
  
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const playerRef = useRef<Vector2>({ x: 0, y: 0 });
  const playerHealthRef = useRef<number>(Player.MAX_HEALTH); // Initial player health
  const playerBulletsRef = useRef<Bullet[]>([]);
  const bossRef = useRef<Vector2>({ x: 0, y: 0 });
  // ========== BOSS STATS ==========
  const BOSS_MAX_HEALTH = 300; // Maximum boss health (also update in health bar calculation and startGame)
  const bossHealthRef = useRef<number>(BOSS_MAX_HEALTH); // Initial boss health
  // ========== BOSS ATTACK POWER / DAMAGE: Change all boss move set damage here ==========
  /** Damage dealt to player when hit by boss bullet */
  const BOSS_BULLET_DAMAGE = 5;
  const BOSS_LASER_DAMAGE = 1;
  const MINION_COLLISION_DAMAGE = 10;
  
  const bossBulletsRef = useRef<Bullet[]>([]);
  const minionsRef = useRef<Minion[]>([]);
  const minionBulletsRef = useRef<Bullet[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const lastShotRef = useRef<number>(0);
  const lastBossShotRef = useRef<number>(0);
  const lastMinionSpawnRef = useRef<number>(0);
  const lastLaserRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const playerInitializedRef = useRef<boolean>(false);
  const lastDamageTimeRef = useRef<number>(0);
  const INVINCIBILITY_TIME = 500; // ms

  const CANVAS_WIDTH = 1366;
  const CANVAS_HEIGHT = 768;
  // Player stats are now imported from Player class
  const BOSS_BULLET_SPEED = 2;
  const BOSS_SHOOT_INTERVAL = 800;
  const MINION_SPAWN_INTERVAL = 5000;
  const MINION_SHOOT_INTERVAL = 1000; // Minions shoot slower than player
  const MINION_HORIZONTAL_SPACING = 120; // Horizontal distance between minions
  const MINION_BULLET_SPEED = 5; // Slightly slower than player bullets
  const LASER_INTERVAL = 5000;
  const LASER_DURATION = 2000;
  const BOSS_SIZE = 100; // Bigger boss ship
  const BOSS_MOVE_SPEED = 0.0005; // Slower boss movement (multiplier for sine wave)
  const BOSS_HORIZONTAL_AMPLITUDE = CANVAS_WIDTH * 0.25; // Boss movement amplitude scales with canvas width

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize player position only once
    if (!playerInitializedRef.current || gameState === 'menu') {
      playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 };
      // Player health is now imported from Player class
      playerHealthRef.current = Player.MAX_HEALTH;
      bossRef.current = { x: CANVAS_WIDTH / 2, y: 60 }; // Boss moved up
      // ========== BOSS HEALTH: Set initial health ==========
      bossHealthRef.current = BOSS_MAX_HEALTH;
      playerInitializedRef.current = true;
    }

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw stars background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % CANVAS_WIDTH;
        const y = (i * 53 + timestamp / 10) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 2, 2);
      }

      // Update player position (using Player.MOVE_SPEED from Player class)
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        playerRef.current.x = Math.max(20, playerRef.current.x - Player.MOVE_SPEED);
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        playerRef.current.x = Math.min(CANVAS_WIDTH - 20, playerRef.current.x + Player.MOVE_SPEED);
      }
      if (keysRef.current['w'] || keysRef.current['arrowup']) {
        playerRef.current.y = Math.max(20, playerRef.current.y - Player.MOVE_SPEED);
      }
      if (keysRef.current['s'] || keysRef.current['arrowdown']) {
        playerRef.current.y = Math.min(CANVAS_HEIGHT - 20, playerRef.current.y + Player.MOVE_SPEED);
      }

      // Auto-shoot player bullets (using Player class properties)
      if (timestamp - lastShotRef.current > Player.SHOOT_INTERVAL) {
        playerBulletsRef.current.push({
          x: playerRef.current.x,
          y: playerRef.current.y - 20,
          vx: 0,
          vy: -Player.BULLET_SPEED,
          radius: Player.BULLET_RADIUS,
          color: Player.BULLET_COLOR,
        });
        lastShotRef.current = timestamp;
      }

      // Update and draw player bullets
      playerBulletsRef.current = playerBulletsRef.current.filter((bullet) => {
        bullet.y += bullet.vy;
        if (bullet.y < 0) return false;

        // Draw bullet
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Boss movement (sinusoidal pattern - slower)
      bossRef.current.x = CANVAS_WIDTH / 2 + Math.sin(timestamp * BOSS_MOVE_SPEED) * BOSS_HORIZONTAL_AMPLITUDE;

      // Boss shoots bullets (downward with horizontal spread, not aiming at player)
      if (timestamp - lastBossShotRef.current > BOSS_SHOOT_INTERVAL) {
        for (let i = -2; i <= 2; i++) {
          bossBulletsRef.current.push({
            x: bossRef.current.x + i * (BOSS_SIZE * 0.25),
            y: bossRef.current.y + BOSS_SIZE * 0.8,
            vx: i * 1.5, // Horizontal spread based on bullet position
            vy: BOSS_BULLET_SPEED, // Move straight down
            radius: 6,
            color: '#ff0066',
          });
        }
        lastBossShotRef.current = timestamp;
      }

      // Boss shoots laser
      if (timestamp - lastLaserRef.current > LASER_INTERVAL) {
        const laserWidth = BOSS_SIZE * 0.8;
        lasersRef.current.push({
          x: bossRef.current.x - laserWidth / 2,
          y: bossRef.current.y + BOSS_SIZE * 0.8,
          width: laserWidth,
          height: CANVAS_HEIGHT - bossRef.current.y - BOSS_SIZE * 0.8,
          active: true,
          duration: LASER_DURATION,
          timer: 0,
        });
        lastLaserRef.current = timestamp;
      }

      // Update lasers (follow boss movement)
      lasersRef.current = lasersRef.current.filter((laser) => {
        laser.timer += 16;
        if (laser.timer < laser.duration) {
          // Update laser position to follow boss
          const laserWidth = BOSS_SIZE * 0.8;
          laser.x = bossRef.current.x - laserWidth / 2;
          laser.y = bossRef.current.y + BOSS_SIZE * 0.8;
          laser.height = CANVAS_HEIGHT - bossRef.current.y - BOSS_SIZE * 0.8;
          
          // Draw laser
          ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
          ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
          ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
          ctx.fillRect(laser.x + 10, laser.y, laser.width - 20, laser.height);
          return true;
        }
        return false;
      });

      // Spawn minions
      if (timestamp - lastMinionSpawnRef.current > MINION_SPAWN_INTERVAL) {
        for (let i = 0; i < 3; i++) {
          const horizontalOffset = (i - 1) * MINION_HORIZONTAL_SPACING; // Offset from boss center
          minionsRef.current.push({
            x: bossRef.current.x + horizontalOffset,
            y: bossRef.current.y + BOSS_SIZE * 0.8 + 20,
            vx: 0, // Horizontal movement will be calculated based on boss pattern
            vy: 1.5, // Constant downward speed
            radius: 15,
            health: 30,
            maxHealth: 30,
            lastShotTime: timestamp, // Initialize shot timer
            horizontalOffset: horizontalOffset, // Store offset to maintain pattern
          });
        }
        lastMinionSpawnRef.current = timestamp;
      }

      // Update and draw minions (follow boss horizontal pattern)
      minionsRef.current = minionsRef.current.filter((minion) => {
        // Calculate target x position based on boss pattern + minion's offset
        const bossPatternX = CANVAS_WIDTH / 2 + Math.sin(timestamp * BOSS_MOVE_SPEED) * BOSS_HORIZONTAL_AMPLITUDE;
        const targetX = bossPatternX + minion.horizontalOffset;
        
        // Move minion horizontally towards target (smooth following)
        minion.x = targetX;
        
        // Move minion downward
        minion.y += minion.vy;
        if (minion.y > CANVAS_HEIGHT || minion.x < 0 || minion.x > CANVAS_WIDTH) {
          return false;
        }

        // Minions shoot bullets (slower than player)
        if (timestamp - minion.lastShotTime > MINION_SHOOT_INTERVAL) {
          minionBulletsRef.current.push({
            x: minion.x,
            y: minion.y + minion.radius,
            vx: 0,
            vy: MINION_BULLET_SPEED,
            radius: 3,
            color: '#ffaa00',
          });
          minion.lastShotTime = timestamp;
        }

        // Draw minion
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.stroke();

        return true;
      });

      // Update and draw minion bullets
      minionBulletsRef.current = minionBulletsRef.current.filter((bullet) => {
        bullet.y += bullet.vy;
        if (bullet.y > CANVAS_HEIGHT || bullet.x < 0 || bullet.x > CANVAS_WIDTH) {
          return false;
        }

        // Draw minion bullet
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Update and draw boss bullets
      bossBulletsRef.current = bossBulletsRef.current.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        if (bullet.y > CANVAS_HEIGHT || bullet.x < 0 || bullet.x > CANVAS_WIDTH) {
          return false;
        }

        // Draw bullet
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Draw player (flash when invincible)
      const isInvincible = timestamp - lastDamageTimeRef.current < INVINCIBILITY_TIME;
      const alpha = isInvincible && Math.floor(timestamp / 100) % 2 === 0 ? 0.5 : 1.0;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00ff00';
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
      ctx.globalAlpha = 1.0;

      // Draw boss (bigger size)
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        bossRef.current.x - BOSS_SIZE / 2,
        bossRef.current.y,
        BOSS_SIZE,
        BOSS_SIZE * 0.8
      );
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        bossRef.current.x - BOSS_SIZE / 2,
        bossRef.current.y,
        BOSS_SIZE,
        BOSS_SIZE * 0.8
      );

      // Boss details (scaled to new size)
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(bossRef.current.x - BOSS_SIZE * 0.3, bossRef.current.y + BOSS_SIZE * 0.15, BOSS_SIZE * 0.6, BOSS_SIZE * 0.3);
      ctx.fillRect(bossRef.current.x - BOSS_SIZE * 0.2, bossRef.current.y + BOSS_SIZE * 0.5, BOSS_SIZE * 0.4, BOSS_SIZE * 0.2);

      // Boss health bar (fixed at top)
      const bossBarWidth = 200;
      const bossBarHeight = 12;
      const bossBarX = CANVAS_WIDTH / 2 - bossBarWidth / 2;
      const bossBarY = 10;
      ctx.fillStyle = '#330000';
      ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(bossBarX + 2, bossBarY + 2, bossBarWidth - 4, bossBarHeight - 4);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        bossBarX + 2,
        bossBarY + 2,
        // ========== BOSS HEALTH: Update max health in health bar calculation ==========
        (bossHealthRef.current / BOSS_MAX_HEALTH) * (bossBarWidth - 4),
        bossBarHeight - 4
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
      
      // Boss health text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', CANVAS_WIDTH / 2, bossBarY - 5);
      ctx.textAlign = 'left';

      // Collision detection: Player bullets vs Boss
      playerBulletsRef.current = playerBulletsRef.current.filter((bullet) => {
        const dist = Math.sqrt(
          Math.pow(bullet.x - bossRef.current.x, 2) +
          Math.pow(bullet.y - bossRef.current.y, 2)
        );
        if (dist < BOSS_SIZE / 2 + bullet.radius) {
          // Player attack power is now imported from Player class
          bossHealthRef.current -= Player.ATTACK_POWER_BOSS;
          if (bossHealthRef.current <= 0) {
            setGameState('gameover');
          }
          return false;
        }
        return true;
      });

      // Collision detection: Player bullets vs Minions
      playerBulletsRef.current = playerBulletsRef.current.filter((bullet) => {
        let hit = false;
        minionsRef.current = minionsRef.current.filter((minion) => {
          const dist = Math.sqrt(
            Math.pow(bullet.x - minion.x, 2) + Math.pow(bullet.y - minion.y, 2)
          );
          if (dist < minion.radius + bullet.radius) {
            // Player attack power is now imported from Player class
            minion.health -= Player.ATTACK_POWER_MINION;
            hit = true;
            if (minion.health <= 0) {
              return false;
            }
            return true;
          }
          return true;
        });
        return !hit;
      });

      // Collision detection: Boss bullets vs Player
      bossBulletsRef.current = bossBulletsRef.current.filter((bullet) => {
        const dist = Math.sqrt(
          Math.pow(bullet.x - playerRef.current.x, 2) +
          Math.pow(bullet.y - playerRef.current.y, 2)
        );
        if (dist < 15 + bullet.radius && timestamp - lastDamageTimeRef.current > INVINCIBILITY_TIME) {
          // Boss bullet damage is now defined at the top of the component
          playerHealthRef.current -= BOSS_BULLET_DAMAGE;
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            setGameState('gameover');
          }
          return false; // Remove bullet after hit
        }
        return true;
      });

      // Collision detection: Lasers vs Player
      lasersRef.current.forEach((laser) => {
        if (
          playerRef.current.x > laser.x &&
          playerRef.current.x < laser.x + laser.width &&
          playerRef.current.y < laser.y + laser.height &&
          playerRef.current.y > laser.y &&
          timestamp - lastDamageTimeRef.current > 100 // Faster damage for lasers but still limited
        ) {
          // Boss laser damage is now defined at the top of the component
          playerHealthRef.current -= BOSS_LASER_DAMAGE;
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            setGameState('gameover');
          }
        }
      });

      // Collision detection: Minion bullets vs Player
      minionBulletsRef.current = minionBulletsRef.current.filter((bullet) => {
        const dist = Math.sqrt(
          Math.pow(bullet.x - playerRef.current.x, 2) +
          Math.pow(bullet.y - playerRef.current.y, 2)
        );
        if (dist < 15 + bullet.radius && timestamp - lastDamageTimeRef.current > INVINCIBILITY_TIME) {
          // Minion bullet damage (same as minion collision for consistency)
          playerHealthRef.current -= MINION_COLLISION_DAMAGE;
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            setGameState('gameover');
          }
          return false; // Remove bullet after hit
        }
        return true;
      });

      // Collision detection: Minions vs Player
      minionsRef.current = minionsRef.current.filter((minion) => {
        const dist = Math.sqrt(
          Math.pow(minion.x - playerRef.current.x, 2) +
          Math.pow(minion.y - playerRef.current.y, 2)
        );
        if (dist < minion.radius + 15 && timestamp - lastDamageTimeRef.current > INVINCIBILITY_TIME) {
          // Minion collision damage is now defined at the top of the component
          playerHealthRef.current -= MINION_COLLISION_DAMAGE;
          setHealth(playerHealthRef.current);
          lastDamageTimeRef.current = timestamp;
          if (playerHealthRef.current <= 0) {
            setGameState('gameover');
          }
          return false; // Remove minion after collision
        }
        return true;
      });

      // Player health bar (fixed at bottom)
      const playerBarWidth = 200;
      const playerBarHeight = 12;
      const playerBarX = CANVAS_WIDTH / 2 - playerBarWidth / 2;
      const playerBarY = CANVAS_HEIGHT - 30;
      ctx.fillStyle = '#003300';
      ctx.fillRect(playerBarX, playerBarY, playerBarWidth, playerBarHeight);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(playerBarX + 2, playerBarY + 2, playerBarWidth - 4, playerBarHeight - 4);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        playerBarX + 2,
        playerBarY + 2,
        // Player max health is now imported from Player class
        (playerHealthRef.current / Player.MAX_HEALTH) * (playerBarWidth - 4),
        playerBarHeight - 4
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerBarX, playerBarY, playerBarWidth, playerBarHeight);
      
      // Player health text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PLAYER', CANVAS_WIDTH / 2, playerBarY - 5);
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
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    // Player health is now imported from Player class
    setHealth(Player.MAX_HEALTH);
    playerHealthRef.current = Player.MAX_HEALTH;
    // ========== BOSS HEALTH: Reset boss health on game start ==========
    bossHealthRef.current = BOSS_MAX_HEALTH;
    bossRef.current = { x: CANVAS_WIDTH / 2, y: 60 }; // Boss moved up
    playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 };
    playerBulletsRef.current = [];
    bossBulletsRef.current = [];
    minionsRef.current = [];
    minionBulletsRef.current = [];
    lasersRef.current = [];
    lastShotRef.current = 0;
    lastBossShotRef.current = 0;
    lastMinionSpawnRef.current = 0;
    lastLaserRef.current = 0;
    lastDamageTimeRef.current = 0;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black">
      <div className="flex flex-col items-center">
        {gameState === 'menu' && (
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white mb-4">Bullet Hell Game</h1>
            <p className="text-white mb-4">Controls: WASD or Arrow Keys to move</p>
            <p className="text-white mb-4">Your ship shoots automatically!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white mb-4">
              {bossHealthRef.current <= 0 ? 'Victory!' : 'Game Over'}
            </h1>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Play Again
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-white"
        />
      </div>
    </main>
  );
}
