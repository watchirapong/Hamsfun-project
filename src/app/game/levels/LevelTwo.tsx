'use client';

import { useMemo } from 'react';
import GameEngine from '../engine/GameEngine';
import type { LevelConfig, BossAttackPattern } from '../engine/types';
import type { PlayerStats } from '../Player';

const CANVAS_WIDTH = 1366;
const CANVAS_HEIGHT = 768;

const levelTwoBossAttack: BossAttackPattern = ({
  bossRef,
  config,
  spawnBullet,
  levelState,
  registerBomb,
  timestamp,
}) => {
  const colorPrimary = config.colors?.bossBullet ?? '#ff80b3';
  const bombColor = '#ffcf41';

  const stateStore = levelState.current as Record<string, unknown>;
  const state = (stateStore.levelTwo as { shot: number } | undefined) ?? { shot: 0 };
  state.shot += 1;
  stateStore.levelTwo = state;

  const { boss } = config;
  if (state.shot % 4 === 0) {
    for (let i = -1; i <= 1; i++) {
      const id = `bomb-${Date.now()}-${Math.random()}`;
      const initialVx = i * 1.6;
      const initialVy = boss.bulletSpeed + 1.8;
      const targetY = CANVAS_HEIGHT * (0.45 + Math.random() * 0.35);
      registerBomb?.({
        id,
        x: bossRef.current.x + i * (boss.size * 0.5),
        y: bossRef.current.y + boss.size * 0.92,
        vx: initialVx,
        vy: initialVy,
        triggerTime: timestamp + 3200 + Math.random() * 400,
        radius: 140,
        damage: 16,
        color: bombColor,
        gravity: 0.045,
        airResistance: 0.996,
        settleResistance: 0.97,
        settleFrame: 240,
        targetY,
        shrapnelCount: 16,
        shrapnelSpeed: 1.8,
        shrapnelColor: '#ffe98a',
      });
    }
  } else {
    for (let i = -3; i <= 3; i++) {
      spawnBullet({
        x: bossRef.current.x + i * 14,
        y: bossRef.current.y + boss.size * 0.6,
        vx: i * 1.35,
        vy: boss.bulletSpeed + Math.abs(i) * 0.4,
        radius: 6,
        color: colorPrimary,
      });
    }
  }
};

const levelTwoConfig: LevelConfig = {
  id: 'level-2',
  name: 'Bullet Hell - Level 2',
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#070022',
    starCount: 65,
  },
  player: {
    startPosition: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 },
    invincibilityTime: 500,
  },
  boss: {
    maxHealth: 360,
    startPosition: { x: CANVAS_WIDTH / 2, y: 60 },
    size: 110,
    moveSpeed: 0.00055,
    horizontalAmplitude: CANVAS_WIDTH * 0.28,
    bulletSpeed: 3,
    shootInterval: 1500,
    attackPattern: levelTwoBossAttack,
  },
  minions: {
    spawnInterval: Number.MAX_SAFE_INTEGER,
    spawnCount: 0,
    horizontalSpacing: 0,
    moveSpeed: 0,
    shootInterval: Number.MAX_SAFE_INTEGER,
    bulletSpeed: 0,
    maxHealth: 0,
  },
  damage: {
    bossBullet: 6,
    bossLaser: 0,
    minion: 0,
  },
  colors: {
    boss: '#ff3366',
    bossAccent: '#b81f4a',
    bossBullet: '#ff6699',
    minion: '#f7c844',
    minionAccent: '#c59c28',
    minionBullet: '#f7c844',
    player: '#00ffcc',
    background: '#040015',
  },
};

interface LevelProps {
  playerStats: PlayerStats;
  onLevelComplete?: () => void;
  onPlayerDefeated?: () => void;
}

export default function LevelTwo({ playerStats, onLevelComplete, onPlayerDefeated }: LevelProps) {
  const config = useMemo<LevelConfig>(
    () => ({
      ...levelTwoConfig,
      onLevelComplete,
      onPlayerDefeated,
    }),
    [onLevelComplete, onPlayerDefeated],
  );

  return <GameEngine config={config} playerStats={playerStats} />;
}
