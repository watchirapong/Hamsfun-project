'use client';

import { useMemo } from 'react';
import GameEngine from '../engine/GameEngine';
import type { LevelConfig, BossAttackPattern } from '../engine/types';
import type { PlayerStats } from '../Player';

const CANVAS_WIDTH = 1366;
const CANVAS_HEIGHT = 768;

const levelThreeBossAttack: BossAttackPattern = ({ bossRef, config, spawnBullet }) => {
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

const levelThreeConfig: LevelConfig = {
  id: 'level-3',
  name: 'Bullet Hell - Level 3',
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
    attackPattern: levelThreeBossAttack,
    laser: {
      interval: 5000,
      duration: 2000,
      widthRatio: 0.8,
      damage: 1,
    },
    shield: {
      radius: 85,
      color: 'rgba(80, 190, 255, 0.8)',
    },
  },
  minions: {
    spawnInterval: 6000,
    spawnCount: 5,
    horizontalSpacing: 140,
    moveSpeed: 0,
    shootInterval: 1400,
    bulletSpeed: 4.5,
    maxHealth: 35,
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

export default function LevelThree({ playerStats, onLevelComplete, onPlayerDefeated }: LevelProps) {
  const config = useMemo<LevelConfig>(
    () => ({
      ...levelThreeConfig,
      onLevelComplete,
      onPlayerDefeated,
    }),
    [onLevelComplete, onPlayerDefeated],
  );

  return <GameEngine config={config} playerStats={playerStats} />;
}
