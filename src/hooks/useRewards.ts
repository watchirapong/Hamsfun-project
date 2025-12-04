import { useState, useRef, useCallback } from 'react';
import { ObjectiveReward, User, Skill } from '@/types';
import { calculatePetLevelProgression } from '@/services/rewardService';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';
import { getAssetUrl } from '@/utils/helpers';
import { RewardNotificationData } from '@/components/common/RewardNotification';

export interface RewardAnimationInstance {
  id: string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard';
  value: number | string;
  skillName?: string;
  itemName?: string;
  itemIcon?: string;
  x: number;
  y: number;
  driftX: number;
  startTime: number;
  forceBurst?: boolean; // Flag to force immediate burst (e.g., on panel close)
}

export interface PendingReward {
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard';
  value: number | string;
  skillName?: string;
  itemName?: string;
  itemIcon?: string;
  itemId?: string;
}

export const useRewards = (
  setUser: React.Dispatch<React.SetStateAction<User>>,
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>
) => {
  const [rewardAnimations, setRewardAnimations] = useState<RewardAnimationInstance[]>([]);
  const [levelUpAnimations, setLevelUpAnimations] = useState<Set<string>>(new Set());
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotificationData[]>([]);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);

  // Ref for unique notification ID counter
  const notificationIdCounter = useRef<number>(0);

  // Ref to track reward animations in progress to prevent duplicates
  const rewardAnimationsInProgress = useRef<Set<string>>(new Set());

  // Ref to track awarded rewards to prevent duplicates when overlay closes
  const awardedRewards = useRef<Set<string>>(new Set());

  // Ref for unique animation ID counter
  const animationIdCounter = useRef<number>(0);

  // Ref to track skill level-ups to prevent duplicate rewards
  const skillLevelUpProcessed = useRef<Set<string>>(new Set());

  // Ref to store handleSkillLevelUp function for use in applyRewardImmediately
  const handleSkillLevelUpRef = useRef<((skillName: string, newLevel: number, skillRewards?: { type: string; value: string }[]) => void) | null>(null);

  // Function to trigger reward notification
  const triggerRewardNotification = (reward: ObjectiveReward) => {
    notificationIdCounter.current += 1;
    const notificationId = `notification-${Date.now()}-${notificationIdCounter.current}`;

    const notification: RewardNotificationData = {
      id: notificationId,
      type: reward.type,
      value: reward.value || 0,
      skillName: reward.skillName,
      itemName: reward.itemName,
      itemIcon: reward.itemIcon,
    };

    setRewardNotifications(prev => [...prev, notification]);
  };

  // Function to remove reward notification
  const removeRewardNotification = (id: string) => {
    setRewardNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Function to trigger reward animation
  const triggerRewardAnimation = (reward: ObjectiveReward) => {
    console.log('triggerRewardAnimation called with:', reward);

    // Also trigger notification
    triggerRewardNotification(reward);

    // Create a more specific reward key that includes item details to prevent duplicates
    const rewardKey = `${reward.type}-${reward.value || 0}-${reward.skillName || ''}-${reward.itemName || ''}-${reward.itemId || ''}`;
    const now = Date.now();

    // Check if this exact reward animation was triggered recently (within last 2000ms)
    // Increased window to catch duplicates from different code paths
    const recentReward = Array.from(rewardAnimationsInProgress.current).find(key => {
      // Extract the base key (without timestamp) for comparison
      const baseKey = key.substring(0, key.lastIndexOf('-'));
      if (baseKey === rewardKey) {
        const timestamp = parseInt(key.split('-').pop() || '0');
        return now - timestamp < 2000; // Increased to 2000ms
      }
      return false;
    });

    if (recentReward) {
      console.log('Duplicate reward animation prevented:', rewardKey, 'recent:', recentReward);
      return;
    }

    console.log('Creating reward animation for:', rewardKey);

    // Mark this reward as in progress with timestamp
    const rewardKeyWithTimestamp = `${rewardKey}-${now}`;
    rewardAnimationsInProgress.current.add(rewardKeyWithTimestamp);

    // Use counter for unique IDs to prevent collisions
    animationIdCounter.current += 1;
    const animationId = `reward-${Date.now()}-${animationIdCounter.current}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate random position within screen bounds (leaving some margin)
    // Spawn at bottom of screen so bubbles can float upward
    const margin = 100;
    const x = margin + Math.random() * (window.innerWidth - margin * 2);
    const y = window.innerHeight - margin - Math.random() * 100; // Spawn near bottom of screen

    // Generate random drift direction (-1 or 1) and amount
    const driftDirection = Math.random() > 0.5 ? 1 : -1;
    const driftAmount = 30 + Math.random() * 40; // 30-70px drift
    const driftX = driftDirection * driftAmount;

    setRewardAnimations(prev => {
      // Ensure no duplicate IDs (safety check)
      const existingIds = new Set(prev.map(anim => anim.id));
      if (existingIds.has(animationId)) {
        console.log('Animation ID already exists, skipping:', animationId);
        return prev;
      }
      const newAnimation: RewardAnimationInstance = {
        id: animationId,
        type: reward.type,
        value: reward.value || 0,
        skillName: reward.skillName,
        itemName: reward.itemName,
        itemIcon: reward.itemIcon,
        x,
        y,
        driftX,
        startTime: Date.now()
      };
      console.log('Adding reward animation to state:', newAnimation, 'Total animations:', prev.length + 1);
      return [...prev, newAnimation];
    });

    // Remove animation after it completes (bubble animation duration + burst time)
    setTimeout(() => {
      setRewardAnimations(prev => prev.filter(anim => anim.id !== animationId));
      // Remove from in-progress set after animation completes
      rewardAnimationsInProgress.current.delete(rewardKeyWithTimestamp);
    }, 8000); // Increased to 8 seconds to ensure cleanup happens after all animations complete
  };

  // Function to apply a reward immediately (moved outside for reuse)
  const applyRewardImmediately = useCallback((reward: PendingReward) => {
    if (reward.type === 'coins') {
      const coinValue = typeof reward.value === 'number' ? reward.value : 0;
      if (coinValue > 0) {
        setUser(prev => ({
          ...prev,
          coins: prev.coins + coinValue
        }));
        console.log(`Applied ${coinValue} coins`);
      }
    } else if (reward.type === 'exp') {
      const expValue = typeof reward.value === 'number' ? reward.value : 0;
      if (expValue > 0) {
        setUser(prev => {
          const progression = calculatePetLevelProgression(prev.petLevel, prev.petXp, expValue);
          return {
            ...prev,
            petXp: progression.newXp,
            petLevel: progression.newLevel,
            petMaxXp: progression.newMaxXp
          };
        });
        console.log(`Applied ${expValue} XP to pet`);
      }
    } else if (reward.type === 'rank') {
      const rankValue = typeof reward.value === 'number' ? reward.value : 0;
      if (rankValue > 0) {
        setUser(prev => ({
          ...prev,
          rankPoints: prev.rankPoints + rankValue
        }));
        console.log(`Applied ${rankValue} rank points`);
      }
    } else if (reward.type === 'leaderboard') {
      const leaderboardValue = typeof reward.value === 'number' ? reward.value : 0;
      if (leaderboardValue > 0) {
        setUser((prev: any) => ({
          ...prev,
          leaderboardScore: (prev.leaderboardScore || 0) + leaderboardValue
        }));
        console.log(`Applied ${leaderboardValue} leaderboard points`);
      }
    } else if (reward.type === 'skill' && reward.skillName) {
      const skillValue = typeof reward.value === 'number' ? reward.value : 0;
      if (skillValue > 0) {
        setSkills(prev => prev.map(skill => {
          if (skill.name === reward.skillName) {
            const oldLevel = skill.currentLevel;
            const oldPoints = skill.points;
            const oldMaxPoints = skill.maxPoints;
            const newPoints = oldPoints + skillValue;

            let newLevel = oldLevel;
            let newMaxPoints = oldMaxPoints;

            if (newPoints >= oldMaxPoints && oldLevel < 5) {
              newLevel = oldLevel + 1;
              newMaxPoints = 10000 * newLevel;
              setTimeout(() => {
                if (handleSkillLevelUpRef.current) {
                  handleSkillLevelUpRef.current(skill.name, newLevel, skill.rewards);
                }
              }, 100);
            }

            const cappedPoints = newLevel === 5 ? newMaxPoints : (newPoints >= newMaxPoints ? newMaxPoints : newPoints);

            return {
              ...skill,
              points: cappedPoints,
              currentLevel: newLevel,
              maxPoints: newMaxPoints
            };
          }
          return skill;
        }));
        console.log(`Applied ${skillValue} points to ${reward.skillName} skill`);
      }
    }
  }, [setUser, setSkills, handleSkillLevelUpRef]);

  // Function to apply pending rewards with animations (TEMPORARILY DISABLED - rewards apply immediately now)
  const applyPendingRewards = useCallback(() => {
    // This function is kept for compatibility but does nothing since rewards apply immediately
    setPendingRewards(prev => {
      if (prev.length === 0) return prev;
      // Clear any remaining pending rewards (shouldn't happen now)
      return [];
    });
  }, []);

  // Helper function to award objective reward (TEMPORARILY DISABLED: applies rewards immediately instead of queuing)
  const awardObjectiveReward = (reward: ObjectiveReward, contextKey?: string) => {
    // Create a unique key for this reward with context to prevent duplicates
    const rewardKey = contextKey
      ? `${contextKey}-${reward.type}-${reward.value || 0}-${reward.skillName || ''}`
      : `${reward.type}-${reward.value || 0}-${reward.skillName || ''}`;

    // Check if this exact reward with context was already awarded
    if (awardedRewards.current.has(rewardKey)) {
      console.log('Reward already awarded (with context), skipping:', rewardKey);
      return;
    }

    // Mark as awarded immediately
    awardedRewards.current.add(rewardKey);

    // Trigger reward animation
    triggerRewardAnimation(reward);

    // Clean up after 5 seconds
    setTimeout(() => {
      awardedRewards.current.delete(rewardKey);
    }, 5000);

    // TEMPORARILY DISABLED: Apply reward immediately instead of queuing
    // Apply reward immediately
    const pendingReward: PendingReward = {
      type: reward.type,
      value: reward.value || 0,
      skillName: reward.skillName,
      itemName: reward.itemName,
      itemIcon: reward.itemIcon,
      itemId: reward.itemId,
    };

    applyRewardImmediately(pendingReward);
    console.log(`Applied reward immediately: ${reward.type} - ${reward.value}`);
  };

  // Helper function to award quest completion rewards
  const awardQuestRewards = (rewards: ObjectiveReward[], questId: number) => {
    // Award all quest completion rewards with quest ID to prevent duplicates
    rewards.forEach((reward, index) => {
      const rewardKey = `quest-${questId}-reward-${index}`;
      if (!awardedRewards.current.has(rewardKey)) {
        awardedRewards.current.add(rewardKey);
        // Pass context key to awardObjectiveReward for better duplicate prevention
        awardObjectiveReward(reward, rewardKey);
      }
    });
  };

  // Helper function to process rewards from grantedRewards object (for main quest rewards after approval)
  const processGrantedRewards = (grantedRewards: any, contextKey?: string) => {
    if (!grantedRewards) return;

    // Process coins - use awardObjectiveReward for proper deduplication
    if (grantedRewards.coins && grantedRewards.coins > 0) {
      const rewardKey = contextKey ? `${contextKey}-coins` : `granted-coins-${Date.now()}`;
      awardObjectiveReward({ type: 'coins', value: grantedRewards.coins }, rewardKey);
    }

    // Process rank points - use awardObjectiveReward for proper deduplication
    if (grantedRewards.rankPoints && grantedRewards.rankPoints > 0) {
      const rewardKey = contextKey ? `${contextKey}-rank` : `granted-rank-${Date.now()}`;
      awardObjectiveReward({ type: 'rank', value: grantedRewards.rankPoints }, rewardKey);
    }

    // Process leaderboard points - use awardObjectiveReward for proper deduplication
    if (grantedRewards.leaderboardScore && grantedRewards.leaderboardScore > 0) {
      const rewardKey = contextKey ? `${contextKey}-leaderboard` : `granted-leaderboard-${Date.now()}`;
      awardObjectiveReward({ type: 'leaderboard', value: grantedRewards.leaderboardScore }, rewardKey);
    }

    // Process items - use awardObjectiveReward for proper deduplication
    if (grantedRewards.items && Array.isArray(grantedRewards.items) && grantedRewards.items.length > 0) {
      grantedRewards.items.forEach((item: any, index: number) => {
        if (item.quantity > 0) {
          const iconUrl = item.icon?.startsWith('/') && !item.icon.startsWith('/Asset')
            ? `${process.env.NEXT_BACKEND_URL}${item.icon}`
            : item.icon || getAssetUrl("/Asset/item/classTicket.png");

          const rewardKey = contextKey
            ? `${contextKey}-item-${index}`
            : `granted-item-${Date.now()}-${index}`;

          awardObjectiveReward({
            type: 'item',
            value: item.quantity,
            itemName: item.name,
            itemIcon: iconUrl,
            itemId: item.itemId
          }, rewardKey);
        }
      });
    }

    // Process badge points - use awardObjectiveReward for proper deduplication
    if (grantedRewards.badgePoints && typeof grantedRewards.badgePoints === 'object') {
      Object.keys(grantedRewards.badgePoints).forEach((skillName, index) => {
        const pointsToAdd = grantedRewards.badgePoints[skillName];
        if (pointsToAdd && pointsToAdd > 0) {
          const displayName = mapApiSkillNameToDisplayName(skillName);
          const rewardKey = contextKey
            ? `${contextKey}-skill-${skillName}`
            : `granted-skill-${Date.now()}-${index}`;

          awardObjectiveReward({
            type: 'skill',
            value: pointsToAdd,
            skillName: displayName
          }, rewardKey);
        }
      });
    }
  };

  // Function to handle skill level-up
  const handleSkillLevelUp = useCallback((skillName: string, newLevel: number, skillRewards?: { type: string; value: string }[]) => {
    // Create unique key for this level-up to prevent duplicates
    const levelUpKey = `${skillName}-${newLevel}`;

    // Check if this level-up has already been processed
    if (skillLevelUpProcessed.current.has(levelUpKey)) {
      console.log(`Level-up reward already processed for ${skillName} to level ${newLevel}, skipping`);
      return;
    }

    // Mark as processed immediately
    skillLevelUpProcessed.current.add(levelUpKey);

    // Trigger level-up animation
    setLevelUpAnimations(prev => new Set(prev).add(skillName));

    // Remove animation after it completes
    setTimeout(() => {
      setLevelUpAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(skillName);
        return newSet;
      });
    }, 2000);

    // Award level-up rewards (if any) - only once
    if (skillRewards && skillRewards.length > 0) {
      // Award level-up rewards
      skillRewards.forEach(reward => {
        if (reward.type === 'coins') {
          const coinValue = parseInt(reward.value.replace('x', '')) || 0;
          if (coinValue > 0) {
            setUser(prev => ({
              ...prev,
              coins: prev.coins + coinValue
            }));
            triggerRewardAnimation({ type: 'coins', value: coinValue });
          }
        } else if (reward.type === 'animal') {
          triggerRewardAnimation({ type: 'animal', value: reward.value });
        }
      });
    }
  }, [setUser, triggerRewardAnimation]);

  // Update ref when handleSkillLevelUp changes
  handleSkillLevelUpRef.current = handleSkillLevelUp;

  return {
    rewardAnimations,
    setRewardAnimations,
    levelUpAnimations,
    setLevelUpAnimations,
    rewardNotifications,
    removeRewardNotification,
    pendingRewards,
    applyPendingRewards,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    processGrantedRewards,
    awardedRewards: awardedRewards.current,
  };
};

