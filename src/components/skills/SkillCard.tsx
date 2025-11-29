'use client';

import React from 'react';
import { Skill } from '@/types';
import { getBadgeIconPath } from '@/utils/helpers';

interface SkillCardProps {
  skill: Skill;
  levelUpAnimations: Set<string>;
  onSkillClick: (skill: Skill) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, levelUpAnimations, onSkillClick }) => {
  // Define level colors to match BadgeOverlay: Unranked, Bronze, Silver, Gold, Diamond
  const levelColors = ["#9CA3AF", "#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
  const currentLevelColor = levelColors[skill.currentLevel - 1];
  const xpPercentage = (skill.points / skill.maxPoints) * 100;
  const isLevelingUp = levelUpAnimations.has(skill.name);
  const isDiamond = skill.currentLevel === 5; // Diamond has no progression

  return (
    <div 
      className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center gap-1 relative"
      onClick={() => onSkillClick(skill)}
    >
      {/* Level-up glow effect */}
      {isLevelingUp && (
        <div className="absolute inset-0 rounded-full animate-ping"
          style={{ 
            backgroundColor: currentLevelColor,
            opacity: 0.3,
            zIndex: -1
          }}
        />
      )}
      
      {/* Badge image - no borders, just the image */}
      <img 
        src={getBadgeIconPath(skill.name, skill.currentLevel)} 
        alt={`${skill.name} - Level ${skill.currentLevel}`}
        className={`w-16 h-16 object-contain transition-all duration-500 ${
          isLevelingUp ? 'scale-125 shadow-lg' : ''
        }`}
        style={{ 
          boxShadow: isLevelingUp ? `0 0 20px ${currentLevelColor}` : 'none'
        }}
      />
      
      {/* XP Progress Bar - Hidden for Diamond level */}
      {!isDiamond && (
        <div className="w-3/4 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ 
              width: `${Math.min(100, xpPercentage)}%`,
              boxShadow: isLevelingUp ? '0 0 10px #10b981' : 'none'
            }}
          />
        </div>
      )}
    </div>
  );
};

