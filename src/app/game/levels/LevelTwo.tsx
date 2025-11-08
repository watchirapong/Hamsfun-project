'use client';

import { useMemo } from 'react';
import GameEngine from '../engine/GameEngine';
import type { LevelConfig, BossAttackPattern } from '../engine/types';
import type { PlayerStats } from '../Player';

const CANVAS_WIDTH = 1366;
const CANVAS_HEIGHT = 768;

const levelTwoBossAttack: BossAttackPattern = ({ bossRef, config, spawnBullet }) => {
  const color = config.colors?.bossBullet ?? '#ff0066';
  for (let i = -2; i <= 2; i++) {
    spawnBullet({
      x: bossRef.current.x + i * (config.boss.size * 0.25),
      y: bossRef.current.y + config.boss.size * 0.8,
      vx: i * 1.5,
      vy: config.boss.bulletSpeed,
      radius: 6,
      color,
    });
  }
};

const levelTwoConfig: LevelConfig = {
  id: 'level-2',
  name: 'Bullet Hell - Level 2',
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#000011',
    starCount: 50,
  },
  player: {
    startPosition: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 },
    invincibilityTime: 500,
  },
  boss: {
    maxHealth: 300,
    startPosition: { x: CANVAS_WIDTH / 2, y: 60 },
    size: 100,
    moveSpeed: 0.0005,
    horizontalAmplitude: CANVAS_WIDTH * 0.25,
    bulletSpeed: 2,
    shootInterval: 800,
    attackPattern: levelTwoBossAttack,
    laser: {
      interval: 5000,
      duration: 2000,
      widthRatio: 0.8,
      damage: 1,
    },
  },
  minions: {
    spawnInterval: 5000,
    spawnCount: 3,
    horizontalSpacing: 120,
    moveSpeed: 1.5,
    shootInterval: 1000,
    bulletSpeed: 5,
    maxHealth: 30,
  },
  damage: {
    bossBullet: 5,
    bossLaser: 1,
    minion: 10,
  },
  colors: {
    boss: '#ff0000',
    bossAccent: '#cc0000',
    bossBullet: '#ff0066',
    minion: '#ffaa00',
    minionAccent: '#ff6600',
    minionBullet: '#ffaa00',
    player: '#00ff00',
    background: '#000011',
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
