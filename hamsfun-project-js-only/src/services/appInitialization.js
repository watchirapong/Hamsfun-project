/**
 * App Initialization Service with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';
import { userAPI, getToken, setToken, removeToken } from '@/lib/api';
import { getRankIconPath, getAssetUrl } from '@/utils/helpers';
import {
  mapBackendRewardEntryToFrontend,
  extractSubQuestIdFromProgress,
  extractSubQuestIdFromSubQuest
} from '@/utils/questHelpers';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';

/**
 * Get default unranked skills for all skill types
 */
const getDefaultSkills = () => {
  return [
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
};

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
 * Process badges from API response
 */
const processBadges = (badges, setSkills) => {
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
    setSkills(getDefaultSkills());
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
    setSkills(Object.values(skillsMap));
  } else {
    setSkills(getDefaultSkills());
  }
};

/**
 * Map completion rewards from backend structure
 */
const mapCompletionRewards = (completionRewards) => {
  if (!completionRewards || !Array.isArray(completionRewards)) {
    return [];
  }

  const mappedRewards = [];

  completionRewards.forEach((rewardGroup) => {
    if (rewardGroup && Array.isArray(rewardGroup.entries)) {
      rewardGroup.entries.forEach((entry) => {
        const mappedReward = mapBackendRewardEntryToFrontend(entry);
        mappedRewards.push(mappedReward);
      });
    }
  });

  return mappedRewards;
};

/**
 * Extract rewards from subQuest or progress entry
 */
const extractSubQuestRewards = (sq, aq) => {
  let rewards = [];

  // Try sq.reward first (single object - for backwards compatibility)
  if (sq.reward && typeof sq.reward === 'object' && sq.reward.type) {
    rewards = [sq.reward];
  }
  // Try sq.rewards array (actual backend structure)
  else if (Array.isArray(sq.rewards) && sq.rewards.length > 0) {
    sq.rewards.forEach((rewardGroup) => {
      if (rewardGroup && Array.isArray(rewardGroup.entries)) {
        rewardGroup.entries.forEach((entry) => {
          const mappedReward = mapBackendRewardEntryToFrontend(entry);
          rewards.push(mappedReward);
        });
      }
    });
  }
  // Check if reward data is in the progress entry
  else {
    const progressEntry = aq.subQuestsProgress?.find((p) => {
      const pId = extractSubQuestIdFromProgress(p)?.toString();
      const sqId = extractSubQuestIdFromSubQuest(sq)?.toString();
      return pId === sqId;
    });

    if (progressEntry?.reward && typeof progressEntry.reward === 'object' && progressEntry.reward.type) {
      rewards = [progressEntry.reward];
    } else if (Array.isArray(progressEntry?.rewards) && progressEntry.rewards.length > 0) {
      progressEntry.rewards.forEach((rewardGroup) => {
        if (rewardGroup && Array.isArray(rewardGroup.entries)) {
          rewardGroup.entries.forEach((entry) => {
            const mappedReward = mapBackendRewardEntryToFrontend(entry);
            rewards.push(mappedReward);
          });
        }
      });
    }
  }

  // If no rewards found, add a default coin reward
  if (rewards.length === 0) {
    rewards = [{ type: 'coins', value: 0 }];
  }

  // Ensure all rewards have the correct structure
  rewards = rewards.map(reward => {
    if (!reward || typeof reward !== 'object') {
      return { type: 'coins', value: 0 };
    }
    if (!reward.type) {
      reward.type = 'coins';
    }
    if (typeof reward.value === 'undefined' || reward.value === null) {
      reward.value = 0;
    }
    return reward;
  });

  // Use single reward if only one, otherwise use array
  return rewards.length === 1 ? rewards[0] : rewards;
};

/**
 * Map objective completion status
 */
const mapObjectiveCompleted = (quest, aq) => {
  const objectives = quest.subQuests || [];
  const progressMap = new Map();

  aq.subQuestsProgress?.forEach((p) => {
    const progressSubQuestId = extractSubQuestIdFromProgress(p);
    if (progressSubQuestId) {
      const subQuestIdString = progressSubQuestId.toString();
      progressMap.set(subQuestIdString, p.status === 'Completed' || p.status === 'Pending');
    }
  });

  return objectives.map((sq) => {
    const objectiveSubQuestId = extractSubQuestIdFromSubQuest(sq)?.toString();
    let completed = progressMap.get(objectiveSubQuestId);

    if (completed === undefined) {
      const matchingProgress = aq.subQuestsProgress?.find((p) => {
        const pId = extractSubQuestIdFromProgress(p)?.toString();
        return pId === objectiveSubQuestId;
      });
      if (matchingProgress) {
        completed = matchingProgress.status === 'Completed' || matchingProgress.status === 'Pending';
      } else {
        completed = false;
      }
    }
    return completed || false;
  });
};

/**
 * Map objective submissions
 */
const mapObjectiveSubmissions = (quest, aq) => {
  const objectives = quest.subQuests || [];
  const submissionsMap = new Map();

  aq.subQuestsProgress?.forEach((p) => {
    const subQuestId = extractSubQuestIdFromProgress(p);
    if (subQuestId) {
      submissionsMap.set(subQuestId.toString(), {
        imageUrl: p.imageProof || null,
        status: p.status === 'Completed' ? 'approved' : p.status === 'Pending' ? 'pending' : p.status === 'Rejected' ? 'rejected' : 'none'
      });
    }
  });

  return objectives.map((sq) => {
    const subQuestId = extractSubQuestIdFromSubQuest(sq)?.toString();
    let submission = submissionsMap.get(subQuestId);

    if (!submission) {
      const matchingProgress = aq.subQuestsProgress?.find((p) => {
        const pId = extractSubQuestIdFromProgress(p)?.toString();
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
      status: 'none'
    };
  });
};

/**
 * Map objective rewards awarded status
 */
const mapObjectiveRewardsAwarded = (quest, aq) => {
  const objectives = quest.subQuests || [];
  const rewardsMap = new Map();

  aq.subQuestsProgress?.forEach((p) => {
    const subQuestId = extractSubQuestIdFromProgress(p);
    if (subQuestId) {
      rewardsMap.set(subQuestId.toString(), p.rewardAwarded || false);
    }
  });

  return objectives.map((sq) => {
    const subQuestId = extractSubQuestIdFromSubQuest(sq)?.toString();
    let awarded = rewardsMap.get(subQuestId);

    if (awarded === undefined) {
      const matchingProgress = aq.subQuestsProgress?.find((p) => {
        const pId = extractSubQuestIdFromProgress(p)?.toString();
        return pId === subQuestId;
      });
      if (matchingProgress) {
        awarded = matchingProgress.rewardAwarded || false;
      }
    }

    return awarded || false;
  });
};

/**
 * Map active quest from API response
 */
const mapActiveQuest = (aq) => {
  const quest = aq.questId;
  return {
    id: quest._id,
    type: quest.type || "Main Quest",
    title: quest.title,
    description: quest.description,
    steps: quest.subQuests?.map((_, i) => i + 1) || [],
    currentStep: aq.subQuestsProgress?.filter((p) => p.status === 'Completed').length || 0,
    rewards: mapCompletionRewards(quest.completionRewards),
    completed: aq.isCompleted || false,
    objectives: quest.subQuests?.map((sq) => ({
      text: sq.title || sq.description,
      reward: extractSubQuestRewards(sq, aq),
      subQuestId: sq._id || sq.id,
      description: sq.description
    })) || [],
    objectiveCompleted: mapObjectiveCompleted(quest, aq),
    objectiveSubmissions: mapObjectiveSubmissions(quest, aq),
    objectiveRewardsAwarded: mapObjectiveRewardsAwarded(quest, aq),
    rewardClaimed: aq.submissionStatus === 'Completed',
    rewardSubmissionStatus: aq.submissionStatus === 'Pending' ? 'pending' : aq.submissionStatus === 'Completed' ? 'approved' : 'none',
    questRewardsAwarded: aq.isCompleted || false,
    category: quest.category || "General"
  };
};

/**
 * Map completed quest from API response
 */
const mapCompletedQuest = (cq) => {
  const quest = cq.questId;
  return {
    id: quest._id,
    type: quest.type || "Main Quest",
    title: quest.title,
    description: quest.description,
    steps: quest.subQuests?.map((_, i) => i + 1) || [],
    currentStep: quest.subQuests?.length || 0,
    rewards: mapCompletionRewards(quest.completionRewards),
    completed: true,
    objectives: quest.subQuests?.map((sq) => ({
      text: sq.title || sq.description,
      reward: sq.reward || { type: 'coins', value: 0 },
      description: sq.description || quest.description
    })) || [],
    objectiveCompleted: cq.subQuestsProgress?.map(() => true) || [],
    objectiveSubmissions: cq.subQuestsProgress?.map((p) => ({
      imageUrl: p.imageProof || null,
      status: 'approved'
    })) || [],
    objectiveRewardsAwarded: cq.subQuestsProgress?.map(() => true) || [],
    rewardClaimed: true,
    rewardSubmissionStatus: 'approved',
    questRewardsAwarded: true,
    category: quest.category || "General"
  };
};

/**
 * Map inventory items from API response
 */
const mapInventoryItems = (inventory) => {
  return inventory.map((inv) => ({
    id: inv._id,
    type: inv.itemId?.type || 'NormalItem',
    name: inv.itemId?.name || 'Item',
    description: inv.itemId?.description || '',
    date: inv.itemId?.date || '',
    quantity: inv.quantity || 1,
    image: inv.itemId?.icon || inv.itemId?.image || getAssetUrl("/Asset/item/classTicket.png"),
    icon: inv.itemId?.icon,
    used: inv.used || false,
    active: inv.active || false
  }));
};

/**
 * Merge completed quests with active quests
 */
const mergeQuests = (prevQuests, mappedCompleted) => {
  const questMap = new Map();

  // First, add all active quests
  prevQuests.forEach(quest => {
    const normalizedId = String(quest.id);
    questMap.set(normalizedId, quest);
  });

  // Then, add/update with completed quests (completed quests take precedence)
  mappedCompleted.forEach(completedQuest => {
    const normalizedId = String(completedQuest.id);
    const existingQuest = questMap.get(normalizedId);
    if (!existingQuest || !existingQuest.completed) {
      questMap.set(normalizedId, completedQuest);
    }
  });

  return Array.from(questMap.values());
};

/**
 * Initializes the application
 */
export const initializeApp = async (params) => {
  const {
    setIsLoading,
    setIsAuthenticated,
    setUser,
    setSkills,
    setQuestsState,
    setBackpackItems
  } = params;

  try {
    // Check for token in URL (from Discord OAuth redirect)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    // Fetch user profile
    try {
      const profile = await userAPI.getMyProfile();
      
      // Map backend profile to frontend User format
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

      // Process badges/skills from backend
      processBadges(profile.badges, setSkills);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Handle 401 Unauthorized or 400 Bad Request
      if (error.status === 401 || error.status === 400) {
        console.log('Authentication failed (401/400), redirecting to login...');
        removeToken();
        setIsAuthenticated(false);
        return;
      }
    }

    // Fetch active quests
    try {
      const activeQuests = await userAPI.getActiveQuests();
      const mappedQuests = activeQuests.map(mapActiveQuest);
      
      if (mappedQuests.length > 0) {
        setQuestsState(mappedQuests);
      }
    } catch (error) {
      console.error('Error fetching active quests:', error);
    }

    // Fetch completed quests
    try {
      const completedQuests = await userAPI.getCompletedQuests();
      const mappedCompleted = completedQuests.map(mapCompletedQuest);
      
      setQuestsState(prev => mergeQuests(prev, mappedCompleted));
    } catch (error) {
      console.error('Error fetching completed quests:', error);
    }

    // Fetch inventory
    try {
      const inventory = await userAPI.getMyInventory();
      const mappedItems = mapInventoryItems(inventory);
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

