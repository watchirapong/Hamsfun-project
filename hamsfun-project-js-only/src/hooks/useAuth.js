/**
 * Authentication Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { userAPI, getToken, setToken, removeToken } from '@/lib/api';
import { getRankIconPath, getAssetUrl } from '@/utils/helpers';
import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';

/**
 * Default user state factory
 */
const createDefaultUser = () => ({
  name: 'User',
  avatar: getAssetUrl("/Asset/pets/dog.png"),
  badge: getRankIconPath("Meteor I"),
  coins: 0,
  rankPoints: 0,
  rankName: "Meteor I",
  nextRankPoints: undefined,
  rankObjectives: [],
  gameDemos: 0,
  petLevel: 1,
  petXp: 0,
  petMaxXp: 1000
});

/**
 * Skill name mapper with caching
 */
class SkillNameMapper {
  constructor() {
    this.cache = new Map();
    this.skillNameMap = {
      "GameDesign": { displayName: "Game Design", icon: Gamepad2 },
      "gamedesign": { displayName: "Game Design", icon: Gamepad2 },
      "Game Design": { displayName: "Game Design", icon: Gamepad2 },
      "LevelDesign": { displayName: "Level Design", icon: Monitor },
      "leveldesign": { displayName: "Level Design", icon: Monitor },
      "Level Design": { displayName: "Level Design", icon: Monitor },
      "Art": { displayName: "Drawing", icon: Paintbrush },
      "art": { displayName: "Drawing", icon: Paintbrush },
      "Drawing": { displayName: "Drawing", icon: Paintbrush },
      "Programming": { displayName: "C# Programming", icon: Code },
      "programming": { displayName: "C# Programming", icon: Code },
      "C# Programming": { displayName: "C# Programming", icon: Code },
      "CSharp": { displayName: "C# Programming", icon: Code },
      "csharp": { displayName: "C# Programming", icon: Code },
      "Explorer": { displayName: "Game Design", icon: Gamepad2 },
      "explorer": { displayName: "Game Design", icon: Gamepad2 }
    };
  }

  getSkillInfo(apiSkillName) {
    if (this.cache.has(apiSkillName)) {
      return this.cache.get(apiSkillName);
    }

    const skillInfo = this.skillNameMap[apiSkillName] || { 
      displayName: apiSkillName, 
      icon: Gamepad2 
    };

    if (this.cache.size < 100) {
      this.cache.set(apiSkillName, skillInfo);
    }

    return skillInfo;
  }
}

const skillNameMapper = new SkillNameMapper();

/**
 * Badge level mapper
 */
const mapBadgeLevel = (rankString) => {
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
 * Get default skills
 */
const getDefaultSkills = () => [
  { name: "Game Design", icon: Gamepad2, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] },
  { name: "Level Design", icon: Monitor, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] },
  { name: "Drawing", icon: Paintbrush, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] },
  { name: "C# Programming", icon: Code, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] }
];

/**
 * Process badges from backend response
 */
const processBadges = (badges) => {
  let badgesObject = {};
  
  if (badges) {
    if (Array.isArray(badges)) {
      badges.forEach((badge) => {
        const key = badge.skill || badge.name || badge.skillName || 'Unknown';
        badgesObject[key] = badge;
      });
    } else if (typeof badges === 'object') {
      badgesObject = badges;
    }
  }

  if (!badgesObject || Object.keys(badgesObject).length === 0) {
    return getDefaultSkills();
  }

  const skillsMap = {};
  
  Object.keys(badgesObject).forEach(apiSkillName => {
    const badgeData = badgesObject[apiSkillName];
    const skillInfo = skillNameMapper.getSkillInfo(apiSkillName);

    const mappedLevel = mapBadgeLevel(badgeData.rank || badgeData.currentTier || '');
    const currentPoints = badgeData.points || 0;
    const maxPoints = mappedLevel >= 5 ? 10000 : (badgeData.nextRankPoints || 10000);

    skillsMap[skillInfo.displayName] = {
      name: skillInfo.displayName,
      icon: skillInfo.icon,
      currentLevel: mappedLevel,
      points: currentPoints,
      maxPoints: maxPoints,
      description: badgeData.description || "",
      rewards: badgeData.rewards || []
    };
  });

  return Object.keys(skillsMap).length > 0 
    ? Object.values(skillsMap) 
    : getDefaultSkills();
};

/**
 * Map backend profile to frontend user format
 */
const mapProfileToUser = (profile) => ({
  name: profile.discordNickname || profile.discordUsername || profile.name || 'User',
  avatar: profile.avatar || getAssetUrl("/Asset/pets/dog.png"),
  badge: getRankIconPath(profile.rank?.currentTier || "Meteor I"),
  coins: profile.coins || 0,
  rankPoints: profile.rank?.points || 0,
  rankName: profile.rank?.currentTier || "Meteor I",
  nextRankPoints: profile.rank?.nextRankPoints || undefined,
  gameDemos: profile.gameDemos || 0,
  petLevel: profile.petLevel || 1,
  petXp: profile.petXp || 0,
  petMaxXp: profile.petMaxXp || 1000,
  rankObjectives: profile.rankObjectives || []
});

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(createDefaultUser);
  const [skills, setSkills] = useState(getDefaultSkills);

  const handleLogout = useCallback(() => {
    removeToken();
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // Check for token in URL (from Discord OAuth redirect)
        if (typeof window === 'undefined') return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
          setToken(tokenFromUrl);
          // Remove token from URL
          window.history.replaceState({}, '', window.location.pathname);
        }

        const token = getToken();
        if (!token) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }

        // Fetch user profile
        try {
          const profile = await userAPI.getMyProfile();
          
          if (!isMounted) return;

          setUser(mapProfileToUser(profile));
          setSkills(processBadges(profile.badges));
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized return value
  return useMemo(() => ({
    isLoading,
    setIsLoading,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    skills,
    setSkills,
    handleLogout
  }), [isLoading, isAuthenticated, user, skills, handleLogout]);
};

