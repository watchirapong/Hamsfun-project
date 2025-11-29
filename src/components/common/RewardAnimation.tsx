'use client';

import React from 'react';
import { Coins, Star, Trophy, Crown } from 'lucide-react';

export interface RewardAnimationInstance {
  id: number | string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item';
  value: number | string;
  itemName?: string;
  itemImage?: string;
  quantity?: number;
  x: number;
  y: number;
  driftX: number;
  startTime: number;
}

interface RewardAnimationProps {
  animation: RewardAnimationInstance;
}

export const RewardAnimation: React.FC<RewardAnimationProps> = ({ animation }) => {
  // Calculate elapsed time to prevent animation restart on re-render
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const animationDuration = 5000; // 5 seconds
  
  React.useEffect(() => {
    const updateElapsed = () => {
      const elapsed = Date.now() - animation.startTime;
      setElapsedTime(Math.min(elapsed, animationDuration));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [animation.startTime]);
  
  // Calculate animation delay (negative to skip to current point)
  const animationDelay = elapsedTime > 0 ? -elapsedTime : 0;
  
  const getIcon = () => {
    switch (animation.type) {
      case 'coins':
        return <Coins className="w-5 h-5 text-yellow-600" />;
      case 'exp':
        return <Star className="w-5 h-5 text-blue-600" />;
      case 'rank':
        return <Trophy className="w-5 h-5 text-purple-600" />;
      case 'skill':
        return <Crown className="w-5 h-5 text-green-600" />;
      case 'animal':
        return <span className="text-xl">🐾</span>;
      case 'item':
        // Show item image if available
        if (animation.itemImage) {
          return <img src={animation.itemImage} alt={animation.itemName || 'Item'} className="w-8 h-8 object-contain" />;
        }
        return <span className="text-xl">🎁</span>;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (animation.type) {
      case 'coins':
        return `+${animation.value}`;
      case 'exp':
        return `+${animation.value} XP`;
      case 'rank':
        return `+${animation.value} RP`;
      case 'skill':
        return `+${animation.value}`;
      case 'animal':
        return `${animation.value}`;
      case 'item':
        // Show item name and quantity
        const qty = animation.quantity || 1;
        return `${animation.itemName || 'Item'} x${qty}`;
      default:
        return '';
    }
  };

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{ 
        left: `${animation.x}px`,
        top: `${animation.y}px`,
        animation: `bubbleFloat ${animationDuration}ms ease-in-out forwards`,
        animationDelay: `${animationDelay}ms`,
        '--drift-x': `${animation.driftX}px`
      } as React.CSSProperties & { '--drift-x': string }}
    >
      {/* Bubble effect */}
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse"></div>
        
        {/* Bubble container */}
        <div className="relative flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-4 py-3 shadow-lg border border-white/50">
          {/* Bubble shine effect */}
          <div className="absolute top-1 left-2 w-3 h-3 bg-white/60 rounded-full blur-sm"></div>
          
          {/* Icon */}
          <div className="relative z-10">
            {getIcon()}
          </div>
          
          {/* Label */}
          <div className="relative z-10 font-bold text-sm text-gray-800 whitespace-nowrap">
            {getLabel()}
          </div>
        </div>
      </div>
    </div>
  );
};

