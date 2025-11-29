'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Gamepad2, Monitor, Paintbrush, Code, ChevronRight, Star, Crown, Users, Ticket, Coins, X, Check, Edit2, Gift, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { userAPI, questAPI, authAPI, getToken, setToken, removeToken } from '@/lib/api';

interface RankObjective {
  text: string;
  completed: boolean;
  questId?: number; // Link to main quest
  coinCost?: number; // Cost to rank up
}

// Rank system from bottom to top
const RANKS = [
  'Meteor I',
  'Meteor II',
  'Meteor III',
  'Planet I',
  'Planet II',
  'Planet III',
  'Star I',
  'Star II',
  'Star III',
  'Supernova',
  'Cosmic'
] as const;

type RankName = typeof RANKS[number];

// Function to get badge icon path based on skill name and level
const getBadgeIconPath = (skillName: string, level: number): string => {
  // Normalize skill name (handle variations from API and display names)
  const normalizedName = skillName.toLowerCase().trim();
  
  // Map skill names to folder names and abbreviations
  // Handle both API badge names and display names
  let folder = "art"; // default
  let skillAbbr = "art"; // default
  
  // Game Design (including "Explorer" badge name)
  if (normalizedName.includes("game") || 
      normalizedName === "gamedesign" || 
      normalizedName === "explorer") {
    folder = "gameDesign";
    skillAbbr = "game";
  } 
  // Level Design
  else if (normalizedName.includes("level") || normalizedName === "leveldesign") {
    folder = "levelDesign";
    skillAbbr = "level";
  } 
  // Art/Drawing
  else if (normalizedName.includes("art") || normalizedName.includes("drawing")) {
    folder = "art";
    skillAbbr = "art";
  } 
  // Programming (including "C# Programming" with special character)
  else if (normalizedName.includes("programming") || 
           normalizedName.includes("program") || 
           normalizedName.includes("prog") ||
           normalizedName.includes("c#") ||
           normalizedName.includes("csharp")) {
    folder = "programming";
    skillAbbr = "prog";
  }
  
  // Map level to tier: 1=u (Unranked), 2=b (Bronze), 3=s (Silver), 4=g (Gold), 5=d (Diamond)
  const tierMap: { [key: number]: string } = {
    1: "u",
    2: "b",
    3: "s",
    4: "g",
    5: "d"
  };
  
  // Ensure level is valid (1-5)
  const validLevel = Math.max(1, Math.min(5, level));
  const tier = tierMap[validLevel] || "u";
  
  const path = `/Asset/badge/${folder}/${skillAbbr}_${tier}.png`;
  return path;
};

// Function to get rank icon path
const getRankIconPath = (rankName: string): string => {
  const rankLower = rankName.toLowerCase();
  
  // Handle special cases
  if (rankLower === 'supernova' || rankLower === 'cosmic') {
    // No icons yet, return placeholder
    return 'https://placehold.co/80x80/4A90E2/FFFFFF?text=' + encodeURIComponent(rankName.toUpperCase());
  }
  
  // Map rank names to file paths
  const iconMap: Record<string, string> = {
    'meteor i': '/Asset/ranks/meteor I.png',
    'meteor ii': '/Asset/ranks/meteor II.png',
    'meteor iii': '/Asset/ranks/meteor III.png',
    'planet i': '/Asset/ranks/planet.png',
    'planet ii': '/Asset/ranks/planet II.png',
    'planet iii': '/Asset/ranks/planet III.png',
    'star i': '/Asset/ranks/star I.png',
    'star ii': '/Asset/ranks/star II.png',
    'star iii': '/Asset/ranks/star III.png',
  };
  
  return iconMap[rankLower] || 'https://placehold.co/80x80/4A90E2/FFFFFF?text=' + encodeURIComponent(rankName.toUpperCase());
};

interface User {
  name: string;
  avatar: string;
  badge: string;
  coins: number;
  rankPoints: number;
  rankName: string;
  rankObjectives: RankObjective[];
  gameDemos: number;
  petLevel: number;
  petXp: number;
  petMaxXp: number;
}

interface Skill {
  name: string;
  icon: React.ComponentType<any>;
  currentLevel: number; // 1=Unranked, 2=Bronze, 3=Silver, 4=Gold, 5=Diamond
  points: number;
  maxPoints: number;
  description: string;
  rewards: { type: string; value: string }[];
}

interface ObjectiveReward {
  type: 'exp' | 'rank' | 'skill' | 'coins' | 'animal';
  value?: number | string; // Optional for animal type
  skillName?: string; // Required for skill type to indicate which skill
}

type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface QuestObjective {
  text: string;
  reward: ObjectiveReward; // Single reward per objective
  subQuestId?: string; // ID from backend to identify the subQuest
}

interface ObjectiveSubmission {
  imageUrl: string | null;
  status: ApprovalStatus; // none, pending (submitted, waiting for admin), approved
}

interface Quest {
  id: number;
  type: string;
  title: string;
  description: string;
  steps?: number[];
  currentStep?: number;
  rewards?: ObjectiveReward[]; // Quest completion rewards (can have multiple)
  completed: boolean;
  objectives: QuestObjective[];
  objectiveCompleted: boolean[]; // Track which objectives are completed
  objectiveSubmissions: ObjectiveSubmission[]; // Track image submissions and approval status
  objectiveRewardsAwarded: boolean[]; // Track which objective rewards have been awarded
  rewardClaimed: boolean; // Track if reward has been claimed
  rewardSubmissionStatus: ApprovalStatus; // Track reward claim approval status
  questRewardsAwarded: boolean; // Track if quest rewards have been awarded
  category: string;
}

interface LeaderboardItem {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  score: number;
}

interface BackpackItem {
  id: number;
  name: string;
  description: string;
  date: string;
  quantity: number;
  image: string;
  used: boolean;
  active: boolean;
}

// Helper functions for Quest progress
const calculateProgress = (quest: Quest): number => {
  if (!quest.objectives || quest.objectives.length === 0) return 0;
  const completedCount = quest.objectiveCompleted.filter(Boolean).length;
  return (completedCount / quest.objectives.length) * 100;
};

const areAllObjectivesCompleted = (quest: Quest): boolean => {
  if (!quest.objectives || quest.objectives.length === 0) return false;
  return quest.objectiveCompleted.every(Boolean);
};

const isQuestTrulyCompleted = (quest: Quest): boolean => {
  return areAllObjectivesCompleted(quest) && quest.rewardClaimed;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('quests');
  const [showQuestOverlay, setShowQuestOverlay] = useState<boolean>(false);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [showItemsOverlay, setShowItemsOverlay] = useState<boolean>(false);
  const [showBadgeOverlay, setShowBadgeOverlay] = useState<boolean>(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [description, setDescription] = useState<string>('anyone can be anything');
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [rankCardFlipped, setRankCardFlipped] = useState<boolean>(false);
  
  // Image upload modal state
  const [showImageUploadModal, setShowImageUploadModal] = useState<boolean>(false);
  const [selectedObjective, setSelectedObjective] = useState<{ questId: number; objectiveIndex: number } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Ref to prevent duplicate reward awarding (React StrictMode causes double execution in dev)
  const processingObjectives = useRef<Set<string>>(new Set());
  
  // Ref to track if quest panel should animate (only on manual open)
  const questPanelShouldAnimate = useRef<boolean>(false);
  
  // Ref to track scroll position to preserve it during updates
  const scrollPositionRef = useRef<{ container: HTMLElement | null; scrollTop: number }>({
    container: null,
    scrollTop: 0
  });
  
  // Ref for unique animation ID counter
  const animationIdCounter = useRef<number>(0);
  
  // Ref to track skill level-ups to prevent duplicate rewards
  const skillLevelUpProcessed = useRef<Set<string>>(new Set());
  
  // Ref to track reward animations in progress to prevent duplicates
  const rewardAnimationsInProgress = useRef<Set<string>>(new Set());
  
  // Ref to track awarded rewards to prevent duplicates when overlay closes
  const awardedRewards = useRef<Set<string>>(new Set());
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Settings & Theme State
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    // Apply theme class to body for global styles if needed
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    window.location.reload();
  };

  // Handle authentication and fetch initial data
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
            name: profile.username || profile.name || 'User',
            avatar: profile.avatar || "/Asset/pets/dog.png",
            badge: getRankIconPath(profile.rank?.currentTier || "Meteor I"),
            coins: profile.coins || 0,
            rankPoints: profile.rank?.points || 0,
            rankName: profile.rank?.currentTier || "Meteor I",
            gameDemos: profile.gameDemos || 0,
            petLevel: profile.petLevel || 1,
            petXp: profile.petXp || 0,
            petMaxXp: profile.petMaxXp || 1000,
            rankObjectives: profile.rankObjectives || []
          });

          // Map badges/skills from backend
          console.log('Full profile from API:', profile);
          console.log('Profile badges from API:', profile.badges);
          console.log('Badges type:', typeof profile.badges);
          console.log('Badges is array?', Array.isArray(profile.badges));
          
          // Handle badges - could be object or array
          let badgesObject: { [key: string]: any } = {};
          if (profile.badges) {
            if (Array.isArray(profile.badges)) {
              // If badges is an array, convert to object keyed by skill name
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
            
            // Map API skill names to display names and icons
            // Note: API returns badge names like "Explorer", "Programming", "Art", "LevelDesign", "GameDesign"
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
              // Common badge names from API
              "Explorer": { displayName: "Game Design", icon: Gamepad2 }, // Map Explorer to Game Design
              "explorer": { displayName: "Game Design", icon: Gamepad2 }
            };
            
            Object.keys(badgesObject).forEach(apiSkillName => {
              const badgeData = badgesObject[apiSkillName];
              console.log(`Processing badge: ${apiSkillName}`, badgeData);
              const skillInfo = skillNameMap[apiSkillName] || { displayName: apiSkillName, icon: Gamepad2 };
              
              // According to API document, badges have:
              // - rank: "Bronze", "Silver", "Gold", "Diamond" (or missing for Unranked)
              // - points: current points
              // - nextRank: next rank to achieve
              // - nextRankPoints: points needed for next rank
              
              // Map rank string to level number
              // Unranked = 1, Bronze = 2, Silver = 3, Gold = 4, Diamond = 5
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
              
              // Use points from badgeData
              const currentPoints = badgeData.points || 0;
              
              // Use nextRankPoints as maxPoints (points needed to reach next rank)
              // If at Diamond (level 5), there's no next rank, so use a high number
              const maxPoints = mappedLevel >= 5 ? 10000 : (badgeData.nextRankPoints || 10000);
              
              
              skillsMap[skillInfo.displayName] = {
                name: skillInfo.displayName, // Use display name for consistency
                icon: skillInfo.icon,
                currentLevel: mappedLevel,
                points: currentPoints,
                maxPoints: maxPoints,
                description: badgeData.description || "",
                rewards: badgeData.rewards || []
              };
              
            });
            // Update skills state if we have badge data from API
            if (Object.keys(skillsMap).length > 0) {
              console.log('Setting skills from API badges:', Object.values(skillsMap));
              setSkills(Object.values(skillsMap));
            } else {
              // If no badge data from API, use default unranked badges for all skills
              console.warn('No badge data found in profile.badges. Using default unranked badges.');
              const defaultSkills: Skill[] = [
                { 
                  name: "Game Design", 
                  icon: Gamepad2,
                  currentLevel: 1, // Unranked
                  points: 0,
                  maxPoints: 10000,
                  description: "",
                  rewards: []
                },
                { 
                  name: "Level Design", 
                  icon: Monitor,
                  currentLevel: 1, // Unranked
                  points: 0,
                  maxPoints: 10000,
                  description: "",
                  rewards: []
                },
                { 
                  name: "Drawing", 
                  icon: Paintbrush,
                  currentLevel: 1, // Unranked
                  points: 0,
                  maxPoints: 10000,
                  description: "",
                  rewards: []
                },
                { 
                  name: "C# Programming", 
                  icon: Code,
                  currentLevel: 1, // Unranked
                  points: 0,
                  maxPoints: 10000,
                  description: "",
                  rewards: []
                }
              ];
              setSkills(defaultSkills);
            }
          } else {
            // If badgesObject is empty, use default unranked badges for all skills
            console.warn('No badge data found in profile.badges. Using default unranked badges.');
            const defaultSkills: Skill[] = [
              { 
                name: "Game Design", 
                icon: Gamepad2,
                currentLevel: 1, // Unranked
                points: 0,
                maxPoints: 10000,
                description: "",
                rewards: []
              },
              { 
                name: "Level Design", 
                icon: Monitor,
                currentLevel: 1, // Unranked
                points: 0,
                maxPoints: 10000,
                description: "",
                rewards: []
              },
              { 
                name: "Drawing", 
                icon: Paintbrush,
                currentLevel: 1, // Unranked
                points: 0,
                maxPoints: 10000,
                description: "",
                rewards: []
              },
              { 
                name: "C# Programming", 
                icon: Code,
                currentLevel: 1, // Unranked
                points: 0,
                maxPoints: 10000,
                description: "",
                rewards: []
              }
            ];
            setSkills(defaultSkills);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }

        // Fetch active quests
        try {
          const activeQuests = await userAPI.getActiveQuests();
          // Map backend quests to frontend Quest interface
          const mappedQuests = activeQuests.map((aq: any) => {
            const quest = aq.questId;
            return {
              id: quest._id,
              type: quest.type || "Main Quest",
              title: quest.title,
              description: quest.description,
              steps: quest.subQuests?.map((_: any, i: number) => i + 1) || [],
              currentStep: aq.subQuestsProgress?.filter((p: any) => p.status === 'Completed').length || 0,
              rewards: (() => {
                // Map completionRewards from backend structure to frontend format
                // Backend structure: completionRewards: [{ chance: 1, entries: [{ type, minAmount, maxAmount, ... }] }]
                if (!quest.completionRewards || !Array.isArray(quest.completionRewards)) {
                  return [];
                }
                
                const mappedRewards: ObjectiveReward[] = [];
                
                quest.completionRewards.forEach((rewardGroup: any) => {
                  if (rewardGroup && Array.isArray(rewardGroup.entries)) {
                    rewardGroup.entries.forEach((entry: any) => {
                      // Map backend type to frontend type
                      let frontendType: 'exp' | 'rank' | 'skill' | 'coins' | 'animal' = 'coins';
                      if (entry.type === 'Coin') {
                        frontendType = 'coins';
                      } else if (entry.type === 'RankPoint') {
                        frontendType = 'rank';
                      } else if (entry.type === 'BadgePoint') {
                        frontendType = 'skill';
                      } else if (entry.type === 'LeaderboardScore') {
                        // LeaderboardScore might not be displayed, but we'll include it as coins for now
                        frontendType = 'coins';
                      }
                      
                      // Use minAmount as value (or average if min/max differ)
                      const rewardValue = entry.minAmount || (entry.minAmount === entry.maxAmount ? entry.minAmount : Math.floor((entry.minAmount + entry.maxAmount) / 2));
                      
                      const mappedReward: ObjectiveReward = {
                        type: frontendType,
                        value: rewardValue || 0
                      };
                      
                      // Add skillName for BadgePoint type
                      if (frontendType === 'skill' && entry.badgeCategory) {
                        mappedReward.skillName = entry.badgeCategory;
                      }
                      
                      mappedRewards.push(mappedReward);
                    });
                  }
                });
                
                return mappedRewards;
              })(),
              completed: aq.isCompleted || false,
            objectives: quest.subQuests?.map((sq: any, idx: number) => {
              // Backend reward structure:
              // rewards: [
              //   {
              //     chance: 1,
              //     entries: [
              //       {
              //         type: "Coin" | "RankPoint" | "LeaderboardScore" | "BadgePoint",
              //         minAmount: number,
              //         maxAmount: number,
              //         weight: number,
              //         badgeCategory?: string (for BadgePoint)
              //       }
              //     ]
              //   }
              // ]
              
              let reward: any = { type: 'coins', value: 0 };
              
              // Try sq.reward first (single object - for backwards compatibility)
              if (sq.reward && typeof sq.reward === 'object' && sq.reward.type) {
                reward = sq.reward;
              }
              // Try sq.rewards array (actual backend structure)
              else if (Array.isArray(sq.rewards) && sq.rewards.length > 0) {
                const rewardGroup = sq.rewards[0];
                if (rewardGroup && Array.isArray(rewardGroup.entries) && rewardGroup.entries.length > 0) {
                  const rewardEntry = rewardGroup.entries[0];
                  
                  // Map backend type to frontend type
                  let frontendType = 'coins';
                  if (rewardEntry.type === 'Coin') {
                    frontendType = 'coins';
                  } else if (rewardEntry.type === 'RankPoint') {
                    frontendType = 'rank';
                  } else if (rewardEntry.type === 'BadgePoint') {
                    frontendType = 'skill';
                  } else if (rewardEntry.type === 'LeaderboardScore') {
                    // LeaderboardScore might not be used in frontend, default to coins
                    frontendType = 'coins';
                  }
                  
                  // Use minAmount as value (or average of min/max if different)
                  const rewardValue = rewardEntry.minAmount || (rewardEntry.minAmount === rewardEntry.maxAmount ? rewardEntry.minAmount : Math.floor((rewardEntry.minAmount + rewardEntry.maxAmount) / 2));
                  
                  reward = {
                    type: frontendType,
                    value: rewardValue || 0
                  };
                  
                  // Add skillName for BadgePoint type
                  if (frontendType === 'skill' && rewardEntry.badgeCategory) {
                    reward.skillName = rewardEntry.badgeCategory;
                  }
                }
              }
              // Check if reward data is in the progress entry
              else {
                const progressEntry = aq.subQuestsProgress?.find((p: any) => {
                  const pId = (p.subQuestId || p.subQuest?._id || p.subQuest?.id || (typeof p.subQuest === 'string' ? p.subQuest : null))?.toString();
                  const sqId = (sq._id || sq.id)?.toString();
                  return pId === sqId;
                });
                
                if (progressEntry?.reward && typeof progressEntry.reward === 'object' && progressEntry.reward.type) {
                  reward = progressEntry.reward;
                } else if (Array.isArray(progressEntry?.rewards) && progressEntry.rewards.length > 0) {
                  const rewardGroup = progressEntry.rewards[0];
                  if (rewardGroup && Array.isArray(rewardGroup.entries) && rewardGroup.entries.length > 0) {
                    const rewardEntry = rewardGroup.entries[0];
                    let frontendType = 'coins';
                    if (rewardEntry.type === 'Coin') {
                      frontendType = 'coins';
                    } else if (rewardEntry.type === 'RankPoint') {
                      frontendType = 'rank';
                    } else if (rewardEntry.type === 'BadgePoint') {
                      frontendType = 'skill';
                    }
                    reward = {
                      type: frontendType,
                      value: rewardEntry.minAmount || 0
                    };
                    if (frontendType === 'skill' && rewardEntry.badgeCategory) {
                      reward.skillName = rewardEntry.badgeCategory;
                    }
                  }
                }
              }
              
              // Ensure reward has the correct structure
              if (!reward || typeof reward !== 'object') {
                reward = { type: 'coins', value: 0 };
              }
              if (!reward.type) {
                reward.type = 'coins';
              }
              if (typeof reward.value === 'undefined' || reward.value === null) {
                reward.value = 0;
              }
              
              return {
                text: sq.title || sq.description,
                reward: reward,
                subQuestId: sq._id || sq.id // Store subQuest ID for API submission
              };
            }) || [],
            objectiveCompleted: (() => {
              // Match progress to objectives by subQuestId, not by array index
              const objectives = quest.subQuests || [];
              const progressMap = new Map();
              // Create a map of subQuestId -> progress status
              // Try multiple possible field names for subQuestId in progress
              aq.subQuestsProgress?.forEach((p: any, idx: number) => {
                // Try to get subQuestId from progress object - check various possible structures
                const progressSubQuestId = p.subQuestId || 
                                         p.subQuest?._id || 
                                         p.subQuest?.id ||
                                         (typeof p.subQuest === 'string' ? p.subQuest : null);
                
                if (progressSubQuestId) {
                  const subQuestIdString = progressSubQuestId.toString();
                  // Mark as completed if status is 'Completed' OR 'Pending' (user sees pending as completed)
                  progressMap.set(subQuestIdString, p.status === 'Completed' || p.status === 'Pending');
                }
              });
              // Map each objective to its completion status by matching subQuestId
              return objectives.map((sq: any, idx: number) => {
                const objectiveSubQuestId = (sq._id || sq.id)?.toString();
                
                // First, try to get from the map we built
                let completed = progressMap.get(objectiveSubQuestId);
                
                // If not found in map, try to find progress by searching through all progress entries
                if (completed === undefined) {
                  const matchingProgress = aq.subQuestsProgress?.find((p: any) => {
                    const pId = (p.subQuestId || p.subQuest?._id || p.subQuest?.id || (typeof p.subQuest === 'string' ? p.subQuest : null))?.toString();
                    return pId === objectiveSubQuestId;
                  });
                  if (matchingProgress) {
                    // Mark as completed if status is 'Completed' OR 'Pending' (user sees pending as completed)
                    completed = matchingProgress.status === 'Completed' || matchingProgress.status === 'Pending';
                  } else {
                    // DO NOT use array index fallback - it causes incorrect mapping
                    completed = false;
                  }
                }
                return completed || false;
              });
            })(),
            objectiveSubmissions: (() => {
              // Match submissions to objectives by subQuestId, not by array index
              const objectives = quest.subQuests || [];
              const submissionsMap = new Map();
              // Create a map of subQuestId -> submission data
              // Try multiple possible field names for subQuestId in progress
              aq.subQuestsProgress?.forEach((p: any, idx: number) => {
                const subQuestId = p.subQuestId || p.subQuest?._id || p.subQuest?.id || (typeof p.subQuest === 'string' ? p.subQuest : null);
                if (subQuestId) {
                  submissionsMap.set(subQuestId.toString(), {
                    imageUrl: p.imageProof || null,
                    status: p.status === 'Completed' ? 'approved' : p.status === 'Pending' ? 'pending' : p.status === 'Rejected' ? 'rejected' : 'none'
                  });
                }
              });
              // Map each objective to its submission by matching subQuestId
              return objectives.map((sq: any, idx: number) => {
                const subQuestId = (sq._id || sq.id)?.toString();
                let submission = submissionsMap.get(subQuestId);
                
                // If not found in map, try to find by searching all progress entries
                if (!submission) {
                  const matchingProgress = aq.subQuestsProgress?.find((p: any) => {
                    const pId = (p.subQuestId || p.subQuest?._id || p.subQuest?.id || (typeof p.subQuest === 'string' ? p.subQuest : null))?.toString();
                    return pId === subQuestId;
                  });
                  if (matchingProgress) {
                    submission = {
                      imageUrl: matchingProgress.imageProof || null,
                      status: matchingProgress.status === 'Completed' ? 'approved' : matchingProgress.status === 'Pending' ? 'pending' : matchingProgress.status === 'Rejected' ? 'rejected' : 'none'
                    };
                  }
                }
                
                return submission || {
                  imageUrl: null,
                  status: 'none' as ApprovalStatus
                };
              });
            })(),
              objectiveRewardsAwarded: (() => {
              // Match rewards awarded to objectives by subQuestId, not by array index
              const objectives = quest.subQuests || [];
              const rewardsMap = new Map();
              // Create a map of subQuestId -> reward awarded status
              // Try multiple possible field names for subQuestId in progress
              aq.subQuestsProgress?.forEach((p: any, idx: number) => {
                const subQuestId = p.subQuestId || p.subQuest?._id || p.subQuest?.id || (typeof p.subQuest === 'string' ? p.subQuest : null);
                if (subQuestId) {
                  rewardsMap.set(subQuestId.toString(), p.rewardAwarded || false);
                }
              });
              // Map each objective to its reward awarded status by matching subQuestId
              return objectives.map((sq: any, idx: number) => {
                const subQuestId = (sq._id || sq.id)?.toString();
                let awarded = rewardsMap.get(subQuestId);
                
                // If not found in map, try to find by searching all progress entries
                if (awarded === undefined) {
                  const matchingProgress = aq.subQuestsProgress?.find((p: any) => {
                    const pId = (p.subQuestId || p.subQuest?._id || p.subQuest?.id || (typeof p.subQuest === 'string' ? p.subQuest : null))?.toString();
                    return pId === subQuestId;
                  });
                  if (matchingProgress) {
                    awarded = matchingProgress.rewardAwarded || false;
                  }
                }
                
                return awarded || false;
              });
            })(),
              rewardClaimed: aq.submissionStatus === 'Completed',
              rewardSubmissionStatus: (aq.submissionStatus === 'Pending' ? 'pending' : aq.submissionStatus === 'Completed' ? 'approved' : 'none') as ApprovalStatus,
              questRewardsAwarded: aq.isCompleted || false,
              category: quest.category || "General"
            };
          });
          setQuestsState(mappedQuests);
        } catch (error) {
          console.error('Error fetching active quests:', error);
        }

        // Fetch completed quests
        try {
          const completedQuests = await userAPI.getCompletedQuests();
          // Similar mapping as active quests
          const mappedCompleted = completedQuests.map((cq: any) => {
            const quest = cq.questId;
            return {
              id: quest._id,
              type: quest.type || "Main Quest",
              title: quest.title,
              description: quest.description,
              steps: quest.subQuests?.map((_: any, i: number) => i + 1) || [],
              currentStep: quest.subQuests?.length || 0,
              rewards: (() => {
                // Map completionRewards from backend structure to frontend format
                // Backend structure: completionRewards: [{ chance: 1, entries: [{ type, minAmount, maxAmount, ... }] }]
                if (!quest.completionRewards || !Array.isArray(quest.completionRewards)) {
                  return [];
                }
                
                const mappedRewards: ObjectiveReward[] = [];
                
                quest.completionRewards.forEach((rewardGroup: any) => {
                  if (rewardGroup && Array.isArray(rewardGroup.entries)) {
                    rewardGroup.entries.forEach((entry: any) => {
                      // Map backend type to frontend type
                      let frontendType: 'exp' | 'rank' | 'skill' | 'coins' | 'animal' = 'coins';
                      if (entry.type === 'Coin') {
                        frontendType = 'coins';
                      } else if (entry.type === 'RankPoint') {
                        frontendType = 'rank';
                      } else if (entry.type === 'BadgePoint') {
                        frontendType = 'skill';
                      } else if (entry.type === 'LeaderboardScore') {
                        // LeaderboardScore might not be displayed, but we'll include it as coins for now
                        frontendType = 'coins';
                      }
                      
                      // Use minAmount as value (or average if min/max differ)
                      const rewardValue = entry.minAmount || (entry.minAmount === entry.maxAmount ? entry.minAmount : Math.floor((entry.minAmount + entry.maxAmount) / 2));
                      
                      const mappedReward: ObjectiveReward = {
                        type: frontendType,
                        value: rewardValue || 0
                      };
                      
                      // Add skillName for BadgePoint type
                      if (frontendType === 'skill' && entry.badgeCategory) {
                        mappedReward.skillName = entry.badgeCategory;
                      }
                      
                      mappedRewards.push(mappedReward);
                    });
                  }
                });
                
                return mappedRewards;
              })(),
              completed: true,
              objectives: quest.subQuests?.map((sq: any) => ({
                text: sq.title || sq.description,
                reward: sq.reward || { type: 'coins', value: 0 }
              })) || [],
              objectiveCompleted: cq.subQuestsProgress?.map(() => true) || [],
              objectiveSubmissions: cq.subQuestsProgress?.map((p: any) => ({
                imageUrl: p.imageProof || null,
                status: 'approved'
              })) || [],
              objectiveRewardsAwarded: cq.subQuestsProgress?.map(() => true) || [],
              rewardClaimed: true,
              rewardSubmissionStatus: 'approved' as ApprovalStatus,
              questRewardsAwarded: true,
              category: quest.category || "General"
            };
          });
          setQuestsState(prev => [...prev, ...mappedCompleted]);
        } catch (error) {
          console.error('Error fetching completed quests:', error);
        }

        // Fetch inventory
        try {
          const inventory = await userAPI.getMyInventory();
          // Map backend inventory to frontend BackpackItem interface
          const mappedItems = inventory.map((inv: any, idx: number) => ({
            id: idx + 1,
            name: inv.itemId?.name || 'Item',
            description: inv.itemId?.description || '',
            date: inv.itemId?.date || '',
            quantity: inv.quantity || 1,
            image: inv.itemId?.image || "/Asset/item/classTicket.png",
            used: inv.used || false,
            active: inv.active || false
          }));
          setBackpackItems(mappedItems);
        } catch (error) {
          console.error('Error fetching inventory:', error);
        }

      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Cancel reward animations when quest overlay closes
  useEffect(() => {
    if (!showQuestOverlay) {
      // Clear all reward animations when overlay closes
      setRewardAnimations([]);
    }
  }, [showQuestOverlay]);

  // Restore scroll position when image upload modal closes
  useEffect(() => {
    if (!showImageUploadModal && scrollPositionRef.current.container) {
      // Restore scroll position after modal closes
      setTimeout(() => {
        const containers = document.querySelectorAll('.overflow-y-auto');
        const container = Array.from(containers).find(el => {
          const rect = el.getBoundingClientRect();
          return rect.height > 200;
        }) as HTMLElement;
        
        if (container && scrollPositionRef.current.scrollTop > 0) {
          container.scrollTop = scrollPositionRef.current.scrollTop;
        }
      }, 0);
    }
  }, [showImageUploadModal]);
  
  // State for reward animations
  const [rewardAnimations, setRewardAnimations] = useState<Array<{
    id: string;
    type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal';
    value: number | string;
    skillName?: string;
    x: number; // Random X position
    y: number; // Random Y position
    driftX: number; // Random drift direction and amount
    startTime: number; // Track when animation started
  }>>([]);
  
  // State for skill level-up animations
  const [levelUpAnimations, setLevelUpAnimations] = useState<Set<string>>(new Set());
  const [questsState, setQuestsState] = useState<Quest[]>([
    {
      id: 1,
      type: "Main Quest",
      title: "Shooting Game",
      description: "Player Movement Script",
      steps: [1, 2, 3, 4],
      currentStep: 0,
      completed: false,
      rewards: [
        { type: 'rank', value: 5000 },
        { type: 'coins', value: 300 }
      ],
      objectives: [
        { text: "Map Layout", reward: { type: 'coins', value: 30 } },
        { text: "Enemy Script", reward: { type: 'rank', value: 5000 } },
        { text: "Map Layout", reward: { type: 'coins', value: 50 } },
        { text: "Sound Effect", reward: { type: 'coins', value: 30 } }
      ],
      objectiveCompleted: [false, false, false, false],
      objectiveSubmissions: [
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' }
      ],
      objectiveRewardsAwarded: [false, false, false, false],
      rewardClaimed: false,
      rewardSubmissionStatus: 'none',
      questRewardsAwarded: false,
      category: "Game Design"
    },
    {
      id: 2,
      type: "Special Quest",
      title: "Lighting 1",
      description: "Light in the cave",
      rewards: [
        { type: 'coins', value: 50 },
        { type: 'rank', value: 500 }
      ],
      completed: false,
      objectives: [
        { text: "Set up basic lighting", reward: { type: 'coins', value: 30 } },
        { text: "Adjust light intensity", reward: { type: 'rank', value: 2500 } },
        { text: "Create ambient occlusion", reward: { type: 'skill', value: 150, skillName: 'Drawing' } },
        { text: "Test in different scenes", reward: { type: 'coins', value: 25 } }
      ],
      objectiveCompleted: [false, false, false, false],
      objectiveSubmissions: [
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' }
      ],
      objectiveRewardsAwarded: [false, false, false, false],
      rewardClaimed: false,
      rewardSubmissionStatus: 'none',
      questRewardsAwarded: false,
      category: "Drawing"
    },
    {
      id: 3,
      type: "Special Quest",
      title: "Timeline 3",
      description: "1 cutscene (Demo)",
      rewards: [
        { type: 'coins', value: 100 },
        { type: 'rank', value: 800 },
        { type: 'skill', value: 300, skillName: 'Level Design' }
      ],
      completed: false,
      objectives: [
        { text: "Create timeline asset", reward: { type: 'rank', value: 4000 } },
        { text: "Add camera movements", reward: { type: 'coins', value: 40 } },
        { text: "Add character animations", reward: { type: 'skill', value: 200, skillName: 'Level Design' } },
        { text: "Add audio cues", reward: { type: 'rank', value: 3000 } }
      ],
      objectiveCompleted: [false, false, false, false],
      objectiveSubmissions: [
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' }
      ],
      objectiveRewardsAwarded: [false, false, false, false],
      rewardClaimed: false,
      rewardSubmissionStatus: 'none',
      questRewardsAwarded: false,
      category: "Level Design"
    },
    {
      id: 4,
      type: "Main Quest",
      title: "Enemy AI",
      description: "Basic enemy behavior",
      steps: [1, 2, 3],
      currentStep: 0,
      completed: false,
      rewards: [
        { type: 'coins', value: 150 },
        { type: 'rank', value: 1200 },
        { type: 'rank', value: 25 },
        { type: 'skill', value: 400, skillName: 'C# Programming' }
      ],
      objectives: [
        { text: "Create enemy prefab", reward: { type: 'coins', value: 30 } },
        { text: "Implement patrol behavior", reward: { type: 'rank', value: 5000 } },
        { text: "Add chase logic", reward: { type: 'coins', value: 50 } },
        { text: "Test against player", reward: { type: 'skill', value: 250, skillName: 'C# Programming' } }
      ],
      objectiveCompleted: [false, false, false, false],
      objectiveSubmissions: [
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' }
      ],
      objectiveRewardsAwarded: [false, false, false, false],
      rewardClaimed: false,
      rewardSubmissionStatus: 'none',
      questRewardsAwarded: false,
      category: "C# Programming"
    },
    {
      id: 5,
      type: "Special Quest",
      title: "UI Design",
      description: "Create game menu",
      rewards: [
        { type: 'coins', value: 75 },
        { type: 'rank', value: 600 },
        { type: 'skill', value: 250, skillName: 'Game Design' }
      ],
      completed: false,
      objectives: [
        { text: "Design main menu layout", reward: { type: 'coins', value: 30 } },
        { text: "Add button functionality", reward: { type: 'rank', value: 3500 } },
        { text: "Implement settings panel", reward: { type: 'coins', value: 50 } },
        { text: "Test usability", reward: { type: 'skill', value: 180, skillName: 'Game Design' } }
      ],
      objectiveCompleted: [false, false, false, false],
      objectiveSubmissions: [
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' }
      ],
      objectiveRewardsAwarded: [false, false, false, false],
      rewardClaimed: false,
      rewardSubmissionStatus: 'none',
      questRewardsAwarded: false,
      category: "Game Design"
    },
    {
      id: 6,
      type: "Special Quest",
      title: "Sound Design",
      description: "Add ambient sounds",
      rewards: [
        { type: 'coins', value: 60 },
        { type: 'rank', value: 550 },
        { type: 'rank', value: 15 }
      ],
      completed: false,
      objectives: [
        { text: "Import sound assets", reward: { type: 'coins', value: 20 } },
        { text: "Set up audio sources", reward: { type: 'rank', value: 2500 } },
        { text: "Configure spatial audio", reward: { type: 'skill', value: 120, skillName: 'Drawing' } },
        { text: "Test in different environments", reward: { type: 'coins', value: 30 } }
      ],
      objectiveCompleted: [false, false, false, false],
      objectiveSubmissions: [
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' },
        { imageUrl: null, status: 'none' }
      ],
      objectiveRewardsAwarded: [false, false, false, false],
      rewardClaimed: false,
      rewardSubmissionStatus: 'none',
      questRewardsAwarded: false,
      category: "Drawing"
    }
  ]);

  // Mock data - User state
  const [user, setUser] = useState<User>({
    name: "mr.X",
    avatar: "/Asset/pets/dog.png",
    badge: getRankIconPath("Meteor I"),
    coins: 1000,
    rankPoints: 0,
    rankName: "Meteor I",
    gameDemos: 1,
    petLevel: 1,
    petXp: 0,
    petMaxXp: 1000, // Level 1->2 requires 1000 XP (500 * (1 + 1))
    rankObjectives: [
      { text: "Complete Shooting Game", completed: false, questId: 1 },
      { text: "Coins x1,000", completed: false, coinCost: 1000 },
      { text: "Earn 100 Rank Points", completed: false }
    ]
  });

  // Initialize skills as empty - will be populated from API badges
  const [skills, setSkills] = useState<Skill[]>([]);

  const leaderboard: LeaderboardItem[] = [
    { rank: 1, name: "mr.X", avatar: "/Asset/pets/dog.png", level: 25, score: 3589 },
    { rank: 2, name: "mr.X", avatar: "/Asset/pets/dog.png", level: 25, score: 2439 },
    { rank: 3, name: "mr.X", avatar: "/Asset/pets/dog.png", level: 25, score: 1321 },
    { rank: 4, name: "mr.X", avatar: "/Asset/pets/dog.png", level: 25, score: 589 }
  ];

  // Helper function to parse date string and check if time has passed
  const parseItemDate = (dateString: string): { startTime: Date; endTime: Date } | null => {
    // Format: "20/11/2025 (19:00-21:00)"
    try {
      const datePart = dateString.split(' ')[0]; // "20/11/2025"
      const timePart = dateString.match(/\((\d{2}):(\d{2})-(\d{2}):(\d{2})\)/);
      
      if (!timePart) return null;
      
      const [day, month, year] = datePart.split('/');
      const startHour = parseInt(timePart[1]);
      const startMinute = parseInt(timePart[2]);
      const endHour = parseInt(timePart[3]);
      const endMinute = parseInt(timePart[4]);
      
      const startTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), startHour, startMinute);
      const endTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), endHour, endMinute);
      
      return { startTime, endTime };
    } catch (error) {
      return null;
    }
  };

  const hasItemTimePassed = (dateString: string): boolean => {
    const times = parseItemDate(dateString);
    if (!times) return false;
    const now = new Date();
    return now > times.endTime;
  };

  const [backpackItems, setBackpackItems] = useState<BackpackItem[]>([
    {
      id: 1,
      name: "Lighting Ticket",
      description: "Dojo Basic Lighting",
      date: "20/11/2025 (19:00-21:00)",
      quantity: 1,
      image: "/Asset/item/classTicket.png",
      used: false,
      active: false
    },
    {
      id: 2,
      name: "C# Ticket",
      description: "Dojo Basic Programming",
      date: "21/11/2025 (19:00-21:00)",
      quantity: 1,
      image: "/Asset/item/classTicket.png",
      used: false,
      active: false
    },
    {
      id: 3,
      name: "Game Design Ticket",
      description: "Advanced Game Mechanics",
      date: "30/11/2025 (14:00-16:00)",
      quantity: 1,
      image: "/Asset/item/classTicket.png",
      used: false,
      active: false
    },
    {
      id: 4,
      name: "Level Design Ticket",
      description: "Environment Creation Workshop",
      date: "01/12/2025 (10:00-12:00)",
      quantity: 1,
      image: "/Asset/item/classTicket.png",
      used: false,
      active: false
    },
    {
      id: 5,
      name: "Drawing Ticket",
      description: "Character Design Masterclass",
      date: "05/12/2025 (15:00-17:00)",
      quantity: 1,
      image: "/Asset/item/classTicket.png",
      used: false,
      active: false
    },
    {
      id: 6,
      name: "Unity Ticket",
      description: "Unity Basics Workshop",
      date: "10/12/2025 (18:00-20:00)",
      quantity: 1,
      image: "/Asset/item/classTicket.png",
      used: false,
      active: false
    }
  ]);

  // Handle item usage - only 1 used item at a time across all types
  const handleUseItem = async (itemId: number) => {
    const item = backpackItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      // Find the inventory item ID (you may need to store this when fetching inventory)
      // For now, assuming itemId maps to inventory item
      await userAPI.useItem(itemId.toString());
      
      // Update local state
      setBackpackItems(prevItems => {
        return prevItems.map(i => {
          if (i.id === itemId) {
            return { ...i, used: true, active: true };
          } else {
            // Un-use and deactivate all other items (only 1 used at a time across all types)
            return { ...i, used: false, active: false };
          }
        });
      });

      // Refresh inventory from API
      const inventory = await userAPI.getMyInventory();
      const mappedItems = inventory.map((inv: any, idx: number) => ({
        id: idx + 1,
        name: inv.itemId?.name || 'Item',
        description: inv.itemId?.description || '',
        date: inv.itemId?.date || '',
        quantity: inv.quantity || 1,
        image: inv.itemId?.image || "/Asset/item/classTicket.png",
        used: inv.used || false,
        active: inv.active || false
      }));
      setBackpackItems(mappedItems);
    } catch (error) {
      console.error('Error using item:', error);
      alert('Failed to use item. Please try again.');
    }
  };

  // Handle item deletion
  const handleDeleteItem = (itemId: number) => {
    setBackpackItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Check if item is expired (current date/time has passed the ticket's end time)
  const isItemExpired = (dateString: string): boolean => {
    const times = parseItemDate(dateString);
    if (!times) return false;
    const now = new Date();
    return now > times.endTime;
  };

  // Remove items that are used and their time has passed
  useEffect(() => {
    setBackpackItems(prevItems => {
      return prevItems.filter(item => {
        // Remove if used AND time has passed
        if (item.used && hasItemTimePassed(item.date)) {
          return false;
        }
        return true;
      });
    });
    
    // Check every minute for expired items
    const interval = setInterval(() => {
      setBackpackItems(prevItems => {
        return prevItems.filter(item => {
          if (item.used && hasItemTimePassed(item.date)) {
            return false;
          }
          return true;
        });
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
    const isCompleted = isQuestTrulyCompleted(quest);
    const approvedCount = getApprovedObjectivesCount(quest);
    
    // Use objectives count instead of steps
    const totalObjectives = quest.objectives.length;
    const completedObjectives = quest.objectiveCompleted.filter(completed => completed).length;

  return (
      <div 
        className={`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer transition-all ${
          isCompleted 
            ? 'opacity-50 hover:opacity-60' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => {
          questPanelShouldAnimate.current = true;
          setSelectedQuestId(quest.id);
          setShowQuestOverlay(true);
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold text-[#BF5475] py-1 rounded-full flex items-center gap-1">
              <img src="/Asset/check-circle.png" alt="" className="w-3 h-3" />
              {quest.type}
            </span>
            <h3 className="font-bold text-black text-lg mt-1">{quest.title}</h3>
            <p className="text-gray-600 text-sm">{quest.description}</p>
          </div>
        </div>
        
        {/* Step indicators based on objectives + reward step */}
        {totalObjectives > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: totalObjectives }).map((_, index) => {
              // Count how many objectives are completed (not which ones)
              // Fill balls from left to right based on count
              const isStepCompleted = index < completedObjectives;
              
              return (
                <React.Fragment key={index}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isStepCompleted
                      ? 'bg-[#4CCC51] text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
          </div>
                  <div className={`h-0.5 flex-1 ${isStepCompleted ? 'bg-[#4CCC51]' : 'bg-gray-200'}`}></div>
                </React.Fragment>
              );
            })}
            {/* Reward step at the end */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              quest.rewardClaimed
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              <Gift size={14} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => {
    // Define level colors to match BadgeOverlay: Unranked, Bronze, Silver, Gold, Diamond
    const levelColors = ["#9CA3AF", "#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
    const currentLevelColor = levelColors[skill.currentLevel - 1];
    const xpPercentage = (skill.points / skill.maxPoints) * 100;
    const isLevelingUp = levelUpAnimations.has(skill.name);
    const isDiamond = skill.currentLevel === 5; // Diamond has no progression

  return (
      <div 
        className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center gap-1 relative"
        onClick={() => {
          setSelectedSkill(skill);
          setShowBadgeOverlay(true);
        }}
      >
        {/* Level-up glow effect */}
        {isLevelingUp && (
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ 
              backgroundColor: currentLevelColor,
              opacity: 0.3,
              zIndex: -1
            }}
          />
        )}
        
        {/* Badge image - no borders, just the image */}
        <img 
          src={getBadgeIconPath(skill.name, skill.currentLevel)} 
          alt={`${skill.name} - Level ${skill.currentLevel}`}
          className={`w-16 h-16 object-contain transition-all duration-500 ${
            isLevelingUp ? 'scale-125 shadow-lg' : ''
          }`}
          style={{ 
            boxShadow: isLevelingUp ? `0 0 20px ${currentLevelColor}` : 'none'
          }}
        />
        
        {/* XP Progress Bar - Hidden for Diamond level */}
        {!isDiamond && (
          <div className="w-3/4 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(100, xpPercentage)}%`,
                boxShadow: isLevelingUp ? '0 0 10px #10b981' : 'none'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // Reward Animation Component
  const RewardAnimation: React.FC<{ animation: typeof rewardAnimations[0] }> = ({ animation }) => {
    // Calculate elapsed time to prevent animation restart on re-render
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const animationDuration = 5000; // 5 seconds
    
    React.useEffect(() => {
      const updateElapsed = () => {
        const elapsed = Date.now() - animation.startTime;
        setElapsedTime(Math.min(elapsed, animationDuration));
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 16); // ~60fps
      
      return () => clearInterval(interval);
    }, [animation.startTime]);
    
    // Calculate animation delay (negative to skip to current point)
    const animationDelay = elapsedTime > 0 ? -elapsedTime : 0;
    
    const getIcon = () => {
      switch (animation.type) {
        case 'coins':
          return <Coins className="w-5 h-5 text-yellow-600" />;
        case 'exp':
          return <Star className="w-5 h-5 text-blue-600" />;
        case 'rank':
          return <Trophy className="w-5 h-5 text-purple-600" />;
        case 'skill':
          return <Crown className="w-5 h-5 text-green-600" />;
        case 'animal':
          return <span className="text-xl">🐾</span>;
        default:
          return null;
      }
    };

    const getLabel = () => {
      switch (animation.type) {
        case 'coins':
          return `+${animation.value}`;
        case 'exp':
          return `+${animation.value} XP`;
        case 'rank':
          return `+${animation.value} RP`;
        case 'skill':
          return `+${animation.value}`;
        case 'animal':
          return `${animation.value}`;
        default:
          return '';
      }
  };

  return (
      <div 
        className="fixed z-[9999] pointer-events-none"
      style={{ 
          left: `${animation.x}px`,
          top: `${animation.y}px`,
          animation: `bubbleFloat ${animationDuration}ms ease-in-out forwards`,
          animationDelay: `${animationDelay}ms`,
          '--drift-x': `${animation.driftX}px`
        } as React.CSSProperties & { '--drift-x': string }}
      >
        {/* Bubble effect */}
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse"></div>
          
          {/* Bubble container */}
          <div className="relative flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-4 py-3 shadow-lg border border-white/50">
            {/* Bubble shine effect */}
            <div className="absolute top-1 left-2 w-3 h-3 bg-white/60 rounded-full blur-sm"></div>
            
            {/* Icon */}
            <div className="relative z-10">
              {getIcon()}
            </div>
            
            {/* Label */}
            <div className="relative z-10 font-bold text-sm text-gray-800 whitespace-nowrap">
              {getLabel()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LeaderboardItemComponent: React.FC<{ item: LeaderboardItem }> = ({ item }) => (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm border border-gray-100">
      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-sm">
        {item.rank}
          </div>
      <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <div className="font-semibold text-sm text-black">{item.name}</div>
        <div className="text-xs text-gray-500">Dogv Lv{item.level}</div>
      </div>
      <div className="font-bold text-sm text-black">{item.score}</div>
    </div>
  );

  const BackpackItemComponent: React.FC<{ item: BackpackItem; onUse: (id: number) => void; onDelete: (id: number) => void }> = ({ item, onUse, onDelete }) => {
    const isUsed = item.used;
    const timePassed = hasItemTimePassed(item.date);
    const expired = isItemExpired(item.date);
    
    // Determine background color
    let backgroundColor = 'white';
    if (isUsed) {
      backgroundColor = '#e3cd0b'; // Yellow for used
    } else if (expired) {
      backgroundColor = '#ef4444'; // Red for expired
    }
    
    return (
      <div 
        className={`flex items-center gap-3 p-3 rounded-xl mb-2 shadow-sm border border-gray-100`}
        style={{ backgroundColor }}
      >
        <img src={item.image} alt={item.name} className="w-20 h-14 object-contain" />
        <div className="flex-1">
          <div className="font-semibold text-sm text-black">{item.name}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
          <div className="text-xs text-gray-500">{item.date}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">x{item.quantity}</div>
          {expired && !isUsed && (
            <button
              onClick={() => onDelete(item.id)}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          )}
          {!expired && !isUsed && (
            <button
              onClick={() => onUse(item.id)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Use
            </button>
          )}
          {isUsed && (
            <span className="text-xs text-gray-600 font-semibold">Used</span>
            )}
          </div>
      </div>
    );
  };

  // Helper function to check if quest is truly completed (all objectives done AND reward claimed)
  const isQuestTrulyCompleted = (quest: Quest): boolean => {
    return quest.rewardClaimed && quest.objectiveCompleted.every(completed => completed);
  };

  // Check if user can rank up (all objectives complete and enough coins)
  const canRankUp = (): boolean => {
    const allObjectivesComplete = user.rankObjectives.every(objective => {
      if (objective.text.includes('Rank Points')) {
        return user.rankPoints >= 100;
      } else if (objective.questId) {
        const linkedQuest = questsState.find(q => q.id === objective.questId);
        return linkedQuest ? isQuestTrulyCompleted(linkedQuest) : false;
      } else if (objective.coinCost) {
        return user.coins >= objective.coinCost;
      } else {
        return objective.completed;
      }
    });
    
    // Also check if user has enough coins for the coin cost objective
    const coinObjective = user.rankObjectives.find(obj => obj.coinCost);
    const hasEnoughCoins = coinObjective ? user.coins >= coinObjective.coinCost! : true;
    
    return allObjectivesComplete && hasEnoughCoins;
  };

  // Handle rank up
  const handleRankUp = async () => {
    if (!canRankUp()) return;
    
    try {
      const result = await userAPI.rankUp() as { message: string; newRank: string; points: number };
      
      // Update user state with new rank
      setUser(prev => ({
        ...prev,
        rankName: result.newRank || prev.rankName,
        badge: getRankIconPath(result.newRank || prev.rankName),
        rankPoints: result.points || 0,
        // Deduct coins (assuming backend handles this, but update local state)
        coins: prev.coins - (user.rankObjectives.find(obj => obj.coinCost)?.coinCost || 0)
      }));

      // Refresh profile to get latest data
      const profile = await userAPI.getMyProfile();
      setUser(prev => ({
        ...prev,
        coins: profile.coins || prev.coins,
        rankPoints: profile.rank?.points || prev.rankPoints,
        rankName: profile.rank?.currentTier || prev.rankName,
        badge: getRankIconPath(profile.rank?.currentTier || prev.rankName)
      }));
    } catch (error) {
      console.error('Error ranking up:', error);
      alert('Failed to rank up. Please try again.');
    }
  };

  // Helper function to check if all objectives are completed (approved by admin)
  const areAllObjectivesCompleted = (quest: Quest): boolean => {
    return quest.objectiveSubmissions.every(submission => submission && submission.status === 'approved');
  };

  // Helper function to get count of approved objectives (for step progress)
  const getApprovedObjectivesCount = (quest: Quest): number => {
    return quest.objectiveSubmissions.filter(submission => submission && submission.status === 'approved').length;
  };

  // Helper function to update quest step based on approved objectives
  const updateQuestStep = (questId: number) => {
    setQuestsState(prevQuests =>
      prevQuests.map(quest => {
        if (quest.id === questId && quest.steps) {
          const approvedCount = getApprovedObjectivesCount(quest);
          return {
            ...quest,
            currentStep: Math.min(approvedCount, quest.steps.length)
          };
        }
        return quest;
      })
    );
  };

  // Function to trigger reward animation
  const triggerRewardAnimation = (reward: ObjectiveReward) => {
    console.log('triggerRewardAnimation called with:', reward);
    // Create a key for this reward type to prevent duplicates (without timestamp)
    const rewardKey = `${reward.type}-${reward.value || 0}-${reward.skillName || ''}`;
    const now = Date.now();
    
    // Check if this exact reward animation was triggered recently (within last 1000ms)
    // Increased window to prevent duplicates when overlay closes
    const recentReward = Array.from(rewardAnimationsInProgress.current).find(key => {
      if (key.startsWith(rewardKey + '-')) {
        const timestamp = parseInt(key.split('-').pop() || '0');
        return now - timestamp < 1000; // Within last 1000ms (1 second)
      }
      return false;
    });
    
    if (recentReward) {
      console.log('Duplicate reward animation prevented:', rewardKey, 'recent:', recentReward);
      return; // Skip duplicate animation
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
        return prev; // Skip if ID already exists
      }
      const newAnimation = {
        id: animationId,
        type: reward.type,
        value: reward.value || 0,
        skillName: reward.skillName,
        x,
        y,
        driftX,
        startTime: Date.now() // Track animation start time
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

  // Helper function to calculate required XP for a level
  // Level 1->2: 1000, Level 2->3: 1500, Level 3->4: 2000, Level 4->5: 2500
  // Formula: XP needed for level N = 500 * (N + 1)
  const getRequiredXpForLevel = (level: number): number => {
    return 500 * (level + 1);
  };

  // Helper function to calculate pet level progression with multiple level-ups
  const calculatePetLevelProgression = (currentLevel: number, currentXp: number, xpToAdd: number): { newLevel: number; newXp: number; newMaxXp: number } => {
    let level = currentLevel;
    let xp = currentXp + xpToAdd;
    
    // Keep leveling up while there's enough XP for the next level
    while (true) {
      const requiredXp = getRequiredXpForLevel(level);
      if (xp >= requiredXp) {
        xp -= requiredXp;
        level += 1;
      } else {
        break;
      }
    }
    
    // Calculate max XP for current level
    const maxXp = getRequiredXpForLevel(level);
    
    return {
      newLevel: level,
      newXp: xp,
      newMaxXp: maxXp
    };
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
              
              // Trigger level-up animation
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
      // TODO: Add animal to user's collection if you have that feature
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

  // Handler to open image upload modal
  const handleObjectiveClick = (questId: number, objectiveIndex: number) => {
    // Preserve scroll position before opening modal
    const questListContainers = document.querySelectorAll('.overflow-y-auto');
    const questListContainer = Array.from(questListContainers).find(el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 200; // Likely the main quest list container
    }) as HTMLElement;
    
    if (questListContainer) {
      scrollPositionRef.current = {
        container: questListContainer,
        scrollTop: questListContainer.scrollTop
      };
    }
    
    const quest = questsState.find(q => q.id === questId);
    if (!quest) return;
    
    // Ensure objectiveSubmissions array exists and has enough entries
    if (!quest.objectiveSubmissions) {
      quest.objectiveSubmissions = [];
    }
    
    // Initialize submission if it doesn't exist
    if (!quest.objectiveSubmissions[objectiveIndex]) {
      quest.objectiveSubmissions[objectiveIndex] = {
        imageUrl: null,
        status: 'none'
      };
    }
    
    const submission = quest.objectiveSubmissions[objectiveIndex];
    // Allow upload if: not approved, not pending (user can resubmit if rejected)
    // Note: pending is shown as completed to user, but we still allow resubmission if rejected
    if (submission && (submission.status === 'none' || submission.status === 'rejected')) {
      // Cancel all reward animations when opening a new submission modal
      setRewardAnimations([]);
      
      setSelectedObjective({ questId, objectiveIndex });
      setUploadedImage(submission.imageUrl || null);
      setShowImageUploadModal(true);
    }
  };

  // Handler for image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler to submit image
  const handleSubmitImage = async () => {
    if (!selectedObjective) return;
    
    // Image is optional according to API guide, but we'll require it for better UX
    if (!uploadedImage) {
      alert('Please upload an image proof before submitting.');
      return;
    }

    // Preserve scroll position before state updates
    const questListContainers = document.querySelectorAll('.overflow-y-auto');
    const questListContainer = Array.from(questListContainers).find(el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 200;
    }) as HTMLElement;
    
    if (questListContainer) {
      scrollPositionRef.current = {
        container: questListContainer,
        scrollTop: questListContainer.scrollTop
      };
    }

    const quest = questsState.find(q => q.id === selectedObjective.questId);
    if (!quest) return;
    
    const objective = quest.objectives[selectedObjective.objectiveIndex];
    if (!objective) return;

    // Check if there's already a pending submission (prevent duplicate API calls)
    const currentSubmission = quest.objectiveSubmissions[selectedObjective.objectiveIndex];
    if (currentSubmission && currentSubmission.status === 'pending') {
      // Already has a pending submission - don't submit again
      alert('This objective already has a pending submission. Please wait for it to be reviewed.');
      return;
    }

    try {
      // Convert base64 image to blob/file
      const formData = new FormData();
      
      // If uploadedImage is a base64 string, convert it to a blob
      if (typeof uploadedImage === 'string' && uploadedImage.startsWith('data:')) {
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        formData.append('imageProof', blob, 'submission.png');
      } else if (uploadedImage && typeof uploadedImage === 'object') {
        // Try to append as File if it's a File object
        try {
          formData.append('imageProof', uploadedImage as any);
        } catch (e) {
          // If not a File, convert to blob
          const blob = new Blob([uploadedImage as any], { type: 'image/png' });
          formData.append('imageProof', blob, 'submission.png');
        }
      }
      
      if (description) {
        formData.append('description', description);
      }
      
      // Add subQuestId to formData if available
      if (objective.subQuestId) {
        formData.append('subQuestId', objective.subQuestId);
      }

      // Submit to API and get response with grantedRewards
      const submitResponse: any = await questAPI.submitQuest(quest.id.toString(), formData);
      
      // Log full response to debug
      console.log('API submitResponse (full):', JSON.stringify(submitResponse, null, 2));
      console.log('API submitResponse keys:', Object.keys(submitResponse || {}));
      
      // Check if rewards were granted by the backend
      // According to API guide: grantedRewards is only present if rewards were actually granted
      // If it's missing or empty, it means no rewards (resubmission)
      // But also check other possible field names
      const grantedRewards = submitResponse?.grantedRewards || submitResponse?.granted_rewards || submitResponse?.rewards;
      console.log('grantedRewards from API (checked multiple fields):', grantedRewards);
      
      // Also check if the response itself contains reward data directly
      const directRewards = {
        coins: submitResponse?.coins,
        rankPoints: submitResponse?.rankPoints || submitResponse?.rank_points,
        badgePoints: submitResponse?.badgePoints || submitResponse?.badge_points,
        items: submitResponse?.items
      };
      console.log('Direct rewards from response:', directRewards);
      
      // Use grantedRewards if available, otherwise check direct rewards
      const rewardsToUse = grantedRewards || (Object.values(directRewards).some(v => v !== undefined && v !== null) ? directRewards : null);
      
      const hasGrantedRewards = rewardsToUse && (
        (rewardsToUse.coins && rewardsToUse.coins > 0) ||
        (rewardsToUse.rankPoints && rewardsToUse.rankPoints > 0) ||
        (rewardsToUse.leaderboardScore && rewardsToUse.leaderboardScore > 0) ||
        (rewardsToUse.badgePoints && Object.keys(rewardsToUse.badgePoints || {}).length > 0) ||
        (rewardsToUse.items && rewardsToUse.items.length > 0)
      );
      console.log('hasGrantedRewards calculated as:', hasGrantedRewards, 'using rewards:', rewardsToUse);

      // Get the reward before updating state
      const rewardRef = { value: objective.reward };
      const processingKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
      
      // Prevent duplicate processing
      if (processingObjectives.current.has(processingKey)) {
        console.log('Already processing this objective, skipping duplicate');
        return;
      }
      processingObjectives.current.add(processingKey);

      // Check if this is a first-time submission by checking current state
      const currentQuest = questsState.find(q => q.id === selectedObjective.questId);
      const currentSubmission = currentQuest?.objectiveSubmissions?.[selectedObjective.objectiveIndex];
      const isFirstTimeSubmission = !currentSubmission || currentSubmission.status === 'none' || currentSubmission.status === 'rejected';
      console.log('Is first-time submission?', isFirstTimeSubmission, 'current status:', currentSubmission?.status);

      // Update local state - status is 'pending' but visually show as completed
      setQuestsState(prevQuests =>
        prevQuests.map(q => {
          if (q.id === selectedObjective.questId) {
            // Ensure arrays exist and have correct length
            const existingRewardsAwarded = q.objectiveRewardsAwarded || [];
            const newRewardsAwarded = [...existingRewardsAwarded];
            while (newRewardsAwarded.length < q.objectives.length) {
              newRewardsAwarded.push(false);
            }
            
            // Mark as awarded if:
            // 1. Backend granted rewards (hasGrantedRewards), OR
            // 2. It's a first-time submission (optimistic - backend might not return grantedRewards)
            const shouldAwardRewards = hasGrantedRewards || (isFirstTimeSubmission && !newRewardsAwarded[selectedObjective.objectiveIndex]);
            if (shouldAwardRewards && newRewardsAwarded[selectedObjective.objectiveIndex] !== true) {
              newRewardsAwarded[selectedObjective.objectiveIndex] = true;
            }
            
            const newSubmissions = [...q.objectiveSubmissions];
            newSubmissions[selectedObjective.objectiveIndex] = {
              imageUrl: uploadedImage,
              status: 'pending' // Status is pending in backend, but user sees it as completed
            };
            
            const newCompleted = [...q.objectiveCompleted];
            newCompleted[selectedObjective.objectiveIndex] = true; // Visually show as completed
            
            const updatedQuest = {
              ...q,
              objectiveSubmissions: newSubmissions,
              objectiveCompleted: newCompleted,
              objectiveRewardsAwarded: newRewardsAwarded
            };
            
            // Update step progress
            setTimeout(() => updateQuestStep(selectedObjective.questId), 0);
            
            return updatedQuest;
          }
          return q;
        })
      );

      // Award reward immediately after submission (user doesn't wait for backend approval)
      // Award if:
      // 1. Backend granted rewards (hasGrantedRewards from API response), OR
      // 2. It's a first-time submission (optimistic - backend might not return grantedRewards but still grants them)
      if (hasGrantedRewards || isFirstTimeSubmission) {
        console.log('Processing rewards - hasGrantedRewards:', hasGrantedRewards, 'isFirstTimeSubmission:', isFirstTimeSubmission, 'rewards:', rewardsToUse);
        // Process rewards immediately (synchronously) before closing modal
        const rewardKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
        
        // Check if already awarded
        if (!awardedRewards.current.has(rewardKey)) {
          // Mark as awarded immediately to prevent duplicates
          awardedRewards.current.add(rewardKey);
          
          // If backend didn't return rewards but it's a first-time submission, use objective reward definition
          const rewardsToProcess = hasGrantedRewards ? rewardsToUse : null;
          
          // Process badge points from API response first (if any)
          if (rewardsToProcess && rewardsToProcess.badgePoints && typeof rewardsToProcess.badgePoints === 'object') {
                Object.keys(rewardsToProcess.badgePoints).forEach(skillName => {
                  const pointsToAdd = rewardsToProcess.badgePoints[skillName];
                  if (pointsToAdd && pointsToAdd > 0) {
                    // Map API skill name to display name
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
                    
                    const displayName = skillNameMap[skillName] || skillName;
                    
                    // Trigger reward animation for badge points
                    console.log('Triggering badge points animation:', pointsToAdd, 'for', displayName);
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
                      
                      console.log(`Awarded ${pointsToAdd} badge points to ${displayName} (from API)`);
                      
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
            }
            
            // Also award coins and rank points from API response
            if (rewardsToProcess && rewardsToProcess.coins && rewardsToProcess.coins > 0) {
              // Trigger reward animation for coins
              console.log('Triggering coins animation:', rewardsToProcess.coins);
              triggerRewardAnimation({
                type: 'coins',
                value: rewardsToProcess.coins
              });
              
              setUser(prev => ({
                ...prev,
                coins: prev.coins + rewardsToProcess.coins
              }));
              console.log(`Awarded ${rewardsToProcess.coins} coins (from API)`);
            }
            
            if (rewardsToProcess && rewardsToProcess.rankPoints && rewardsToProcess.rankPoints > 0) {
              // Trigger reward animation for rank points
              console.log('Triggering rank points animation:', rewardsToProcess.rankPoints);
              triggerRewardAnimation({
                type: 'rank',
                value: rewardsToProcess.rankPoints
              });
              
              setUser(prev => ({
                ...prev,
                rankPoints: prev.rankPoints + rewardsToProcess.rankPoints
              }));
              console.log(`Awarded ${rewardsToProcess.rankPoints} rank points (from API)`);
            }
            
            // If backend didn't return rewards but it's a first-time submission, use objective reward definition
            // OR if backend returned rewards but they're incomplete, use objective reward as fallback
            if (rewardRef.value && (!hasGrantedRewards || !rewardsToProcess || 
                (!rewardsToProcess.badgePoints || Object.keys(rewardsToProcess.badgePoints || {}).length === 0) && 
                !rewardsToProcess.coins && !rewardsToProcess.rankPoints)) {
              console.log('Using objective reward definition (backend did not return rewards or rewards incomplete):', rewardRef.value);
              awardObjectiveReward(rewardRef.value, rewardKey);
            }
            
            console.log('Reward awarded for objective:', selectedObjective.objectiveIndex, 'hasGrantedRewards:', hasGrantedRewards, 'isFirstTimeSubmission:', isFirstTimeSubmission);
            
            // Clean up after 5 seconds
            setTimeout(() => {
              awardedRewards.current.delete(rewardKey);
            }, 5000);
            
            // Close modal after rewards are processed (give time for animations to start)
            setTimeout(() => {
              setShowImageUploadModal(false);
              setSelectedObjective(null);
              setUploadedImage(null);
              setDescription('');
            }, 300);
          } else {
            console.log('Reward already awarded, skipping duplicate:', rewardKey);
            
            // Close modal even if reward was already awarded
            setTimeout(() => {
              setShowImageUploadModal(false);
              setSelectedObjective(null);
              setUploadedImage(null);
              setDescription('');
            }, 100);
          }
          
          // Clear processing flag
          setTimeout(() => {
            processingObjectives.current.delete(processingKey);
          }, 100);
      } else {
        console.log('No rewards granted by backend (resubmission) - skipping reward award for objective:', selectedObjective.objectiveIndex);
        // Clear processing flag even if no reward
        setTimeout(() => {
          processingObjectives.current.delete(processingKey);
        }, 100);
        
        // Close modal even if no rewards (resubmission case)
        setTimeout(() => {
          setShowImageUploadModal(false);
          setSelectedObjective(null);
          setUploadedImage(null);
          setDescription('');
        }, 100);
      }

      // Refresh quest data from API to get updated submission status
      // Note: We merge API data with local optimistic state to handle rejections
      // We DON'T refresh immediately after submission to avoid overwriting optimistic state
      // The refresh will happen naturally when the user navigates or when the app loads
      // This prevents the "already pending" error from showing up

    } catch (error: any) {
      console.error('Error submitting quest:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Full error details:', {
        questId: quest.id,
        questIdString: quest.id.toString(),
        objectiveIndex: selectedObjective.objectiveIndex,
        subQuestId: objective.subQuestId,
        hasImage: !!uploadedImage,
        hasDescription: !!description,
        error: errorMessage,
        errorStack: error?.stack
      });
      
      // Don't close modal on error so user can retry
      alert(`Failed to submit quest: ${errorMessage}. Please check the console for details.`);
      if (selectedObjective) {
        const errorProcessingKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
        processingObjectives.current.delete(errorProcessingKey);
      }
      return; // Exit early on error, don't close modal
    }

    // Only close modal and reset on success
    // Restore scroll position
    setTimeout(() => {
      if (scrollPositionRef.current.container) {
        scrollPositionRef.current.container.scrollTop = scrollPositionRef.current.scrollTop;
      }
    }, 0);

    // Modal closing is now handled inside the try block after rewards are processed
    // This ensures rewards are visible before the modal closes
  };

  // Handler for admin approval (instant confirm for testing)
  const handleApproveObjective = useCallback((questId: number, objectiveIndex: number) => {
    const processingKey = `${questId}-${objectiveIndex}`;
    
    // Prevent duplicate execution (React StrictMode in dev causes double calls)
    if (processingObjectives.current.has(processingKey)) {
      console.log('Already processing this objective, skipping duplicate call');
      return;
    }
    
    // Mark as processing immediately
    processingObjectives.current.add(processingKey);
    
    // Get the reward from current state BEFORE updating (using object ref to access after callback)
    const rewardRef = { value: null as ObjectiveReward | null };
    setQuestsState(prevQuests => {
      // First, check if reward was already awarded by looking at current state
      const currentQuest = prevQuests.find(q => q.id === questId);
      if (currentQuest) {
        const existingRewardsAwarded = currentQuest.objectiveRewardsAwarded || [];
        // Ensure array is long enough
        const rewardsAwarded = existingRewardsAwarded.length >= objectiveIndex + 1 
          ? existingRewardsAwarded[objectiveIndex] 
          : false;

        if (rewardsAwarded === true) {
          processingObjectives.current.delete(processingKey);
          console.log('Reward already awarded, skipping');
          return prevQuests; // Return unchanged state if already awarded
        }
        
        // Get the reward from current quest state and store in ref (executes synchronously within callback)
        const objective = currentQuest.objectives[objectiveIndex];
        if (objective) {
          rewardRef.value = objective.reward;
        }
      }
      
      // Now update the state
      return prevQuests.map(quest => {
        if (quest.id === questId) {
          // Ensure objectiveRewardsAwarded array exists and has correct length
          const existingRewardsAwarded = quest.objectiveRewardsAwarded || [];
          const newRewardsAwarded = [...existingRewardsAwarded];
          // Ensure array is long enough for all objectives
          while (newRewardsAwarded.length < quest.objectives.length) {
            newRewardsAwarded.push(false);
          }
          
          // Double-check: if already awarded, don't proceed
          if (newRewardsAwarded[objectiveIndex] === true) {
            processingObjectives.current.delete(processingKey);
            return quest;
          }
          
          // Mark as awarded immediately
          newRewardsAwarded[objectiveIndex] = true;
          
          const newSubmissions = [...quest.objectiveSubmissions];
          newSubmissions[objectiveIndex] = {
            ...newSubmissions[objectiveIndex],
            status: 'approved'
          };
          const newCompleted = [...quest.objectiveCompleted];
          newCompleted[objectiveIndex] = true;

          const updatedQuest = {
            ...quest,
            objectiveSubmissions: newSubmissions,
            objectiveCompleted: newCompleted,
            objectiveRewardsAwarded: newRewardsAwarded
          };
          
          // Update step progress
          setTimeout(() => updateQuestStep(questId), 0);
          
          return updatedQuest;
        }
        return quest;
      });
    });

    // Award reward outside of state update to ensure it only happens once
    // Use setTimeout to ensure the state update callback has executed and rewardRef is set
    setTimeout(() => {
      if (rewardRef.value) {
        // Create unique key for this reward to prevent duplicates
        const rewardKey = `${questId}-${objectiveIndex}`;
        
        // Check if already awarded
        if (!awardedRewards.current.has(rewardKey)) {
          // Mark as awarded immediately to prevent duplicates
          awardedRewards.current.add(rewardKey);
          // Pass context key to awardObjectiveReward for better duplicate prevention
          awardObjectiveReward(rewardRef.value, rewardKey);
          console.log('Reward awarded for objective:', objectiveIndex);
        } else {
          console.log('Reward already awarded, skipping duplicate:', rewardKey);
        }
      }
    }, 0);
    
    // Clear processing flag after a delay
    setTimeout(() => {
      processingObjectives.current.delete(processingKey);
    }, 100);
  }, []);

  // Handler to claim reward (submit main quest completion to API)
  const handleClaimReward = async (questId: number) => {
    const quest = questsState.find(q => q.id === questId);
    if (!quest) return;
    
    // Check if all objectives are completed and reward not already claimed
    if (!areAllObjectivesCompleted(quest) || quest.rewardClaimed) {
      return;
    }
    
    // Check if already pending
    if (quest.rewardSubmissionStatus === 'pending') {
      alert('Quest completion reward is already pending approval.');
      return;
    }
    
    try {
      // Submit main quest completion (without subQuestId = submits main quest)
      const formData = new FormData();
      // Optionally add description if needed
      // formData.append('description', 'Quest completed');
      
      // Submit to API - no subQuestId means main quest submission
      const submitResponse: any = await questAPI.submitQuest(quest.id.toString(), formData);
      
      // Check if rewards were granted by the backend
      const grantedRewards = submitResponse?.grantedRewards;
      const hasGrantedRewards = grantedRewards && (
        (grantedRewards.coins && grantedRewards.coins > 0) ||
        (grantedRewards.rankPoints && grantedRewards.rankPoints > 0) ||
        (grantedRewards.leaderboardScore && grantedRewards.leaderboardScore > 0) ||
        (grantedRewards.badgePoints && Object.keys(grantedRewards.badgePoints).length > 0) ||
        (grantedRewards.items && grantedRewards.items.length > 0)
      );
      
      // Process rewards from API response
      if (hasGrantedRewards) {
        // Process badge points from API response
        if (grantedRewards.badgePoints && typeof grantedRewards.badgePoints === 'object') {
          Object.keys(grantedRewards.badgePoints).forEach(skillName => {
            const pointsToAdd = grantedRewards.badgePoints[skillName];
            if (pointsToAdd && pointsToAdd > 0) {
              // Map API skill name to display name
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
              
                  const displayName = skillNameMap[skillName] || skillName;
                  
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
                  
                  console.log(`Awarded ${pointsToAdd} badge points to ${displayName} (from API - quest completion)`);
                  
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
        }
        
        // Process coins from API response
        if (grantedRewards.coins && grantedRewards.coins > 0) {
          setUser(prev => ({
            ...prev,
            coins: prev.coins + grantedRewards.coins
          }));
          console.log(`Awarded ${grantedRewards.coins} coins (from API - quest completion)`);
        }
        
        // Process rank points from API response
        if (grantedRewards.rankPoints && grantedRewards.rankPoints > 0) {
          setUser(prev => ({
            ...prev,
            rankPoints: prev.rankPoints + grantedRewards.rankPoints
          }));
          console.log(`Awarded ${grantedRewards.rankPoints} rank points (from API - quest completion)`);
        }
        
        // Also award rewards from quest definition (for display/fallback)
        if (quest.rewards && quest.rewards.length > 0) {
          awardQuestRewards(quest.rewards, questId);
        }
      }
      
      // Update local state to show pending status
      setQuestsState(prevQuests => 
        prevQuests.map(q => {
          if (q.id === questId) {
            return {
              ...q,
              rewardSubmissionStatus: 'pending',
              rewardClaimed: hasGrantedRewards ? true : q.rewardClaimed, // Mark as claimed if rewards were granted
              questRewardsAwarded: hasGrantedRewards ? true : q.questRewardsAwarded
            };
          }
          return q;
        })
      );
      
      console.log('Main quest completion submitted:', submitResponse);
    } catch (error: any) {
      console.error('Error submitting quest completion:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to submit quest completion: ${errorMessage}. Please check the console for details.`);
    }
  };

  // Handler for admin approval of reward (instant confirm for testing)
  const handleApproveReward = useCallback((questId: number) => {
    const processingKey = `quest-reward-${questId}`;
    
    // Prevent duplicate execution (React StrictMode in dev causes double calls)
    if (processingObjectives.current.has(processingKey)) {
      console.log('Already processing quest reward, skipping duplicate call');
      return;
    }
    
    // Mark as processing immediately
    processingObjectives.current.add(processingKey);
    
    // Get the rewards from current state BEFORE updating (using object ref to access after callback)
    const rewardsRef = { value: null as ObjectiveReward[] | null };
    
    setQuestsState(prevQuests => {
      // First, check if reward was already awarded by looking at current state
      const currentQuest = prevQuests.find(q => q.id === questId);
      if (currentQuest) {
        // Early check: if reward already awarded, skip
        if (currentQuest.questRewardsAwarded === true) {
          processingObjectives.current.delete(processingKey);
          console.log('Quest reward already awarded, skipping');
          return prevQuests; // Return unchanged state if already awarded
        }
        
        // Store rewards to award outside of state update
        if (currentQuest.rewards && currentQuest.rewards.length > 0) {
          rewardsRef.value = currentQuest.rewards;
        }
      }
      
      // Now update the state
      return prevQuests.map(quest => {
        if (quest.id === questId) {
          // Double-check: if already awarded, don't proceed
          if (quest.questRewardsAwarded === true) {
            processingObjectives.current.delete(processingKey);
            return quest;
          }
          
          return {
            ...quest,
            rewardClaimed: true,
            rewardSubmissionStatus: 'approved',
            questRewardsAwarded: true,
            completed: true
          };
        }
        return quest;
      });
    });
    
    // Award rewards outside of state update to ensure it only happens once
    setTimeout(() => {
      if (rewardsRef.value && rewardsRef.value.length > 0) {
        // Check if quest rewards already awarded
        const questRewardKey = `quest-${questId}-rewards`;
        if (!awardedRewards.current.has(questRewardKey)) {
          awardedRewards.current.add(questRewardKey);
          awardQuestRewards(rewardsRef.value, questId);
          console.log('Quest rewards awarded for quest:', questId);
          
          // Clean up after 5 seconds
          setTimeout(() => {
            awardedRewards.current.delete(questRewardKey);
          }, 5000);
        } else {
          console.log('Quest rewards already awarded, skipping duplicate:', questId);
        }
      }
      
      // Clear processing flag after a delay
      setTimeout(() => {
        processingObjectives.current.delete(processingKey);
      }, 100);
    }, 0);
  }, []);

  // Handler to toggle quest expansion
  const toggleQuestExpansion = (questId: number) => {
    setSelectedQuestId(prev => prev === questId ? null : questId);
  };

  const QuestListOverlay: React.FC = () => {
    // Separate completed and uncompleted quests
    const uncompletedQuests = questsState.filter(q => !isQuestTrulyCompleted(q));
    const completedQuests = questsState.filter(q => isQuestTrulyCompleted(q));
    
    // Track if panel should animate (only on manual open)
    const [shouldAnimate, setShouldAnimate] = useState(false);
    
    // Reset animation flag when overlay closes
    useEffect(() => {
      if (!showQuestOverlay) {
        questPanelShouldAnimate.current = false;
        setShouldAnimate(false);
      } else if (showQuestOverlay && questPanelShouldAnimate.current) {
        // Only animate if manually opened
        setShouldAnimate(true);
        // Remove animation classes after animation completes
        setTimeout(() => {
          setShouldAnimate(false);
          questPanelShouldAnimate.current = false; // Reset flag after animation
        }, 400); // Slightly longer than animation duration
      }
    }, [showQuestOverlay]);

    // Scroll to selected quest when overlay opens (only if quest was manually selected, not from objective submission)
    useEffect(() => {
      if (selectedQuestId && questPanelShouldAnimate.current) {
        const element = document.getElementById(`quest-${selectedQuestId}`);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the quest briefly
            element.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-blue-500');
            }, 2000);
          }, 100);
        }
      }
    }, [selectedQuestId, showQuestOverlay]);

    return (
      <div className={`fixed inset-0 z-50 flex items-end justify-center animate-fade-in ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`}>
        <div 
          className={`w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up transition-colors ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div></div>
            <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Quests</h2>
            <button
              onClick={() => {
                setShowQuestOverlay(false);
                setSelectedQuestId(null);
              }}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quest List with Full Details */}
          <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Uncompleted Quests */}
            {uncompletedQuests.length > 0 && (
              <>
                {uncompletedQuests.map((quest) => (
                  <div 
                    key={`uncompleted-${quest.id}`}
                    id={`quest-${quest.id}`}
                    className={`rounded-xl p-4 mb-4 shadow-sm border transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                  >
                    {/* Quest Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Check size={16} className="text-purple-600" />
                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                          {quest.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <span className="text-xs">🎮</span>
                        </div>
                        <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{quest.title}</h3>
                      </div>
                    </div>
                      {/* Objectives */}
                    <div className="mb-4">
                      <div className="space-y-1">
                        {quest.objectives.map((objective, index) => {
                          const isCompleted = quest.objectiveCompleted[index] || false;
                          const submission = quest.objectiveSubmissions[index];
                          const status = submission?.status || 'none';
                          const reward = objective.reward;
                          
                          // Format reward display
                          const getRewardDisplay = () => {
                            if (reward.type === 'exp' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold">
                                    {reward.value.toLocaleString()} XP
                                  </div>
                                </div>
                              );
                            } else if (reward.type === 'coins' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <img src="/Asset/item/coin.png" alt="Coins" className="w-8 h-8 object-contain" />
                                  <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
                                </div>
                              );
                            } else if (reward.type === 'skill' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                    {reward.value}
                                  </div>
                                  {reward.skillName && (
                                    <div className={`text-xs font-semibold mt-1 text-center max-w-[80px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {reward.skillName}
                                    </div>
                                  )}
                                </div>
                              );
                            } else if (reward.type === 'rank' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md text-center leading-tight whitespace-nowrap">
                                    {reward.value.toLocaleString()} RP
                                  </div>
                                </div>
                              );
                            } else if (reward.type === 'animal') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                    </svg>
                                  </div>
                                </div>
                              );
                            }
                          };

                          // Determine visual state
                          // Note: 'pending' status is shown as completed to user (optimistic UI)
                          const isPending = status === 'pending';
                          const isApproved = status === 'approved' || status === 'pending'; // Show pending as approved visually
                          const isFullyApproved = status === 'approved'; // Fully approved (not just pending)
                          const isRejected = status === 'rejected';
                          const isClickable = isRejected || (status !== 'approved' && status !== 'pending'); // Allow resubmission if rejected

                          return (
                            <div 
                              key={index} 
                              className={`relative flex items-center justify-between py-2 border-b last:border-b-0 transition-all ${
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                              } ${
                                isRejected
                                  ? theme === 'dark' ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'
                                  : isApproved 
                                  ? theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50' 
                                  : isClickable 
                                  ? theme === 'dark' ? 'bg-green-900/30 border-green-500 cursor-pointer hover:bg-green-900/40' : 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100' 
                                  : ''
                              }`}
                              onClick={() => isClickable && handleObjectiveClick(quest.id, index)}
                            >
                              <div className="flex-1 flex items-center gap-2">
                                <span className={`text-sm ${
                                  isApproved 
                                    ? 'text-green-600 font-semibold' 
                                    : isRejected
                                    ? 'text-red-600 font-semibold'
                                    : theme === 'dark' ? 'text-gray-300' : 'text-black'
                                }`}>
                                  {objective.text}
                                </span>
                                {isPending && (
                                  <Check className="w-4 h-4 text-green-600" />
                                )}
                                {isFullyApproved && (
                                  <div className="flex items-center gap-0.5">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <Check className="w-4 h-4 text-green-600" />
                                  </div>
                                )}
                                {isRejected && (
                                  <span className="text-xs text-red-600 font-semibold">(Rejected - Click to resubmit)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0">
                                  {getRewardDisplay()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* REWARDS Section */}
                    {quest.rewards && quest.rewards.length > 0 && (
                      <div className="mb-4 relative">
                        <div className="flex justify-center absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-[#F67BA4] text-white text-center py-2.5 px-16">
                            <span className="text-m font-semibold uppercase">REWARDS</span>
                          </div>
                        </div>
                        <div className={`relative rounded-lg pt-8 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                          <button
                            onClick={() => {
                              if (areAllObjectivesCompleted(quest) && !quest.rewardClaimed && quest.rewardSubmissionStatus === 'none') {
                                handleClaimReward(quest.id);
                              }
                            }}
                            disabled={quest.rewardClaimed || !areAllObjectivesCompleted(quest) || quest.rewardSubmissionStatus === 'pending'}
                            className={`w-full p-8 rounded-lg transition-all relative ${
                              quest.rewardClaimed
                                ? theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed'
                                : quest.rewardSubmissionStatus === 'pending'
                                ? theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed opacity-70' : 'bg-gray-100 cursor-not-allowed opacity-70'
                                : areAllObjectivesCompleted(quest) && !quest.rewardClaimed && quest.rewardSubmissionStatus === 'none'
                                ? theme === 'dark' ? 'bg-green-900/40 border-2 border-green-500 hover:bg-green-900/50 cursor-pointer' : 'bg-green-50 border-2 border-green-200 hover:bg-green-100 cursor-pointer'
                                : theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed opacity-50' : 'bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {quest.rewardSubmissionStatus === 'pending' && (
                              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <span className="text-sm font-semibold text-white bg-black/50 px-3 py-1 rounded">waited…</span>
                              </div>
                            )}
                            <div className={`flex justify-center gap-6 ${quest.rewardSubmissionStatus === 'pending' ? 'opacity-30' : ''}`}>
                              {quest.rewards.map((reward, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  {reward.type === 'exp' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                      {reward.value.toLocaleString()} XP
                                    </div>
                                  ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                                    <>
                                      <img src="/Asset/item/coin.png" alt="Coins" className="w-12 h-12 object-contain mb-2" />
                                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
                                    </>
                                  ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                                    <div className="flex flex-col items-center">
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                        {reward.value}
                                      </div>
                                      {reward.skillName && (
                                        <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
                                          {reward.skillName}
                                        </div>
                                      )}
                                    </div>
                                  ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                      {reward.value.toLocaleString()} RP
                                    </div>
                                  ) : reward.type === 'animal' ? (
                                    <>
                                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                          <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                        </svg>
                                      </div>
                                      <div className={`text-xs font-semibold text-center ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>ANIMAL<br/>APPEAR!</div>
                                    </>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            
            {/* Completed Quests Section */}
            {completedQuests.length > 0 && (
              <>
                <div className={`text-xs font-semibold uppercase mb-2 mt-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  Completed
                </div>
                {completedQuests.map((quest) => (
                  <div 
                    key={`completed-${quest.id}`}
                    id={`quest-${quest.id}`}
                    className={`rounded-xl p-4 mb-4 shadow-sm border transition-all opacity-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                  >
                    {/* Quest Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Check size={16} className="text-purple-600" />
                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                          {quest.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <span className="text-xs">🎮</span>
                        </div>
                        <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{quest.title}</h3>
                      </div>
                    </div>

                    {/* Objectives */}
                    <div className="mb-4">
                      <div className="space-y-1">
                        {quest.objectives.map((objective, index) => {
                          const isCompleted = quest.objectiveCompleted[index] || false;
                          const submission = quest.objectiveSubmissions[index];
                          const status = submission?.status || 'none';
                          const reward = objective.reward;
                          
                          // Format reward display
                          const getRewardDisplay = () => {
                            if (reward.type === 'exp' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold">
                                    {reward.value.toLocaleString()} XP
                                  </div>
                                </div>
                              );
                            } else if (reward.type === 'coins' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <img src="/Asset/item/coin.png" alt="Coins" className="w-8 h-8 object-contain" />
                                  <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
                                </div>
                              );
                            } else if (reward.type === 'skill' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                    {reward.value}
                                  </div>
                                  {reward.skillName && (
                                    <div className={`text-xs font-semibold mt-1 text-center max-w-[80px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {reward.skillName}
                                    </div>
                                  )}
                                </div>
                              );
                            } else if (reward.type === 'rank' && typeof reward.value === 'number') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md text-center leading-tight whitespace-nowrap">
                                    {reward.value.toLocaleString()} RP
                                  </div>
                                </div>
                              );
                            } else if (reward.type === 'animal') {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                    </svg>
                                  </div>
                                </div>
                              );
                            }
                          };

                          const isApproved = status === 'approved';

                          return (
                            <div 
                              key={index} 
                              className={`relative flex items-center justify-between py-2 border-b last:border-b-0 transition-all ${
                                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                              } ${
                                isApproved ? theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50' : ''
                              }`}
                            >
                              <div className="flex-1 flex items-center gap-2">
                                <span className={`text-sm ${
                                  isApproved 
                                    ? 'text-green-600 font-semibold' 
                                    : theme === 'dark' ? 'text-gray-300' : 'text-black'
                                }`}>
                                  {objective.text}
                                </span>
                                {isApproved && (
                                  <div className="flex items-center gap-0.5">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <Check className="w-4 h-4 text-green-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0">
                                  {getRewardDisplay()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* REWARDS Section */}
                    {quest.rewards && quest.rewards.length > 0 && (
                      <div className="mb-4 relative">
                        <div className="flex justify-center absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-[#BF5475] text-white text-center py-2 px-6 rounded-lg">
                            <span className="text-sm font-semibold uppercase">REWARDS</span>
                          </div>
                        </div>
                        <div className={`relative rounded-lg pt-2 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                          <div className={`w-full p-4 rounded-lg cursor-not-allowed ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                            <div className="flex justify-center gap-6">
                              {quest.rewards.map((reward, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  {reward.type === 'exp' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                      {reward.value.toLocaleString()} XP
                                    </div>
                                  ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                                    <>
                                      <img src="/Asset/item/coin.png" alt="Coins" className="w-12 h-12 object-contain mb-2" />
                                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
                                    </>
                                  ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                                    <div className="flex flex-col items-center">
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                        {reward.value}
                                      </div>
                                      {reward.skillName && (
                                        <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
                                          {reward.skillName}
                                        </div>
                                      )}
                                    </div>
                                  ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                      {reward.value.toLocaleString()} RP
                                    </div>
                                  ) : reward.type === 'animal' ? (
                                    <>
                                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                          <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                        </svg>
                                      </div>
                                      <div className={`text-xs font-semibold text-center ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>ANIMAL<br/>APPEAR!</div>
                                    </>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuestOverlay: React.FC = () => {
    return <QuestListOverlay />;
  };

  // Helper function to parse date string and convert to sortable format
  const parseDate = (dateString: string): Date => {
    // Extract date part (format: "20/11/2025 (19:00-21:00)")
    const datePart = dateString.split(' ')[0]; // "20/11/2025"
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Sort items: first by usage (used -> not used -> expired), then by time
  const sortItems = (items: BackpackItem[]): BackpackItem[] => {
    return [...items].sort((a, b) => {
      const expiredA = isItemExpired(a.date);
      const expiredB = isItemExpired(b.date);
      const usedA = a.used;
      const usedB = b.used;
      
      // Determine priority: used = 0, not used = 1, expired = 2
      const getPriority = (used: boolean, expired: boolean): number => {
        if (used) return 0;
        if (expired) return 2;
        return 1;
      };
      
      const priorityA = getPriority(usedA, expiredA);
      const priorityB = getPriority(usedB, expiredB);
      
      // First sort by usage status
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort by time (nearest/soonest first)
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const ItemsListOverlay: React.FC = () => {
    // Sort items by usage status, then by time
    const sortedItems = sortItems(backpackItems);

    return (
      <div className={`fixed inset-0 z-50 flex items-end justify-center animate-fade-in ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`}>
        <div className={`w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up transition-colors ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Header */}
          <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div></div>
            <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Items</h2>
            <button
              onClick={() => setShowItemsOverlay(false)}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {sortedItems.map((item) => {
              const isUsed = item.used;
              const timePassed = hasItemTimePassed(item.date);
              const expired = isItemExpired(item.date);
              
              // Determine background color
              let backgroundColor = theme === 'dark' ? '#1f2937' : 'white';
              if (isUsed) {
                backgroundColor = '#e3cd0b'; // Yellow for used
              } else if (expired) {
                backgroundColor = '#ef4444'; // Red for expired
              }
              
              return (
                <div 
                  key={item.id}
                  className={`flex items-center gap-3 p-4 rounded-xl mb-3 shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
                  style={{ backgroundColor }}
                >
                  <img src={item.image} alt={item.name} className="w-24 h-18 object-contain rounded-lg" />
                  <div className="flex-1">
                    <div className={`font-semibold text-base mb-1 ${theme === 'dark' && !isUsed && !expired ? 'text-white' : 'text-black'}`}>{item.name}</div>
                    <div className={`text-sm mb-1 ${theme === 'dark' && !isUsed && !expired ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</div>
                    <div className={`text-xs ${theme === 'dark' && !isUsed && !expired ? 'text-gray-500' : 'text-gray-500'}`}>{item.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm px-3 py-1 rounded-full font-semibold ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-black'}`}>
                      x{item.quantity}
                    </div>
                    {expired && !isUsed && (
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    {!expired && !isUsed && (
                      <button
                        onClick={() => handleUseItem(item.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Use
                      </button>
                    )}
                    {isUsed && (
                      <span className="text-xs text-gray-600 font-semibold">Used</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const ItemsOverlay: React.FC = () => {
    return <ItemsListOverlay />;
  };

  const SettingsOverlay: React.FC = () => {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
        <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          {/* Header */}
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
            <h2 className="font-bold text-xl flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h2>
            <button 
              onClick={() => setShowSettingsOverlay(false)}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Theme Toggle */}
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Appearance</span>
                <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    theme === 'light' 
                      ? 'bg-white shadow-md border-2 border-indigo-500 text-indigo-600' 
                      : 'hover:bg-gray-200/50 text-gray-500'
                  }`}
                >
                  <Sun size={18} />
                  <span className="font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 shadow-md border-2 border-indigo-400 text-indigo-300' 
                      : 'hover:bg-gray-200/50 text-gray-500'
                  }`}
                >
                  <Moon size={18} />
                  <span className="font-medium">Dark</span>
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Account
              </h3>
              <button
                onClick={handleLogout}
                className="w-full py-3.5 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center gap-2 font-semibold group"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                Log Out
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className={`p-4 text-center text-xs ${theme === 'dark' ? 'text-gray-500 bg-gray-900/30' : 'text-gray-400 bg-gray-50'}`}>
            HamsterWorld v1.0.0
          </div>
        </div>
      </div>
    );
  };

  const BadgeOverlay: React.FC = () => {
    if (!selectedSkill) return null;

    // Define level names and colors: Bronze, Silver, Gold, Diamond (Unranked has no badge)
    const levelNames = ["Bronze", "Silver", "Gold", "Diamond"];
    const levelColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
    // Map skill level to badge index: level 1=Unranked (no badge), level 2=Bronze (index 0), etc.
    const badgeIndex = selectedSkill.currentLevel - 2; // -1 for Unranked, 0 for Bronze, etc.
    const currentLevelName = badgeIndex >= 0 ? levelNames[badgeIndex] : "Unranked";
    const currentLevelColor = badgeIndex >= 0 ? levelColors[badgeIndex] : "#9CA3AF";
    const isDiamond = selectedSkill.currentLevel === 5; // Diamond has no progression

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <button 
              onClick={() => setShowBadgeOverlay(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h2 className="font-bold text-lg">{selectedSkill.name}</h2>
            <div></div>
          </div>

          {/* Badge Info */}
          <div className="p-4">
            <div className="text-center mb-6">
              <h3 className="font-bold text-xl mb-1">{selectedSkill.name}</h3>
              <p className="text-gray-600 text-sm">{selectedSkill.description}</p>
            </div>

            {/* Progress Circle - Hidden for Diamond level */}
            {!isDiamond && (
              <div className="flex justify-center mb-6">
                <div className="relative w-40 h-40">
                  {/* Outer circle */}
                  <div className="absolute inset-0 rounded-full border-8 border-blue-100"></div>
                  {/* Inner circle with progress */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedSkill.points.toLocaleString()}</div>
                        <div className="text-gray-600">/ {selectedSkill.maxPoints.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Level Badges - Only show Bronze, Silver, Gold, Diamond (no Unranked badge) */}
            <div className="flex justify-center gap-2 mb-6">
              {levelNames.map((levelName, index) => {
                // Badge index corresponds to skill level - 2 (Bronze = level 2 = index 0)
                const badgeLevel = index + 2; // Bronze is level 2, Silver is level 3, etc.
                const isUnlocked = badgeLevel <= selectedSkill.currentLevel;
                // Color mapping: Bronze=amber, Silver=gray, Gold=yellow, Diamond=blue
                const borderColorClass = index === 0 ? 'amber' : index === 1 ? 'gray' : index === 2 ? 'yellow' : 'blue';
                
                return (
                  <div 
                    key={index} 
                    className={`w-12 h-12 flex items-center justify-center ${
                      !isUnlocked ? 'opacity-50' : ''
                    }`}
                  >
                    <img 
                      src={getBadgeIconPath(selectedSkill.name, badgeLevel)} 
                      alt={levelName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              })}
            </div>

            {/* Rewards Section */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-full border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">REWARDS</span>
                <div className="w-full border-t border-gray-300"></div>
              </div>
              
              <div className="flex justify-center gap-6">
                {selectedSkill.rewards.map((reward, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {reward.type === "animal" ? (
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                        <img src="/Asset/item/coin.png" alt="Coins" className="w-6 h-6 object-contain" />
                      </div>
                    )}
                    <div className="text-center text-sm font-medium">
                      {reward.value}
        </div>
      </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors">
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Welcome to HamsterWorld</h1>
          <p className="text-gray-600 text-center mb-6">Please login to continue</p>
          <div className="space-y-4">
            <button
              onClick={() => authAPI.discordLogin(window.location.origin)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Login with Discord
            </button>
            <button
              onClick={async () => {
                try {
                  await authAPI.devLogin('DevUser');
                  setIsAuthenticated(true);
                  window.location.reload(); // Reload to fetch data
                } catch (error) {
                  console.error('Dev login failed:', error);
                }
              }}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Developer Login (Testing)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
      {/* Settings Overlay */}
      {showSettingsOverlay && <SettingsOverlay />}
      
      {/* Reward Animations */}
      {rewardAnimations.map((animation) => (
        <RewardAnimation key={animation.id} animation={animation} />
      ))}
      {/* Header */}
      <div className={`shadow-sm p-4 transition-colors ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <Crown size={16} className="text-yellow-500" />
            </div>
            {isEditingDescription ? (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setIsEditingDescription(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingDescription(false);
                  }
                }}
                className={`text-sm font-medium border-b-2 border-blue-500 outline-none focus:border-blue-600 px-2 py-1 rounded shadow-sm min-w-[200px] ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                autoFocus
              />
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity group"
                onClick={() => setIsEditingDescription(true)}
              >
                <span className={`text-sm font-medium px-2 py-1 rounded shadow-sm ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>{description}</span>
                <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <img src="/Asset/item/coin.png" alt="Coins" className="w-6 h-6 object-contain" />
              <span className={`font-bold px-4 py-2 rounded shadow-sm ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>{user.coins}</span>
            </div>
            <button 
              onClick={() => setShowSettingsOverlay(true)}
              className={`p-2 rounded-full shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Section with Rank Card */}
      <div className={`p-4 shadow-sm mb-4 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Pet Display on Left */}
          <div className="flex flex-col items-center flex-shrink-0">
            <img src={user.avatar} alt="Pet" className="w-45 h-45 sm:w-48 sm:h-48 object-contain" />
            <div className="text-center mt-1">
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.petLevel}</span>
            </div>
          </div>
          
          {/* Rank Card on Right - Clickable with Flip Animation */}
          <div className="flex-1 min-w-0" style={{ flex: '1 1 auto' }}>
            <div 
              className={`flip-card cursor-pointer w-full sm:max-w-md ${rankCardFlipped ? 'flipped' : ''}`}
              onClick={() => setRankCardFlipped(!rankCardFlipped)}
              style={{ minHeight: '280px' }}
            >
              <div className="flip-card-inner" style={{ minHeight: '280px' }}>
                {/* Front of Card */}
                <div className={`flip-card-front rounded-xl p-4 shadow-md border flex flex-col w-full h-full justify-between ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  {/* Rank Icon/Badge */}
                  <div className="flex justify-center -mt-10">
                    <img 
                      src={user.badge} 
                      alt="Rank Badge" 
                      className="w-56 h-56 sm:w-56 sm:h-56 object-contain" 
                    />
                  </div>
                  <h2 className={`font-bold text-2xl sm:text-3xl text-center truncate -mt-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.rankName}</h2>
                  <div className="flex flex-col">
                    <div className={`w-full rounded-full h-3 mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((user.rankPoints / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className={`text-xs sm:text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user.rankPoints}/100 RP
                    </div>
                  </div>
                </div>
                
                {/* Back of Card - Rank Objectives */}
                <div className={`flip-card-back rounded-xl p-3 sm:p-4 shadow-md border flex flex-col w-full h-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <h3 className={`font-bold text-lg sm:text-xl text-center mb-2 sm:mb-3 truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.rankName}</h3>
                  <div className={`text-xs font-semibold mb-2 sm:mb-3 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Objectives to Rank Up</div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs mb-3">
                    {user.rankObjectives.map((objective, index) => {
                      // Check completion status based on objective type
                      let isCompleted = false;
                      if (objective.text.includes('Rank Points')) {
                        isCompleted = user.rankPoints >= 100;
                      } else if (objective.questId) {
                        // Check if linked quest is completed
                        const linkedQuest = questsState.find(q => q.id === objective.questId);
                        isCompleted = linkedQuest ? isQuestTrulyCompleted(linkedQuest) : false;
                      } else if (objective.coinCost) {
                        // Check if user has enough coins
                        isCompleted = user.coins >= objective.coinCost;
                      } else {
                        isCompleted = objective.completed;
                      }
                      
                      const showProgress = objective.text.includes('Rank Points');
                      
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <Check 
                            size={18} 
                            className={`flex-shrink-0 mt-0.5 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} 
                          />
                          <div className="flex-1">
                            <span className={`${isCompleted ? 'line-through text-gray-500' : theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              {objective.text}
                            </span>
                            {showProgress && !isCompleted && (
                              <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Progress: {user.rankPoints}/100 RP
                              </div>
                            )}
                            {objective.coinCost && !isCompleted && (
                              <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Need: {objective.coinCost} coins (Have: {user.coins})
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t pt-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card flip
                        handleRankUp();
                      }}
                      disabled={!canRankUp()}
                      className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors ${
                        canRankUp()
                          ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Rank Up
                    </button>
                  </div>
                  <div className="mt-1.5 text-[10px] text-gray-400 text-center">
                    Tap to flip back
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-black text-lg mb-3">Complete tasks and Badge</h2>
        <div className="grid grid-cols-4 gap-4">
          {skills.map((skill, index) => (
            <SkillCard key={index} skill={skill} />
          ))}
        </div>
      </div>

      {/* Quests Section */}
      <div className="px-4 mb-4">
        {/* Show first 2 uncompleted quests on main page (including those with all objectives done but reward not claimed) */}
        {questsState
          .filter(quest => !isQuestTrulyCompleted(quest))
          .slice(0, 2)
          .map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        <button 
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          onClick={() => {
            setSelectedQuestId(null);
            setShowQuestOverlay(true);
          }}
        >
          More Quests
        </button>
      </div>

      {/* Leaderboard Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-lg mb-3 text-black">Leader Board</h2>
        {leaderboard.map((item, index) => (
          <LeaderboardItemComponent key={index} item={item} />
        ))}
      </div>

      {/* Backpack Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-lg mb-3 text-black">Items in Backpack</h2>
        {sortItems(backpackItems).slice(0, 3).map((item) => (
          <BackpackItemComponent key={item.id} item={item} onUse={handleUseItem} onDelete={handleDeleteItem} />
        ))}
        <button 
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          onClick={() => setShowItemsOverlay(true)}
        >
          More Items
        </button>
      </div>

      {/* Quest Overlay */}
      {showQuestOverlay && <QuestOverlay />}
      
      {/* Items Overlay */}
      {showItemsOverlay && <ItemsOverlay />}
      
      {/* Badge Overlay */}
      {showBadgeOverlay && <BadgeOverlay />}

      {/* Image Upload Modal */}
      {showImageUploadModal && selectedObjective && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Import your image</h2>
              <button
                onClick={() => {
                  setShowImageUploadModal(false);
                  setSelectedObjective(null);
                  setUploadedImage(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="image-upload-input" className="block text-center mb-4 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                  {uploadedImage ? (
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      className="max-w-full max-h-64 mx-auto rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">Click to select image</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload-input"
                />
              </label>
            </div>

            <button
              onClick={handleSubmitImage}
              disabled={!uploadedImage}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                uploadedImage
                  ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit to Admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
