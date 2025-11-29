'use client';

import React from 'react';
import { Gift } from 'lucide-react';
import { Quest } from '@/types';
import { isQuestTrulyCompleted } from '@/utils/helpers';

interface QuestCardProps {
  quest: Quest;
  onQuestClick: (questId: number) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onQuestClick }) => {
  const isCompleted = isQuestTrulyCompleted(quest);
  
  // Use objectives count instead of steps
  const totalObjectives = quest.objectives.length;
  const completedObjectives = quest.objectiveCompleted.filter(completed => completed).length;

  return (
    <div 
      className={`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer transition-all ${
        isCompleted 
          ? 'opacity-50 hover:opacity-60' 
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onQuestClick(quest.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs font-semibold text-[#BF5475] py-1 rounded-full flex items-center gap-1">
            <img src="/Asset/check-circle.png" alt="" className="w-3 h-3" />
            {quest.type}
          </span>
          <h3 className="font-bold text-black text-lg mt-1">{quest.title}</h3>
          <p className="text-gray-600 text-sm">{quest.description}</p>
        </div>
      </div>
      
      {/* Step indicators based on objectives + reward step */}
      {totalObjectives > 0 && (
        <div className="flex items-center gap-1 mt-3">
          {Array.from({ length: totalObjectives }).map((_, index) => {
            // Count how many objectives are completed (not which ones)
            // Fill balls from left to right based on count
            const isStepCompleted = index < completedObjectives;
            
            return (
              <React.Fragment key={index}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isStepCompleted
                    ? 'bg-[#4CCC51] text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className={`h-0.5 flex-1 ${isStepCompleted ? 'bg-[#4CCC51]' : 'bg-gray-200'}`}></div>
              </React.Fragment>
            );
          })}
          {/* Reward step at the end */}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            quest.rewardClaimed
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            <Gift size={14} />
          </div>
        </div>
      )}
    </div>
  );
};

