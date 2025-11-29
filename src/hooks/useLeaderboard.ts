import { useState, useEffect } from 'react';
import { leaderboardAPI } from '@/lib/api';
import { HouseLeaderboardItem, LeaderboardResponse, HouseMember } from '@/types';

export const useLeaderboard = () => {
  const [houseLeaderboard, setHouseLeaderboard] = useState<HouseLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await leaderboardAPI.getLeaderboard();
        
        // Get houses from response (prioritize houses over users)
        const houses = response.houses || [];
        
        if (houses.length === 0) {
          console.warn('No houses found in leaderboard response');
          setHouseLeaderboard([]);
          return;
        }
        
        // Sort houses by score (descending) and map to HouseLeaderboardItem format
        const sortedHouses = [...houses].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
        
        const mappedLeaderboard: HouseLeaderboardItem[] = sortedHouses.map((house: any, index: number) => {
          return {
            rank: index + 1, // Position in leaderboard (1-based)
            houseName: house.name || 'Unknown House',
            houseScore: house.score || 0,
            memberCount: house.memberCount || 0,
            houseId: house._id || house.id || '',
            members: house.members || undefined, // May be included in response
          };
        });
        
        setHouseLeaderboard(mappedLeaderboard);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setHouseLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { houseLeaderboard, isLoading, error };
};

