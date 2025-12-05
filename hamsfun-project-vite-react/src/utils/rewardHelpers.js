/**
 * Reward Helpers with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { getAssetUrl } from './helpers';

/**
 * Skill name mapper with caching
 */
class SkillNameMapper {
  constructor() {
    this.cache = new Map();
    this.skillNameMap = {
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
  }

  map(apiSkillName) {
    if (this.cache.has(apiSkillName)) {
      return this.cache.get(apiSkillName);
    }

    const displayName = this.skillNameMap[apiSkillName] || apiSkillName;

    if (this.cache.size < 100) {
      this.cache.set(apiSkillName, displayName);
    }

    return displayName;
  }
}

const skillNameMapper = new SkillNameMapper();

/**
 * Maps API skill names to display names
 */
export const mapApiSkillNameToDisplayName = (apiSkillName) => {
  return skillNameMapper.map(apiSkillName);
};

/**
 * Checks if grantedRewards object has any valid rewards
 */
export const hasValidGrantedRewards = (grantedRewards) => {
  if (!grantedRewards) return false;

  return (
    (grantedRewards.coins && grantedRewards.coins > 0) ||
    (grantedRewards.rankPoints && grantedRewards.rankPoints > 0) ||
    (grantedRewards.leaderboardScore && grantedRewards.leaderboardScore > 0) ||
    (grantedRewards.badgePoints && Object.keys(grantedRewards.badgePoints || {}).length > 0) ||
    (grantedRewards.items && grantedRewards.items.length > 0)
  );
};

/**
 * Processes coins from API response
 */
export const processCoinsFromApi = (coins, setUser, triggerRewardAnimation) => {
  if (coins && coins > 0) {
    triggerRewardAnimation({
      type: 'coins',
      value: coins
    });

    setUser(prev => ({
      ...prev,
      coins: prev.coins + coins
    }));
    console.log(`Awarded ${coins} coins (from API)`);
  }
};

/**
 * Processes rank points from API response
 */
export const processRankPointsFromApi = (rankPoints, setUser, triggerRewardAnimation) => {
  if (rankPoints && rankPoints > 0) {
    triggerRewardAnimation({
      type: 'rank',
      value: rankPoints
    });

    setUser(prev => ({
      ...prev,
      rankPoints: prev.rankPoints + rankPoints
    }));
    console.log(`Awarded ${rankPoints} rank points (from API)`);
  }
};

/**
 * Processes badge points from API response and updates skills
 */
export const processBadgePointsFromApi = (
  badgePoints,
  setSkills,
  triggerRewardAnimation,
  handleSkillLevelUp
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

          const cappedPoints = newLevel === 5 ? newMaxPoints : (newPoints >= oldMaxPoints ? newMaxPoints : newPoints);

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
 */
export const processLeaderboardPointsFromApi = (leaderboardScore, setUser, triggerRewardAnimation) => {
  if (leaderboardScore && leaderboardScore > 0) {
    triggerRewardAnimation({
      type: 'leaderboard',
      value: leaderboardScore
    });

    setUser(prev => ({
      ...prev,
      leaderboardScore: (prev.leaderboardScore || 0) + leaderboardScore
    }));
    console.log(`Awarded ${leaderboardScore} leaderboard points (from API)`);
  }
};

/**
 * Processes items from API response
 */
export const processItemsFromApi = (items, triggerRewardAnimation, getItemIconUrl) => {
  if (items && items.length > 0) {
    items.forEach(item => {
      if (item.quantity > 0) {
        const iconUrl = getItemIconUrl
          ? getItemIconUrl(item.icon)
          : (item.icon?.startsWith('/') && !item.icon.startsWith('/Asset')
            ? `${import.meta.env.VITE_BACKEND_URL}${item.icon}`
            : item.icon || getAssetUrl("/Asset/item/classTicket.png"));

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

