'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getAssetUrl } from '@/utils/helpers';

export interface CoinFlightInstance {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
}

interface CoinFlightAnimationProps {
  coins: CoinFlightInstance[];
  onComplete: (coinId: string) => void;
  theme?: 'light' | 'dark';
}

export const CoinFlightAnimation: React.FC<CoinFlightAnimationProps> = ({
  coins,
  onComplete,
  theme = 'light',
}) => {
  const [coinPositions, setCoinPositions] = useState<Map<string, {
    x: number;
    y: number;
    scale: number;
    opacity: number;
    rotation: number;
    prevX: number;
    prevY: number;
  }>>(new Map());

  const animationFrameRef = useRef<number>();
  const coinRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Easing function for smooth flight
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useEffect(() => {
    if (coins.length === 0) {
      setCoinPositions(new Map());
      return;
    }

    let isRunning = true;
    const duration = 800; // 0.8 seconds for faster, more dynamic flight

    const updatePositions = () => {
      if (!isRunning) return;

      const now = Date.now();
      const newPositions = new Map<string, {
        x: number;
        y: number;
        scale: number;
        opacity: number;
        rotation: number;
        prevX: number;
        prevY: number;
      }>();

      let hasActiveCoins = false;

      coins.forEach((coin) => {
        const elapsed = now - coin.startTime;
        if (elapsed < 0) {
          // Coin hasn't started yet
          hasActiveCoins = true;
          return;
        }

        const progress = Math.min(elapsed / duration, 1);
        // Use easeOutQuad for faster, more dynamic motion
        const easeOutQuad = (t: number) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);

        // Calculate curved path using quadratic bezier curve
        // Control point creates an arc - higher up for more curve
        const controlX = (coin.startX + coin.targetX) / 2;
        const controlY = Math.min(coin.startY, coin.targetY) - Math.abs(coin.targetY - coin.startY) * 0.4; // Arc upward
        
        // Quadratic bezier curve calculation
        const t = easedProgress;
        const x = (1 - t) * (1 - t) * coin.startX + 2 * (1 - t) * t * controlX + t * t * coin.targetX;
        const y = (1 - t) * (1 - t) * coin.startY + 2 * (1 - t) * t * controlY + t * t * coin.targetY;

        // Scale: start small, grow quickly, maintain size, shrink at end
        let scale = 1;
        if (progress < 0.15) {
          scale = 0.4 + (progress / 0.15) * 0.6; // 0.4 to 1.0 (faster growth)
        } else if (progress < 0.85) {
          scale = 1;
        } else {
          scale = 1 - ((progress - 0.85) / 0.15) * 0.4; // 1.0 to 0.6 (shrink more)
        }

        // Opacity: fade in quickly, stay visible, fade out at end
        let opacity = 1;
        if (progress < 0.1) {
          opacity = progress / 0.1;
        } else if (progress > 0.9) {
          opacity = 1 - ((progress - 0.9) / 0.1);
        }

        // Rotation: faster spin for dynamic feel
        const rotation = progress * 1080; // 3 full rotations for more dynamic effect

        // Get previous position for trail effect
        const prevPosition = previousPositionsRef.current.get(coin.id);
        const prevX = prevPosition?.x ?? x;
        const prevY = prevPosition?.y ?? y;

        newPositions.set(coin.id, { x, y, scale, opacity, rotation, prevX, prevY });
        
        // Update previous positions for next frame
        previousPositionsRef.current.set(coin.id, { x, y });

        // Remove coin when animation completes
        if (progress >= 1) {
          setTimeout(() => onComplete(coin.id), 50);
        } else {
          hasActiveCoins = true;
        }
      });

      // Update positions atomically
      setCoinPositions(newPositions);

      if (hasActiveCoins && isRunning) {
        animationFrameRef.current = requestAnimationFrame(updatePositions);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updatePositions);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [coins, onComplete]);

  if (coins.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000]">
      {coins.map((coin) => {
        const position = coinPositions.get(coin.id);
        if (!position) return null;

        return (
          <div
            key={coin.id}
            ref={(el) => {
              if (el) coinRefs.current.set(coin.id, el);
            }}
            className="absolute"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
              opacity: position.opacity,
              transition: 'none',
            }}
          >
            {/* Golden light beam trail - curved streak effect */}
            {position.prevX !== position.x || position.prevY !== position.y ? (() => {
              const dx = position.x - position.prevX;
              const dy = position.y - position.prevY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              
              return (
                <div
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${Math.max(distance, 20)}px`,
                    height: '6px',
                    transformOrigin: 'left center',
                    transform: `translate(-50%, -50%) translate(${-distance / 2}px, 0) rotate(${angle}deg)`,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.7) 10%, rgba(255, 193, 7, 0.8) 30%, rgba(255, 152, 0, 0.6) 70%, transparent 100%)',
                    filter: 'blur(4px)',
                    opacity: position.opacity * 0.8,
                    zIndex: -1,
                    borderRadius: '3px',
                  }}
                />
              );
            })() : null}

            {/* Softer golden glow effect */}
            <div
              className="absolute inset-0 rounded-full blur-lg"
              style={{
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.35) 0%, rgba(255, 193, 7, 0.25) 30%, rgba(255, 152, 0, 0.15) 60%, transparent 100%)',
                width: '70px',
                height: '70px',
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
              }}
            />
            
            {/* Subtle light trail effect */}
            <div
              className="absolute"
              style={{
                width: '50px',
                height: '50px',
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
                background: 'radial-gradient(ellipse, rgba(255, 215, 0, 0.3) 0%, rgba(255, 193, 7, 0.2) 50%, transparent 100%)',
                filter: 'blur(6px)',
              }}
            />

            {/* Coin icon */}
            <div className="relative z-10">
              <img
                src={getAssetUrl("/Asset/item/coin.png")}
                alt="Coin"
                className="w-12 h-12 object-contain drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))',
                }}
              />
            </div>

            {/* Subtle sparkle effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 215, 0, 0.3) 40%, transparent 70%)',
                width: '35px',
                height: '35px',
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

