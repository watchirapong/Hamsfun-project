import { Skill } from '@/types';

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
  triggerRewardAnimation: (reward: { type: 'coins'; value: number }) => void
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
 * Processes rank points from API response
 * @param rankPoints - Amount of rank points to award
 * @param setUser - State setter for user
 * @param triggerRewardAnimation - Function to trigger reward animation
 */
export const processRankPointsFromApi = (
  rankPoints: number,
  setUser: React.Dispatch<React.SetStateAction<any>>,
  triggerRewardAnimation: (reward: { type: 'rank'; value: number }) => void
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
  triggerRewardAnimation: (reward: { type: 'skill'; value: number; skillName: string }) => void,
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
