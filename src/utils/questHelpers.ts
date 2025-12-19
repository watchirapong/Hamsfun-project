import { ObjectiveReward } from '@/types';
import { mapApiSkillNameToDisplayName } from './rewardHelpers';

/**
 * Maps backend reward type to frontend reward type
 * @param backendType - The reward type from backend (e.g., "Coin", "RankPoint")
 * @returns The frontend reward type (e.g., "coins", "rank")
 */
export const mapBackendRewardTypeToFrontend = (backendType: string): 'exp' | 'rank' | 'skill' | 'coins' | 'animal' | 'item' | 'leaderboard' | 'petExp' => {
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
  } else if (backendType === 'PetExp' || backendType === 'PetExperience' || backendType === 'petExp') {
    return 'petExp';
  }
  return 'coins'; // Default fallback
};

/**
 * Calculates reward value from backend reward entry
 * Uses minAmount, or average of minAmount and maxAmount if they differ
 * @param entry - Backend reward entry with minAmount and maxAmount
 * @returns The calculated reward value
 */
export const calculateRewardValue = (entry: { minAmount?: number; maxAmount?: number }): number => {
  if (!entry.minAmount) return 0;

  if (entry.minAmount === entry.maxAmount) {
    return entry.minAmount;
  }

  // Average if min and max differ
  return Math.floor((entry.minAmount + (entry.maxAmount || entry.minAmount)) / 2);
};

/**
 * Maps backend reward entry to frontend ObjectiveReward
 * @param entry - Backend reward entry
 * @returns Frontend ObjectiveReward object
 */
export const mapBackendRewardEntryToFrontend = (entry: {
  type: string;
  minAmount?: number;
  maxAmount?: number;
  badgeCategory?: string;
  itemId?: string;
}): ObjectiveReward => {
  const frontendType = mapBackendRewardTypeToFrontend(entry.type);
  const value = calculateRewardValue(entry);

  const reward: ObjectiveReward = {
    type: frontendType,
    value: value || 0,
    minValue: entry.minAmount,
    maxValue: entry.maxAmount
  };

  // Add skillName for BadgePoint type
  if (frontendType === 'skill' && entry.badgeCategory) {
    reward.skillName = mapApiSkillNameToDisplayName(entry.badgeCategory);
  }

  // Add itemId for Item type (item details will be fetched separately if needed)
  if (frontendType === 'item' && entry.itemId) {
    reward.itemId = entry.itemId;
  }

  return reward;
};

/**
 * Extracts subQuestId from progress entry (handles various possible structures)
 * @param progressEntry - Progress entry from API
 * @returns The subQuestId as a string, or null if not found
 */
export const extractSubQuestIdFromProgress = (progressEntry: any): string | null => {
  return progressEntry?.subQuestId ||
    progressEntry?.subQuest?._id ||
    progressEntry?.subQuest?.id ||
    (typeof progressEntry?.subQuest === 'string' ? progressEntry.subQuest : null);
};

/**
 * Extracts subQuestId from subQuest object
 * @param subQuest - SubQuest object from API
 * @returns The subQuestId as a string, or null if not found
 */
export const extractSubQuestIdFromSubQuest = (subQuest: any): string | null => {
  return (subQuest?._id || subQuest?.id)?.toString() || null;
};

/**
 * Unified mapper to convert API quest data to frontend Quest interface
 */
export const mapApiQuestToFrontend = (apiQuest: any, userQuestData?: any): any => {
  // apiQuest might be the quest object itself or an object with questId property
  const quest = apiQuest.questId || apiQuest;
  const aq = userQuestData || apiQuest; // aq = activeQuest data if available

  return {
    id: quest._id,
    type: quest.type || "Main",
    title: quest.title,
    description: quest.description,
    steps: quest.subQuests?.map((_: any, i: number) => i + 1) || [],
    currentStep: aq.subQuestsProgress?.filter((p: any) => p.status === 'Completed').length || 0,
    rewards: (() => {
      if (!quest.completionRewards || !Array.isArray(quest.completionRewards)) {
        return [];
      }
      const mappedRewards: ObjectiveReward[] = [];
      quest.completionRewards.forEach((rewardGroup: any) => {
        if (rewardGroup && Array.isArray(rewardGroup.entries)) {
          rewardGroup.entries.forEach((entry: any) => {
            mappedRewards.push(mapBackendRewardEntryToFrontend(entry));
          });
        }
      });
      return mappedRewards;
    })(),
    completed: aq.isCompleted || aq.status === 'Completed' || false,
    objectives: quest.subQuests?.map((sq: any) => {
      let rewards: ObjectiveReward[] = [];
      if (sq.reward && typeof sq.reward === 'object' && sq.reward.type) {
        rewards = [sq.reward];
      } else if (Array.isArray(sq.rewards)) {
        sq.rewards.forEach((rg: any) => {
          rg.entries?.forEach((entry: any) => {
            rewards.push(mapBackendRewardEntryToFrontend(entry));
          });
        });
      }

      if (rewards.length === 0) rewards = [{ type: 'coins', value: 0 }];

      return {
        text: sq.title || sq.description,
        reward: rewards.length === 1 ? rewards[0] : rewards,
        subQuestId: sq._id || sq.id,
        description: sq.description
      };
    }) || [],
    objectiveCompleted: quest.subQuests?.map((sq: any) => {
      const sqId = extractSubQuestIdFromSubQuest(sq);
      const progress = aq.subQuestsProgress?.find((p: any) => extractSubQuestIdFromProgress(p) === sqId);
      return progress?.status === 'Completed' || progress?.status === 'Pending' || false;
    }) || [],
    objectiveSubmissions: quest.subQuests?.map((sq: any) => {
      const sqId = extractSubQuestIdFromSubQuest(sq);
      const progress = aq.subQuestsProgress?.find((p: any) => extractSubQuestIdFromProgress(p) === sqId);
      return {
        imageUrl: progress?.imageProof || null,
        status: progress?.status === 'Completed' ? 'approved' :
          progress?.status === 'Pending' ? 'pending' :
            progress?.status === 'Rejected' ? 'rejected' : 'none'
      };
    }) || [],
    objectiveRewardsAwarded: quest.subQuests?.map((sq: any) => {
      const sqId = extractSubQuestIdFromSubQuest(sq);
      const progress = aq.subQuestsProgress?.find((p: any) => extractSubQuestIdFromProgress(p) === sqId);
      // If submitted, show as awarded (green) on reload for UX
      return progress?.rewardAwarded || (progress?.status && progress.status !== 'none') || false;
    }) || [],
    rewardClaimed: aq.status === 'Completed',
    rewardSubmissionStatus: (aq.status === 'Pending' ? 'pending' : aq.status === 'Completed' ? 'approved' : 'none'),
    questRewardsAwarded: aq.isCompleted || aq.status === 'Completed' || false,
    category: quest.category || "General"
  };
};
