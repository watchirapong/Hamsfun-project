/**
 * Player Class
 * Stores all player-related configuration and stats
 * 
 * To modify player stats, change the values in the class properties below
 */

export interface PlayerStats {
  maxHealth: number;
  attackPowerBoss: number;
  attackPowerMinion: number;
  moveSpeed: number;
  shootInterval: number;
  bulletSpeed: number;
  bulletRadius: number;
  bulletColor: string;
}

export const BASE_PLAYER_STATS: PlayerStats = {
  maxHealth: 50,
  attackPowerBoss: 5,
  attackPowerMinion: 10,
  moveSpeed: 5,
  shootInterval: 200,
  bulletSpeed: 8,
  bulletRadius: 4,
  bulletColor: '#00ffff',
};

export const MIN_SHOOT_INTERVAL = 80;

