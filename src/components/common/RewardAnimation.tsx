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
  forceBurst?: boolean; // Flag to force immediate burst (e.g., on panel close)
}

interface RewardAnimationProps {
  animation: RewardAnimationInstance;
}

export const RewardAnimation: React.FC<RewardAnimationProps> = ({ animation }) => {
  const [currentPosition, setCurrentPosition] = React.useState({ y: 0, scale: 0.6, opacity: 0 });
  const [isPopping, setIsPopping] = React.useState(false);
  const [shouldBurst, setShouldBurst] = React.useState(false);
  const [showParticles, setShowParticles] = React.useState(true);
  const animationDuration = 7000; // 5 seconds total for slower float
  const targetHeight = window.innerHeight * 0.8; // 80% of screen height
  const popStartTime = animationDuration * 0.8; // Start pop at 80% of animation
  const burstAnimationDuration = 600; // Duration of burst animation in ms
  
  // Easing function for smooth float
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };
  
  React.useEffect(() => {
    // Check if force burst is requested (e.g., panel closing)
    if (animation.forceBurst && !isPopping && !shouldBurst) {
      setIsPopping(true);
      setShouldBurst(true);
      return;
    }

    const updatePosition = () => {
      const elapsed = Date.now() - animation.startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      if (progress >= 1 || isPopping) {
        // Animation complete or bursting - maintain final position
        if (!isPopping && !shouldBurst && progress >= popStartTime / animationDuration) {
          setIsPopping(true);
          setShouldBurst(true);
        }
        return;
      }
      
      // Calculate position based on progress with easing
      const easedProgress = easeOutCubic(progress);
      const y = -targetHeight * easedProgress;
      
      // Scale and opacity based on progress
      let scale = 0.6;
      let opacity = 0;
      
      if (progress < 0.1) {
        // Initial appearance (0-10%)
        const initialProgress = progress / 0.1;
        scale = 0.6 + (0.4 * initialProgress);
        opacity = initialProgress * 0.7;
      } else if (progress < 0.2) {
        // Full appearance (10-20%)
        const appearanceProgress = (progress - 0.1) / 0.1;
        scale = 1;
        opacity = 0.7 + (0.3 * appearanceProgress);
      } else {
        // Floating phase (20-100%)
        scale = 1 + (0.1 * (progress - 0.2) / 0.8);
        opacity = 1;
      }
      
      setCurrentPosition({ y, scale, opacity });
      
      // Trigger burst when bubble reaches near the top (when absolute y position is close to targetHeight)
      // Check if the bubble has moved up by at least 75% of targetHeight
      const currentHeight = Math.abs(y);
      const burstThreshold = targetHeight * 0.75; // Burst when 75% of the way to top
      
      if (currentHeight >= burstThreshold && !isPopping && !shouldBurst) {
        setIsPopping(true);
        setShouldBurst(true);
      }
    };
    
    updatePosition();
    const interval = setInterval(updatePosition, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [animation.startTime, animation.forceBurst, isPopping, shouldBurst, popStartTime, targetHeight]);

  // Clean up particles after burst animation completes
  React.useEffect(() => {
    if (isPopping && shouldBurst) {
      const cleanupTimer = setTimeout(() => {
        setShowParticles(false);
      }, burstAnimationDuration);

      return () => clearTimeout(cleanupTimer);
    }
  }, [isPopping, shouldBurst, burstAnimationDuration]);
  
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

  // Calculate bottom position - animation.y is spawn position from top of screen
  // Convert to bottom positioning: bottom = window.innerHeight - y (from top)
  // To move upward, we increase bottom value by adding the absolute value of currentPosition.y
  const bottomPosition = (window.innerHeight - animation.y) + Math.abs(currentPosition.y);

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{ 
        left: `${animation.x}px`,
        bottom: `${bottomPosition}px`,
        transform: isPopping ? 'none' : `scale(${currentPosition.scale})`,
        opacity: isPopping ? 1 : currentPosition.opacity,
        transition: isPopping ? 'none' : 'none', // No transition, we update directly
      }}
    >
      {/* Floating Orb Bubble */}
      <div className="relative">
        {/* Outer glow - pulsing effect (only when not bursting) */}
        {!isPopping && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-xl animate-pulse"></div>
        )}
        
        {/* Bubble orb container */}
        <div 
          className="relative flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-full px-5 py-4 shadow-2xl border-2 border-white/60"
          style={{
            minWidth: '80px',
            minHeight: '80px',
            transform: isPopping ? 'scale(0)' : 'scale(1)',
            opacity: isPopping ? 0 : 1,
            transition: isPopping ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out' : 'none',
          }}
        >
          {/* Bubble shine/highlight effect */}
          {!isPopping && (
            <>
              <div className="absolute top-2 left-3 w-4 h-4 bg-white/80 rounded-full blur-sm"></div>
              <div className="absolute top-1 left-2 w-2 h-2 bg-white rounded-full"></div>
            </>
          )}
          
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {getIcon()}
          </div>
          
          {/* Label */}
          <div className="relative z-10 font-bold text-xs text-gray-800 whitespace-nowrap text-center">
            {getLabel()}
          </div>
        </div>

        {/* Bubble Pop Particles - Soft Circular Expansion */}
        {isPopping && (
          <>
            {/* Central soft glow pulse */}
            {showParticles && (
              <>
                <style>{`
                  @keyframes glowPulse-${animation.id} {
                    0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
                  }
                `}</style>
                <div 
                  className="absolute rounded-full bg-gradient-to-br from-blue-200/50 via-cyan-200/40 to-white/50 blur-3xl"
                  style={{
                    width: '120px',
                    height: '120px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: `glowPulse-${animation.id} 500ms ease-out forwards`,
                  }}
                />
              </>
            )}
            
            {/* Main bubble particles - soft circular expansion */}
            {showParticles && [...Array(6)].map((_, i) => {
              const angle = (i * 360) / 6;
              const radian = (angle * Math.PI) / 180;
              const baseDistance = 50;
              const finalDistance = baseDistance * 2.5;
              const sizeVariation = 12 + (i % 3) * 4; // Vary sizes: 12px, 16px, 20px
              const x = Math.cos(radian) * finalDistance;
              const y = Math.sin(radian) * finalDistance;
              
              // Create unique keyframe animation for each particle using animation.id
              const animationName = `bubbleParticleExpand-${animation.id}-${i}`;
              
              return (
                <React.Fragment key={i}>
                  <style>{`
                    @keyframes ${animationName} {
                      0% {
                        transform: translate(-50%, -50%) translate(0, 0) scale(0);
                        opacity: 1;
                      }
                      20% {
                        opacity: 0.9;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.2);
                      }
                      50% {
                        opacity: 0.7;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.8);
                      }
                      100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.3);
                      }
                    }
                  `}</style>
                  <div
                    className="absolute rounded-full bg-gradient-to-br from-blue-100/90 via-cyan-100/80 to-white/90 blur-md"
                    style={{
                      width: `${sizeVariation}px`,
                      height: `${sizeVariation}px`,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%) translate(0, 0) scale(0)',
                      opacity: 0,
                      animation: `${animationName} 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                      animationDelay: `${i * 30}ms`,
                      boxShadow: '0 0 15px rgba(135, 206, 250, 0.6), 0 0 30px rgba(135, 206, 250, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.8)',
                    }}
                  />
                </React.Fragment>
              );
            })}
            
            {/* Secondary smaller bubbles for detail */}
            {showParticles && [...Array(10)].map((_, i) => {
              const angle = (i * 360) / 10 + 18; // Offset by 18 degrees
              const radian = (angle * Math.PI) / 180;
              const baseDistance = 35;
              const finalDistance = baseDistance * 2.5;
              const size = 6 + (i % 2) * 2; // 6px or 8px
              const x = Math.cos(radian) * finalDistance;
              const y = Math.sin(radian) * finalDistance;
              const animationName = `bubbleParticleExpand-small-${animation.id}-${i}`;
              
              return (
                <React.Fragment key={`small-${i}`}>
                  <style>{`
                    @keyframes ${animationName} {
                      0% {
                        transform: translate(-50%, -50%) translate(0, 0) scale(0);
                        opacity: 1;
                      }
                      20% {
                        opacity: 0.9;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.2);
                      }
                      50% {
                        opacity: 0.7;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.8);
                      }
                      100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.3);
                      }
                    }
                  `}</style>
                  <div
                    className="absolute rounded-full bg-white/70 blur-sm"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%) translate(0, 0) scale(0)',
                      opacity: 0,
                      animation: `${animationName} 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                      animationDelay: `${i * 20}ms`,
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.9), inset 0 0 4px rgba(255, 255, 255, 1)',
                    }}
                  />
                </React.Fragment>
              );
            })}
            
            {/* Tiny sparkle particles */}
            {showParticles && [...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8 + 22.5;
              const radian = (angle * Math.PI) / 180;
              const baseDistance = 25;
              const finalDistance = baseDistance * 2.5;
              const x = Math.cos(radian) * finalDistance;
              const y = Math.sin(radian) * finalDistance;
              const animationName = `bubbleParticleExpand-sparkle-${animation.id}-${i}`;
              
              return (
                <React.Fragment key={`sparkle-${i}`}>
                  <style>{`
                    @keyframes ${animationName} {
                      0% {
                        transform: translate(-50%, -50%) translate(0, 0) scale(0);
                        opacity: 1;
                      }
                      20% {
                        opacity: 0.9;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(1.2);
                      }
                      50% {
                        opacity: 0.7;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.8);
                      }
                      100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.3);
                      }
                    }
                  `}</style>
                  <div
                    className="absolute rounded-full bg-white blur-xs"
                    style={{
                      width: '3px',
                      height: '3px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%) translate(0, 0) scale(0)',
                      opacity: 0,
                      animation: `${animationName} 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                      animationDelay: `${i * 15}ms`,
                      boxShadow: '0 0 6px rgba(255, 255, 255, 1)',
                    }}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

