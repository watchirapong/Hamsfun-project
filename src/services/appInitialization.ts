import { Gamepad2, Monitor, Paintbrush, Code } from 'lucide-react';
import { userAPI, hamsterAPI, questAPI, getToken, setToken, removeToken } from '@/lib/api';
import { User, Skill, Quest, BackpackItem, ObjectiveReward, ApprovalStatus } from '@/types';
import { getRankIconPath, getAssetUrl } from '@/utils/helpers';
import {
  mapBackendRewardEntryToFrontend,
  extractSubQuestIdFromProgress,
  extractSubQuestIdFromSubQuest,
  mapApiQuestToFrontend
} from '@/utils/questHelpers';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';
import { populateItemCache, getItemIconUrl } from '@/utils/itemHelpers';

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
        balls: profile.hamster?.balls || profile.balls || 0,
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
          maxHealth: profile.partnerPet?.iv?.maxHealth || 0,
          attackDamage: profile.partnerPet?.iv?.attackDamage || 0,
          defense: profile.partnerPet?.iv?.defense || 0,
        } : undefined,
        petIcon: profile.partnerPet?.itemId?.icon || undefined,
        rankObjectives: profile.rankObjectives || [],
        isHamster: isHamsterUser,
        hamsterRank: profile.hamster?.hamsterRank || undefined,
        ownerCity: profile.ownerCity || undefined
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

    // Unified Quest Loading Flow
    try {
      console.log('Fetching all quest types...');
      const [activeQuests, completedQuests] = await Promise.all([
        isHamsterUser ? hamsterAPI.getActiveQuests().catch(() => []) : userAPI.getActiveQuests().catch(() => []),
        isHamsterUser ? hamsterAPI.getCompletedQuests().catch(() => []) : userAPI.getCompletedQuests().catch(() => [])
      ]);
      const allQuests = [...activeQuests, ...completedQuests];

      const questMap = new Map<string, Quest>();

      // 1. Map All Quests from Structure (as "New Quests" initially)
      allQuests.forEach((q: any) => {
        if (q && q._id) {
          const mapped = mapApiQuestToFrontend(q);
          questMap.set(q._id.toString(), mapped);
        }
      });

      // 2. Map Active Quests (overwrite with progress)
      activeQuests
        .filter((aq: any) => aq.questId && typeof aq.questId === 'object' && aq.questId._id)
        .forEach((aq: any) => {
          const mapped = mapApiQuestToFrontend(aq.questId, aq);
          questMap.set(aq.questId._id.toString(), mapped);
        });

      // 3. Map Completed Quests (overwrite as completed)
      completedQuests
        .filter((cq: any) => cq.questId && typeof cq.questId === 'object' && cq.questId._id)
        .forEach((cq: any) => {
          const mapped = mapApiQuestToFrontend(cq.questId, cq);
          questMap.set(cq.questId._id.toString(), mapped);
        });

      // Merge with existing quests (preserving any from profile)
      const finalQuests = Array.from(questMap.values());
      if (finalQuests.length > 0) {
        setQuestsState(prev => {
          const combinedMap = new Map<string, Quest>();
          // Add existing quests first
          prev.forEach(q => combinedMap.set(String(q.id), q));
          // Overwrite/Add with newly fetched quests
          finalQuests.forEach(q => combinedMap.set(String(q.id), q));
          return Array.from(combinedMap.values());
        });
        console.log(`Merged ${finalQuests.length} new/active/completed quests`);
      }
    } catch (error) {
      console.error('Error in unified quest loading:', error);
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
        image: getItemIconUrl(inv.itemId?.icon || inv.itemId?.image),
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
          // Get memberQuestId from API response (_id field) or fallback to index-based
          const memberQuestId = mq._id || mq.memberQuestId || `mq-${mq.memberQuestIndex}`;
          // Create a unique ID for Quest interface
          const uniqueId = `${mq.teamQuestId}-${memberQuestId}`;

          // Map subQuests to objectives with their individual status
          // SubQuest status: Active | Pending | Approved
          const objectives = mq.subQuests && mq.subQuests.length > 0
            ? mq.subQuests.map((sq: any, idx: number) => ({
              text: sq.title || `Sub Task ${idx + 1}`,
              reward: { type: 'exp' as const, value: 0 },
              description: sq.description || '',
              // Use _id from subQuest if available, otherwise fallback to index
              subQuestId: sq._id || `sq-${idx}`,
              // Store SubQuest index for fallback
              subQuestIndex: idx
            }))
            : [{
              text: mq.title || "Complete Task",
              reward: { type: 'exp' as const, value: 0 },
              description: mq.description || '',
              subQuestId: 'sq-0',
              subQuestIndex: 0
            }];

          // Map SubQuest status to objective completion
          // Approved = completed
          // Pending = submitted (waiting) -> NOT completed yet
          // Active = not done -> NOT completed
          const objectiveCompleted = mq.subQuests && mq.subQuests.length > 0
            ? mq.subQuests.map((sq: any) => sq.status === 'Approved')
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
            memberQuestId: memberQuestId, // Store actual ID for API calls
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

