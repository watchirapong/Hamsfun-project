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

  // Check if user can rank up (all objectives complete and enough coins)
  const canRankUp = (): boolean => {
    // Get required RP for next rank (use nextRankPoints from API, fallback to 100 if not available)
    const requiredRP = user.nextRankPoints || 100;
    
    const allObjectivesComplete = user.rankObjectives.every(objective => {
      if (objective.text.includes('Rank Points')) {
        // If at max rank (no nextRankPoints), this objective can't be completed
        if (!user.nextRankPoints) return false;
        return user.rankPoints >= requiredRP;
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

