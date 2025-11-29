import { ObjectiveReward } from '@/types';

// Helper function to calculate required XP for a level
// Level 1->2: 1000, Level 2->3: 1500, Level 3->4: 2000, Level 4->5: 2500
// Formula: XP needed for level N = 500 * (N + 1)
export const getRequiredXpForLevel = (level: number): number => {
  return 500 * (level + 1);
};

// Helper function to calculate pet level progression with multiple level-ups
export const calculatePetLevelProgression = (currentLevel: number, currentXp: number, xpToAdd: number): { newLevel: number; newXp: number; newMaxXp: number } => {
  let level = currentLevel;
  let xp = currentXp + xpToAdd;
  
  // Keep leveling up while there's enough XP for the next level
  while (true) {
    const requiredXp = getRequiredXpForLevel(level);
    if (xp >= requiredXp) {
      xp -= requiredXp;
      level += 1;
    } else {
      break;
    }
  }
  
  // Calculate max XP for current level
  const maxXp = getRequiredXpForLevel(level);
  
  return {
    newLevel: level,
    newXp: xp,
    newMaxXp: maxXp
  };
};

