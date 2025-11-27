'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Gamepad2, Monitor, Paintbrush, Code, ChevronRight, Star, Crown, Users, Ticket, Coins, X, Check, Edit2, Gift } from 'lucide-react';

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

type ApprovalStatus = 'none' | 'pending' | 'approved';

interface QuestObjective {
  text: string;
  reward: ObjectiveReward; // Single reward per objective
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

  const [skills, setSkills] = useState<Skill[]>([
    { 
      name: "Game Design", 
      icon: Gamepad2,
      currentLevel: 1, // Bronze
      points: 0,
      maxPoints: 10000,
      description: "Basic Game Designer. Can Create Simple Games",
      rewards: [
        { type: "animal", value: "ANIMAL APPEAR!" },
        { type: "coins", value: "x300" }
      ]
    },
    { 
      name: "Level Design", 
      icon: Monitor,
      currentLevel: 1, // Bronze
      points: 0,
      maxPoints: 10000,
      description: "Basic Level Designer. Can Create Simple Levels",
      rewards: [
        { type: "animal", value: "ANIMAL APPEAR!" },
        { type: "coins", value: "x200" }
      ]
    },
    { 
      name: "Drawing", 
      icon: Paintbrush,
      currentLevel: 1, // Bronze
      points: 0,
      maxPoints: 10000,
      description: "Master Artist. Can Create Professional Art",
      rewards: [
        { type: "animal", value: "ANIMAL APPEAR!" },
        { type: "coins", value: "x500" }
      ]
    },
    { 
      name: "C# Programming", 
      icon: Code,
      currentLevel: 1, // Bronze
      points: 0,
      maxPoints: 10000,
      description: "Basic Programmer. Can Create Simple System",
      rewards: [
        { type: "animal", value: "ANIMAL APPEAR!" },
        { type: "coins", value: "x300" }
      ]
    }
  ]);

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
  const handleUseItem = (itemId: number) => {
    setBackpackItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, used: true, active: true };
        } else {
          // Un-use and deactivate all other items (only 1 used at a time across all types)
          return { ...item, used: false, active: false };
        }
      });
    });
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
        
        {/* Circular icon with colored border */}
        <div 
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
            isLevelingUp ? 'scale-125 shadow-lg' : ''
          }`}
          style={{ 
            borderColor: currentLevelColor,
            backgroundColor: `${currentLevelColor}15`, // 15% opacity
            boxShadow: isLevelingUp ? `0 0 20px ${currentLevelColor}` : 'none'
          }}
        >
          <skill.icon size={32} style={{ color: currentLevelColor }} />
        </div>
        
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
  const handleRankUp = () => {
    if (!canRankUp()) return;
    
    // Find current rank index
    const currentRankIndex = RANKS.indexOf(user.rankName as RankName);
    if (currentRankIndex === -1 || currentRankIndex === RANKS.length - 1) {
      // Already at max rank or rank not found
      return;
    }
    
    // Get coin cost
    const coinObjective = user.rankObjectives.find(obj => obj.coinCost);
    const coinCost = coinObjective?.coinCost || 0;
    
    // Deduct coins
    if (coinCost > 0 && user.coins >= coinCost) {
      setUser(prev => ({
        ...prev,
        coins: prev.coins - coinCost,
        rankName: RANKS[currentRankIndex + 1] as RankName,
        badge: getRankIconPath(RANKS[currentRankIndex + 1]),
        rankPoints: 0 // Reset rank points after ranking up
      }));
    }
  };

  // Helper function to check if all objectives are completed (approved by admin)
  const areAllObjectivesCompleted = (quest: Quest): boolean => {
    return quest.objectiveSubmissions.every(submission => submission.status === 'approved');
  };

  // Helper function to get count of approved objectives (for step progress)
  const getApprovedObjectivesCount = (quest: Quest): number => {
    return quest.objectiveSubmissions.filter(submission => submission.status === 'approved').length;
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
        return prev; // Skip if ID already exists
      }
      return [...prev, {
        id: animationId,
        type: reward.type,
        value: reward.value || 0,
        skillName: reward.skillName,
        x,
        y,
        driftX,
        startTime: Date.now() // Track animation start time
      }];
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
    
    const submission = quest.objectiveSubmissions[objectiveIndex];
    // Only allow upload if not already approved
    if (submission.status !== 'approved') {
      // Cancel all reward animations when opening a new submission modal
      setRewardAnimations([]);
      
      setSelectedObjective({ questId, objectiveIndex });
      setUploadedImage(submission.imageUrl);
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
  const handleSubmitImage = () => {
    if (!selectedObjective || !uploadedImage) return;

    // Preserve scroll position before state updates
    // Find the quest list container in the overlay (the scrollable div)
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

    // Get the quest and objective before updating state
    const quest = questsState.find(q => q.id === selectedObjective.questId);
    if (!quest) return;
    
    const objective = quest.objectives[selectedObjective.objectiveIndex];
    if (!objective) return;

    // Award the objective reward immediately (no admin approval needed)
    const existingRewardsAwarded = quest.objectiveRewardsAwarded || [];
    const rewardAlreadyAwarded = existingRewardsAwarded.length > selectedObjective.objectiveIndex 
      ? existingRewardsAwarded[selectedObjective.objectiveIndex] 
      : false;
    
    // Create unique key for this reward to prevent duplicates
    const rewardKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
    
    if (objective.reward && !rewardAlreadyAwarded && !awardedRewards.current.has(rewardKey)) {
      // Mark as awarded immediately to prevent duplicates
      awardedRewards.current.add(rewardKey);
      // Pass context key to awardObjectiveReward for better duplicate prevention
      awardObjectiveReward(objective.reward, rewardKey);
    }

    setQuestsState(prevQuests =>
      prevQuests.map(quest => {
        if (quest.id === selectedObjective.questId) {
          const newSubmissions = [...quest.objectiveSubmissions];
          // Mark as approved immediately since reward is given instantly
          newSubmissions[selectedObjective.objectiveIndex] = {
            imageUrl: uploadedImage,
            status: 'approved'
          };
          
          // Mark objective as completed and reward as awarded
          const newCompleted = [...quest.objectiveCompleted];
          newCompleted[selectedObjective.objectiveIndex] = true;
          
          const newRewardsAwarded = [...(quest.objectiveRewardsAwarded || [])];
          while (newRewardsAwarded.length < quest.objectives.length) {
            newRewardsAwarded.push(false);
          }
          newRewardsAwarded[selectedObjective.objectiveIndex] = true;
          
          const updatedQuest = {
            ...quest,
            objectiveSubmissions: newSubmissions,
            objectiveCompleted: newCompleted,
            objectiveRewardsAwarded: newRewardsAwarded
          };
          
          // Update step progress (without triggering scroll)
          setTimeout(() => updateQuestStep(selectedObjective.questId), 0);
          
          return updatedQuest;
        }
        return quest;
      })
    );

    // Restore scroll position after state update
    setTimeout(() => {
      if (scrollPositionRef.current.container) {
        scrollPositionRef.current.container.scrollTop = scrollPositionRef.current.scrollTop;
      }
    }, 0);

    // Close modal
    setShowImageUploadModal(false);
    setSelectedObjective(null);
    setUploadedImage(null);
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

  // Handler to claim reward (now with approval workflow)
  const handleClaimReward = (questId: number) => {
    setQuestsState(prevQuests => 
      prevQuests.map(quest => {
        if (quest.id === questId && areAllObjectivesCompleted(quest) && !quest.rewardClaimed) {
          return {
            ...quest,
            rewardSubmissionStatus: 'pending',
          };
        }
        return quest;
      })
    );
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

  const QuestListOverlay: React.FC = () => {
    // Sort quests: uncompleted first (including those with all objectives done but reward not claimed), completed at bottom
    const sortedQuests = [...questsState].sort((a, b) => {
      const aCompleted = isQuestTrulyCompleted(a);
      const bCompleted = isQuestTrulyCompleted(b);
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
    
    // Separate completed and uncompleted quests for better visual organization
    const uncompletedQuests = sortedQuests.filter(q => !isQuestTrulyCompleted(q));
    const completedQuests = sortedQuests.filter(q => isQuestTrulyCompleted(q));
    
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
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center ${shouldAnimate ? 'animate-fade-in' : ''}`}>
        <div className={`bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20 ${shouldAnimate ? 'animate-slide-up' : ''}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div></div>
            <h2 className="font-bold text-lg">All Quests</h2>
            <button 
              onClick={() => {
                setShowQuestOverlay(false);
                setSelectedQuestId(null);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
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
                    key={quest.id}
                    id={`quest-${quest.id}`}
                    className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 transition-all"
                  >
              {/* Quest Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600">
                    {quest.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">🎮</span>
                  </div>
                  <h3 className="font-bold text-xl">{quest.title}</h3>
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
                            <div className="text-xs font-semibold">x{reward.value}</div>
                          </div>
                        );
                      } else if (reward.type === 'skill' && typeof reward.value === 'number') {
                        return (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                              {reward.value}
                            </div>
                            {reward.skillName && (
                              <div className="text-xs font-semibold mt-1 text-center max-w-[80px]">
                                {reward.skillName}
        </div>
      )}
                          </div>
                        );
                      } else if (reward.type === 'rank' && typeof reward.value === 'number') {
                        return (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold">
                              {reward.value}rp
                            </div>
                          </div>
                        );
                      } else if (reward.type === 'animal') {
                        return (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                              </svg>
                            </div>
                          </div>
                        );
                      }
                    };

                    // Determine visual state
                    const isPending = status === 'pending';
                    const isApproved = status === 'approved';
                    const isClickable = status !== 'approved';

                    return (
                      <div 
                        key={index} 
                        className={`relative flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all ${
                          isPending 
                            ? 'bg-gray-800 opacity-70' 
                            : isApproved 
                            ? 'bg-green-50' 
                            : isClickable 
                            ? 'cursor-pointer hover:bg-gray-50' 
                            : ''
                        }`}
                        onClick={() => isClickable && handleObjectiveClick(quest.id, index)}
                      >
                        {isPending && (
                          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                            <span className="text-sm font-semibold text-white bg-black/50 px-3 py-1 rounded">waited…</span>
                          </div>
                        )}
                        <div className={`flex-1 flex items-center gap-2 ${isPending ? 'opacity-30' : ''}`}>
                          <span className={`text-sm ${isApproved ? 'text-green-700 font-semibold' : ''}`}>
                            {objective.text}
                          </span>
                          {isApproved && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className={`flex items-center gap-2 ${isPending ? 'opacity-30' : ''}`}>
                          <div className="flex-shrink-0">
                            {getRewardDisplay()}
                          </div>
                          {/* Instant confirm button for testing */}
                          {isPending && (
          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveObjective(quest.id, index);
                              }}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors z-20 relative"
                              title="Approve (Testing)"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REWARDS Section */}
              {quest.rewards && quest.rewards.length > 0 && (
                <div className="mb-4">
                  <div className="bg-pink-500 text-white text-center py-2 mb-0 rounded-t-lg">
                    <span className="text-sm font-semibold uppercase">REWARDS</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (areAllObjectivesCompleted(quest) && !quest.rewardClaimed && quest.rewardSubmissionStatus === 'none') {
                          handleClaimReward(quest.id);
                        }
                      }}
                      disabled={quest.rewardClaimed || !areAllObjectivesCompleted(quest) || quest.rewardSubmissionStatus === 'pending'}
                      className={`w-full p-4 rounded-b-lg transition-all relative ${
                        quest.rewardClaimed
                          ? 'bg-green-200 cursor-not-allowed'
                          : quest.rewardSubmissionStatus === 'pending'
                          ? 'bg-gray-800 cursor-not-allowed opacity-70'
                          : areAllObjectivesCompleted(quest)
                          ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                          : 'bg-red-500 cursor-not-allowed'
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
                              <div className="w-16 h-16 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                                {reward.value.toLocaleString()} XP
                              </div>
                            ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                              <>
                                <img src="/Asset/item/coin.png" alt="Coins" className="w-10 h-10 object-contain mb-2" />
                                <div className="text-sm font-semibold">x{reward.value}</div>
                              </>
                            ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                                  {reward.value}
                                </div>
                                {reward.skillName && (
                                  <div className="text-xs font-semibold text-center max-w-[100px]">
                                    {reward.skillName}
                                  </div>
                                )}
                              </div>
                            ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                              <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                                {reward.value}rp
                              </div>
                            ) : reward.type === 'animal' ? (
                              <>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                  </svg>
                                </div>
                                <div className="text-xs font-semibold text-center">ANIMAL<br/>APPEAR!</div>
                              </>
                            ) : null}
                          </div>
                        ))}
                      </div>
          </button>
                    {/* Instant confirm button for testing */}
                    {quest.rewardSubmissionStatus === 'pending' && (
                      <button
                        onClick={() => handleApproveReward(quest.id)}
                        className="absolute top-2 right-2 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors z-20"
                        title="Approve Reward (Testing)"
                      >
                        ✓ Confirm
                      </button>
                    )}
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
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2 mt-6">
                  Completed
                </div>
                {completedQuests.map((quest) => (
                  <div 
                    key={quest.id}
                    id={`quest-${quest.id}`}
                    className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 transition-all opacity-50"
                  >
              {/* Quest Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600">
                    {quest.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">🎮</span>
                  </div>
                  <h3 className="font-bold text-xl">{quest.title}</h3>
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
                            <div className="text-xs font-semibold">x{reward.value}</div>
                          </div>
                        );
                      } else if (reward.type === 'skill' && typeof reward.value === 'number') {
                        return (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                              {reward.value}
                            </div>
                            {reward.skillName && (
                              <div className="text-xs font-semibold mt-1 text-center max-w-[80px]">
                                {reward.skillName}
                              </div>
                            )}
                          </div>
                        );
                      } else if (reward.type === 'rank' && typeof reward.value === 'number') {
                        return (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold">
                              {reward.value}rp
                            </div>
                          </div>
                        );
                      } else if (reward.type === 'animal') {
                        return (
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
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
                        className={`relative flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0 ${
                          isApproved ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <span className={`text-sm ${isApproved ? 'text-green-700 font-semibold' : ''}`}>
                            {objective.text}
                          </span>
                          {isApproved && (
                            <Check className="w-4 h-4 text-green-600" />
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
                <div className="mb-4">
                  <div className="bg-pink-500 text-white text-center py-2 mb-0 rounded-t-lg">
                    <span className="text-sm font-semibold uppercase">REWARDS</span>
                  </div>
                  <div className="relative">
                    <div className="w-full p-4 rounded-b-lg bg-green-200 cursor-not-allowed">
                      <div className="flex justify-center gap-6">
                        {quest.rewards.map((reward, index) => (
                          <div key={index} className="flex flex-col items-center">
                            {reward.type === 'exp' && typeof reward.value === 'number' ? (
                              <div className="w-16 h-16 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                                {reward.value.toLocaleString()} XP
                              </div>
                            ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                              <>
                                <img src="/Asset/item/coin.png" alt="Coins" className="w-10 h-10 object-contain mb-2" />
                                <div className="text-sm font-semibold">x{reward.value}</div>
                              </>
                            ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                                  {reward.value}
                </div>
                                {reward.skillName && (
                                  <div className="text-xs font-semibold text-center max-w-[100px]">
                                    {reward.skillName}
                </div>
                                )}
                              </div>
                            ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                              <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                                {reward.value}rp
                              </div>
                            ) : reward.type === 'animal' ? (
                              <>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                  </svg>
                                </div>
                                <div className="text-xs font-semibold text-center">ANIMAL<br/>APPEAR!</div>
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div></div>
            <h2 className="font-bold text-lg">All Items</h2>
            <button
              onClick={() => setShowItemsOverlay(false)}
              className="p-2 rounded-full hover:bg-gray-100"
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
              let backgroundColor = 'white';
              if (isUsed) {
                backgroundColor = '#e3cd0b'; // Yellow for used
              } else if (expired) {
                backgroundColor = '#ef4444'; // Red for expired
              }
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
                  style={{ backgroundColor }}
                >
                  <img src={item.image} alt={item.name} className="w-24 h-18 object-contain rounded-lg" />
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-1">{item.name}</div>
                    <div className="text-sm text-gray-600 mb-1">{item.description}</div>
                    <div className="text-xs text-gray-500">{item.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm bg-gray-100 px-3 py-1 rounded-full font-semibold">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isUnlocked 
                        ? `border-4 border-${borderColorClass}-500`
                        : 'border-2 border-gray-300'
                    }`}
                    style={{ 
                      backgroundColor: isUnlocked ? levelColors[index] : '#f3f4f6',
                      color: isUnlocked ? 'white' : 'black'
                    }}
                  >
                    <span className="text-xs font-bold">{levelName[0]}</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reward Animations */}
      {rewardAnimations.map((animation) => (
        <RewardAnimation key={animation.id} animation={animation} />
      ))}
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
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
                className="text-sm font-medium text-black bg-white border-b-2 border-blue-500 outline-none focus:border-blue-600 px-2 py-1 rounded shadow-sm min-w-[200px]"
                autoFocus
              />
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity group"
                onClick={() => setIsEditingDescription(true)}
              >
                <span className="text-sm font-medium text-black bg-white px-2 py-1 rounded shadow-sm">{description}</span>
                <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <img src="/Asset/item/coin.png" alt="Coins" className="w-6 h-6 object-contain" />
            <span className="font-bold text-black bg-white px-4 py-2 rounded shadow-sm">{user.coins}</span>
          </div>
        </div>
      </div>

      {/* User Profile Section with Rank Card */}
      <div className="p-4 bg-white shadow-sm mb-4">
        <div className="flex items-center gap-6">
          {/* Pet Display on Left */}
          <div className="flex flex-col items-center flex-shrink-0">
            <img src={user.avatar} alt="Pet" className="w-42 h-42 sm:w-48 sm:h-48 object-contain" />
            <div className="text-center mt-1">
              <span className="text-xl font-bold text-black">{user.petLevel}</span>
            </div>
          </div>
          
          {/* Rank Card on Right - Clickable with Flip Animation */}
          <div className="flex-1 min-w-0">
            <div 
              className={`flip-card cursor-pointer w-full ${rankCardFlipped ? 'flipped' : ''}`}
              onClick={() => setRankCardFlipped(!rankCardFlipped)}
              style={{ minHeight: '280px' }}
            >
              <div className="flip-card-inner" style={{ minHeight: '280px' }}>
                {/* Front of Card */}
                <div className="flip-card-front bg-white rounded-xl p-4 shadow-md border border-gray-200 flex flex-col w-full h-full justify-between">
                  {/* Rank Icon/Badge */}
                  <div className="flex justify-center -mt-10">
                    <img 
                      src={user.badge} 
                      alt="Rank Badge" 
                      className="w-56 h-56 sm:w-56 sm:h-56 object-contain" 
                    />
                  </div>
                  <h2 className="font-bold text-2xl sm:text-3xl text-center text-black truncate -mt-8">{user.rankName}</h2>
                  <div className="flex flex-col">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((user.rankPoints / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 text-center">
                      {user.rankPoints}/100 RP
                    </div>
                  </div>
                </div>
                
                {/* Back of Card - Rank Objectives */}
                <div className="flip-card-back bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 flex flex-col w-full h-full">
                  <h3 className="font-bold text-lg sm:text-xl text-center mb-2 sm:mb-3 truncate">{user.rankName}</h3>
                  <div className="text-xs font-semibold mb-2 sm:mb-3 text-gray-600 text-center">Objectives to Rank Up</div>
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
                            <span className={`${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                              {objective.text}
                            </span>
                            {showProgress && !isCompleted && (
                              <div className="text-xs text-gray-500 mt-1">
                                Progress: {user.rankPoints}/100 RP
                              </div>
                            )}
                            {objective.coinCost && !isCompleted && (
                              <div className="text-xs text-gray-500 mt-1">
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
