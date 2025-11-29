'use client';

import React from 'react';
import { LeaderboardItem as LeaderboardItemType } from '@/types';

interface LeaderboardItemProps {
  item: LeaderboardItemType;
}

export const LeaderboardItemComponent: React.FC<LeaderboardItemProps> = ({ item }) => {
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
        textColor: '#C77143',
        textGlowColor: 'rgba(199, 113, 67, 0.5)',
        cardGlowColor: 'rgba(199, 113, 67, 0.15)',
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

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm border border-gray-100"
      style={isTopThree ? {
        boxShadow: `0 0 8px ${rankStyle.cardGlowColor}`,
      } : {}}
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
      <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <div 
          className="font-semibold text-sm"
          style={isTopThree ? {
            color: rankStyle.textColor,
            textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
          } : { color: '#000000' }}
        >
          {item.name}
        </div>
        <div className="text-xs text-gray-500">Dogv Lv{item.level}</div>
      </div>
      <div 
        className="font-bold text-sm"
        style={isTopThree ? {
          color: rankStyle.textColor,
          textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
        } : { color: '#000000' }}
      >
        {item.score}
      </div>
    </div>
  );
};

