import { useState, useRef } from 'react';
import { ObjectiveReward, User, Skill } from '@/types';
import { calculatePetLevelProgression } from '@/services/rewardService';

export interface RewardAnimationInstance {
  id: string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal';
  value: number | string;
  skillName?: string;
  x: number;
  y: number;
  driftX: number;
  startTime: number;
}

export const useRewards = (
  setUser: React.Dispatch<React.SetStateAction<User>>,
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>
) => {
  const [rewardAnimations, setRewardAnimations] = useState<RewardAnimationInstance[]>([]);
  const [levelUpAnimations, setLevelUpAnimations] = useState<Set<string>>(new Set());
  
  // Ref to track reward animations in progress to prevent duplicates
  const rewardAnimationsInProgress = useRef<Set<string>>(new Set());
  
  // Ref to track awarded rewards to prevent duplicates when overlay closes
  const awardedRewards = useRef<Set<string>>(new Set());
  
  // Ref for unique animation ID counter
  const animationIdCounter = useRef<number>(0);
  
  // Ref to track skill level-ups to prevent duplicate rewards
  const skillLevelUpProcessed = useRef<Set<string>>(new Set());

  // Function to trigger reward animation
  const triggerRewardAnimation = (reward: ObjectiveReward) => {
    console.log('triggerRewardAnimation called with:', reward);
    const rewardKey = `${reward.type}-${reward.value || 0}-${reward.skillName || ''}`;
    const now = Date.now();
    
    // Check if this exact reward animation was triggered recently (within last 1000ms)
    const recentReward = Array.from(rewardAnimationsInProgress.current).find(key => {
      if (key.startsWith(rewardKey + '-')) {
        const timestamp = parseInt(key.split('-').pop() || '0');
        return now - timestamp < 1000;
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
    const margin = 100;
    const x = margin + Math.random() * (window.innerWidth - margin * 2);
    const y = margin + Math.random() * (window.innerHeight * 0.3); // Spawn in upper 30% of screen
    
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
        x,
        y,
        driftX,
        startTime: Date.now()
      };
      console.log('Adding reward animation to state:', newAnimation, 'Total animations:', prev.length + 1);
      return [...prev, newAnimation];
    });
    
    // Remove animation after it completes (bubble animation duration)
    setTimeout(() => {
      setRewardAnimations(prev => prev.filter(anim => anim.id !== animationId));
      // Remove from in-progress set after animation completes
      rewardAnimationsInProgress.current.delete(rewardKeyWithTimestamp);
    }, 5000); // 5 seconds for slower animation
  };

  // Helper function to award objective reward
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
    
    // Award the reward based on type
    if (reward.type === 'coins') {
      const coinValue = typeof reward.value === 'number' ? reward.value : 0;
      if (coinValue > 0) {
        setUser(prev => ({
          ...prev,
          coins: prev.coins + coinValue
        }));
        console.log(`Awarded ${coinValue} coins`);
      }
    } else if (reward.type === 'exp') {
      const expValue = typeof reward.value === 'number' ? reward.value : 0;
      if (expValue > 0) {
        setUser(prev => {
          // All XP goes to pet (100% of exp reward)
          // Calculate multiple level-ups if needed
          const progression = calculatePetLevelProgression(prev.petLevel, prev.petXp, expValue);
          
          return {
            ...prev,
            petXp: progression.newXp,
            petLevel: progression.newLevel,
            petMaxXp: progression.newMaxXp
          };
        });
        console.log(`Awarded ${expValue} XP to pet`);
      }
    } else if (reward.type === 'rank') {
      const rankValue = typeof reward.value === 'number' ? reward.value : 0;
      if (rankValue > 0) {
        setUser(prev => ({
          ...prev,
          rankPoints: prev.rankPoints + rankValue
        }));
        console.log(`Awarded ${rankValue} rank points`);
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
            
            // Preserve current level - only level up when points reach or exceed maxPoints
            let newLevel = oldLevel;
            let newMaxPoints = oldMaxPoints;
            
            // Check if skill should level up (points reached maxPoints)
            // Cap at level 5 (Diamond) - no progression after Diamond
            if (newPoints >= oldMaxPoints && oldLevel < 5) {
              newLevel = oldLevel + 1;
              newMaxPoints = 10000 * newLevel;
              
              // Trigger level-up animation after state update
              setTimeout(() => {
                handleSkillLevelUp(skill.name, newLevel, skill.rewards);
              }, 100);
            }
            
            // Cap points at maxPoints for current level (don't exceed until level up)
            // Diamond (level 5) doesn't accumulate points
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
        console.log(`Awarded ${skillValue} points to ${reward.skillName} skill`);
      }
    } else if (reward.type === 'animal') {
      // Award animal (special reward) - could add to a collection or show notification
      console.log('Awarded animal:', reward.value);
    }
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

  // Function to handle skill level-up
  const handleSkillLevelUp = (skillName: string, newLevel: number, skillRewards?: { type: string; value: string }[]) => {
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
  };

  return {
    rewardAnimations,
    setRewardAnimations,
    levelUpAnimations,
    setLevelUpAnimations,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    awardedRewards: awardedRewards.current,
  };
};

