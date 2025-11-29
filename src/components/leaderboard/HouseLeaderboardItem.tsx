'use client';

import React, { useState } from 'react';
import { HouseLeaderboardItem as HouseLeaderboardItemType, HouseMember } from '@/types';
import { HouseMemberItem } from './HouseMemberItem';

interface HouseLeaderboardItemProps {
  item: HouseLeaderboardItemType;
  onFetchMembers?: (houseId: string) => Promise<HouseMember[]>;
}

export const HouseLeaderboardItemComponent: React.FC<HouseLeaderboardItemProps> = ({ 
  item, 
  onFetchMembers 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [members, setMembers] = useState<HouseMember[]>(item.members || []);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

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
      textColor: '#000000',
      textGlowColor: 'transparent',
      cardGlowColor: 'transparent',
    };
  };

  const rankStyle = getRankStyle();
  const isTopThree = item.rank <= 3;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click (overlay open)
    
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      
      // Fetch members if not already loaded and fetch function provided
      if (members.length === 0 && onFetchMembers) {
        setIsLoadingMembers(true);
        try {
          const fetchedMembers = await onFetchMembers(item.houseId);
          setMembers(fetchedMembers);
        } catch (error) {
          console.error('Failed to fetch house members:', error);
        } finally {
          setIsLoadingMembers(false);
        }
      }
    }
  };

  return (
    <div>
      <div 
        className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm border border-gray-100 cursor-pointer transition-all"
        style={isTopThree ? {
          boxShadow: `0 0 8px ${rankStyle.cardGlowColor}`,
        } : {}}
        onClick={handleClick}
      >
        <div 
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-sm"
          style={isTopThree ? {
            color: rankStyle.textColor,
            textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
          } : {}}
        >
          {item.rank}
        </div>
        <div className="flex-1">
          <div 
            className="font-semibold text-sm"
            style={isTopThree ? {
              color: rankStyle.textColor,
              textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
            } : { color: '#000000' }}
          >
            {item.houseName}
          </div>
          <div className="text-xs text-gray-400 opacity-70">{item.memberCount} members</div>
        </div>
        <div 
          className="font-bold text-sm"
          style={isTopThree ? {
            color: rankStyle.textColor,
            textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
          } : { color: '#000000' }}
        >
          {item.houseScore.toLocaleString()}
        </div>
      </div>
      
      {/* Expandable Member List */}
      {isExpanded && (
        <div 
          className="ml-4 mb-2 border-l-2 border-gray-200 pl-4 space-y-2 animate-slide-down"
        >
          {isLoadingMembers ? (
            <div className="text-center py-2 text-gray-500 text-sm">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-2 text-gray-500 text-sm">No members found</div>
          ) : (
            members.map((member, index) => (
              <HouseMemberItem 
                key={member._id || index} 
                member={member} 
                rank={index + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

