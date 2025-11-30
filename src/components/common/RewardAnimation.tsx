'use client';

import React from 'react';
import { Coins, Star, Trophy, Crown, Package, TrendingUp } from 'lucide-react';

export interface RewardAnimationInstance {
  id: number | string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard';
  value: number | string;
  x: number;
  y: number;
  driftX: number;
  startTime: number;
  itemName?: string;
  itemIcon?: string;
}

interface RewardAnimationProps {
  animation: RewardAnimationInstance;
  isPanelClosing?: boolean;
}

export const RewardAnimation: React.FC<RewardAnimationProps> = ({ animation, isPanelClosing = false }) => {
  // Calculate elapsed time to prevent animation restart on re-render
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [isPopping, setIsPopping] = React.useState(false);
  const animationDuration = 4000; // 4 seconds total
  const popStartTime = animationDuration * 0.85; // Start pop at 85% of animation
  
  React.useEffect(() => {
    const updateElapsed = () => {
      const elapsed = Date.now() - animation.startTime;
      setElapsedTime(Math.min(elapsed, animationDuration));
      
      // Trigger pop animation near the top or if panel is closing
      if ((elapsed >= popStartTime || isPanelClosing) && !isPopping) {
        setIsPopping(true);
      }
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [animation.startTime, isPopping, popStartTime, isPanelClosing]);
  
  // Calculate animation delay (negative to skip to current point)
  const animationDelay = elapsedTime > 0 ? -elapsedTime : 0;
  
  const getIcon = () => {
    switch (animation.type) {
      case 'coins':
        return <Coins className="w-6 h-6 text-yellow-600" />;
      case 'exp':
        return <Star className="w-6 h-6 text-blue-600" />;
      case 'rank':
        return <Trophy className="w-6 h-6 text-purple-600" />;
      case 'skill':
        return <Crown className="w-6 h-6 text-green-600" />;
      case 'animal':
        return <span className="text-2xl">🐾</span>;
      case 'item':
        if (animation.itemIcon) {
          return (
            <img 
              src={animation.itemIcon} 
              alt={animation.itemName || 'Item'} 
              className="w-6 h-6 object-contain"
            />
          );
        }
        return <Package className="w-6 h-6 text-indigo-600" />;
      case 'leaderboard':
        return <TrendingUp className="w-6 h-6 text-orange-600" />;
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
        return animation.itemName || `+${animation.value}`;
      case 'leaderboard':
        return `+${animation.value} LP`;
      default:
        return '';
    }
  };

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{ 
        left: `${animation.x}px`,
        bottom: `${window.innerHeight - animation.y}px`, // Use bottom positioning for upward floating
        animation: isPopping 
          ? `bubblePop ${animationDuration - popStartTime}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
          : `bubbleFloat ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
        animationDelay: `${animationDelay}ms`,
        '--drift-x': `${animation.driftX}px`
      } as React.CSSProperties & { '--drift-x': string }}
    >
      {/* Floating Orb Bubble */}
      <div className="relative">
        {/* Outer glow - pulsing effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-xl animate-pulse"></div>
        
        {/* Bubble orb container */}
        <div className={`relative flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-full px-5 py-4 shadow-2xl border-2 border-white/60 ${
          isPopping ? 'animate-bubblePop' : ''
        }`}
        style={{
          minWidth: '80px',
          minHeight: '80px',
        }}>
          {/* Bubble shine/highlight effect */}
          <div className="absolute top-2 left-3 w-4 h-4 bg-white/80 rounded-full blur-sm"></div>
          <div className="absolute top-1 left-2 w-2 h-2 bg-white rounded-full"></div>
          
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {getIcon()}
          </div>
          
          {/* Label */}
          <div className="relative z-10 font-bold text-xs text-gray-800 whitespace-nowrap text-center">
            {getLabel()}
          </div>
        </div>
      </div>
    </div>
  );
};

