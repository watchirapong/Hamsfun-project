/**
 * Rewards Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 * Handles reward animations, pending rewards queue, and duplicate protection
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { calculatePetLevelProgression } from '@/services/rewardService';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';
import { getAssetUrl } from '@/utils/helpers';
import { animateCount, easeOutCubic } from '@/utils/countingAnimation';

/**
 * Calculate bubble spawn position within main page boundaries
 */
const calculateBubblePosition = () => {
  const mainPageWidth = 428; // Main page max width
  const bubbleSize = 80;
  const margin = Math.max(20, bubbleSize / 2);
  
  const mainPageLeft = (window.innerWidth - mainPageWidth) / 2;
  const mainPageRight = mainPageLeft + mainPageWidth;
  
  const minX = mainPageLeft + margin;
  const maxX = mainPageRight - margin - bubbleSize;
  
  const validMinX = Math.max(mainPageLeft, minX);
  const validMaxX = Math.max(validMinX + bubbleSize, Math.min(maxX, mainPageRight - bubbleSize));
  
  const x = validMinX + Math.random() * (validMaxX - validMinX);
  const clampedX = Math.max(mainPageLeft, Math.min(x, mainPageRight - bubbleSize));
  
  const bottomMargin = 20;
  const y = window.innerHeight - bottomMargin;
  
  const driftDirection = Math.random() > 0.5 ? 1 : -1;
  const driftAmount = 30 + Math.random() * 40;
  const driftX = driftDirection * driftAmount;
  
  return { x: clampedX, y, driftX };
};

/**
 * Create reward key for duplicate detection
 */
const createRewardKey = (reward, contextKey) => {
  return contextKey
    ? `${contextKey}-${reward.type}-${reward.value || 0}-${reward.skillName || ''}-${reward.itemName || ''}-${reward.itemId || ''}`
    : `${reward.type}-${reward.value || 0}-${reward.skillName || ''}-${reward.itemName || ''}-${reward.itemId || ''}`;
};

/**
 * Create merge key for pending rewards
 */
const createMergeKey = (reward) => {
  if (reward.type === 'skill') {
    return `${reward.type}-${reward.skillName}`;
  }
  if (reward.type === 'item') {
    return `${reward.type}-${reward.itemId}`;
  }
  return reward.type;
};

export const useRewards = (setUser, setSkills) => {
  const [rewardAnimations, setRewardAnimations] = useState([]);
  const [levelUpAnimations, setLevelUpAnimations] = useState(new Set());
  const [rewardNotifications, setRewardNotifications] = useState([]);
  const [pendingRewards, setPendingRewards] = useState([]);

  // Refs for tracking and preventing duplicates
  const notificationIdCounter = useRef(0);
  const rewardAnimationsInProgress = useRef(new Set());
  const awardedRewards = useRef(new Set());
  const animationIdCounter = useRef(0);
  const skillLevelUpProcessed = useRef(new Set());
  const handleSkillLevelUpRef = useRef(null);
  const animatedRewards = useRef(new Set());
  const pendingRewardTotals = useRef(new Map());

  // Function to trigger reward notification
  const triggerRewardNotification = useCallback((reward) => {
    notificationIdCounter.current += 1;
    const notificationId = `notification-${Date.now()}-${notificationIdCounter.current}`;

    const notification = {
      id: notificationId,
      type: reward.type,
      value: reward.value || 0,
      skillName: reward.skillName,
      itemName: reward.itemName,
      itemIcon: reward.itemIcon,
    };

    setRewardNotifications(prev => [...prev, notification]);
  }, []);

  // Function to remove reward notification
  const removeRewardNotification = useCallback((id) => {
    setRewardNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Function to trigger reward animation
  const triggerRewardAnimation = useCallback((reward) => {
    console.log('triggerRewardAnimation called with:', reward);

    // Also trigger notification
    triggerRewardNotification(reward);

    const rewardKey = createRewardKey(reward);
    const now = Date.now();

    // Check if this exact reward animation was triggered recently (within last 2000ms)
    const recentReward = Array.from(rewardAnimationsInProgress.current).find(key => {
      const baseKey = key.substring(0, key.lastIndexOf('-'));
      if (baseKey === rewardKey) {
        const timestamp = parseInt(key.split('-').pop() || '0', 10);
        return now - timestamp < 2000;
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

    const { x, y, driftX } = calculateBubblePosition();

    setRewardAnimations(prev => {
      // Ensure no duplicate IDs (safety check)
      const existingIds = new Set(prev.map(anim => anim.id));
      if (existingIds.has(animationId)) {
        console.log('Animation ID already exists, skipping:', animationId);
        return prev;
      }
      
      const newAnimation = {
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
      rewardAnimationsInProgress.current.delete(rewardKeyWithTimestamp);
    }, 8000);
  }, [triggerRewardNotification]);

  // Function to apply a reward immediately
  const applyRewardImmediately = useCallback((reward) => {
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
        setUser(prev => ({
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
  }, [setUser, setSkills]);

  // Function to apply pending rewards (placeholder - called from page.tsx)
  const applyPendingRewards = useCallback(async () => {
    const pending = pendingRewardTotals.current;
    if (pending.size === 0) {
      setPendingRewards([]);
      return;
    }
    
    // Clear pending rewards after processing
    pendingRewardTotals.current.clear();
    setPendingRewards([]);
  }, []);

  // Helper function to award objective reward (queues rewards instead of applying immediately)
  const awardObjectiveReward = useCallback((reward, contextKey) => {
    const rewardKey = createRewardKey(reward, contextKey);

    // DOUBLE PROTECTION: Check if this exact reward was already awarded
    if (awardedRewards.current.has(rewardKey)) {
      console.log('Reward already awarded (with context), skipping:', rewardKey);
      return;
    }

    // DOUBLE PROTECTION: Check if this reward animation was already triggered
    const animationKey = createRewardKey(reward);
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
    const mergeKey = createMergeKey(reward);

    // Merge with existing pending rewards of the same type
    const currentTotal = pendingRewardTotals.current.get(mergeKey) || 0;
    pendingRewardTotals.current.set(mergeKey, currentTotal + rewardValue);

    // Add to pending rewards list for tracking
    setPendingRewards(prev => {
      const existingIndex = prev.findIndex(p => 
        p.type === reward.type &&
        (reward.type === 'skill' ? p.skillName === reward.skillName : true) &&
        (reward.type === 'item' ? p.itemId === reward.itemId : true)
      );

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const newValue = (typeof existing.value === 'number' ? existing.value : 0) + rewardValue;
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          value: newValue
        };
        return updated;
      } else {
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
  }, [triggerRewardAnimation]);

  // Helper function to award quest completion rewards
  const awardQuestRewards = useCallback((rewards, questId) => {
    rewards.forEach((reward, index) => {
      const rewardKey = `quest-${questId}-reward-${index}`;
      if (!awardedRewards.current.has(rewardKey)) {
        awardedRewards.current.add(rewardKey);
        awardObjectiveReward(reward, rewardKey);
      }
    });
  }, [awardObjectiveReward]);

  // Helper function to process rewards from grantedRewards object
  const processGrantedRewards = useCallback((grantedRewards, contextKey) => {
    if (!grantedRewards) return;

    // Process coins
    if (grantedRewards.coins && grantedRewards.coins > 0) {
      const rewardKey = contextKey ? `${contextKey}-coins` : `granted-coins-${Date.now()}`;
      awardObjectiveReward({ type: 'coins', value: grantedRewards.coins }, rewardKey);
    }

    // Process rank points
    if (grantedRewards.rankPoints && grantedRewards.rankPoints > 0) {
      const rewardKey = contextKey ? `${contextKey}-rank` : `granted-rank-${Date.now()}`;
      awardObjectiveReward({ type: 'rank', value: grantedRewards.rankPoints }, rewardKey);
    }

    // Process leaderboard points
    if (grantedRewards.leaderboardScore && grantedRewards.leaderboardScore > 0) {
      const rewardKey = contextKey ? `${contextKey}-leaderboard` : `granted-leaderboard-${Date.now()}`;
      awardObjectiveReward({ type: 'leaderboard', value: grantedRewards.leaderboardScore }, rewardKey);
    }

    // Process items
    if (grantedRewards.items && Array.isArray(grantedRewards.items) && grantedRewards.items.length > 0) {
      grantedRewards.items.forEach((item, index) => {
        if (item.quantity > 0) {
          const iconUrl = item.icon?.startsWith('/') && !item.icon.startsWith('/Asset')
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${item.icon}`
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

    // Process badge points
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
  }, [awardObjectiveReward]);

  // Function to handle skill level-up
  const handleSkillLevelUp = useCallback((skillName, newLevel, skillRewards) => {
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
      skillRewards.forEach(reward => {
        if (reward.type === 'coins') {
          const coinValue = parseInt(reward.value.replace('x', ''), 10) || 0;
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

  // Function to apply pending rewards with smooth animations
  const applyPendingRewardsWithAnimations = useCallback(async (
    currentUser,
    currentSkills,
    setUserCallback,
    setSkillsCallback
  ) => {
    return new Promise((resolve) => {
      setPendingRewards(prevPending => {
        if (prevPending.length === 0) {
          resolve();
          return [];
        }

        console.log('Applying pending rewards with animations:', prevPending);

        // Group rewards by type for merging
        const rewardsByType = new Map();
        const skillRewards = new Map();
        const itemRewards = new Map();

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
        const animations = [];

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
                  setUserCallback(prev => ({ ...prev, leaderboardScore: value }));
                }
              }
            )
          );
        }

        // Process EXP
        const expTotal = rewardsByType.get('exp') || 0;
        if (expTotal > 0) {
          const currentXp = currentUser.petXp;
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

        // Process skill points (badge points)
        skillRewards.forEach((total, skillName) => {
          const skill = currentSkills.find(s => s.name === skillName);
          if (skill && total > 0) {
            animations.push(
              new Promise((resolve) => {
                const currentPoints = skill.points;
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
          pendingRewardTotals.current.clear();
          console.log('All reward animations completed');
          resolve();
        });

        return [];
      });
    });
  }, [setPendingRewards]);

  // Memoized return value
  return useMemo(() => ({
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
  }), [
    rewardAnimations,
    levelUpAnimations,
    rewardNotifications,
    pendingRewards,
    removeRewardNotification,
    applyPendingRewards,
    applyPendingRewardsWithAnimations,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    processGrantedRewards,
  ]);
};

