import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';
import { userAPI, hamsterAPI, getToken, setToken, removeToken } from '@/lib/api';
import { User, Skill, Quest, BackpackItem, ObjectiveReward, ApprovalStatus } from '@/types';
import { getRankIconPath, getAssetUrl } from '@/utils/helpers';
import {
  mapBackendRewardEntryToFrontend,
  extractSubQuestIdFromProgress,
  extractSubQuestIdFromSubQuest
} from '@/utils/questHelpers';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';
import { populateItemCache } from '@/utils/itemHelpers';

interface InitializeAppParams {
  setIsLoading: (loading: boolean) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  setQuestsState: React.Dispatch<React.SetStateAction<Quest[]>>;
  setBackpackItems: React.Dispatch<React.SetStateAction<BackpackItem[]>>;
}

/**
 * Initializes the application by:
 * 1. Checking for token in URL and setting it
 * 2. Fetching and setting user profile
 * 3. Mapping badges to skills
 * 4. Fetching and mapping active quests
 * 5. Fetching and mapping completed quests
 * 6. Fetching and mapping inventory
 */
export const initializeApp = async (params: InitializeAppParams) => {
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
    let isHamsterUser = false; // Track if user is Hamster to fetch correct quests
    try {
      const profile = await userAPI.getMyProfile();
      isHamsterUser = profile.isHamster || false;
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
        // Map pet data from partnerPet object
        petLevel: profile.partnerPet?.level || profile.petLevel || 1,
        petXp: profile.partnerPet?.experience || profile.petXp || 0,
        petMaxXp: profile.partnerPet?.maxExperience || 1000, // Calculate based on level if needed
        petStats: {
          maxHealth: profile.partnerPet?.currentStats?.maxHealth || 100,
          attackDamage: profile.partnerPet?.currentStats?.attackDamage || 10,
          defense: profile.partnerPet?.currentStats?.defense || 5,
        },
        petIV: profile.partnerPet?.iv ? {
          maxHealth: profile.partnerPet.iv.maxHealth || 0,
          attackDamage: profile.partnerPet.iv.attackDamage || 0,
          defense: profile.partnerPet.iv.defense || 0,
        } : undefined,
        petIcon: profile.partnerPet?.icon || undefined,
        rankObjectives: profile.rankObjectives || [],
        isHamster: isHamsterUser,
        hamsterRank: profile.hamster?.hamsterRank || undefined
      });

      // Map badges/skills from backend
      console.log('Full profile from API:', profile);
      console.log('Profile badges from API:', profile.badges);
      console.log('Badges type:', typeof profile.badges);
      console.log('Badges is array?', Array.isArray(profile.badges));

      // Store hamster questList for later processing (Team Quests from profile)
      let hamsterQuestList: any[] = [];
      if (isHamsterUser && profile.hamster?.questList && Array.isArray(profile.hamster.questList)) {
        hamsterQuestList = profile.hamster.questList;
        console.log('Hamster questList from profile:', hamsterQuestList);
      }

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
        const skillIconMap: { [key: string]: any } = {
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
          console.log(`Processing badge: ${apiSkillName}`, badgeData);
          const displayName = mapApiSkillNameToDisplayName(apiSkillName);
          const icon = skillIconMap[apiSkillName] || Gamepad2;

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


          skillsMap[displayName] = {
            name: displayName, // Use display name for consistency
            icon: icon,
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
          const defaultSkills = getDefaultSkills();
          setSkills(defaultSkills);
        }
      } else {
        // If badgesObject is empty, use default unranked badges for all skills
        console.warn('No badge data found in profile.badges. Using default unranked badges.');
        const defaultSkills = getDefaultSkills();
        setSkills(defaultSkills);
      }

      // Map hamster questList (Team Quests) to Quest interface if available
      if (hamsterQuestList.length > 0) {
        const mappedHamsterQuests = hamsterQuestList.map((tq: any) => {
          // Map Team Quest from profile.hamster.questList
          // Structure: { _id, title, icon, type, description, rewardPool, subQuests, deadline }
          return {
            id: tq._id,
            type: tq.type || "Team",
            title: tq.title,
            description: tq.description || "",
            steps: tq.subQuests?.map((_: any, i: number) => i + 1) || [],
            currentStep: 0, // Will be updated when active-quests are fetched
            rewards: [], // Team quests have rewardPool, not direct rewards
            completed: false,
            objectives: tq.subQuests?.map((sq: any) => ({
              text: sq.title || sq.description || "Sub Task",
              reward: { type: 'exp' as const, value: 0 },
              subQuestId: sq._id,
              description: sq.description
            })) || [{
              text: tq.title,
              reward: { type: 'exp' as const, value: 0 },
              description: tq.description
            }],
            objectiveCompleted: tq.subQuests?.map(() => false) || [false],
            objectiveSubmissions: tq.subQuests?.map(() => ({
              imageUrl: null,
              status: 'none' as ApprovalStatus
            })) || [{ imageUrl: null, status: 'none' as ApprovalStatus }],
            objectiveRewardsAwarded: tq.subQuests?.map(() => false) || [false],
            rewardClaimed: false,
            rewardSubmissionStatus: 'none' as ApprovalStatus,
            questRewardsAwarded: false,
            category: "Team Quest",
            isMemberQuest: false, // This is a Team Quest, not a Member Quest
            teamQuestId: tq._id
          };
        });

        // Set the hamster quests initially
        setQuestsState(mappedHamsterQuests);
        console.log('Mapped Hamster Team Quests:', mappedHamsterQuests);
      }

    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // Handle 401 Unauthorized or 400 Bad Request
      if (error.status === 401 || error.status === 400) {
        console.log('Authentication failed (401/400), redirecting to login...');
        removeToken();
        setIsAuthenticated(false);
        return;
      }
    }

    // Fetch active quests - use hamsterAPI for Hamster users, userAPI for regular users
    try {
      console.log('Fetching active quests, isHamsterUser:', isHamsterUser);
      const activeQuests = isHamsterUser
        ? await hamsterAPI.getActiveQuests()
        : await userAPI.getActiveQuests();
      console.log('Active quests from API:', activeQuests);
      // Map backend quests to frontend Quest interface
      // Filter out quests where questId is null or not populated (not an object)
      const mappedQuests = activeQuests
        .filter((aq: any) => aq.questId && typeof aq.questId === 'object' && aq.questId._id)
        .map((aq: any) => {
          const quest = aq.questId;
          return {
            id: quest._id,
            type: quest.type || "Main",
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
                    const mappedReward = mapBackendRewardEntryToFrontend(entry);
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

              let rewards: ObjectiveReward[] = [];

              // Try sq.reward first (single object - for backwards compatibility)
              if (sq.reward && typeof sq.reward === 'object' && sq.reward.type) {
                rewards = [sq.reward];
              }
              // Try sq.rewards array (actual backend structure)
              else if (Array.isArray(sq.rewards) && sq.rewards.length > 0) {
                sq.rewards.forEach((rewardGroup: any) => {
                  if (rewardGroup && Array.isArray(rewardGroup.entries)) {
                    rewardGroup.entries.forEach((entry: any) => {
                      const mappedReward = mapBackendRewardEntryToFrontend(entry);
                      rewards.push(mappedReward);
                    });
                  }
                });
              }
              // Check if reward data is in the progress entry
              else {
                const progressEntry = aq.subQuestsProgress?.find((p: any) => {
                  const pId = extractSubQuestIdFromProgress(p)?.toString();
                  const sqId = extractSubQuestIdFromSubQuest(sq)?.toString();
                  return pId === sqId;
                });

                if (progressEntry?.reward && typeof progressEntry.reward === 'object' && progressEntry.reward.type) {
                  rewards = [progressEntry.reward];
                } else if (Array.isArray(progressEntry?.rewards) && progressEntry.rewards.length > 0) {
                  progressEntry.rewards.forEach((rewardGroup: any) => {
                    if (rewardGroup && Array.isArray(rewardGroup.entries)) {
                      rewardGroup.entries.forEach((entry: any) => {
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
              const reward = rewards.length === 1 ? rewards[0] : rewards;

              return {
                text: sq.title || sq.description,
                reward: reward,
                subQuestId: sq._id || sq.id, // Store subQuest ID for API submission
                description: sq.description // Store subQuest description
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
                const progressSubQuestId = extractSubQuestIdFromProgress(p);

                if (progressSubQuestId) {
                  const subQuestIdString = progressSubQuestId.toString();
                  // Mark as completed if status is 'Completed' OR 'Pending' (user sees pending as completed)
                  progressMap.set(subQuestIdString, p.status === 'Completed' || p.status === 'Pending');
                }
              });
              // Map each objective to its completion status by matching subQuestId
              return objectives.map((sq: any, idx: number) => {
                const objectiveSubQuestId = extractSubQuestIdFromSubQuest(sq)?.toString();

                // First, try to get from the map we built
                let completed = progressMap.get(objectiveSubQuestId);

                // If not found in map, try to find progress by searching through all progress entries
                if (completed === undefined) {
                  const matchingProgress = aq.subQuestsProgress?.find((p: any) => {
                    const pId = extractSubQuestIdFromProgress(p)?.toString();
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
                const subQuestId = extractSubQuestIdFromProgress(p);
                if (subQuestId) {
                  submissionsMap.set(subQuestId.toString(), {
                    imageUrl: p.imageProof || null,
                    status: p.status === 'Completed' ? 'approved' : p.status === 'Pending' ? 'pending' : p.status === 'Rejected' ? 'rejected' : 'none'
                  });
                }
              });
              // Map each objective to its submission by matching subQuestId
              return objectives.map((sq: any, idx: number) => {
                const subQuestId = extractSubQuestIdFromSubQuest(sq)?.toString();
                let submission = submissionsMap.get(subQuestId);

                // If not found in map, try to find by searching all progress entries
                if (!submission) {
                  const matchingProgress = aq.subQuestsProgress?.find((p: any) => {
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
                  status: 'none' as ApprovalStatus
                };
              });
            })(),
            objectiveRewardsAwarded: (() => {
              // Match rewards awarded to objectives by subQuestId, not by array index
              const objectives = quest.subQuests || [];
              const rewardsMap = new Map();
              const submissionsMap = new Map();

              // Create a map of subQuestId -> reward awarded status
              // Also create a map of subQuestId -> submission status
              aq.subQuestsProgress?.forEach((p: any, idx: number) => {
                const subQuestId = extractSubQuestIdFromProgress(p);
                if (subQuestId) {
                  rewardsMap.set(subQuestId.toString(), p.rewardAwarded || false);
                  // Track submission status
                  const status = p.status === 'Completed' ? 'approved' : p.status === 'Pending' ? 'pending' : p.status === 'Rejected' ? 'rejected' : 'none';
                  submissionsMap.set(subQuestId.toString(), status);
                }
              });

              // Map each objective to its reward awarded status by matching subQuestId
              return objectives.map((sq: any, idx: number) => {
                const subQuestId = extractSubQuestIdFromSubQuest(sq)?.toString();
                let awarded = rewardsMap.get(subQuestId);
                const submissionStatus = submissionsMap.get(subQuestId) || 'none';

                // If not found in map, try to find by searching all progress entries
                if (awarded === undefined) {
                  const matchingProgress = aq.subQuestsProgress?.find((p: any) => {
                    const pId = extractSubQuestIdFromProgress(p)?.toString();
                    return pId === subQuestId;
                  });
                  if (matchingProgress) {
                    awarded = matchingProgress.rewardAwarded || false;
                  }
                }

                // On reload: if objective was submitted (status !== 'none'), always show as completed (green)
                // The "CLAIM REWARD" state is temporary and frontend-only, so on reload it should be green
                if (submissionStatus !== 'none') {
                  return true; // Show green "Task completed" state
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
      // Only set quests if we got any from the API - don't overwrite with empty array
      if (mappedQuests.length > 0) {
        setQuestsState(mappedQuests);
      }
    } catch (error) {
      console.error('Error fetching active quests:', error);
    }

    // Fetch completed quests - use hamsterAPI for Hamster users, userAPI for regular users
    try {
      const completedQuests = isHamsterUser
        ? await hamsterAPI.getCompletedQuests()
        : await userAPI.getCompletedQuests();
      // Similar mapping as active quests
      // Filter out quests where questId is null or not populated (not an object)
      const mappedCompleted = completedQuests
        .filter((cq: any) => cq.questId && typeof cq.questId === 'object' && cq.questId._id)
        .map((cq: any) => {
          const quest = cq.questId;
          return {
            id: quest._id,
            type: quest.type || "Main",
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
                    const mappedReward = mapBackendRewardEntryToFrontend(entry);
                    mappedRewards.push(mappedReward);
                  });
                }
              });

              return mappedRewards;
            })(),
            completed: true,
            objectives: quest.subQuests?.map((sq: any) => ({
              text: sq.title || sq.description,
              reward: sq.reward || { type: 'coins', value: 0 },
              description: sq.description || quest.description
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

      // Merge completed quests with active quests, avoiding duplicates
      // If a quest exists in both lists, prefer the completed version
      setQuestsState(prev => {
        const questMap = new Map<string | number, any>();

        // First, add all active quests (normalize ID to string for consistent comparison)
        prev.forEach(quest => {
          const normalizedId = String(quest.id);
          questMap.set(normalizedId, quest);
        });

        // Then, add/update with completed quests (completed quests take precedence)
        mappedCompleted.forEach(completedQuest => {
          const normalizedId = String(completedQuest.id);
          // Only add if not already present, or replace if the existing one is not completed
          const existingQuest = questMap.get(normalizedId);
          if (!existingQuest || !existingQuest.completed) {
            questMap.set(normalizedId, completedQuest);
          }
        });

        // Convert map back to array
        return Array.from(questMap.values());
      });
    } catch (error) {
      console.error('Error fetching completed quests:', error);
    }

    // Fetch inventory
    try {
      const inventory = await userAPI.getMyInventory();

      // Populate item cache from inventory data (for use in quest rewards display)
      populateItemCache(inventory);

      // Map backend inventory to frontend BackpackItem interface
      const mappedItems = inventory.map((inv: any, idx: number) => ({
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
      setBackpackItems(mappedItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }

    // Fetch member quests (for Hamsters)
    if (isHamsterUser) {
      try {
        const memberQuests = await hamsterAPI.getMyMemberQuests();

        // Map member quests to Quest interface
        // API Response structure:
        // { teamQuestId, teamQuestTitle, teamName, memberQuestIndex, title, description, status,
        //   rewardBalls, rewardLeaderboardScore, subQuests, assignedAt, leaderFeedback }
        console.log('Member quests from API:', memberQuests);

        const mappedMemberQuests = memberQuests.map((mq: any) => {
          // Create a unique ID using teamQuestId + memberQuestIndex
          const uniqueId = `${mq.teamQuestId}-mq-${mq.memberQuestIndex}`;

          // Map subQuests to objectives with their individual status
          // SubQuest status: Active | Pending | Approved
          const objectives = mq.subQuests && mq.subQuests.length > 0
            ? mq.subQuests.map((sq: any, idx: number) => ({
              text: sq.title || `Sub Task ${idx + 1}`,
              reward: { type: 'exp' as const, value: 0 },
              description: sq.description || '',
              subQuestId: `${uniqueId}-sq-${idx}`,
              // Store SubQuest index for submission
              subQuestIndex: idx
            }))
            : [{
              text: mq.title || "Complete Task",
              reward: { type: 'exp' as const, value: 0 },
              description: mq.description || '',
              subQuestIndex: 0
            }];

          // Map SubQuest status to objective completion
          // Approved = completed, Pending = submitted (waiting), Active = not done
          const objectiveCompleted = mq.subQuests && mq.subQuests.length > 0
            ? mq.subQuests.map((sq: any) => sq.status === 'Approved' || sq.status === 'Pending')
            : [mq.status === 'Completed'];

          // Map SubQuest status to submission status per SubQuest
          const objectiveSubmissions = mq.subQuests && mq.subQuests.length > 0
            ? mq.subQuests.map((sq: any) => ({
              imageUrl: sq.imageProof || null,
              status: (sq.status === 'Approved' ? 'approved' : sq.status === 'Pending' ? 'pending' : 'none') as ApprovalStatus
            }))
            : [{
              imageUrl: null,
              status: 'none' as ApprovalStatus
            }];

          // Track which SubQuests are fully approved
          const objectiveRewardsAwarded = mq.subQuests && mq.subQuests.length > 0
            ? mq.subQuests.map((sq: any) => sq.status === 'Approved')
            : [mq.status === 'Completed'];

          return {
            id: uniqueId,
            type: "Member",
            title: `${mq.title || "Team Task"} (${mq.teamName || 'Team'})`,
            description: mq.description || "",
            steps: objectives.map((_: any, i: number) => i + 1),
            currentStep: objectiveRewardsAwarded.filter((c: boolean) => c).length,
            rewards: [
              ...(mq.rewardBalls ? [{ type: 'coins' as const, value: mq.rewardBalls }] : []),
              ...(mq.rewardLeaderboardScore ? [{ type: 'leaderboard' as const, value: mq.rewardLeaderboardScore }] : [])
            ],
            completed: mq.status === 'Completed',
            objectives,
            objectiveCompleted,
            objectiveSubmissions,
            objectiveRewardsAwarded,
            rewardClaimed: mq.status === 'Completed',
            rewardSubmissionStatus: (mq.status === 'Completed' ? 'approved' : 'none') as ApprovalStatus,
            questRewardsAwarded: mq.status === 'Completed',
            category: "Team Work",
            // Member Quest specific fields
            isMemberQuest: true,
            teamQuestId: mq.teamQuestId,
            memberQuestIndex: mq.memberQuestIndex,
            // Extra info for display
            teamName: mq.teamName,
            leaderFeedback: mq.leaderFeedback
          };
        });

        if (mappedMemberQuests.length > 0) {
          // Merge member quests with existing quests, avoiding duplicates
          setQuestsState(prev => {
            const questMap = new Map<string | number, any>();

            // Add existing quests
            prev.forEach(quest => {
              const normalizedId = String(quest.id);
              questMap.set(normalizedId, quest);
            });

            // Add member quests (if not already present)
            mappedMemberQuests.forEach(mq => {
              const normalizedId = String(mq.id);
              if (!questMap.has(normalizedId)) {
                questMap.set(normalizedId, mq);
              }
            });

            return Array.from(questMap.values());
          });
        }
      } catch (error) {
        console.error('Error fetching member quests:', error);
      }
    }

  } catch (error) {
    console.error('Error initializing app:', error);
  } finally {
    setIsLoading(false);
  }
};

/**
 * Returns default unranked skills for all skill types
 */
const getDefaultSkills = (): Skill[] => {
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

