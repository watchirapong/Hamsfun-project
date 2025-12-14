'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Heart, Sword, Shield } from 'lucide-react';
import { User, Quest } from '@/types';
import { isQuestTrulyCompleted, getAssetUrl } from '@/utils/helpers';
import { rankCardAttention } from './rankCardVariants';
import { rankCardGlowPulse } from './rankCardGlowPulseVariants';

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
  const [petStatsFlipped, setPetStatsFlipped] = useState(false);

  return (
    <div className={`p-4 shadow-sm mb-4 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-3 sm:gap-6 w-full">
        {/* Pet Display on Left - 50% of screen width */}
        <div className="flex flex-col items-center justify-center w-1/2" style={{ minHeight: '280px' }}>
          {/* Pet Image Container with Hover Effect */}
          <div className="relative w-full h-full flex items-center justify-center group cursor-pointer" style={{ minHeight: '280px' }}>
            {/* Pet Image */}
            <img 
              src={/*user.avatar*/ getAssetUrl("/Asset/pets/dog.png") /*TESTING*/} 
              alt="Pet" 
              className="w-full h-auto object-contain max-w-full transition-all duration-300 group-hover:blur-sm group-hover:scale-105" 
              style={{ maxHeight: '280px' }}
            />
            
            {/* Pet Level Badge - Always Visible */}
            <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }`}>
              Lv. {user.petLevel}
            </div>
            
            {/* Pet Stats Overlay - Shown on Hover with Flip Functionality */}
            <div 
              className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl backdrop-blur-md ${
                theme === 'dark' ? 'bg-black/40' : 'bg-white/50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setPetStatsFlipped(!petStatsFlipped);
              }}
              onMouseLeave={() => {
                // Reset flip state when hover ends
                setPetStatsFlipped(false);
              }}
            >
              {/* Flip Card Container */}
              <div className={`flip-card ${petStatsFlipped ? 'flipped' : ''}`} style={{ width: '160px' }}>
                <div className="flip-card-inner">
                  {/* Front Side - Pet Stats */}
                  <div className="flip-card-front">
                    {/* Shared Card Container - Pet Stats */}
                    <div className={`text-center p-4 rounded-xl ${
                      theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'
                    } shadow-xl backdrop-blur-sm w-full cursor-pointer flex flex-col`} style={{ boxSizing: 'border-box', minHeight: 'auto' }}>
                      <h3 className={`text-sm font-bold mb-2.5 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>Pet Stats</h3>
                      
                      {/* Combat Stats Grid */}
                      <div className="space-y-1.5 mb-2.5">
                        {/* HP */}
                        <div className="flex items-center gap-2 justify-center">
                          <Heart size={14} className="text-red-500 fill-red-500 flex-shrink-0" />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>HP:</span>
                          <span className={`text-xs font-bold text-red-500`}>{user.petStats.maxHealth}</span>
                        </div>
                        
                        {/* Attack */}
                        <div className="flex items-center gap-2 justify-center">
                          <Sword size={14} className="text-orange-500 flex-shrink-0" />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ATK:</span>
                          <span className={`text-xs font-bold text-orange-500`}>{user.petStats.attackDamage}</span>
                        </div>
                        
                        {/* Defense */}
                        <div className="flex items-center gap-2 justify-center">
                          <Shield size={14} className="text-blue-500 flex-shrink-0" />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>DEF:</span>
                          <span className={`text-xs font-bold text-blue-500`}>{user.petStats.defense}</span>
                        </div>
                      </div>
                      
                      {/* XP Progress */}
                      <div className="pt-2 border-t border-gray-600/30">
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>XP</span>
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                            {user.petXp}/{user.petMaxXp}
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-1.5 mb-1.5 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${user.petMaxXp > 0 ? Math.min((user.petXp / user.petMaxXp) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                        {/* Tap to show IV text */}
                        <div className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Tap to show IV
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back Side - Pet IV */}
                  <div className="flip-card-back">
                    {/* Shared Card Container - Pet IV */}
                    <div 
                      className={`p-4 rounded-xl ${
                        theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'
                      } shadow-xl backdrop-blur-sm w-full cursor-pointer flex flex-col`}
                      style={{ boxSizing: 'border-box', minHeight: 'auto' }}
                    >
                      <h3 className={`text-xs font-bold mb-3 text-center ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>Pet IV</h3>
                      
                      {/* IV Stats Grid */}
                      <div className="space-y-2.5 mb-3">
                        {/* HP IV */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 justify-start">
                            <Heart size={14} className="text-red-500 fill-red-500 flex-shrink-0" />
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>HP</span>
                          </div>
                          <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${user.petIV?.maxHealth || 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className={`text-[10px] text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {user.petIV?.maxHealth || 0}/100
                          </span>
                        </div>
                        
                        {/* ATK IV */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 justify-start">
                            <Sword size={14} className="text-orange-500 flex-shrink-0" />
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ATK</span>
                          </div>
                          <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${user.petIV?.attackDamage || 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className={`text-[10px] text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {user.petIV?.attackDamage || 0}/100
                          </span>
                        </div>
                        
                        {/* DEF IV */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 justify-start">
                            <Shield size={14} className="text-blue-500 flex-shrink-0" />
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>DEF</span>
                          </div>
                          <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${user.petIV?.defense || 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className={`text-[10px] text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {user.petIV?.defense || 0}/100
                          </span>
                        </div>
                      </div>
                      
                      <div className={`text-[10px] text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tap to flip back
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rank Card on Right - 50% of screen width - Clickable with Flip Animation */}
        <div className="w-1/2">
          <motion.div 
            className={`flip-card w-full ${rankCardFlipped ? 'flipped' : ''} ${!user.isHamster ? 'cursor-pointer' : ''}`}
            onClick={!user.isHamster ? onRankCardFlip : undefined}
            style={{ minHeight: '280px' }}
            variants={rankCardAttention}
            animate={
              !user.isHamster && canRankUp() && !rankCardFlipped
                ? 'active'
                : 'inactive'
            }
          >
            <div className="flip-card-inner" style={{ minHeight: '280px' }}>
              {/* Front of Card */}
              <motion.div 
                className={`flip-card-front rounded-xl p-4 shadow-md border flex flex-col w-full h-full justify-between ${
                user.isHamster 
                  ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50' 
                  : theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}
                variants={rankCardGlowPulse}
                animate={
                  !user.isHamster && canRankUp() && !rankCardFlipped
                    ? 'active'
                    : 'inactive'
                }
              >
                {/* Rank Icon/Badge */}
                <div className="flex justify-center -mt-10">
                  <img 
                    src={user.badge} 
                    alt="Rank Badge" 
                    className="w-56 h-56 sm:w-56 sm:h-56 object-contain" 
                  />
                </div>
                {/* Show Hamster Rank or Regular Rank */}
                {user.isHamster && user.hamsterRank ? (
                  <div className="text-center -mt-8">
                    <span className="text-xs font-medium text-yellow-500 uppercase tracking-wider">Hamster</span>
                    <h2 className="font-bold text-2xl sm:text-3xl text-yellow-400 truncate">{user.hamsterRank}</h2>
                  </div>
                ) : (
                  <h2 className={`font-bold text-2xl sm:text-3xl text-center truncate -mt-8 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.rankName}</h2>
                )}
                {/* Hide RP progress for Hamster users - they cannot rank up themselves */}
                {!user.isHamster && (
                  <div className="flex flex-col">
                    <div className={`w-full rounded-full h-3 mb-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300" 
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
                )}
              </motion.div>
              
              {/* Back of Card - Rank Objectives (or Hamster Info) */}
              <div className={`flip-card-back rounded-xl p-3 sm:p-4 shadow-md border flex flex-col w-full h-full ${
                user.isHamster 
                  ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50' 
                  : theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                {user.isHamster ? (
                  <>
                    {/* Hamster Rank Info */}
                    <h3 className="font-bold text-lg sm:text-xl text-center mb-2 sm:mb-3 text-yellow-400 truncate">
                      {user.hamsterRank || 'Hamster'}
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className={`text-sm text-center mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Hamster ranks are assigned by admins and cannot be upgraded manually.
                      </div>
                      <div className="text-4xl mb-2">🐹</div>
                      <div className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Thank you for being a Hamster!
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-gray-400 text-center">
                      Tap to flip back
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

