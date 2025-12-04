'use client';

import React, { useEffect, useState } from 'react';
import { getRankColor, getRankScriptChar } from '@/utils/rankHelpers';

interface RankBadgeProps {
  rank: 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  theme: 'light' | 'dark';
  shouldAnimate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RankBadge: React.FC<RankBadgeProps> = ({ 
  rank, 
  theme, 
  shouldAnimate = false,
  size = 'md'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const rankColors = getRankColor(rank, theme);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  useEffect(() => {
    if (shouldAnimate) {
      setIsAnimating(true);
      // Stop animation after 2 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full font-bold transition-all ${
          isAnimating ? 'rank-badge-animate' : ''
        }`}
        style={{
          color: rankColors.color,
          backgroundColor: rankColors.bgColor,
          textShadow: isAnimating 
            ? `0 0 20px ${rankColors.glowColor}, 0 0 40px ${rankColors.glowColor}` 
            : `0 0 8px ${rankColors.glowColor}`,
          border: `2px solid ${rankColors.color}`,
          boxShadow: isAnimating 
            ? `0 0 20px ${rankColors.glowColor}, 0 0 40px ${rankColors.glowColor}` 
            : `0 0 4px ${rankColors.glowColor}`,
        }}
      >
        {getRankScriptChar(rank)}
      </div>
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: rankColors.color,
                animation: `rankUpParticles 1s ease-out ${i * 0.1}s infinite`,
                transform: `rotate(${i * 60}deg) translateY(-15px)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

