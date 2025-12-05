/**
 * Reward Polling Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { useEffect, useRef, useCallback } from 'react';
import { userAPI, getToken } from '@/lib/api';

/**
 * Check if quest is completed and rewards granted
 */
const isQuestApproved = (apiQuest) => {
  return (apiQuest.isCompleted || false) && 
         (apiQuest.rewardAwarded || apiQuest.questRewardsAwarded || false);
};

/**
 * Find quest in API response by ID
 */
const findQuestInApiResponse = (allQuestsFromApi, questId) => {
  return allQuestsFromApi.find((aq) => {
    const apiQuestId = aq.questId?._id || aq.questId?.id;
    return apiQuestId === questId || apiQuestId === questId.toString();
  });
};

/**
 * Process approved quest rewards
 */
const processApprovedQuest = (pendingQuest, awardedRewards, awardObjectiveReward, setQuestsState) => {
  if (!pendingQuest.rewards || pendingQuest.rewards.length === 0) {
    return;
  }

  const rewardKey = `quest-${pendingQuest.id}-approved`;
  if (awardedRewards.has(rewardKey)) {
    return;
  }

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
};

export const useRewardPolling = (params) => {
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

  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);

  const checkForApprovedRewards = useCallback(async () => {
    // Check if user is authenticated before making API calls
    const token = getToken();
    if (!token) {
      return; // Silently skip if not authenticated
    }

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
        const apiQuest = findQuestInApiResponse(allQuestsFromApi, pendingQuest.id);

        if (!apiQuest) continue;

        if (isQuestApproved(apiQuest) && !pendingQuest.questRewardsAwarded) {
          processApprovedQuest(pendingQuest, awardedRewards, awardObjectiveReward, setQuestsState);
        }
      }
    } catch (error) {
      // Only log non-401 errors (401 is expected when not authenticated)
      if (error.status !== 401) {
        console.error('Error checking for approved rewards:', error);
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [questsState, awardedRewards, awardObjectiveReward, setQuestsState]);

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
  }, [questsState, checkForApprovedRewards]);

  // Check on mount/refresh for any newly approved rewards
  useEffect(() => {
    let isMounted = true;

    const checkOnMount = async () => {
      // Check if user is authenticated before making API calls
      const token = getToken();
      if (!token) {
        return; // Silently skip if not authenticated
      }

      try {
        const activeQuests = await userAPI.getActiveQuests();
        const completedQuests = await userAPI.getCompletedQuests();
        const allQuestsFromApi = [...activeQuests, ...completedQuests];

        if (!isMounted) return;

        // Find quests that were approved but we haven't awarded yet
        allQuestsFromApi.forEach((apiQuest) => {
          const questId = apiQuest.questId?._id || apiQuest.questId?.id;

          if (isQuestApproved(apiQuest)) {
            // Check if we have this quest in state and if rewards haven't been awarded
            const existingQuest = questsState.find(q =>
              String(q.id) === String(questId)
            );

            if (existingQuest && !existingQuest.questRewardsAwarded) {
              processApprovedQuest(existingQuest, awardedRewards, awardObjectiveReward, setQuestsState);
            }
          }
        });
      } catch (error) {
        // Only log non-401 errors (401 is expected when not authenticated)
        if (error.status !== 401) {
          console.error('Error checking for approved rewards on mount:', error);
        }
      }
    };

    checkOnMount();

    return () => {
      isMounted = false;
    };
  }, [questsState, awardedRewards, awardObjectiveReward, setQuestsState]); // Include dependencies
};

