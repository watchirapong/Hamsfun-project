/**
 * Player Class
 * Stores all player-related configuration and stats
 * 
 * To modify player stats, change the values in the class properties below
 */

export class Player {
  // ========== PLAYER STATS: Change player configuration here ==========
  
  /** Maximum player health */
  static readonly MAX_HEALTH: number = 100;
  
  /** Player attack power - damage dealt to boss per bullet */
  static readonly ATTACK_POWER_BOSS: number = 5;
  
  /** Player attack power - damage dealt to minions per bullet */
  static readonly ATTACK_POWER_MINION: number = 10;
  
  /** Player movement speed (pixels per frame) */
  static readonly MOVE_SPEED: number = 5;
  
  /** Player shoot interval (milliseconds between shots) */
  static readonly SHOOT_INTERVAL: number = 200;
  
  /** Player bullet speed (pixels per frame) */
  static readonly BULLET_SPEED: number = 8;
  
  /** Player bullet radius (pixels) */
  static readonly BULLET_RADIUS: number = 4;
  
  /** Player bullet color (hex color string) */
  static readonly BULLET_COLOR: string = '#00ffff';
}

