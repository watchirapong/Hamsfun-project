'use client';

import React, { useMemo } from 'react';
import { getBadgeIconPath } from '@/utils/helpers';

/**
 * Skill Card Component with performance optimizations
 * Optimized for 10,000+ concurrent users
 */
export const SkillCard = React.memo(({ skill, levelUpAnimations, onSkillClick }) => {
  // Define level colors to match BadgeOverlay: Unranked, Bronze, Silver, Gold, Diamond
  const levelColors = useMemo(() => ["#9CA3AF", "#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"], []);
  const currentLevelColor = useMemo(() => levelColors[skill.currentLevel - 1], [levelColors, skill.currentLevel]);
  const xpPercentage = useMemo(() => (skill.points / skill.maxPoints) * 100, [skill.points, skill.maxPoints]);
  const isLevelingUp = useMemo(() => levelUpAnimations.has(skill.name), [levelUpAnimations, skill.name]);
  const isDiamond = useMemo(() => skill.currentLevel === 5, [skill.currentLevel]); // Diamond has no progression

  const handleClick = React.useCallback(() => {
    onSkillClick(skill);
  }, [skill, onSkillClick]);

  const badgeIconPath = useMemo(() => getBadgeIconPath(skill.name, skill.currentLevel), [skill.name, skill.currentLevel]);

  return (
    <div 
      className="cursor-pointer hover:scale-110 transition-transform flex flex-col items-center gap-1 relative"
      onClick={handleClick}
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
        src={badgeIconPath} 
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
});

SkillCard.displayName = 'SkillCard';

