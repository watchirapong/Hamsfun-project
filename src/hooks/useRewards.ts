import { useState, useRef, useCallback } from 'react';
import { ObjectiveReward, User, Skill } from '@/types';
import { calculatePetLevelProgression } from '@/services/rewardService';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';
import { getAssetUrl } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';
import { RewardNotificationData } from '@/components/common/RewardNotification';
import { animateCount, easeOutCubic } from '@/utils/countingAnimation';

export interface RewardAnimationInstance {
  id: string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard' | 'petExp' | 'balls';
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
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard' | 'petExp' | 'balls';
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

  // Ref to track rewards that have been animated (for double-protection)
  const animatedRewards = useRef<Set<string>>(new Set());

  // Ref to track pending reward totals (to merge duplicates)
  const pendingRewardTotals = useRef<Map<string, number>>(new Map());

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

    // Generate random X position within MAIN PAGE boundaries only (428px centered)
    // Main page is max-w-[428px] centered, so we need to calculate relative to center
    const mainPageWidth = 428; // Main page max width
    const bubbleSize = 80;
    const margin = Math.max(20, bubbleSize / 2); // At least 20px margin, or half bubble size

    // Calculate main page boundaries
    // Main page is centered: left = (window.innerWidth - 428) / 2, right = left + 428
    const mainPageLeft = (window.innerWidth - mainPageWidth) / 2;
    const mainPageRight = mainPageLeft + mainPageWidth;

    // X position range within main page only
    const minX = mainPageLeft + margin;
    const maxX = mainPageRight - margin - bubbleSize;

    // Ensure valid range
    const validMinX = Math.max(mainPageLeft, minX);
    const validMaxX = Math.max(validMinX + bubbleSize, Math.min(maxX, mainPageRight - bubbleSize));

    // Randomize X position within main page safe bounds
    const x = validMinX + Math.random() * (validMaxX - validMinX);

    // Final safety check - clamp to ensure bubble stays within main page
    const clampedX = Math.max(mainPageLeft, Math.min(x, mainPageRight - bubbleSize));

    // Y position: Spawn from bottom of screen (for bottom positioning)
    // Leave small margin from absolute bottom
    const bottomMargin = 20;
    const y = window.innerHeight - bottomMargin;

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
    } else if (reward.type === 'balls') {
      const ballValue = typeof reward.value === 'number' ? reward.value : 0;
      if (ballValue > 0) {
        setUser(prev => ({
          ...prev,
          balls: (prev.balls || 0) + ballValue
        }));
        console.log(`Applied ${ballValue} balls`);
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
    } else if (reward.type === 'petExp') {
      const petExpValue = typeof reward.value === 'number' ? reward.value : 0;
      if (petExpValue > 0) {
        setUser(prev => {
          const progression = calculatePetLevelProgression(prev.petLevel, prev.petXp, petExpValue);
          return {
            ...prev,
            petXp: progression.newXp,
            petLevel: progression.newLevel,
            petMaxXp: progression.newMaxXp
          };
        });
        console.log(`Applied ${petExpValue} Pet EXP to pet`);
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

  // Function to apply pending rewards with smooth counting animations
  const applyPendingRewards = useCallback(async () => {
    const pending = pendingRewardTotals.current;
    if (pending.size === 0) {
      setPendingRewards([]);
      return;
    }

    // Get current user state for animation start values
    let currentUser: User | null = null;
    let currentSkills: Skill[] | null = null;

    // We'll need to get these from the state setters - for now, we'll use a callback approach
    // This will be called from page.tsx with current state

    // Clear pending rewards after processing
    pendingRewardTotals.current.clear();
    setPendingRewards([]);
  }, []);

  // Helper function to award objective reward (queues rewards instead of applying immediately)
  const awardObjectiveReward = (reward: ObjectiveReward, contextKey?: string) => {
    // Create a unique key for this reward with context to prevent duplicates
    const rewardKey = contextKey
      ? `${contextKey}-${reward.type}-${reward.value || 0}-${reward.skillName || ''}-${reward.itemName || ''}-${reward.itemId || ''}`
      : `${reward.type}-${reward.value || 0}-${reward.skillName || ''}-${reward.itemName || ''}-${reward.itemId || ''}`;

    // DOUBLE PROTECTION: Check if this exact reward was already awarded
    if (awardedRewards.current.has(rewardKey)) {
      console.log('Reward already awarded (with context), skipping:', rewardKey);
      return;
    }

    // DOUBLE PROTECTION: Check if this reward animation was already triggered
    const animationKey = `${reward.type}-${reward.value || 0}-${reward.skillName || ''}-${reward.itemName || ''}-${reward.itemId || ''}`;
    if (animatedRewards.current.has(animationKey)) {
      console.log('Reward animation already triggered, skipping:', animationKey);
      return;
    }

    // Mark as awarded and animated immediately
    awardedRewards.current.add(rewardKey);
    animatedRewards.current.add(animationKey);

    // Trigger reward animation (shows in overlay)
    triggerRewardAnimation(reward);

    // Queue reward for later application (when overlay closes)
    const rewardValue = typeof reward.value === 'number' ? reward.value : 0;

    // Create a key for merging duplicate rewards of the same type
    const mergeKey = reward.type === 'skill'
      ? `${reward.type}-${reward.skillName}`
      : reward.type === 'item'
        ? `${reward.type}-${reward.itemId}`
        : reward.type;

    // Merge with existing pending rewards of the same type
    const currentTotal = pendingRewardTotals.current.get(mergeKey) || 0;
    pendingRewardTotals.current.set(mergeKey, currentTotal + rewardValue);

    // Add to pending rewards list for tracking
    setPendingRewards(prev => {
      // Check if we already have a pending reward of this type to merge
      const existingIndex = prev.findIndex(p =>
        p.type === reward.type &&
        (reward.type === 'skill' ? p.skillName === reward.skillName : true) &&
        (reward.type === 'item' ? p.itemId === reward.itemId : true)
      );

      if (existingIndex >= 0) {
        // Merge with existing reward
        const existing = prev[existingIndex];
        const newValue = (typeof existing.value === 'number' ? existing.value : 0) + rewardValue;
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          value: newValue
        };
        return updated;
      } else {
        // Add new reward
        return [...prev, {
          type: reward.type,
          value: rewardValue,
          skillName: reward.skillName,
          itemName: reward.itemName,
          itemIcon: reward.itemIcon,
          itemId: reward.itemId,
        }];
      }
    });

    console.log(`Queued reward: ${reward.type} - ${rewardValue} (Total pending: ${pendingRewardTotals.current.get(mergeKey)})`);

    // Clean up after 5 seconds
    setTimeout(() => {
      awardedRewards.current.delete(rewardKey);
      animatedRewards.current.delete(animationKey);
    }, 5000);
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

    // Process balls - use awardObjectiveReward for proper deduplication
    if (grantedRewards.balls && grantedRewards.balls > 0) {
      const rewardKey = contextKey ? `${contextKey}-balls` : `granted-balls-${Date.now()}`;
      awardObjectiveReward({ type: 'balls' as any, value: grantedRewards.balls }, rewardKey);
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
          const iconUrl = getItemIconUrl(item.icon);

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

  // Function to apply pending rewards with smooth animations (called from page.tsx with current state)
  const applyPendingRewardsWithAnimations = useCallback(async (
    currentUser: User,
    currentSkills: Skill[],
    setUserCallback: React.Dispatch<React.SetStateAction<User>>,
    setSkillsCallback: React.Dispatch<React.SetStateAction<Skill[]>>
  ) => {
    // Get pending rewards from state (these are already merged)
    return new Promise<void>((resolve) => {
      setPendingRewards(prevPending => {
        if (prevPending.length === 0) {
          resolve();
          return [];
        }

        console.log('Applying pending rewards with animations:', prevPending);

        // Group rewards by type for merging
        const rewardsByType = new Map<string, number>();
        const skillRewards = new Map<string, number>();
        const itemRewards = new Map<string, { quantity: number; itemId?: string }>();

        prevPending.forEach(reward => {
          const value = typeof reward.value === 'number' ? reward.value : 0;
          if (reward.type === 'skill' && reward.skillName) {
            const key = reward.skillName;
            skillRewards.set(key, (skillRewards.get(key) || 0) + value);
          } else if (reward.type === 'item' && reward.itemId) {
            const key = reward.itemId;
            const existing = itemRewards.get(key) || { quantity: 0, itemId: reward.itemId };
            itemRewards.set(key, { ...existing, quantity: existing.quantity + value });
          } else {
            rewardsByType.set(reward.type, (rewardsByType.get(reward.type) || 0) + value);
          }
        });

        // Prepare animations for all reward types
        const animations: Array<Promise<void>> = [];

        // Process coins
        const coinsTotal = rewardsByType.get('coins') || 0;
        if (coinsTotal > 0) {
          animations.push(
            animateCount(
              currentUser.coins,
              currentUser.coins + coinsTotal,
              {
                duration: 1000,
                easing: easeOutCubic,
                onUpdate: (value) => {
                  setUserCallback(prev => ({ ...prev, coins: value }));
                }
              }
            )
          );
        }

        // Process balls
        const ballsTotal = rewardsByType.get('balls') || 0;
        if (ballsTotal > 0) {
          animations.push(
            animateCount(
              currentUser.balls || 0,
              (currentUser.balls || 0) + ballsTotal,
              {
                duration: 1000,
                easing: easeOutCubic,
                onUpdate: (value) => {
                  setUserCallback(prev => ({ ...prev, balls: value }));
                }
              }
            )
          );
        }

        // Process rank points
        const rankTotal = rewardsByType.get('rank') || 0;
        if (rankTotal > 0) {
          animations.push(
            animateCount(
              currentUser.rankPoints,
              currentUser.rankPoints + rankTotal,
              {
                duration: 1000,
                easing: easeOutCubic,
                onUpdate: (value) => {
                  setUserCallback(prev => ({ ...prev, rankPoints: value }));
                }
              }
            )
          );
        }

        // Process leaderboard points
        const leaderboardTotal = rewardsByType.get('leaderboard') || 0;
        if (leaderboardTotal > 0) {
          animations.push(
            animateCount(
              currentUser.leaderboardScore || 0,
              (currentUser.leaderboardScore || 0) + leaderboardTotal,
              {
                duration: 1000,
                easing: easeOutCubic,
                onUpdate: (value) => {
                  setUserCallback((prev: any) => ({ ...prev, leaderboardScore: value }));
                }
              }
            )
          );
        }

        // Process EXP
        const expTotal = rewardsByType.get('exp') || 0;
        if (expTotal > 0) {
          let currentXp = currentUser.petXp;
          animations.push(
            animateCount(
              currentXp,
              currentXp + expTotal,
              {
                duration: 1000,
                easing: easeOutCubic,
                onUpdate: (value) => {
                  setUserCallback(prev => {
                    const progression = calculatePetLevelProgression(prev.petLevel, prev.petXp, value - prev.petXp);
                    return {
                      ...prev,
                      petXp: progression.newXp,
                      petLevel: progression.newLevel,
                      petMaxXp: progression.newMaxXp
                    };
                  });
                }
              }
            )
          );
        }

        // Process Pet EXP
        const petExpTotal = rewardsByType.get('petExp') || 0;
        if (petExpTotal > 0) {
          let currentXp = currentUser.petXp;
          animations.push(
            animateCount(
              currentXp,
              currentXp + petExpTotal,
              {
                duration: 1000,
                easing: easeOutCubic,
                onUpdate: (value) => {
                  setUserCallback(prev => {
                    const progression = calculatePetLevelProgression(prev.petLevel, prev.petXp, value - prev.petXp);
                    return {
                      ...prev,
                      petXp: progression.newXp,
                      petLevel: progression.newLevel,
                      petMaxXp: progression.newMaxXp
                    };
                  });
                }
              }
            )
          );
        }

        // Process skill points (badge points)
        skillRewards.forEach((total, skillName) => {
          const skill = currentSkills.find(s => s.name === skillName);
          if (skill && total > 0) {
            animations.push(
              new Promise<void>((resolve) => {
                let currentPoints = skill.points;
                animateCount(
                  currentPoints,
                  currentPoints + total,
                  {
                    duration: 1000,
                    easing: easeOutCubic,
                    onUpdate: (value) => {
                      setSkillsCallback(prev => prev.map(s => {
                        if (s.name === skillName) {
                          const oldLevel = s.currentLevel;
                          const oldMaxPoints = s.maxPoints;
                          const newPoints = value;
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
                            ...s,
                            points: cappedPoints,
                            currentLevel: newLevel,
                            maxPoints: newMaxPoints
                          };
                        }
                        return s;
                      }));
                    },
                    onComplete: resolve
                  }
                );
              })
            );
          }
        });

        // Wait for all animations to complete
        Promise.all(animations).then(() => {
          // Clear pending rewards after animations complete
          pendingRewardTotals.current.clear();
          console.log('All reward animations completed');
          resolve();
        });

        return [];
      });
    });
  }, [setPendingRewards]);

  return {
    rewardAnimations,
    setRewardAnimations,
    levelUpAnimations,
    setLevelUpAnimations,
    rewardNotifications,
    removeRewardNotification,
    pendingRewards,
    applyPendingRewards,
    applyPendingRewardsWithAnimations,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    processGrantedRewards,
    awardedRewards: awardedRewards.current,
  };
};

