import { Skill } from '@/types';
import { getAssetUrl } from './helpers';
import { getItemIconUrl as getGlobalItemIconUrl } from './itemHelpers';
import { ObjectiveReward } from '@/types';

/**
 * Unified type for reward animation payload
 */
export type RewardAnimationPayload = {
  type: ObjectiveReward['type'];
  value: number;
  skillName?: string;
  itemName?: string;
  itemIcon?: string;
};

/**
 * Maps API skill names to display names
 * @param apiSkillName - The skill name from API (e.g., "GameDesign", "Explorer")
 * @returns The display name (e.g., "Game Design")
 */
export const mapApiSkillNameToDisplayName = (apiSkillName: string): string => {
  const skillNameMap: { [key: string]: string } = {
    "GameDesign": "Game Design",
    "gamedesign": "Game Design",
    "Game Design": "Game Design",
    "LevelDesign": "Level Design",
    "leveldesign": "Level Design",
    "Level Design": "Level Design",
    "Art": "Drawing",
    "art": "Drawing",
    "Drawing": "Drawing",
    "Programming": "C# Programming",
    "programming": "C# Programming",
    "C# Programming": "C# Programming",
    "CSharp": "C# Programming",
    "csharp": "C# Programming",
    "Explorer": "Game Design",
    "explorer": "Game Design"
  };

  return skillNameMap[apiSkillName] || apiSkillName;
};

/**
 * Checks if grantedRewards object has any valid rewards
 * @param grantedRewards - The grantedRewards object from API response
 * @returns true if grantedRewards exists and has at least one non-zero value
 */
export const hasValidGrantedRewards = (grantedRewards: any): boolean => {
  if (!grantedRewards) return false;

  return (
    (grantedRewards.coins && grantedRewards.coins > 0) ||
    (grantedRewards.balls && grantedRewards.balls > 0) ||
    (grantedRewards.rankPoints && grantedRewards.rankPoints > 0) ||
    (grantedRewards.leaderboardScore && grantedRewards.leaderboardScore > 0) ||
    (grantedRewards.badgePoints && Object.keys(grantedRewards.badgePoints || {}).length > 0) ||
    (grantedRewards.items && grantedRewards.items.length > 0)
  );
};

/**
 * Processes coins from API response
 * @param coins - Amount of coins to award
 * @param setUser - State setter for user
 * @param triggerRewardAnimation - Function to trigger reward animation
 */
export const processCoinsFromApi = (
  coins: number,
  setUser: React.Dispatch<React.SetStateAction<any>>,
  triggerRewardAnimation: (reward: RewardAnimationPayload) => void
) => {
  if (coins && coins > 0) {
    triggerRewardAnimation({
      type: 'coins',
      value: coins
    });

    setUser((prev: any) => ({
      ...prev,
      coins: prev.coins + coins
    }));
    console.log(`Awarded ${coins} coins (from API)`);
  }
};

/**
 * Processes balls from API response (Hamster only)
 * @param balls - Amount of balls to award
 * @param setUser - State setter for user
 * @param triggerRewardAnimation - Function to trigger reward animation
 */
export const processBallsFromApi = (
  balls: number,
  setUser: React.Dispatch<React.SetStateAction<any>>,
  triggerRewardAnimation: (reward: RewardAnimationPayload) => void
) => {
  if (balls && balls > 0) {
    triggerRewardAnimation({
      type: 'balls',
      value: balls
    });

    setUser((prev: any) => ({
      ...prev,
      balls: (prev.balls || 0) + balls
    }));
    console.log(`Awarded ${balls} balls (from API)`);
  }
};

/**
 * Processes rank points from API response
 * @param rankPoints - Amount of rank points to award
 * @param setUser - State setter for user
 * @param triggerRewardAnimation - Function to trigger reward animation
 */
export const processRankPointsFromApi = (
  rankPoints: number,
  setUser: React.Dispatch<React.SetStateAction<any>>,
  triggerRewardAnimation: (reward: RewardAnimationPayload) => void
) => {
  if (rankPoints && rankPoints > 0) {
    triggerRewardAnimation({
      type: 'rank',
      value: rankPoints
    });

    setUser((prev: any) => ({
      ...prev,
      rankPoints: prev.rankPoints + rankPoints
    }));
    console.log(`Awarded ${rankPoints} rank points (from API)`);
  }
};

/**
 * Processes badge points from API response and updates skills
 * Handles skill level-ups and triggers animations
 * @param badgePoints - Object with skill names as keys and points as values
 * @param setSkills - State setter for skills
 * @param triggerRewardAnimation - Function to trigger reward animation
 * @param handleSkillLevelUp - Function to handle skill level-up
 */
export const processBadgePointsFromApi = (
  badgePoints: { [skillName: string]: number },
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>,
  triggerRewardAnimation: (reward: RewardAnimationPayload) => void,
  handleSkillLevelUp: (skillName: string, newLevel: number, skillRewards?: { type: string; value: string }[]) => void
) => {
  console.log('[Badge Processing] Processing badge points from backend:', badgePoints);

  Object.keys(badgePoints).forEach(skillName => {
    const pointsToAdd = badgePoints[skillName];
    if (pointsToAdd && pointsToAdd > 0) {
      const displayName = mapApiSkillNameToDisplayName(skillName);

      console.log(`[Badge Processing] Awarding ${pointsToAdd} points to ${displayName} (API name: ${skillName})`);

      // Trigger reward animation for badge points
      triggerRewardAnimation({
        type: 'skill',
        value: pointsToAdd,
        skillName: displayName
      });

      // Award badge points directly
      setSkills(prev => prev.map(skill => {
        if (skill.name === displayName) {
          const oldLevel = skill.currentLevel;
          const oldPoints = skill.points;
          const oldMaxPoints = skill.maxPoints;
          const newPoints = oldPoints + pointsToAdd;

          let newLevel = oldLevel;
          let newMaxPoints = oldMaxPoints;

          // Check if skill should level up
          if (newPoints >= oldMaxPoints && oldLevel < 5) {
            newLevel = oldLevel + 1;
            newMaxPoints = 10000 * newLevel;

            // Trigger level-up animation
            setTimeout(() => {
              handleSkillLevelUp(skill.name, newLevel, skill.rewards);
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
    }
  });
};

/**
 * Processes leaderboard points from API response
 * @param leaderboardScore - Amount of leaderboard points to award
 * @param setUser - State setter for user
 * @param triggerRewardAnimation - Function to trigger reward animation
 */
export const processLeaderboardPointsFromApi = (
  leaderboardScore: number,
  setUser: React.Dispatch<React.SetStateAction<any>>,
  triggerRewardAnimation: (reward: RewardAnimationPayload) => void
) => {
  if (leaderboardScore && leaderboardScore > 0) {
    triggerRewardAnimation({
      type: 'leaderboard',
      value: leaderboardScore
    });

    setUser((prev: any) => ({
      ...prev,
      leaderboardScore: (prev.leaderboardScore || 0) + leaderboardScore
    }));
    console.log(`Awarded ${leaderboardScore} leaderboard points (from API)`);
  }
};

/**
 * Processes items from API response
 * @param items - Array of items to award
 * @param triggerRewardAnimation - Function to trigger reward animation
 * @param getItemIconUrl - Function to get item icon URL
 */
export const processItemsFromApi = (
  items: Array<{ itemId: string; name: string; quantity: number; icon?: string }>,
  triggerRewardAnimation: (reward: RewardAnimationPayload) => void,
  getItemIconUrl?: (icon?: string) => string
) => {
  if (items && items.length > 0) {
    items.forEach(item => {
      if (item.quantity > 0) {
        const iconResolver = getItemIconUrl || getGlobalItemIconUrl;
        const iconUrl = iconResolver(item.icon);

        triggerRewardAnimation({
          type: 'item',
          value: item.quantity,
          itemName: item.name,
          itemIcon: iconUrl
        });
        console.log(`Awarded ${item.quantity}x ${item.name} (from API)`);
      }
    });
  }
};
