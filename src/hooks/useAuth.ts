import { useState, useEffect } from 'react';
import { getToken, setToken } from '@/lib/api';
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
    balls: 0,
    rankPoints: 0,
    rankName: "Meteor I",
    nextRankPoints: undefined,
    rankObjectives: [],
    gameDemos: 0,
    petLevel: 1,
    petXp: 0,
    petMaxXp: 1000,
    petStats: {
      maxHealth: 100,
      attackDamage: 10,
      defense: 5,
    },
    isHamster: false,
    hamsterRank: undefined,
    ownerCity: undefined,
  });
  const [skills, setSkills] = useState<Skill[]>([]);

  const handleLogout = () => {
    const { removeToken } = require('@/lib/api');
    removeToken();
    setIsAuthenticated(false);
    window.location.reload();
  };

  useEffect(() => {
    const checkAuth = () => {
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
          // No token - not authenticated
          setIsLoading(false);
          return;
        }

        // Token exists - mark as authenticated
        // Profile fetching is handled by initializeApp in page components
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
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

