import { userAPI } from '@/lib/api';
import { Skill } from '@/types';
import { mapApiSkillNameToDisplayName } from './rewardHelpers';
import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';

/**
 * Refreshes badge data from backend and updates skills state
 * This ensures frontend badge data matches backend after rewards are granted
 * @param setSkills - State setter for skills
 * @returns Promise that resolves when badge data is refreshed
 */
export const refreshBadgeDataFromBackend = async (
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>
): Promise<void> => {
  try {
    const profile = await userAPI.getMyProfile();
    
    if (!profile.badges) {
      console.warn('No badge data in profile response');
      return;
    }
    
    // Handle badges - could be object or array
    let badgesObject: { [key: string]: any } = {};
    if (Array.isArray(profile.badges)) {
      profile.badges.forEach((badge: any) => {
        const key = badge.skill || badge.name || badge.skillName || 'Unknown';
        badgesObject[key] = badge;
      });
    } else if (typeof profile.badges === 'object') {
      badgesObject = profile.badges;
    }
    
    if (Object.keys(badgesObject).length === 0) {
      console.warn('No badge data found after refresh');
      return;
    }
    
    const skillsMap: { [key: string]: Skill } = {};
    const skillIconMap: { [key: string]: any } = {
      "GameDesign": Gamepad2,
      "gamedesign": Gamepad2,
      "Game Design": Gamepad2,
      "LevelDesign": Monitor,
      "leveldesign": Monitor,
      "Level Design": Monitor,
      "Art": Paintbrush,
      "art": Paintbrush,
      "Drawing": Paintbrush,
      "Programming": Code,
      "programming": Code,
      "C# Programming": Code,
      "CSharp": Code,
      "csharp": Code,
      "Explorer": Gamepad2,
      "explorer": Gamepad2
    };
    
    Object.keys(badgesObject).forEach(apiSkillName => {
      const badgeData = badgesObject[apiSkillName];
      const displayName = mapApiSkillNameToDisplayName(apiSkillName);
      const icon = skillIconMap[apiSkillName] || Gamepad2;
      
      // Map rank string to level number
      let mappedLevel = 1; // Default to Unranked
      const rankString = badgeData.rank || badgeData.currentTier || '';
      if (rankString) {
        const normalizedRank = rankString.toLowerCase().trim();
        if (normalizedRank === 'bronze') {
          mappedLevel = 2;
        } else if (normalizedRank === 'silver') {
          mappedLevel = 3;
        } else if (normalizedRank === 'gold') {
          mappedLevel = 4;
        } else if (normalizedRank === 'diamond') {
          mappedLevel = 5;
        } else if (normalizedRank === 'unranked') {
          mappedLevel = 1;
        }
      }
      
      const currentPoints = badgeData.points || 0;
      const maxPoints = mappedLevel >= 5 ? 10000 : (badgeData.nextRankPoints || 10000);
      
      skillsMap[displayName] = {
        name: displayName,
        icon: icon,
        currentLevel: mappedLevel,
        points: currentPoints,
        maxPoints: maxPoints,
        description: badgeData.description || "",
        rewards: badgeData.rewards || []
      };
    });
    
    if (Object.keys(skillsMap).length > 0) {
      console.log('Refreshed badge data from backend:', Object.values(skillsMap));
      setSkills(Object.values(skillsMap));
    }
  } catch (error) {
    console.error('Error refreshing badge data from backend:', error);
  }
};

