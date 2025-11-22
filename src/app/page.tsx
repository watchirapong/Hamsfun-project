'use client';

import React, { useState } from 'react';
import { Trophy, Gamepad2, Monitor, Paintbrush, Code, ChevronRight, Star, Crown, Users, Ticket, Coins, X, Check } from 'lucide-react';

interface User {
  name: string;
  level: number;
  avatar: string;
  badge: string;
  xp: number;
  maxXp: number;
  coins: number;
}

interface Skill {
  name: string;
  icon: React.ComponentType<any>;
}

interface Quest {
  id: number;
  type: string;
  title: string;
  description: string;
  steps?: number[];
  currentStep?: number;
  reward?: number;
  completed: boolean;
  objectives: string[];
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

  // Mock data
  const user: User = {
    name: "mr.X",
    level: 25,
    avatar: "https://placehold.co/100x100/FFFFFF/000000?text=DOG",
    badge: "https://placehold.co/80x80/4A90E2/FFFFFF?text=PLANET+I",
    xp: 45000,
    maxXp: 100000,
    coins: 150
  };

  const skills: Skill[] = [
    { name: "Game Design", icon: Gamepad2 },
    { name: "Level Design", icon: Monitor },
    { name: "Drawing", icon: Paintbrush },
    { name: "C# Programming", icon: Code }
  ];

  const quests: Quest[] = [
    {
      id: 1,
      type: "Main Quest",
      title: "Shooting Game",
      description: "Player Movement Script",
      steps: [1, 2, 3, 4],
      currentStep: 3,
      completed: false,
      reward: 100,
      objectives: [
        "Create player controller script",
        "Implement movement physics",
        "Add jump functionality",
        "Test and debug movement"
      ],
      category: "Game Design"
    },
    {
      id: 2,
      type: "Special Quest",
      title: "Lighting 1",
      description: "Light in the cave",
      reward: 50,
      completed: true,
      objectives: [
        "Set up basic lighting",
        "Adjust light intensity",
        "Create ambient occlusion",
        "Test in different scenes"
      ],
      category: "Drawing"
    },
    {
      id: 3,
      type: "Special Quest",
      title: "Timeline 3",
      description: "1 cutscene (Demo)",
      reward: 100,
      completed: true,
      objectives: [
        "Create timeline asset",
        "Add camera movements",
        "Add character animations",
        "Add audio cues"
      ],
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
      reward: 150,
      objectives: [
        "Create enemy prefab",
        "Implement patrol behavior",
        "Add chase logic",
        "Test against player"
      ],
      category: "C# Programming"
    },
    {
      id: 5,
      type: "Special Quest",
      title: "UI Design",
      description: "Create game menu",
      reward: 75,
      completed: false,
      objectives: [
        "Design main menu layout",
        "Add button functionality",
        "Implement settings panel",
        "Test usability"
      ],
      category: "Game Design"
    },
    {
      id: 6,
      type: "Special Quest",
      title: "Sound Design",
      description: "Add ambient sounds",
      reward: 60,
      completed: false,
      objectives: [
        "Import sound assets",
        "Set up audio sources",
        "Configure spatial audio",
        "Test in different environments"
      ],
      category: "Drawing"
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
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            {quest.type}
          </span>
          <h3 className="font-bold text-lg mt-1">{quest.title}</h3>
          <p className="text-gray-600 text-sm">{quest.description}</p>
        </div>
        {quest.reward && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">💰</span>
            <span className="font-bold">{quest.reward}</span>
          </div>
        )}
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

  const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => (
    <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
      <div className="flex flex-col items-center gap-1">
        <skill.icon size={24} className="text-blue-500" />
        <span className="text-xs text-center">{skill.name}</span>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full" 
            style={{ width: `${Math.random() * 30 + 70}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

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

  const QuestListOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div></div>
          <h2 className="font-bold text-lg">All Quests</h2>
          <button 
            onClick={() => setShowQuestOverlay(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quest List with Full Details */}
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {quests.map((quest) => (
            <div 
              key={quest.id}
              className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
            >
              {/* Quest Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full mb-2 inline-block">
                    {quest.type}
                  </span>
                  <h3 className="font-bold text-xl mb-1">{quest.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{quest.description}</p>
                  <div className="text-sm text-gray-500">Category: {quest.category}</div>
                </div>
                {quest.reward && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">💰</span>
                    <span className="font-bold text-lg">{quest.reward}</span>
                  </div>
                )}
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
                <h4 className="font-semibold mb-2 text-sm">Objectives:</h4>
                <div className="space-y-2">
                  {quest.objectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Check size={16} className={`flex-shrink-0 ${quest.completed ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${quest.completed ? 'line-through text-gray-500' : ''}`}>{objective}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Quest Button */}
              {!quest.completed && (
                <button className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">
                  Complete Quest
                </button>
              )}
              {quest.completed && (
                <div className="w-full bg-gray-200 text-gray-600 py-3 rounded-xl font-medium text-center">
                  Quest Completed!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const QuestOverlay: React.FC = () => {
    return <QuestListOverlay />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Crown size={16} className="text-yellow-500" />
            </div>
            <span className="text-sm font-medium">anyone can be anything</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">💰</span>
            <span className="font-bold">{user.coins}</span>
          </div>
        </div>
      </div>

      {/* User Profile Section with Rank Card on Right */}
      <div className="p-4 bg-white shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <img src={user.avatar} alt="User Avatar" className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">mr.X</span>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">Lv{user.level}</span>
            </div>
          </div>
          
          {/* Rank Card positioned on right */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <img src={user.badge} alt="Badge" className="w-10 h-10" />
              <div>
                <div className="text-sm font-medium">Planet I</div>
                <div className="flex items-center gap-1">
                  <div className="w-20 bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full" 
                      style={{ width: `${(user.xp / user.maxXp) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{user.xp}/{user.maxXp} XP</span>
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
        {/* Show first 3 quests on main page */}
        {quests.slice(0, 3).map((quest, index) => (
          <QuestCard key={index} quest={quest} />
        ))}
        <button 
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          onClick={() => setShowQuestOverlay(true)}
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
        <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors">
          More Items
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-3 flex justify-around">
        <button className="flex flex-col items-center gap-1">
          <Users size={24} className="text-blue-500" />
          <span className="text-xs">Community</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Trophy size={24} className="text-gray-400" />
          <span className="text-xs">Rank</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Ticket size={24} className="text-gray-400" />
          <span className="text-xs">Tickets</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Crown size={24} className="text-gray-400" />
          <span className="text-xs">Profile</span>
        </button>
      </div>

      {/* Quest Overlay */}
      {showQuestOverlay && <QuestOverlay />}
    </div>
  );
};

export default App;
