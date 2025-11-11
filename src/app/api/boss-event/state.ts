// Shared boss event state
export interface BossEventState {
  isActive: boolean;
  bossLevel: number;
  bossHp: number;
  maxBossHp: number;
  startedAt: Date | null;
  rewardHamsterCoin: number;
  rewardStatPoint: number;
}

export let bossEventState: BossEventState = {
  isActive: false,
  bossLevel: 1,
  bossHp: 1000,
  maxBossHp: 1000,
  startedAt: null,
  rewardHamsterCoin: 0,
  rewardStatPoint: 0,
};

