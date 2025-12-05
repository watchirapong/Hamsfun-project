/**
 * Quest Helpers with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { mapApiSkillNameToDisplayName } from './rewardHelpers';

/**
 * Maps backend reward type to frontend reward type
 */
export const mapBackendRewardTypeToFrontend = (backendType) => {
  if (backendType === 'Coin') {
    return 'coins';
  } else if (backendType === 'RankPoint') {
    return 'rank';
  } else if (backendType === 'BadgePoint') {
    return 'skill';
  } else if (backendType === 'Item') {
    return 'item';
  } else if (backendType === 'LeaderboardScore') {
    return 'leaderboard';
  }
  return 'coins'; // Default fallback
};

/**
 * Calculates reward value from backend reward entry
 * Uses minAmount, or average of minAmount and maxAmount if they differ
 */
export const calculateRewardValue = (entry) => {
  if (!entry.minAmount) return 0;
  
  if (entry.minAmount === entry.maxAmount) {
    return entry.minAmount;
  }
  
  // Average if min and max differ
  return Math.floor((entry.minAmount + (entry.maxAmount || entry.minAmount)) / 2);
};

/**
 * Maps backend reward entry to frontend ObjectiveReward
 */
export const mapBackendRewardEntryToFrontend = (entry) => {
  const frontendType = mapBackendRewardTypeToFrontend(entry.type);
  const value = calculateRewardValue(entry);
  
  const reward = {
    type: frontendType,
    value: value || 0,
    minValue: entry.minAmount,
    maxValue: entry.maxAmount
  };
  
  // Add skillName for BadgePoint type
  if (frontendType === 'skill' && entry.badgeCategory) {
    reward.skillName = mapApiSkillNameToDisplayName(entry.badgeCategory);
  }
  
  // Add itemId for Item type
  if (frontendType === 'item' && entry.itemId) {
    reward.itemId = entry.itemId;
  }
  
  return reward;
};

/**
 * Extracts subQuestId from progress entry (handles various possible structures)
 */
export const extractSubQuestIdFromProgress = (progressEntry) => {
  return progressEntry?.subQuestId || 
         progressEntry?.subQuest?._id || 
         progressEntry?.subQuest?.id ||
         (typeof progressEntry?.subQuest === 'string' ? progressEntry.subQuest : null);
};

/**
 * Extracts subQuestId from subQuest object
 */
export const extractSubQuestIdFromSubQuest = (subQuest) => {
  return (subQuest?._id || subQuest?.id)?.toString() || null;
};

