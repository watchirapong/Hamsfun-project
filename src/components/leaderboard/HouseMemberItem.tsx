'use client';

import React from 'react';
import { HouseMember } from '@/types';

interface HouseMemberItemProps {
  member: HouseMember;
  rank: number;
  theme: 'light' | 'dark';
}

export const HouseMemberItem: React.FC<HouseMemberItemProps> = ({ member, rank, theme }) => {
  // Determine colors and glow for top 3 ranks
  const getRankStyle = () => {
    if (rank === 1) {
      return {
        textColor: '#F0AC3E',
        textGlowColor: 'rgba(240, 172, 62, 0.5)',
      };
    } else if (rank === 2) {
      return {
        textColor: '#979797',
        textGlowColor: 'rgba(151, 151, 151, 0.5)',
      };
    } else if (rank === 3) {
      return {
        textColor: '#CA5212',
        textGlowColor: 'rgba(202, 82, 18, 0.5)',
      };
    }
    return {
      textColor: theme === 'dark' ? '#ffffff' : '#000000',
      textGlowColor: 'transparent',
    };
  };

  const rankStyle = getRankStyle();
  const isTopThree = rank <= 3;
  const petLevel = member.petLevel || member.rank?.points || 0;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div 
        className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}
        style={isTopThree ? {
          color: rankStyle.textColor,
          textShadow: `0 0 6px ${rankStyle.textGlowColor}`,
        } : { color: rankStyle.textColor }}
      >
        {rank}
      </div>
      <div className="flex-1">
        <div 
          className="font-medium text-xs"
          style={isTopThree ? {
            color: rankStyle.textColor,
            textShadow: `0 0 6px ${rankStyle.textGlowColor}`,
          } : { color: rankStyle.textColor }}
        >
          {member.discordNickname || member.discordUsername}
        </div>
        <div className="text-xs text-gray-400 opacity-70">Pet Lv{petLevel}</div>
      </div>
      <div 
        className="font-bold text-xs"
        style={isTopThree ? {
          color: rankStyle.textColor,
          textShadow: `0 0 6px ${rankStyle.textGlowColor}`,
        } : { color: rankStyle.textColor }}
      >
        {member.leaderboardScore.toLocaleString()}
      </div>
    </div>
  );
};

