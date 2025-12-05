'use client';

import React, { useMemo } from 'react';
import { getRankFromScore } from '@/utils/rankHelpers';
import { RankBadge } from './RankBadge';

/**
 * House Member Item Component with performance optimizations
 * Optimized for 10,000+ concurrent users
 */
export const HouseMemberItem = React.memo(({ 
  member, 
  theme,
  shouldAnimate = false
}) => {
  const rank = useMemo(() => getRankFromScore(member.leaderboardScore), [member.leaderboardScore]);
  const petLevel = useMemo(() => member.petLevel || member.rank?.points || 0, [member.petLevel, member.rank]);
  const displayName = useMemo(() => member.discordNickname || member.discordUsername, [member.discordNickname, member.discordUsername]);

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
      theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
    }`}>
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
          {displayName}
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
});

HouseMemberItem.displayName = 'HouseMemberItem';

