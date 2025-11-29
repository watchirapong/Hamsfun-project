'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { User, Quest } from '@/types';
import { isQuestTrulyCompleted } from '@/utils/helpers';

interface ProfileSectionProps {
  user: User;
  questsState: Quest[];
  rankCardFlipped: boolean;
  theme: 'light' | 'dark';
  onRankCardFlip: () => void;
  onRankUp: () => void;
  canRankUp: () => boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  questsState,
  rankCardFlipped,
  theme,
  onRankCardFlip,
  onRankUp,
  canRankUp,
}) => {
  return (
    <div className={`p-4 shadow-sm mb-4 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Pet Display on Left */}
        <div className="flex flex-col items-center flex-shrink-0">
          <img src={user.avatar} alt="Pet" className="w-45 h-45 sm:w-48 sm:h-48 object-contain" />
          <div className="text-center mt-1">
            <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.petLevel}</span>
          </div>
        </div>
        
        {/* Rank Card on Right - Clickable with Flip Animation */}
        <div className="flex-1 min-w-0" style={{ flex: '1 1 auto' }}>
          <div 
            className={`flip-card cursor-pointer w-full sm:max-w-md ${rankCardFlipped ? 'flipped' : ''}`}
            onClick={onRankCardFlip}
            style={{ minHeight: '280px' }}
          >
            <div className="flip-card-inner" style={{ minHeight: '280px' }}>
              {/* Front of Card */}
              <div className={`flip-card-front rounded-xl p-4 shadow-md border flex flex-col w-full h-full justify-between ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                {/* Rank Icon/Badge */}
                <div className="flex justify-center -mt-10">
                  <img 
                    src={user.badge} 
                    alt="Rank Badge" 
                    className="w-56 h-56 sm:w-56 sm:h-56 object-contain" 
                  />
                </div>
                <h2 className={`font-bold text-2xl sm:text-3xl text-center truncate -mt-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.rankName}</h2>
                <div className="flex flex-col">
                  <div className={`w-full rounded-full h-3 mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${user.nextRankPoints 
                          ? Math.min((user.rankPoints / user.nextRankPoints) * 100, 100) 
                          : 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className={`text-xs sm:text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user.rankPoints}{user.nextRankPoints ? `/${user.nextRankPoints}` : ''} RP
                  </div>
                </div>
              </div>
              
              {/* Back of Card - Rank Objectives */}
              <div className={`flip-card-back rounded-xl p-3 sm:p-4 shadow-md border flex flex-col w-full h-full ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-bold text-lg sm:text-xl text-center mb-2 sm:mb-3 truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.rankName}</h3>
                <div className={`text-xs font-semibold mb-2 sm:mb-3 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Objectives to Rank Up</div>
                <div className="space-y-1.5 sm:space-y-2 text-xs mb-3">
                  {user.rankObjectives.map((objective, index) => {
                    // Get required RP for next rank (use nextRankPoints from API, fallback to 100 if not available)
                    const requiredRP = user.nextRankPoints || 100;
                    
                    // Check completion status based on objective type
                    let isCompleted = false;
                    if (objective.text.includes('Rank Points')) {
                      // If at max rank (no nextRankPoints), this objective can't be completed
                      if (!user.nextRankPoints) {
                        isCompleted = false;
                      } else {
                        isCompleted = user.rankPoints >= requiredRP;
                      }
                    } else if (objective.questId) {
                      // Check if linked quest is completed
                      const linkedQuest = questsState.find(q => q.id === objective.questId);
                      isCompleted = linkedQuest ? isQuestTrulyCompleted(linkedQuest) : false;
                    } else if (objective.coinCost) {
                      // Check if user has enough coins
                      isCompleted = user.coins >= objective.coinCost;
                    } else {
                      isCompleted = objective.completed;
                    }
                    
                    const showProgress = objective.text.includes('Rank Points');
                    
                    return (
                      <div key={index} className="flex items-start gap-2">
                        <Check 
                          size={18} 
                          className={`flex-shrink-0 mt-0.5 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} 
                        />
                        <div className="flex-1">
                          <span className={`${isCompleted ? 'line-through text-gray-500' : theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            {objective.text}
                          </span>
                          {showProgress && !isCompleted && user.nextRankPoints && (
                            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Progress: {user.rankPoints}/{user.nextRankPoints} RP
                            </div>
                          )}
                          {showProgress && !isCompleted && !user.nextRankPoints && (
                            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Max rank reached
                            </div>
                          )}
                          {objective.coinCost && !isCompleted && (
                            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Need: {objective.coinCost} coins (Have: {user.coins})
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-2 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card flip
                      onRankUp();
                    }}
                    disabled={!canRankUp()}
                    className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors ${
                      canRankUp()
                        ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Rank Up
                  </button>
                </div>
                <div className="mt-1.5 text-[10px] text-gray-400 text-center">
                  Tap to flip back
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

