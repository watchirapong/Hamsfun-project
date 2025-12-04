'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HouseLeaderboardItem as HouseLeaderboardItemType, HouseMember } from '@/types';
import { HouseMemberItem } from './HouseMemberItem';
import { getRankFromScore, getRankPriority } from '@/utils/rankHelpers';

interface HouseLeaderboardItemProps {
  item: HouseLeaderboardItemType;
  onFetchMembers?: (houseId: string) => Promise<HouseMember[]>;
  theme: 'light' | 'dark';
  currentUserDiscordUsername?: string; // Optional: to detect rank changes
}

export const HouseLeaderboardItemComponent: React.FC<HouseLeaderboardItemProps> = ({ 
  item, 
  onFetchMembers,
  theme,
  currentUserDiscordUsername
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [members, setMembers] = useState<HouseMember[]>(item.members || []);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberRankMap, setMemberRankMap] = useState<Map<string, string>>(new Map());
  const previousRankMapRef = useRef<Map<string, string>>(new Map());

  // Determine colors and glow for top 3 ranks
  const getRankStyle = () => {
    if (item.rank === 1) {
      return {
        textColor: '#F0AC3E',
        textGlowColor: 'rgba(240, 172, 62, 0.5)',
        cardGlowColor: 'rgba(240, 172, 62, 0.15)',
      };
    } else if (item.rank === 2) {
      return {
        textColor: '#979797',
        textGlowColor: 'rgba(151, 151, 151, 0.5)',
        cardGlowColor: 'rgba(151, 151, 151, 0.15)',
      };
    } else if (item.rank === 3) {
      return {
        textColor: '#CA5212',
        textGlowColor: 'rgba(202, 82, 18, 0.5)',
        cardGlowColor: 'rgba(202, 82, 18, 0.15)',
      };
    }
    return {
      textColor: theme === 'dark' ? '#ffffff' : '#000000',
      textGlowColor: 'transparent',
      cardGlowColor: 'transparent',
    };
  };

  const rankStyle = getRankStyle();
  const isTopThree = item.rank <= 3;

  // Sort members by rank (S->G), then alphabetically by username
  const sortMembersByRank = (membersList: HouseMember[]): HouseMember[] => {
    return [...membersList].sort((a, b) => {
      const rankA = getRankFromScore(a.leaderboardScore);
      const rankB = getRankFromScore(b.leaderboardScore);
      
      // First sort by rank priority (S highest, G lowest)
      const priorityDiff = getRankPriority(rankB) - getRankPriority(rankA);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // If same rank, sort alphabetically by username
      const usernameA = (a.discordNickname || a.discordUsername || '').toLowerCase();
      const usernameB = (b.discordNickname || b.discordUsername || '').toLowerCase();
      return usernameA.localeCompare(usernameB);
    });
  };

  // Update rank map when members change
  useEffect(() => {
    if (members.length > 0) {
      const newRankMap = new Map<string, string>();
      members.forEach(member => {
        const rank = getRankFromScore(member.leaderboardScore);
        newRankMap.set(member._id, rank);
      });
      
      setMemberRankMap(newRankMap);
    }
  }, [members]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click (overlay open)
    
    if (isExpanded) {
      // When closing, save current ranks as previous for next time
      if (members.length > 0) {
        const currentRankMap = new Map<string, string>();
        members.forEach(member => {
          const rank = getRankFromScore(member.leaderboardScore);
          currentRankMap.set(member._id, rank);
        });
        previousRankMapRef.current = currentRankMap;
      }
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      
      // Fetch members if not already loaded and fetch function provided
      if (members.length === 0 && onFetchMembers) {
        setIsLoadingMembers(true);
        try {
          const fetchedMembers = await onFetchMembers(item.houseId);
          // Sort members by rank
          const sortedMembers = sortMembersByRank(fetchedMembers);
          setMembers(sortedMembers);
        } catch (error) {
          console.error('Failed to fetch house members:', error);
        } finally {
          setIsLoadingMembers(false);
        }
      } else if (members.length > 0) {
        // Re-sort existing members
        const sortedMembers = sortMembersByRank(members);
        setMembers(sortedMembers);
      }
    }
  };

  // Check if a member's rank has increased (for animation)
  const shouldAnimateMember = (member: HouseMember): boolean => {
    if (!currentUserDiscordUsername) return false;
    
    const memberUsername = member.discordNickname || member.discordUsername;
    if (memberUsername !== currentUserDiscordUsername) return false;
    
    const previousRank = previousRankMapRef.current.get(member._id);
    const currentRank = getRankFromScore(member.leaderboardScore);
    
    if (!previousRank) return false; // First time viewing, no animation
    
    // Check if rank improved (higher priority = better rank)
    return getRankPriority(currentRank) > getRankPriority(previousRank as any);
  };

  return (
    <div>
      <div 
        className={`flex items-center gap-3 p-3 rounded-xl mb-2 shadow-sm border cursor-pointer transition-all ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
            : 'bg-white border-gray-100 hover:bg-gray-50'
        }`}
        style={isTopThree ? {
          boxShadow: `0 0 8px ${rankStyle.cardGlowColor}`,
        } : {}}
        onClick={handleClick}
      >
        <div 
          className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}
          style={isTopThree ? {
            color: rankStyle.textColor,
            textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
          } : { color: rankStyle.textColor }}
        >
          {item.rank}
        </div>
        <div className="flex-1">
          <div 
            className="font-semibold text-sm"
            style={isTopThree ? {
              color: rankStyle.textColor,
              textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
            } : { color: rankStyle.textColor }}
          >
            {item.houseName}
          </div>
          <div className={`text-xs opacity-70 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`}>{item.memberCount} members</div>
        </div>
        <div 
          className="font-bold text-sm"
          style={isTopThree ? {
            color: rankStyle.textColor,
            textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
          } : { color: rankStyle.textColor }}
        >
          {item.houseScore.toLocaleString()}
        </div>
      </div>
      
      {/* Expandable Member List */}
      {isExpanded && (
        <div 
          className={`ml-4 mb-2 border-l-2 pl-4 space-y-2 animate-slide-down-expand ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          {isLoadingMembers ? (
            <div className="text-center py-2 text-gray-500 text-sm">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-2 text-gray-500 text-sm">No members found</div>
          ) : (
            members.map((member) => (
              <HouseMemberItem 
                key={member._id} 
                member={member} 
                theme={theme}
                shouldAnimate={shouldAnimateMember(member)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

