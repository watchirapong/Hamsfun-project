'use client';

import React, { useState } from 'react';
import { HouseLeaderboardItem as HouseLeaderboardItemType, HouseMember } from '@/types';
import { HouseMemberItem } from './HouseMemberItem';

interface HouseLeaderboardItemProps {
  item: HouseLeaderboardItemType;
  onFetchMembers?: (houseId: string) => Promise<HouseMember[]>;
  theme: 'light' | 'dark';
}

export const HouseLeaderboardItemComponent: React.FC<HouseLeaderboardItemProps> = ({ 
  item, 
  onFetchMembers,
  theme
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
      textColor: theme === 'dark' ? '#ffffff' : '#000000',
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
            members.map((member, index) => (
              <HouseMemberItem 
                key={member._id || index} 
                member={member} 
                rank={index + 1}
                theme={theme}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

