'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Crown, Edit2, Settings } from 'lucide-react';
import { getAssetUrl } from '@/utils/helpers';

interface HeaderProps {
  description: string;
  isEditingDescription: boolean;
  coins: number;
  theme: 'light' | 'dark';
  onDescriptionChange: (value: string) => void;
  onDescriptionEdit: () => void;
  onDescriptionBlur: () => void;
  onSettingsClick: () => void;
  coinDisplayRef?: React.RefObject<HTMLDivElement>;
}

export const Header: React.FC<HeaderProps> = ({
  description,
  isEditingDescription,
  coins,
  theme,
  onDescriptionChange,
  onDescriptionEdit,
  onDescriptionBlur,
  onSettingsClick,
  coinDisplayRef,
}) => {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousCoinsRef = useRef(coins);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (coins !== previousCoinsRef.current) {
      setIsAnimating(true);
      
      // Animate from previous value to new value
      const startValue = previousCoinsRef.current;
      const endValue = coins;
      const difference = endValue - startValue;
      const duration = 1000; // 1 second for smooth counting
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        const currentValue = Math.round(startValue + difference * easedProgress);
        setDisplayCoins(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayCoins(endValue);
          setIsAnimating(false);
          previousCoinsRef.current = endValue;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      previousCoinsRef.current = coins;
    }
  }, [coins]);

  return (
    <div className={`shadow-sm p-4 transition-colors ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isEditingDescription ? (
            <input
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onBlur={onDescriptionBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onDescriptionBlur();
                }
              }}
              className={`text-sm font-medium border-b-2 border-blue-500 outline-none focus:border-blue-600 px-2 py-1 rounded shadow-sm min-w-[200px] ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
              autoFocus
            />
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity group"
              onClick={onDescriptionEdit}
            >
              <span className={`text-sm font-medium px-2 py-1 rounded shadow-sm ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>{description}</span>
              <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div ref={coinDisplayRef} className="flex items-center gap-1">
            <img src={getAssetUrl("/Asset/item/coin.png")} alt="Coins" className="w-6 h-6 object-contain" />
            <span className={`font-bold px-4 py-2 rounded shadow-sm relative overflow-hidden inline-block ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
              {/* Subtle golden glow while animating */}
              {isAnimating && (
                <span
                  className="absolute inset-0 rounded"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(255, 193, 7, 0.1) 50%, transparent 100%)',
                    animation: 'goldenGlowPulse 0.6s ease-out forwards',
                    pointerEvents: 'none',
                  }}
                />
              )}
              
              {/* Old number sliding up, fading out, and shrinking */}
              {isAnimating && previousCoinsRef.current !== displayCoins && (
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    animation: 'slideUpFadeOutShrink 0.4s ease-out forwards',
                  }}
                >
                  {previousCoinsRef.current}
                </span>
              )}
              
              {/* New number appearing with scale-up and fade-in */}
              <span
                className={isAnimating ? 'animate-scaleUpFadeIn' : ''}
                style={{
                  display: 'inline-block',
                }}
              >
                {displayCoins}
              </span>
            </span>
          </div>
          <button 
            onClick={onSettingsClick}
            className={`p-2 rounded-full shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

