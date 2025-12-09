import { Quest } from '@/types';

/**
 * Mock quest data for development/testing
 * This data is used as initial state before real quest data is fetched from the API
 */
export const mockQuests: Quest[] = [
  {
    id: 1,
    type: "Main",
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
    type: "Special",
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
    type: "Special",
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
    type: "Main",
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
    type: "Special",
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
    type: "Special",
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
];

