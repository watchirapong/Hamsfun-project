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
  theme?: 'light' | 'dark';
}

export const RewardAnimation: React.FC<RewardAnimationProps> = ({ animation, theme }) => {
  // Detect theme from document if not provided
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>(
    theme || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );

  // Watch for theme changes
  React.useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
      return;
    }

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [theme]);
  const [currentPosition, setCurrentPosition] = React.useState({ y: 0, scale: 0.6, opacity: 0, xOffset: 0 });
  const [isPopping, setIsPopping] = React.useState(false);
  const [shouldBurst, setShouldBurst] = React.useState(false);
  const [showParticles, setShowParticles] = React.useState(true);
  const animationDuration = 7000; // 5 seconds total for slower float
  const targetHeight = window.innerHeight * 0.8; // 80% of screen height
  const popStartTime = animationDuration * 0.8; // Start pop at 80% of animation
  const burstAnimationDuration = 600; // Duration of burst animation in ms

  // Handle click/tap to trigger burst
  const handleBubbleClick = () => {
    if (!isPopping && !shouldBurst) {
      setIsPopping(true);
      setShouldBurst(true);
    }
  };
  
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
      
      // Add subtle horizontal drift for natural floating movement
      // Gentle sine wave drift that increases slightly over time
      // Constrain drift to stay within main page boundaries (428px centered)
      const mainPageWidth = 428;
      const mainPageLeft = (window.innerWidth - mainPageWidth) / 2;
      const mainPageRight = mainPageLeft + mainPageWidth;
      const bubbleSize = 80;
      
      // Calculate drift with constraint
      const driftAmount = Math.sin(progress * Math.PI * 4) * (animation.driftX * 0.3);
      const xOffset = driftAmount * (1 + progress * 0.5); // Slight increase over time
      
      // Ensure bubble stays within main page boundaries during drift
      const currentX = animation.x + xOffset;
      const constrainedXOffset = Math.max(
        mainPageLeft - animation.x, // Don't go left of main page
        Math.min(xOffset, mainPageRight - bubbleSize - animation.x) // Don't go right of main page
      );
      
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
        // Floating phase (20-100%) - gentle scale variation for natural feel
        const floatProgress = (progress - 0.2) / 0.8;
        // Subtle breathing effect: slight scale variation
        const breathing = Math.sin(floatProgress * Math.PI * 6) * 0.03; // ±3% scale variation
        scale = 1 + (0.05 * floatProgress) + breathing; // Slight growth + breathing
        opacity = 1;
      }
      
      setCurrentPosition({ y, scale, opacity, xOffset: constrainedXOffset });
      
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
  // Add horizontal drift offset for natural floating movement
  const leftPosition = animation.x + (currentPosition.xOffset || 0);

  return (
    <div 
      className="fixed z-[9999]"
      style={{ 
        left: `${leftPosition}px`,
        bottom: `${bottomPosition}px`,
        transform: isPopping ? 'none' : `scale(${currentPosition.scale})`,
        opacity: isPopping ? 1 : currentPosition.opacity,
        transition: isPopping ? 'none' : 'none', // No transition, we update directly
        pointerEvents: isPopping ? 'none' : 'auto', // Allow clicks only when not popping
      }}
    >
      {/* Soap Bubble with soft edges, glossy highlights, rainbow tint, and gentle glow */}
      <div 
        className="relative cursor-pointer"
        onClick={handleBubbleClick}
        onTouchStart={handleBubbleClick}
      >
        {/* Outer gentle glow - soft rainbow tint (only when not bursting) - theme aware */}
        {!isPopping && (
          <>
            <div 
              className="absolute inset-0 rounded-full blur-2xl"
              style={{
                background: currentTheme === 'dark'
                  ? 'radial-gradient(circle, rgba(100, 150, 200, 0.5) 0%, rgba(150, 100, 150, 0.4) 30%, rgba(200, 200, 255, 0.3) 60%, transparent 100%)'
                  : 'radial-gradient(circle, rgba(135, 206, 250, 0.4) 0%, rgba(255, 182, 193, 0.3) 30%, rgba(255, 255, 255, 0.2) 60%, transparent 100%)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <div 
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                background: currentTheme === 'dark'
                  ? 'radial-gradient(circle, rgba(150, 180, 220, 0.4) 0%, rgba(180, 150, 200, 0.3) 50%, transparent 100%)'
                  : 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(200, 230, 255, 0.2) 50%, transparent 100%)',
              }}
            />
          </>
        )}
        
        {/* Soap bubble container with soft edges and glossy highlights */}
        <div 
          className="relative flex flex-col items-center justify-center gap-1 rounded-full px-5 py-4 shadow-2xl"
          onClick={(e) => {
            e.stopPropagation();
            handleBubbleClick();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleBubbleClick();
          }}
          style={{
            minWidth: '80px',
            minHeight: '80px',
            // Soft edges with backdrop blur and subtle rainbow tint - theme aware
            background: currentTheme === 'dark'
              ? `
                radial-gradient(circle at 30% 30%, rgba(180, 200, 230, 0.9) 0%, rgba(150, 180, 220, 0.8) 20%, rgba(120, 150, 200, 0.6) 50%, rgba(100, 130, 180, 0.4) 80%, rgba(150, 120, 180, 0.3) 100%),
                radial-gradient(circle at 70% 70%, rgba(150, 120, 180, 0.2) 0%, transparent 60%)
              `
              : `
                radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 20%, rgba(200, 230, 255, 0.6) 50%, rgba(135, 206, 250, 0.4) 80%, rgba(255, 182, 193, 0.3) 100%),
                radial-gradient(circle at 70% 70%, rgba(255, 182, 193, 0.2) 0%, transparent 60%)
              `,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            // Subtle rainbow tint border - theme aware
            border: currentTheme === 'dark' 
              ? '2px solid rgba(150, 180, 220, 0.6)'
              : '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            // Soft shadow for depth with rainbow tint - theme aware
            boxShadow: currentTheme === 'dark'
              ? `
                0 0 20px rgba(100, 150, 200, 0.5),
                0 0 40px rgba(150, 100, 180, 0.4),
                0 0 60px rgba(120, 140, 200, 0.3),
                inset 0 0 30px rgba(180, 200, 230, 0.4),
                inset -10px -10px 20px rgba(120, 150, 200, 0.3),
                inset 10px 10px 20px rgba(150, 120, 180, 0.2)
              `
              : `
                0 0 20px rgba(135, 206, 250, 0.4),
                0 0 40px rgba(255, 182, 193, 0.3),
                0 0 60px rgba(200, 230, 255, 0.2),
                inset 0 0 30px rgba(255, 255, 255, 0.5),
                inset -10px -10px 20px rgba(200, 230, 255, 0.3),
                inset 10px 10px 20px rgba(255, 182, 193, 0.2)
              `,
            transform: isPopping ? 'scale(0)' : 'scale(1)',
            opacity: isPopping ? 0 : 1,
            transition: isPopping ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out' : 'none',
          }}
        >
          {/* Glossy highlight effects - multiple highlights for realistic soap bubble look */}
          {!isPopping && (
            <>
              {/* Main highlight - top left */}
              <div 
                className="absolute top-3 left-4 w-6 h-6 rounded-full blur-sm"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                }}
              />
              {/* Secondary highlight - smaller, more subtle */}
              <div 
                className="absolute top-2 left-3 w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)',
                }}
              />
              {/* Additional subtle highlight - bottom right for depth - theme aware */}
              <div 
                className="absolute bottom-4 right-5 w-4 h-4 rounded-full blur-xs opacity-60"
                style={{
                  background: currentTheme === 'dark'
                    ? 'radial-gradient(circle, rgba(150, 180, 220, 0.8) 0%, transparent 100%)'
                    : 'radial-gradient(circle, rgba(200, 230, 255, 0.8) 0%, transparent 100%)',
                }}
              />
            </>
          )}
          
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {getIcon()}
          </div>
          
          {/* Label */}
          <div className="relative z-10 font-bold text-xs text-gray-800 whitespace-nowrap text-center drop-shadow-sm">
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

