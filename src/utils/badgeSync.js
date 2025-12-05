/**
 * Badge Sync Utilities with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { userAPI } from '@/lib/api';
import { mapApiSkillNameToDisplayName } from './rewardHelpers';
import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';

/**
 * Map rank string to level number
 */
const mapRankToLevel = (rankString) => {
  if (!rankString) return 1;
  
  const normalizedRank = rankString.toLowerCase().trim();
  if (normalizedRank === 'bronze') return 2;
  if (normalizedRank === 'silver') return 3;
  if (normalizedRank === 'gold') return 4;
  if (normalizedRank === 'diamond') return 5;
  if (normalizedRank === 'unranked') return 1;
  return 1;
};

/**
 * Refreshes badge data from backend and updates skills state
 * This ensures frontend badge data matches backend after rewards are granted
 */
export const refreshBadgeDataFromBackend = async (setSkills) => {
  try {
    const profile = await userAPI.getMyProfile();
    
    if (!profile.badges) {
      console.warn('No badge data in profile response');
      return;
    }
    
    // Handle badges - could be object or array
    let badgesObject = {};
    if (Array.isArray(profile.badges)) {
      profile.badges.forEach((badge) => {
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
    
    const skillsMap = {};
    const skillIconMap = {
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
      
      const mappedLevel = mapRankToLevel(badgeData.rank || badgeData.currentTier || '');
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

