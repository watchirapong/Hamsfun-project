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

  // Calculate total score from members if totalScore is 0 or not provided
  const calculatedTotal = team.members?.reduce((sum, m) => sum + (m.leaderboardScore || 0), 0) || 0;
  const displayTotal = team.totalScore > 0 ? team.totalScore : calculatedTotal;
  const memberCount = team.memberCount || team.members?.length || 1;
  const displayAverage = Math.round(displayTotal / memberCount);

  // Determine colors for top 3 ranks (same as HouseLeaderboardItem)
  const getRankStyle = () => {
    if (team.rank === 1) {
      return {
        textColor: '#F0AC3E',
        textGlowColor: 'rgba(240, 172, 62, 0.5)',
        cardGlowColor: 'rgba(240, 172, 62, 0.15)',
      };
    } else if (team.rank === 2) {
      return {
        textColor: '#979797',
        textGlowColor: 'rgba(151, 151, 151, 0.5)',
        cardGlowColor: 'rgba(151, 151, 151, 0.15)',
      };
    } else if (team.rank === 3) {
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
  const isTopThree = team.rank <= 3;

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
        onClick={() => setIsExpanded(!isExpanded)}
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
          {team.rank}
        </div>
        <div className="text-xl">{team.icon}</div>
        <div className="flex-1">
          <div 
            className="font-semibold text-sm flex items-center gap-1"
            style={isTopThree ? {
              color: rankStyle.textColor,
              textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
            } : { color: rankStyle.textColor }}
          >
            {team.name}
            {isExpanded ? (
              <ChevronUp size={14} className="opacity-60" />
            ) : (
              <ChevronDown size={14} className="opacity-60" />
            )}
          </div>
          <div className={`text-xs opacity-70 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`}>{team.memberCount} members</div>
        </div>
        <div className="text-right">
          <div 
            className="font-bold text-sm"
            style={isTopThree ? {
              color: rankStyle.textColor,
              textShadow: `0 0 8px ${rankStyle.textGlowColor}`,
            } : { color: rankStyle.textColor }}
          >
            {displayAverage}
          </div>
        </div>
      </div>
      
      {/* Expandable Member List */}
      {isExpanded && (
        <div 
          className={`ml-4 mb-2 border-l-2 pl-4 space-y-2 animate-slide-down-expand ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          {team.members && team.members.length > 0 ? (
            [...team.members]
              .sort((a, b) => (b.leaderboardScore || 0) - (a.leaderboardScore || 0))
              .map((member) => (
              <div 
                key={member._id}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}
              >
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
                <div className="flex-1">
                  <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {member.discordNickname || member.discordUsername}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {member.hamsterRank}
                  </div>
                </div>
                <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {member.leaderboardScore}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-gray-500 text-sm">No members found</div>
          )}
        </div>
      )}
    </div>
  );
};

