'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Skill } from '@/types';
import { getBadgeIconPath } from '@/utils/helpers';

interface BadgeOverlayProps {
  selectedSkill: Skill | null;
  setShowBadgeOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BadgeOverlay: React.FC<BadgeOverlayProps> = ({
  selectedSkill,
  setShowBadgeOverlay,
}) => {
  if (!selectedSkill) return null;

  // Define level names and colors: Bronze, Silver, Gold, Diamond (Unranked has no badge)
  const levelNames = ["Bronze", "Silver", "Gold", "Diamond"];
  const levelColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
  // Map skill level to badge index: level 1=Unranked (no badge), level 2=Bronze (index 0), etc.
  const badgeIndex = selectedSkill.currentLevel - 2; // -1 for Unranked, 0 for Bronze, etc.
  const currentLevelName = badgeIndex >= 0 ? levelNames[badgeIndex] : "Unranked";
  const currentLevelColor = badgeIndex >= 0 ? levelColors[badgeIndex] : "#9CA3AF";
  const isDiamond = selectedSkill.currentLevel === 5; // Diamond has no progression

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <button
            onClick={() => setShowBadgeOverlay(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-lg">{selectedSkill.name}</h2>
          <div></div>
        </div>

        {/* Badge Info */}
        <div className="p-4">
          <div className="text-center mb-6">
            <h3 className="font-bold text-xl mb-1">{selectedSkill.name}</h3>
            <p className="text-gray-600 text-sm">{selectedSkill.description}</p>
          </div>

          {/* Progress Circle - Hidden for Diamond level */}
          {!isDiamond && (
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                {/* Outer circle */}
                <div className="absolute inset-0 rounded-full border-8 border-blue-100"></div>
                {/* Inner circle with progress */}
                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedSkill.points.toLocaleString()}</div>
                      <div className="text-gray-600">/ {selectedSkill.maxPoints.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Level Badges - Only show Bronze, Silver, Gold, Diamond (no Unranked badge) */}
          <div className="flex justify-center gap-2 mb-6">
            {levelNames.map((levelName, index) => {
              // Badge index corresponds to skill level - 2 (Bronze = level 2 = index 0)
              const badgeLevel = index + 2; // Bronze is level 2, Silver is level 3, etc.
              const isUnlocked = badgeLevel <= selectedSkill.currentLevel;
              // Color mapping: Bronze=amber, Silver=gray, Gold=yellow, Diamond=blue
              const borderColorClass = index === 0 ? 'amber' : index === 1 ? 'gray' : index === 2 ? 'yellow' : 'blue';
              
              return (
                <div 
                  key={index} 
                  className={`w-12 h-12 flex items-center justify-center ${
                    !isUnlocked ? 'opacity-50' : ''
                  }`}
                >
                  <img 
                    src={getBadgeIconPath(selectedSkill.name, badgeLevel)} 
                    alt={levelName}
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            })}
          </div>

          {/* Rewards Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-full border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">REWARDS</span>
              <div className="w-full border-t border-gray-300"></div>
            </div>
            
            <div className="flex justify-center gap-6">
              {selectedSkill.rewards.map((reward, index) => (
                <div key={index} className="flex flex-col items-center">
                  {reward.type === "animal" ? (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                      <img src="/Asset/item/coin.png" alt="Coins" className="w-6 h-6 object-contain" />
                    </div>
                  )}
                  <div className="text-center text-sm font-medium">
                    {reward.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors">
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
};

