import { useEffect, useRef } from 'react';
import { userAPI } from '@/lib/api';
import { Quest } from '@/types';
import { processBadgePointsFromApi, processCoinsFromApi, processRankPointsFromApi, processLeaderboardPointsFromApi, processItemsFromApi } from '@/utils/rewardHelpers';
import { getItemIconUrl } from '@/utils/itemHelpers';
import { getAssetUrl } from '@/utils/helpers';

interface UseRewardPollingParams {
  questsState: Quest[];
  setQuestsState: React.Dispatch<React.SetStateAction<Quest[]>>;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  setSkills: React.Dispatch<React.SetStateAction<any[]>>;
  triggerRewardAnimation: (reward: any) => void;
  handleSkillLevelUp: (skillName: string, newLevel: number, skillRewards?: { type: string; value: string }[]) => void;
  awardedRewards: Set<string>;
  awardObjectiveReward: (reward: any, contextKey?: string) => void;
}

/**
 * Polls for approved rewards and triggers animations when rewards are approved
 * Checks every 5 seconds for quests in "pending" state
 */
export const useRewardPolling = (params: UseRewardPollingParams) => {
  const {
    questsState,
    setQuestsState,
    setUser,
    setSkills,
    triggerRewardAnimation,
    handleSkillLevelUp,
    awardedRewards,
    awardObjectiveReward
  } = params;

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const checkForApprovedRewards = async () => {
    // Prevent multiple simultaneous checks
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      // Find quests that are pending approval
      const pendingQuests = questsState.filter(
        q => q.rewardSubmissionStatus === 'pending' && !q.questRewardsAwarded
      );

      if (pendingQuests.length === 0) {
        isPollingRef.current = false;
        return;
      }

      // Fetch fresh quest data from API
      const activeQuests = await userAPI.getActiveQuests();
      const completedQuests = await userAPI.getCompletedQuests();
      const allQuestsFromApi = [...activeQuests, ...completedQuests];

      // Check each pending quest
      for (const pendingQuest of pendingQuests) {
        const apiQuest = allQuestsFromApi.find((aq: any) => {
          const questId = aq.questId?._id || aq.questId?.id;
          return questId === pendingQuest.id || questId === pendingQuest.id.toString();
        });

        if (!apiQuest) continue;

        // Check if quest is completed and rewards were granted
        const isCompleted = apiQuest.isCompleted || false;
        const hasRewardsGranted = apiQuest.rewardAwarded || apiQuest.questRewardsAwarded || false;

        if (isCompleted && hasRewardsGranted && !pendingQuest.questRewardsAwarded) {
          // Quest was approved - check if we can get grantedRewards from API
          // Since the API might not return grantedRewards in the quest list,
          // we'll trigger the reward animation based on the quest's reward structure

          // Award rewards from quest definition (since API doesn't return grantedRewards in list)
          if (pendingQuest.rewards && pendingQuest.rewards.length > 0) {
            const rewardKey = `quest-${pendingQuest.id}-approved`;
            if (!awardedRewards.has(rewardKey)) {
              // Process each reward type
              pendingQuest.rewards.forEach((reward, index) => {
                const individualKey = `quest-${pendingQuest.id}-reward-${index}`;
                if (!awardedRewards.has(individualKey)) {
                  // Queue the reward instead of applying immediately
                  awardObjectiveReward(reward, individualKey);
                }
              });

              // Update quest state to mark as awarded
              setQuestsState(prevQuests =>
                prevQuests.map(q => {
                  if (q.id === pendingQuest.id) {
                    return {
                      ...q,
                      rewardSubmissionStatus: 'approved',
                      questRewardsAwarded: true,
                      rewardClaimed: true
                    };
                  }
                  return q;
                })
              );

              console.log('Rewards approved and awarded for quest:', pendingQuest.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for approved rewards:', error);
    } finally {
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    // Start polling if there are pending quests
    const hasPendingQuests = questsState.some(
      q => q.rewardSubmissionStatus === 'pending' && !q.questRewardsAwarded
    );

    if (hasPendingQuests) {
      // Check immediately
      checkForApprovedRewards();

      // Then poll every 5 seconds
      pollingIntervalRef.current = setInterval(() => {
        checkForApprovedRewards();
      }, 5000);
    } else {
      // Stop polling if no pending quests
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [questsState]);

  // Check on mount/refresh for any newly approved rewards
  useEffect(() => {
    const checkOnMount = async () => {
      try {
        const activeQuests = await userAPI.getActiveQuests();
        const completedQuests = await userAPI.getCompletedQuests();
        const allQuestsFromApi = [...activeQuests, ...completedQuests];

        // Find quests that were approved but we haven't awarded yet
        allQuestsFromApi.forEach((apiQuest: any) => {
          const questId = apiQuest.questId?._id || apiQuest.questId?.id;
          const isCompleted = apiQuest.isCompleted || false;
          const hasRewardsGranted = apiQuest.rewardAwarded || apiQuest.questRewardsAwarded || false;

          if (isCompleted && hasRewardsGranted) {
            // Check if we have this quest in state and if rewards haven't been awarded
            const existingQuest = questsState.find(q =>
              String(q.id) === String(questId)
            );

            if (existingQuest && !existingQuest.questRewardsAwarded) {
              // Award rewards from quest definition
              if (existingQuest.rewards && existingQuest.rewards.length > 0) {
                const rewardKey = `quest-${existingQuest.id}-approved`;
                if (!awardedRewards.has(rewardKey)) {
                  // Process each reward (same logic as polling)
                  existingQuest.rewards.forEach((reward: any, index: number) => {
                    const individualKey = `quest-${existingQuest.id}-reward-${index}`;
                    if (!awardedRewards.has(individualKey)) {
                      // Queue the reward instead of applying immediately
                      awardObjectiveReward(reward, individualKey);
                    }
                  });

                  // Update quest state
                  setQuestsState(prevQuests =>
                    prevQuests.map(q => {
                      if (q.id === existingQuest.id) {
                        return {
                          ...q,
                          rewardSubmissionStatus: 'approved',
                          questRewardsAwarded: true,
                          rewardClaimed: true
                        };
                      }
                      return q;
                    })
                  );

                  console.log('Rewards detected and awarded on refresh for quest:', existingQuest.id);
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('Error checking for approved rewards on mount:', error);
      }
    };

    checkOnMount();
  }, []); // Only run on mount
};

