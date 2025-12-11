import { userAPI } from '@/lib/api';
import { Quest, User } from '@/types';
import { getRankIconPath } from '@/utils/helpers';
import { isQuestTrulyCompleted } from '@/utils/helpers';

interface ProfileHandlersParams {
  user: User;
  questsState: Quest[];
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

/**
 * Creates profile/rank-related handler functions
 */
export const useProfileHandlers = (params: ProfileHandlersParams) => {
  const { user, questsState, setUser } = params;

  /**
   * Check if user can rank up
   * Returns true only if ALL of the following are satisfied:
   * 1. Rank Points Requirement: current RP >= nextRankPoints
   * 2. Quest Requirement: All required quests are fully completed
   * 3. Coin Requirement: current coins >= required coin cost
   */
  const canRankUp = (): boolean => {
    // 1. Rank Points Requirement
    // Check if user has enough rank points for the next rank
    const hasEnoughRankPoints = (() => {
      // If no nextRankPoints is defined, user is at max rank and cannot rank up
      if (!user.nextRankPoints) {
        return false;
      }
      // User must have at least the required RP to rank up
      return user.rankPoints >= user.nextRankPoints;
    })();

    // 2. Quest Requirement
    // Check if all required quests (those with questId) are fully completed
    const allRequiredQuestsCompleted = (() => {
      // Find all rank objectives that require quests
      const questObjectives = user.rankObjectives.filter(obj => obj.questId !== undefined);
      
      // If there are no quest requirements, this condition is satisfied
      if (questObjectives.length === 0) {
        return true;
      }

      // Check each required quest
      return questObjectives.every(objective => {
        if (!objective.questId) return true; // Should not happen due to filter, but safety check
        
        // Find the linked quest in questsState
        const linkedQuest = questsState.find(q => q.id === objective.questId);
        
        if (!linkedQuest) {
          // Quest not found - cannot be completed
          return false;
        }

        // Quest must be truly completed (all objectives done AND reward claimed)
        return isQuestTrulyCompleted(linkedQuest);
      });
    })();

    // 3. Coin Requirement
    // Check if user has enough coins for the rank up cost
    const hasEnoughCoins = (() => {
      // Find the coin cost objective (if any)
      const coinObjective = user.rankObjectives.find(obj => obj.coinCost !== undefined);
      
      // If there's no coin cost requirement, this condition is satisfied
      if (!coinObjective || coinObjective.coinCost === undefined) {
        return true;
      }

      // User must have at least the required coins
      return user.coins >= coinObjective.coinCost;
    })();

    // All three conditions must be satisfied
    return hasEnoughRankPoints && allRequiredQuestsCompleted && hasEnoughCoins;
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
        nextRankPoints: profile.rank?.nextRankPoints || undefined,
        badge: getRankIconPath(profile.rank?.currentTier || prev.rankName)
      }));
    } catch (error) {
      console.error('Error ranking up:', error);
      alert('Failed to rank up. Please try again.');
    }
  };

  return {
    canRankUp,
    handleRankUp,
  };
};

