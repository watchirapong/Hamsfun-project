export interface RankObjective {
  text: string;
  completed: boolean;
  questId?: number; // Link to main quest
  coinCost?: number; // Cost to rank up
}

export type RankName = 
  | 'Meteor I'
  | 'Meteor II'
  | 'Meteor III'
  | 'Planet I'
  | 'Planet II'
  | 'Planet III'
  | 'Star I'
  | 'Star II'
  | 'Star III'
  | 'Supernova'
  | 'Cosmic';

export const RANKS: readonly RankName[] = [
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

export interface User {
  name: string;
  avatar: string;
  badge: string;
  coins: number;
  rankPoints: number;
  rankName: string;
  nextRankPoints?: number; // Points needed for next rank (from API rank.nextRankPoints)
  rankObjectives: RankObjective[];
  gameDemos: number;
  petLevel: number;
  petXp: number;
  petMaxXp: number;
  leaderboardScore?: number; // Leaderboard points
}

export interface Skill {
  name: string;
  icon: React.ComponentType<any>;
  currentLevel: number; // 1=Unranked, 2=Bronze, 3=Silver, 4=Gold, 5=Diamond
  points: number;
  maxPoints: number;
  description: string;
  rewards: { type: string; value: string }[];
}

export interface ObjectiveReward {
  type: 'exp' | 'rank' | 'skill' | 'coins' | 'animal' | 'item' | 'leaderboard';
  value?: number | string; // Optional for animal type (calculated average or single value), or quantity for items
  minValue?: number; // Minimum reward value
  maxValue?: number; // Maximum reward value
  skillName?: string; // Required for skill type to indicate which skill
  itemId?: string; // Required for item type - the item ID
  itemName?: string; // Item name for display
  itemIcon?: string; // Item icon URL
}

export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface QuestObjective {
  text: string;
  reward: ObjectiveReward | ObjectiveReward[]; // Single or multiple rewards per objective
  subQuestId?: string; // ID from backend to identify the subQuest
}

export interface ObjectiveSubmission {
  imageUrl: string | null;
  status: ApprovalStatus; // none, pending (submitted, waiting for admin), approved
}

export interface Quest {
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

export interface LeaderboardItem {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  score: number;
}

// API Response types for Leaderboard
export interface LeaderboardUser {
  _id: string;
  discordUsername: string;
  discordNickname?: string;
  rank: {
    currentTier: string;
    points: number;
  };
  leaderboardScore: number;
  roles?: Array<{
    name: string;
    id: string;
    color: string;
    position: number;
  }>;
  badges?: {
    [key: string]: {
      rank: string;
      points: number;
    };
  };
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  houses?: House[];
}

export interface House {
  _id: string;
  name: string;
  score: number;
  memberCount: number;
  members?: HouseMember[]; // Optional, may be included in response
}

export interface HouseMember {
  _id: string;
  discordUsername: string;
  discordNickname?: string;
  leaderboardScore: number;
  rank?: {
    currentTier: string;
    points: number;
  };
  petLevel?: number;
  avatar?: string;
}

export interface HouseLeaderboardItem {
  rank: number;
  houseName: string;
  houseScore: number;
  memberCount: number;
  houseId: string;
  members?: HouseMember[]; // Optional, for expanded view
}

export interface BackpackItem {
  id: number;
  name: string;
  description: string;
  date: string;
  quantity: number;
  image: string; // Keep for backward compatibility, but prefer icon
  icon?: string; // Item icon URL from API
  used: boolean;
  active: boolean;
}

