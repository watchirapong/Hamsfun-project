/**
 * Leaderboard Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { leaderboardAPI } from '@/lib/api';

/**
 * Map house data to HouseLeaderboardItem format
 */
const mapHouseToLeaderboardItem = (house, index) => ({
  rank: index + 1, // Position in leaderboard (1-based)
  houseName: house.name || 'Unknown House',
  houseScore: house.score || 0,
  memberCount: house.memberCount || 0,
  houseId: house._id || house.id || '',
  members: house.members || undefined, // May be included in response
});

/**
 * Sort houses by score (descending)
 */
const sortHousesByScore = (houses) => {
  return [...houses].sort((a, b) => (b.score || 0) - (a.score || 0));
};

export const useLeaderboard = () => {
  const [houseLeaderboard, setHouseLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
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
      const sortedHouses = sortHousesByScore(houses);
      const mappedLeaderboard = sortedHouses.map(mapHouseToLeaderboardItem);
      
      setHouseLeaderboard(mappedLeaderboard);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setHouseLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Memoized return value
  return useMemo(() => ({
    houseLeaderboard,
    isLoading,
    error
  }), [houseLeaderboard, isLoading, error]);
};

