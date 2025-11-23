'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Gamepad2, Monitor, Paintbrush, Code, ChevronRight, Star, Crown, Users, Ticket, Coins, X, Check, Edit2 } from 'lucide-react';

interface RankObjective {
  text: string;
  completed: boolean;
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
  level: number;
  avatar: string;
  badge: string;
  xp: number;
  maxXp: number;
  coins: number;
  rankPoints: number;
  rankName: string;
  rankObjectives: RankObjective[];
  gameDemos: number;
  petLevel: number;
}

interface Skill {
  name: string;
  icon: React.ComponentType<any>;
  currentLevel: number; // 1=Bronze, 2=Silver, 3=Gold, 4=Diamond
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

interface QuestObjective {
  text: string;
  reward: ObjectiveReward; // Single reward per objective
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
  rewardClaimed: boolean; // Track if reward has been claimed
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
  const [questsState, setQuestsState] = useState<Quest[]>([
    {
      id: 1,
      type: "Main Quest",
      title: "Shooting Game",
      description: "Player Movement Script",
      steps: [1, 2, 3, 4],
      currentStep: 3,
      completed: false,
      rewards: [
        { type: 'exp', value: 5000 },
        { type: 'animal', value: 'ANIMAL APPEAR!' },
        { type: 'coins', value: 300 }
      ],
      objectives: [
        { text: "Map Layout", reward: { type: 'coins', value: 30 } },
        { text: "Enemy Script", reward: { type: 'exp', value: 5000 } },
        { text: "Map Layout", reward: { type: 'coins', value: 50 } },
        { text: "Sound Effect", reward: { type: 'animal', value: 'ANIMAL APPEAR!' } }
      ],
      objectiveCompleted: [true, true, true, false], // 3 out of 4 completed
      rewardClaimed: false,
      category: "Game Design"
    },
    {
      id: 2,
      type: "Special Quest",
      title: "Lighting 1",
      description: "Light in the cave",
      rewards: [
        { type: 'coins', value: 50 },
        { type: 'exp', value: 500 }
      ],
      completed: true,
      objectives: [
        { text: "Set up basic lighting", reward: { type: 'coins', value: 30 } },
        { text: "Adjust light intensity", reward: { type: 'exp', value: 2500 } },
        { text: "Create ambient occlusion", reward: { type: 'skill', value: 150, skillName: 'Drawing' } },
        { text: "Test in different scenes", reward: { type: 'coins', value: 25 } }
      ],
      objectiveCompleted: [true, true, true, true],
      rewardClaimed: true,
      category: "Drawing"
    },
    {
      id: 3,
      type: "Special Quest",
      title: "Timeline 3",
      description: "1 cutscene (Demo)",
      rewards: [
        { type: 'coins', value: 100 },
        { type: 'exp', value: 800 },
        { type: 'skill', value: 300, skillName: 'Level Design' }
      ],
      completed: true,
      objectives: [
        { text: "Create timeline asset", reward: { type: 'exp', value: 4000 } },
        { text: "Add camera movements", reward: { type: 'coins', value: 40 } },
        { text: "Add character animations", reward: { type: 'skill', value: 200, skillName: 'Level Design' } },
        { text: "Add audio cues", reward: { type: 'exp', value: 3000 } }
      ],
      objectiveCompleted: [true, true, true, true],
      rewardClaimed: true,
      category: "Level Design"
    },
    {
      id: 4,
      type: "Main Quest",
      title: "Enemy AI",
      description: "Basic enemy behavior",
      steps: [1, 2, 3],
      currentStep: 2,
      completed: false,
      rewards: [
        { type: 'coins', value: 150 },
        { type: 'exp', value: 1200 },
        { type: 'rank', value: 25 },
        { type: 'skill', value: 400, skillName: 'C# Programming' }
      ],
      objectives: [
        { text: "Create enemy prefab", reward: { type: 'coins', value: 30 } },
        { text: "Implement patrol behavior", reward: { type: 'exp', value: 5000 } },
        { text: "Add chase logic", reward: { type: 'coins', value: 50 } },
        { text: "Test against player", reward: { type: 'skill', value: 250, skillName: 'C# Programming' } }
      ],
      objectiveCompleted: [true, true, false, false],
      rewardClaimed: false,
      category: "C# Programming"
    },
    {
      id: 5,
      type: "Special Quest",
      title: "UI Design",
      description: "Create game menu",
      rewards: [
        { type: 'coins', value: 75 },
        { type: 'exp', value: 600 },
        { type: 'skill', value: 250, skillName: 'Game Design' }
      ],
      completed: false,
      objectives: [
        { text: "Design main menu layout", reward: { type: 'coins', value: 30 } },
        { text: "Add button functionality", reward: { type: 'exp', value: 3500 } },
        { text: "Implement settings panel", reward: { type: 'coins', value: 50 } },
        { text: "Test usability", reward: { type: 'skill', value: 180, skillName: 'Game Design' } }
      ],
      objectiveCompleted: [true, true, true, true], // All objectives done but reward not claimed
      rewardClaimed: false,
      category: "Game Design"
    },
    {
      id: 6,
      type: "Special Quest",
      title: "Sound Design",
      description: "Add ambient sounds",
      rewards: [
        { type: 'coins', value: 60 },
        { type: 'exp', value: 550 },
        { type: 'rank', value: 15 }
      ],
      completed: false,
      objectives: [
        { text: "Import sound assets", reward: { type: 'coins', value: 20 } },
        { text: "Set up audio sources", reward: { type: 'exp', value: 2500 } },
        { text: "Configure spatial audio", reward: { type: 'skill', value: 120, skillName: 'Drawing' } },
        { text: "Test in different environments", reward: { type: 'coins', value: 30 } }
      ],
      objectiveCompleted: [false, false, false, false],
      rewardClaimed: false,
      category: "Drawing"
    }
  ]);

  // Mock data
  const user: User = {
    name: "mr.X",
    level: 25,
    avatar: "https://placehold.co/100x100/FFFFFF/000000?text=DOG",
    badge: getRankIconPath("Planet I"),
    xp: 45000,
    maxXp: 100000,
    coins: 1000,
    rankPoints: 45,
    rankName: "Planet I",
    gameDemos: 1,
    petLevel: 25,
    rankObjectives: [
      { text: "Game Demo x1", completed: false },
      { text: "Coins x1,000", completed: false },
      { text: "Earn 100 Rank Points", completed: false }
    ]
  };

  const skills: Skill[] = [
    { 
      name: "Game Design", 
      icon: Gamepad2,
      currentLevel: 3, // Gold
      points: 7500,
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
      currentLevel: 2, // Silver
      points: 4500,
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
      currentLevel: 4, // Diamond
      points: 10000,
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
      currentLevel: 3, // Gold
      points: 4500,
      maxPoints: 10000,
      description: "Basic Programmer. Can Create Simple System",
      rewards: [
        { type: "animal", value: "ANIMAL APPEAR!" },
        { type: "coins", value: "x300" }
      ]
    }
  ];

  const leaderboard: LeaderboardItem[] = [
    { rank: 1, name: "mr.X", avatar: "https://placehold.co/30x30/FFD700/000000?text=DOG", level: 25, score: 3589 },
    { rank: 2, name: "mr.X", avatar: "https://placehold.co/30x30/FFD700/000000?text=DOG", level: 25, score: 2439 },
    { rank: 3, name: "mr.X", avatar: "https://placehold.co/30x30/FFD700/000000?text=DOG", level: 25, score: 1321 },
    { rank: 4, name: "mr.X", avatar: "https://placehold.co/30x30/FFD700/000000?text=DOG", level: 25, score: 589 }
  ];

  const backpackItems: BackpackItem[] = [
    {
      id: 1,
      name: "Lighting Ticket",
      description: "Dojo Basic Lighting",
      date: "20/11/2025 (19:00-21:00)",
      quantity: 1,
      image: "https://placehold.co/60x40/FFD700/000000?text=TICKET"
    },
    {
      id: 2,
      name: "C# Ticket",
      description: "Dojo Basic Programming",
      date: "21/11/2025 (19:00-21:00)",
      quantity: 1,
      image: "https://placehold.co/60x40/FFD700/000000?text=TICKET"
    }
  ];

  const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => (
    <div 
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => {
        setSelectedQuestId(quest.id);
        setShowQuestOverlay(true);
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            {quest.type}
          </span>
          <h3 className="font-bold text-lg mt-1">{quest.title}</h3>
          <p className="text-gray-600 text-sm">{quest.description}</p>
        </div>
      </div>
      
      {quest.steps && (
        <div className="flex items-center gap-1 mt-3">
          {quest.steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                index + 1 <= (quest.currentStep || 0) 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < quest.steps!.length - 1 && (
                <div className={`h-0.5 flex-1 ${index + 1 < (quest.currentStep || 0) ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );

  const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => {
    // Define level colors to match BadgeOverlay
    const levelColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
    const currentLevelColor = levelColors[skill.currentLevel - 1];

    return (
      <div 
        className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center gap-1"
        onClick={() => {
          setSelectedSkill(skill);
          setShowBadgeOverlay(true);
        }}
      >
        {/* Circular icon with colored border */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center border-4"
          style={{ 
            borderColor: currentLevelColor,
            backgroundColor: `${currentLevelColor}15` // 15% opacity
          }}
        >
          <skill.icon size={24} style={{ color: currentLevelColor }} />
        </div>
        <span className="text-xs text-center">{skill.name}</span>
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
        <div className="font-semibold text-sm">{item.name}</div>
        <div className="text-xs text-gray-500">Dogv Lv{item.level}</div>
      </div>
      <div className="font-bold text-sm">{item.score}</div>
    </div>
  );

  const BackpackItemComponent: React.FC<{ item: BackpackItem }> = ({ item }) => (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm border border-gray-100">
      <img src={item.image} alt={item.name} className="w-12 h-8 object-contain" />
      <div className="flex-1">
        <div className="font-semibold text-sm">{item.name}</div>
        <div className="text-xs text-gray-500">{item.description}</div>
        <div className="text-xs text-gray-500">{item.date}</div>
      </div>
      <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">x{item.quantity}</div>
    </div>
  );

  // Helper function to check if quest is truly completed (all objectives done AND reward claimed)
  const isQuestTrulyCompleted = (quest: Quest): boolean => {
    return quest.rewardClaimed && quest.objectiveCompleted.every(completed => completed);
  };

  // Helper function to check if all objectives are completed
  const areAllObjectivesCompleted = (quest: Quest): boolean => {
    return quest.objectiveCompleted.every(completed => completed);
  };

  // Handler to claim reward
  const handleClaimReward = (questId: number) => {
    setQuestsState(prevQuests => 
      prevQuests.map(quest => {
        if (quest.id === questId && areAllObjectivesCompleted(quest) && !quest.rewardClaimed) {
          return {
            ...quest,
            rewardClaimed: true,
            completed: true
          };
        }
        return quest;
      })
    );
  };

  const QuestListOverlay: React.FC = () => {
    // Sort quests: uncompleted first (including those with all objectives done but reward not claimed), completed at bottom
    const sortedQuests = [...questsState].sort((a, b) => {
      const aCompleted = isQuestTrulyCompleted(a);
      const bCompleted = isQuestTrulyCompleted(b);
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });

    // Scroll to selected quest when overlay opens
    useEffect(() => {
      if (selectedQuestId) {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up">
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
            {sortedQuests.map((quest) => (
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

              {/* Progress Bar */}
              {quest.steps && (
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                    {quest.steps.map((step, index) => (
                      <React.Fragment key={index}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          index + 1 <= (quest.currentStep || 0) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        {index < quest.steps!.length - 1 && (
                          <div className={`h-0.5 flex-1 ${index + 1 < (quest.currentStep || 0) ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Step {quest.currentStep || 0} of {quest.steps.length}
                  </div>
                </div>
              )}

              {/* Objectives */}
              <div className="mb-4">
                <div className="space-y-1">
                  {quest.objectives.map((objective, index) => {
                    const isCompleted = quest.objectiveCompleted[index] || false;
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
                            <div className="text-2xl">💰</div>
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

                    return (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <span className={`text-sm flex-1 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                          {objective.text}
                        </span>
                        <div className="flex-shrink-0">
                          {getRewardDisplay()}
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
                  <button
                    onClick={() => {
                      if (areAllObjectivesCompleted(quest) && !quest.rewardClaimed) {
                        handleClaimReward(quest.id);
                      }
                    }}
                    disabled={quest.rewardClaimed || !areAllObjectivesCompleted(quest)}
                    className={`w-full p-4 rounded-b-lg transition-colors ${
                      quest.rewardClaimed
                        ? 'bg-gray-200 cursor-not-allowed'
                        : areAllObjectivesCompleted(quest)
                        ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                        : 'bg-red-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-center gap-6">
                      {quest.rewards.map((reward, index) => (
                        <div key={index} className="flex flex-col items-center">
                          {reward.type === 'exp' && typeof reward.value === 'number' ? (
                            <div className="w-16 h-16 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold mb-2">
                              {reward.value.toLocaleString()} XP
                            </div>
                          ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                            <>
                              <div className="text-3xl mb-2">💰</div>
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
                </div>
              )}
            </div>
          ))}
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

  const ItemsListOverlay: React.FC = () => {
    // Sort items by date (newest first)
    const sortedItems = [...backpackItems].sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

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
            {sortedItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl mb-3 shadow-sm border border-gray-100"
              >
                <img src={item.image} alt={item.name} className="w-16 h-12 object-contain rounded-lg" />
                <div className="flex-1">
                  <div className="font-semibold text-base mb-1">{item.name}</div>
                  <div className="text-sm text-gray-600 mb-1">{item.description}</div>
                  <div className="text-xs text-gray-500">{item.date}</div>
                </div>
                <div className="text-sm bg-gray-100 px-3 py-1 rounded-full font-semibold">
                  x{item.quantity}
                </div>
              </div>
            ))}
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

    // Define level names and colors
    const levelNames = ["Bronze", "Silver", "Gold", "Diamond"];
    const levelColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
    const currentLevelName = levelNames[selectedSkill.currentLevel - 1];
    const currentLevelColor = levelColors[selectedSkill.currentLevel - 1];

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

            {/* Progress Circle */}
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

            {/* Level Badges */}
            <div className="flex justify-center gap-2 mb-6">
              {levelNames.map((levelName, index) => (
                <div 
                  key={index} 
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index + 1 <= selectedSkill.currentLevel 
                      ? `border-4 border-${index === 0 ? 'amber' : index === 1 ? 'gray' : index === 2 ? 'yellow' : 'blue'}-500`
                      : 'border-2 border-gray-300'
                  }`}
                  style={{ 
                    backgroundColor: index + 1 <= selectedSkill.currentLevel ? levelColors[index] : '#f3f4f6',
                    color: index + 1 <= selectedSkill.currentLevel ? 'white' : 'black'
                  }}
                >
                  <span className="text-xs font-bold">{levelName[0]}</span>
                </div>
              ))}
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
                        <Coins size={24} className="text-yellow-500" />
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
                className="text-sm font-medium bg-transparent border-b-2 border-blue-500 outline-none focus:border-blue-600 px-1 min-w-[200px]"
                autoFocus
              />
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity group"
                onClick={() => setIsEditingDescription(true)}
              >
                <span className="text-sm font-medium">{description}</span>
                <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">💰</span>
            <span className="font-bold">{user.coins}</span>
          </div>
        </div>
      </div>

      {/* User Profile Section with Rank Card */}
      <div className="p-4 bg-white shadow-sm mb-4">
        <div className="flex items-start gap-4">
          {/* Pet Display on Left */}
          <div className="flex flex-col items-center flex-shrink-0">
            <img src={user.avatar} alt="Pet" className="w-24 h-24 object-contain" />
            <span className="text-sm font-medium mt-1">{user.petLevel}</span>
          </div>
          
          {/* Rank Card on Right - Clickable with Flip Animation */}
          <div className="flex-1 min-w-0">
            <div 
              className={`flip-card cursor-pointer w-full ${rankCardFlipped ? 'flipped' : ''}`}
              onClick={() => setRankCardFlipped(!rankCardFlipped)}
              style={{ minHeight: '220px' }}
            >
              <div className="flip-card-inner" style={{ minHeight: '220px' }}>
                {/* Front of Card */}
                <div className="flip-card-front bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-200 flex flex-col w-full h-full">
                  {/* Rank Icon/Badge */}
                  <div className="flex justify-center mb-3">
                    <img 
                      src={user.badge} 
                      alt="Rank Badge" 
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
                    />
                  </div>
                  <h3 className="font-bold text-xl sm:text-2xl text-center mb-4 sm:mb-6 truncate">{user.rankName}</h3>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-gray-500 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((user.rankPoints / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-700 text-center">
                      {user.rankPoints}/100 rp
                    </div>
                  </div>
                </div>
                
                {/* Back of Card - Rank Objectives */}
                <div className="flip-card-back bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-200 flex flex-col w-full h-full">
                  <h3 className="font-bold text-xl sm:text-2xl text-center mb-3 sm:mb-4 truncate">{user.rankName}</h3>
                  <div className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-gray-600 text-center">Objectives to Rank Up</div>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-4">
                    {user.rankObjectives.map((objective, index) => {
                      // Check completion status based on objective type
                      let isCompleted = false;
                      if (objective.text.includes('Rank Points')) {
                        isCompleted = user.rankPoints >= 100;
                      } else if (objective.text.includes('Game Demo')) {
                        isCompleted = user.gameDemos >= 1;
                      } else if (objective.text.includes('Coins')) {
                        isCompleted = user.coins >= 1000;
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
                                Progress: {user.rankPoints}/100 rp
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t pt-3 mt-auto">
                    <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                      <span className="text-left truncate">Pet Lv{user.petLevel}</span>
                      <span className="text-right flex-shrink-0">x1</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 text-center">
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
        <h2 className="font-bold text-lg mb-3">Complete tasks and Badge</h2>
        <div className="grid grid-cols-4 gap-2">
          {skills.map((skill, index) => (
            <SkillCard key={index} skill={skill} />
          ))}
        </div>
      </div>

      {/* Quests Section */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">Quests</h2>
        </div>
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
        <h2 className="font-bold text-lg mb-3">Leader Board</h2>
        {leaderboard.map((item, index) => (
          <LeaderboardItemComponent key={index} item={item} />
        ))}
      </div>

      {/* Backpack Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-lg mb-3">Items in Backpack</h2>
        {backpackItems.map((item, index) => (
          <BackpackItemComponent key={index} item={item} />
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
    </div>
  );
};

export default App;
