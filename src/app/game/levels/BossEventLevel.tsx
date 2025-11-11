'use client';

import { useMemo } from 'react';
import GameEngine from '../engine/GameEngine';
import type { LevelConfig, BossAttackPattern } from '../engine/types';
import type { PlayerStats } from '../Player';

const CANVAS_WIDTH = 1366;
const CANVAS_HEIGHT = 768;

const bossEventAttack: BossAttackPattern = ({ bossRef, config, spawnBullet }) => {
  const color = config.colors?.bossBullet ?? '#ff0066';
  for (let i = -3; i <= 3; i++) {
    spawnBullet({
      x: bossRef.current.x + i * (config.boss.size * 0.2),
      y: bossRef.current.y + config.boss.size * 0.8,
      vx: i * 1.5,
      vy: config.boss.bulletSpeed,
      radius: 6,
      color,
    });
  }
};

interface BossEventLevelProps {
  playerStats: PlayerStats;
  bossLevel: number;
  bossHp: number;
  maxBossHp: number;
  onBossDamage: (damage: number) => Promise<void>;
  onBossDefeated: () => void;
  onPlayerDefeated?: () => void;
  otherPlayers?: Array<{
    discordId: string;
    name: string;
    avatarUrl?: string;
    position: { x: number; y: number };
    health: number;
    maxHealth: number;
  }>;
  currentPlayerId?: string;
  onPositionUpdate?: (position: { x: number; y: number }, health: number) => void;
}

export default function BossEventLevel({ 
  playerStats, 
  bossLevel, 
  bossHp, 
  maxBossHp,
  onBossDamage,
  onBossDefeated,
  onPlayerDefeated,
  otherPlayers = [],
  currentPlayerId,
  onPositionUpdate,
}: BossEventLevelProps) {

  const bossEventConfig: LevelConfig = useMemo(() => ({
    id: 'boss-event',
    name: `Boss Event - Level ${bossLevel}`,
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
      maxHealth: maxBossHp,
      startPosition: { x: CANVAS_WIDTH / 2, y: 60 },
      size: 120,
      moveSpeed: 0.0005,
      horizontalAmplitude: CANVAS_WIDTH * 0.25,
      bulletSpeed: 2.5,
      shootInterval: 700,
      attackPattern: bossEventAttack,
      laser: {
        interval: 4000,
        duration: 2000,
        widthRatio: 0.8,
        damage: 1,
      },
    },
    minions: {
      spawnInterval: 4000,
      spawnCount: 4,
      horizontalSpacing: 170,
      moveSpeed: 1.8,
      shootInterval: 900,
      bulletSpeed: 5.5,
      maxHealth: 40,
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
  }), [bossLevel, maxBossHp]);

  return (
    <MultiplayerGameEngine
      config={bossEventConfig}
      playerStats={playerStats}
      currentBossHp={bossHp}
      maxBossHp={maxBossHp}
      onBossDamage={onBossDamage}
      onBossDefeated={onBossDefeated}
      onPlayerDefeated={onPlayerDefeated}
      otherPlayers={otherPlayers}
      currentPlayerId={currentPlayerId}
      onPositionUpdate={onPositionUpdate}
    />
  );
}

// Multiplayer version of GameEngine that syncs boss HP
function MultiplayerGameEngine({
  config,
  playerStats,
  currentBossHp,
  maxBossHp,
  onBossDamage,
  onBossDefeated,
  onPlayerDefeated,
  otherPlayers = [],
  currentPlayerId,
  onPositionUpdate,
}: {
  config: LevelConfig;
  playerStats: PlayerStats;
  currentBossHp: number;
  maxBossHp: number;
  onBossDamage: (damage: number) => Promise<void>;
  onBossDefeated: () => void;
  onPlayerDefeated?: () => void;
  otherPlayers?: Array<{
    discordId: string;
    name: string;
    avatarUrl?: string;
    position: { x: number; y: number };
    health: number;
    maxHealth: number;
  }>;
  currentPlayerId?: string;
  onPositionUpdate?: (position: { x: number; y: number }, health: number) => void;
}) {
  return (
    <GameEngine
      config={{
        ...config,
        boss: {
          ...config.boss,
          maxHealth: maxBossHp,
        },
      }}
      playerStats={playerStats}
      externalBossHp={currentBossHp}
      onBossDamage={onBossDamage}
      onBossDefeated={onBossDefeated}
      onPlayerDefeated={onPlayerDefeated}
      otherPlayers={otherPlayers}
      currentPlayerId={currentPlayerId}
      onPositionUpdate={onPositionUpdate}
    />
  );
}

