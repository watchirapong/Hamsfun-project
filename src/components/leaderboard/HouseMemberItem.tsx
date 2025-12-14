'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HouseMember } from '@/types';
import { getRankFromScore } from '@/utils/rankHelpers';
import { RankBadge } from './RankBadge';

interface HouseMemberItemProps {
  member: HouseMember;
  theme: 'light' | 'dark';
  shouldAnimate?: boolean;
}

export const HouseMemberItem: React.FC<HouseMemberItemProps> = ({ 
  member, 
  theme,
  shouldAnimate = false
}) => {
  const router = useRouter();
  const rank = getRankFromScore(member.leaderboardScore);
  const petLevel = member.petLevel || member.rank?.points || 0;

  const handleClick = () => {
    // Navigate to profile page with user ID
    router.push(`/profile?userId=${member._id}`);
  };

  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
        theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={handleClick}
    >
      <RankBadge 
        rank={rank} 
        theme={theme} 
        shouldAnimate={shouldAnimate}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm truncate ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {member.discordNickname || member.discordUsername}
        </div>
        {petLevel > 0 && (
          <div className={`text-xs opacity-70 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Pet Lv{petLevel}
          </div>
        )}
      </div>
    </div>
  );
};

