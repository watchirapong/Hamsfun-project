import type { MutableRefObject } from 'react';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export interface Minion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  lastShotTime: number;
  horizontalOffset: number;
}

export interface Laser {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  duration: number;
  timer: number;
}

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor?: string;
  starCount?: number;
}

export interface BossConfig {
  maxHealth: number;
  startPosition: Vector2;
  size: number;
  moveSpeed: number;
  horizontalAmplitude: number;
  bulletSpeed: number;
  shootInterval: number;
  attackPattern?: BossAttackPattern;
  laser?: {
    interval: number;
    duration: number;
    widthRatio: number;
    damage: number;
    pattern?: LaserPattern;
  };
}

export interface MinionConfig {
  spawnInterval: number;
  spawnCount: number;
  horizontalSpacing: number;
  moveSpeed: number;
  shootInterval: number;
  bulletSpeed: number;
  maxHealth: number;
  attackPattern?: MinionAttackPattern;
}

export interface PlayerSettings {
  startPosition: Vector2;
  invincibilityTime: number;
}

export interface DamageSettings {
  bossBullet: number;
  bossLaser: number;
  minion: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  canvas: CanvasSettings;
  player: PlayerSettings;
  boss: BossConfig;
  minions: MinionConfig;
  damage: DamageSettings;
  colors?: {
    boss?: string;
    bossAccent?: string;
    bossBullet?: string;
    minion?: string;
    minionAccent?: string;
    minionBullet?: string;
    player?: string;
    background?: string;
  };
  onLevelComplete?: () => void;
  onPlayerDefeated?: () => void;
}

export interface AttackContextCommon {
  timestamp: number;
  delta: number;
  config: LevelConfig;
  levelState: MutableRefObject<Record<string, unknown>>;
}

export interface BossAttackContext extends AttackContextCommon {
  bossRef: MutableRefObject<Vector2>;
  playerRef: MutableRefObject<Vector2>;
  spawnBullet: (bullet: Bullet) => void;
}

export interface LaserPatternContext extends AttackContextCommon {
  bossRef: MutableRefObject<Vector2>;
  lasersRef: MutableRefObject<Laser[]>;
}

export interface MinionAttackContext extends AttackContextCommon {
  minion: Minion;
  spawnBullet: (bullet: Bullet) => void;
}

export type BossAttackPattern = (context: BossAttackContext) => void;
export type LaserPattern = (context: LaserPatternContext) => void;
export type MinionAttackPattern = (context: MinionAttackContext) => void;
