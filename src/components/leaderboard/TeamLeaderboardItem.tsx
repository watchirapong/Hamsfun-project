'use client';

import React, { useState } from 'react';
import { TeamLeaderboardItem } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TeamLeaderboardItemComponentProps {
  team: TeamLeaderboardItem;
  theme: 'light' | 'dark';
}

export const TeamLeaderboardItemComponent: React.FC<TeamLeaderboardItemComponentProps> = ({
  team,
  theme,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`p-3 mb-2 rounded-xl border transition-all cursor-pointer ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-600/30 hover:border-yellow-500/50' 
          : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-300'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold w-8 text-center ${
            team.rank === 1 ? 'text-yellow-500' : 
            team.rank === 2 ? 'text-gray-400' : 
            team.rank === 3 ? 'text-amber-600' : 
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {team.rank <= 3 ? ['🥇', '🥈', '🥉'][team.rank - 1] : team.rank}
          </div>
          <div className="text-2xl">{team.icon}</div>
          <div>
            <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {team.name}
            </div>
            <div className={`text-xs flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {team.memberCount} members
              {isExpanded ? (
                <ChevronUp size={12} className="ml-1" />
              ) : (
                <ChevronDown size={12} className="ml-1" />
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-500">🔵 {team.totalBalls}</div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            avg: {team.avgBalls}/member
          </div>
        </div>
      </div>
      
      {/* Expanded Members List */}
      {isExpanded && team.members && team.members.length > 0 && (
        <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Team Members
          </div>
          {team.members.map((member, idx) => (
            <div 
              key={member._id}
              className={`flex items-center justify-between py-2 ${
                idx < team.members.length - 1 
                  ? `border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-100'}` 
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.discordNickname || member.discordUsername} 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {(member.discordNickname || member.discordUsername || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {member.discordNickname || member.discordUsername}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {member.hamsterRank}
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium text-yellow-500">
                🔵 {member.balls}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No members message */}
      {isExpanded && (!team.members || team.members.length === 0) && (
        <div className={`mt-3 pt-3 border-t text-center text-sm ${
          theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
        }`}>
          No members data available
        </div>
      )}
    </div>
  );
};

