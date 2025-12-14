'use client';

import { useState, useEffect } from 'react';
import { leaderboardAPI } from '@/lib/api';
import { HouseLeaderboardItem, TeamLeaderboardItem, HamsterLeaderboardItem, HouseMember } from '@/types';

interface UseLeaderboardResult {
  houseLeaderboard: HouseLeaderboardItem[];
  teamLeaderboard: TeamLeaderboardItem[];
  hamsterLeaderboard: HamsterLeaderboardItem[];
  isLoading: boolean;
  error: string | null;
}

export const useLeaderboard = (isHamster: boolean = false, cityId?: string): UseLeaderboardResult => {
  const [houseLeaderboard, setHouseLeaderboard] = useState<HouseLeaderboardItem[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardItem[]>([]);
  const [hamsterLeaderboard, setHamsterLeaderboard] = useState<HamsterLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        if (isHamster) {
          // Hamster user: fetch hamster leaderboard (hamsters and teams)
          const response = await leaderboardAPI.getHamsterLeaderboard();

          if (!isMounted) return;

          // Map hamsters with rank position
          const mappedHamsters: HamsterLeaderboardItem[] = (response.hamsters || []).map((h: any, index: number) => ({
            rank: index + 1,
            _id: h._id,
            discordUsername: h.discordUsername,
            discordNickname: h.discordNickname,
            avatar: h.avatar,
            hamsterRank: h.hamsterRank,
            leaderboardScore: h.leaderboardScore || 0,
          }));

          // Map teams with rank position
          const mappedTeams: TeamLeaderboardItem[] = (response.teams || []).map((t: any, index: number) => ({
            rank: index + 1,
            _id: t._id,
            name: t.name,
            icon: t.icon || '🐹',
            memberCount: t.memberCount || 0,
            totalScore: t.totalScore || 0,
            avgScore: t.avgScore || 0,
            members: (t.members || []).map((m: any) => ({
              _id: m._id,
              discordNickname: m.discordNickname,
              discordUsername: m.discordUsername,
              avatar: m.avatar,
              hamsterRank: m.hamsterRank,
              leaderboardScore: m.leaderboardScore || 0,
            })),
          }));

          setHamsterLeaderboard(mappedHamsters);
          setTeamLeaderboard(mappedTeams);
          setHouseLeaderboard([]);
        } else {
          // Regular user: fetch house leaderboard with cityId
          const response = await leaderboardAPI.getLeaderboard(cityId);

          if (!isMounted) return;

          // Get houses from response (prioritize houses over users)
          const houses = response.houses || [];

          if (houses.length === 0) {
            console.warn('No houses found in leaderboard response');
            setHouseLeaderboard([]);
            // Don't clear others if empty response? No, we should probably clear to be safe
            setTeamLeaderboard([]);
            setHamsterLeaderboard([]);
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
          setTeamLeaderboard([]);
          setHamsterLeaderboard([]);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch leaderboard:', err);
          setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
          setHouseLeaderboard([]);
          setTeamLeaderboard([]);
          setHamsterLeaderboard([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [isHamster, cityId]);

  return { houseLeaderboard, teamLeaderboard, hamsterLeaderboard, isLoading, error };
};

