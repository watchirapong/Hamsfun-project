import { useState, useEffect } from 'react';
import { userAPI, getToken, setToken } from '@/lib/api';
import { User, Skill } from '@/types';
import { getRankIconPath, getAssetUrl } from '@/utils/helpers';
import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>({
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
  const [skills, setSkills] = useState<Skill[]>([]);

  const handleLogout = () => {
    const { removeToken } = require('@/lib/api');
    removeToken();
    setIsAuthenticated(false);
    window.location.reload();
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for token in URL (from Discord OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
          setToken(tokenFromUrl);
          // Remove token from URL
          window.history.replaceState({}, '', window.location.pathname);
        }

        const token = getToken();
        if (!token) {
          // No token - redirect to login or show login button
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Fetch user profile
        try {
          const profile = await userAPI.getMyProfile();
          // Map backend profile to frontend User interface
          setUser({
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

          // Map badges/skills from backend
          let badgesObject: { [key: string]: any } = {};
          if (profile.badges) {
            if (Array.isArray(profile.badges)) {
              profile.badges.forEach((badge: any) => {
                const key = badge.skill || badge.name || badge.skillName || 'Unknown';
                badgesObject[key] = badge;
              });
            } else if (typeof profile.badges === 'object') {
              badgesObject = profile.badges;
            }
          }

          if (badgesObject && Object.keys(badgesObject).length > 0) {
            const skillsMap: { [key: string]: Skill } = {};
            const skillNameMap: { [key: string]: { displayName: string; icon: any } } = {
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

            Object.keys(badgesObject).forEach(apiSkillName => {
              const badgeData = badgesObject[apiSkillName];
              const skillInfo = skillNameMap[apiSkillName] || { displayName: apiSkillName, icon: Gamepad2 };

              let mappedLevel = 1;
              const rankString = badgeData.rank || badgeData.currentTier || '';
              if (rankString) {
                const normalizedRank = rankString.toLowerCase().trim();
                if (normalizedRank === 'bronze') mappedLevel = 2;
                else if (normalizedRank === 'silver') mappedLevel = 3;
                else if (normalizedRank === 'gold') mappedLevel = 4;
                else if (normalizedRank === 'diamond') mappedLevel = 5;
                else if (normalizedRank === 'unranked') mappedLevel = 1;
              }

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

            if (Object.keys(skillsMap).length > 0) {
              setSkills(Object.values(skillsMap));
            } else {
              setSkills(getDefaultSkills());
            }
          } else {
            setSkills(getDefaultSkills());
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return {
    isLoading,
    setIsLoading,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    skills,
    setSkills,
    handleLogout
  };
};

const getDefaultSkills = (): Skill[] => [
  { name: "Game Design", icon: Gamepad2, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] },
  { name: "Level Design", icon: Monitor, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] },
  { name: "Drawing", icon: Paintbrush, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] },
  { name: "C# Programming", icon: Code, currentLevel: 1, points: 0, maxPoints: 10000, description: "", rewards: [] }
];

