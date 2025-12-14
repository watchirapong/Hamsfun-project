'use client';

import React from 'react';
import { Gift } from 'lucide-react';
import { Quest } from '@/types';
import { isQuestTrulyCompleted, getAssetUrl } from '@/utils/helpers';

interface QuestCardProps {
  quest: Quest;
  onQuestClick: (questId: number) => void;
  theme: 'light' | 'dark';
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onQuestClick, theme }) => {
  const isCompleted = isQuestTrulyCompleted(quest);
  const isBossQuest = quest.type === "Boss";
  
  // Use objectives count instead of steps
  const totalObjectives = quest.objectives.length;
  const completedObjectives = quest.objectiveCompleted.filter(completed => completed).length;

  // Boss quest styling - soft red theme
  const bossStyles = isBossQuest ? {
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, rgba(139, 0, 0, 0.3) 0%, rgba(178, 34, 34, 0.2) 100%)'
      : 'linear-gradient(135deg, rgba(255, 200, 200, 0.4) 0%, rgba(255, 182, 193, 0.3) 100%)',
    borderColor: theme === 'dark' ? 'rgba(220, 20, 60, 0.5)' : 'rgba(220, 20, 60, 0.4)',
    hoverBackground: theme === 'dark'
      ? 'linear-gradient(135deg, rgba(139, 0, 0, 0.4) 0%, rgba(178, 34, 34, 0.3) 100%)'
      : 'linear-gradient(135deg, rgba(255, 200, 200, 0.5) 0%, rgba(255, 182, 193, 0.4) 100%)',
  } : null;

  return (
    <div 
      className={`rounded-xl p-4 mb-3 shadow-sm border cursor-pointer transition-all ${
        isBossQuest
          ? ''
          : theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
            : 'bg-white border-gray-100 hover:bg-gray-50'
      } ${
        isCompleted 
          ? 'opacity-50 hover:opacity-60' 
          : ''
      }`}
      style={bossStyles ? {
        background: bossStyles.background,
        borderColor: bossStyles.borderColor,
      } : undefined}
      onMouseEnter={(e) => {
        if (bossStyles && !isCompleted) {
          e.currentTarget.style.background = bossStyles.hoverBackground;
        }
      }}
      onMouseLeave={(e) => {
        if (bossStyles && !isCompleted) {
          e.currentTarget.style.background = bossStyles.background;
        }
      }}
      onClick={() => onQuestClick(quest.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`text-xs font-semibold py-1 rounded-full flex items-center gap-1 ${
            isBossQuest
              ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
              : theme === 'dark' ? 'text-[#F67BA4]' : 'text-[#BF5475]'
          }`}>
            <img src={getAssetUrl("/Asset/check-circle.png")} alt="" className="w-3 h-3" />
            {quest.type}
          </span>
          <h3 className={`font-bold text-lg mt-1 ${
            isBossQuest
              ? theme === 'dark' ? 'text-red-300' : 'text-red-700'
              : theme === 'dark' ? 'text-white' : 'text-black'
          }`}>{quest.title}</h3>
          <p className={`text-sm ${
            isBossQuest
              ? theme === 'dark' ? 'text-red-400/80' : 'text-red-600/80'
              : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>{quest.description}</p>
        </div>
      </div>
      
      {/* Step indicators based on objectives + reward step */}
      {totalObjectives > 0 && (
        <div className="flex items-center gap-1 mt-3">
          {Array.from({ length: totalObjectives }).map((_, index) => {
            // Check specific completion for this step if array corresponds to steps
            // But relying on count for simplified progress bar behavior as before
            // However, we want to know if the CURRENT step is pending
            
            const isStepCompleted = index < completedObjectives;
            
            // Check if this specific step is pending
            const submission = quest.objectiveSubmissions?.[index];
            const isPending = submission?.status === 'pending';
            
            // Next progress level is the first uncompleted objective
            const isNextProgressLevel = index === completedObjectives;
            
            return (
              <React.Fragment key={index}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs relative ${
                  isStepCompleted
                    ? 'bg-[#4CCC51] text-white' 
                    : isPending
                      ? 'bg-yellow-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-600'
                } ${
                  isNextProgressLevel && !isPending ? 'ring-2 ring-[#4CCC51] ring-offset-1' : ''
                } ${
                  isPending ? 'ring-2 ring-yellow-500 ring-offset-1' : ''
                }`}>
                  {index + 1}
                </div>
                <div className={`h-0.5 flex-1 ${
                  isStepCompleted 
                    ? 'bg-[#4CCC51]' 
                    : isPending
                      ? 'bg-yellow-500'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </React.Fragment>
            );
          })}
          {/* Reward step at the end */}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center relative ${
            quest.rewardClaimed
              ? 'bg-blue-500 text-white' 
              : quest.rewardSubmissionStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-600'
          } ${
            completedObjectives === totalObjectives && !quest.rewardClaimed && quest.rewardSubmissionStatus !== 'pending' 
              ? 'ring-2 ring-[#4CCC51] ring-offset-1' 
              : ''
          } ${
            quest.rewardSubmissionStatus === 'pending' ? 'ring-2 ring-yellow-500 ring-offset-1' : ''
          }`}>
            <Gift size={14} />
          </div>
        </div>
      )}
    </div>
  );
};

