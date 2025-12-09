'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAssetUrl } from '@/utils/helpers';

export interface QuestNotificationData {
  id: string;
  questIds: string[];
  count: number;
}

interface QuestNotificationProps {
  notification: QuestNotificationData;
  onRemove: (id: string) => void;
  onViewQuests?: () => void;
  theme?: 'light' | 'dark';
}

export const QuestNotification: React.FC<QuestNotificationProps> = ({ 
  notification, 
  onRemove,
  onViewQuests,
  theme = 'light',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animation after a tiny delay
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 500); // Match exit animation duration
  };

  const handleClick = () => {
    if (onViewQuests) {
      onViewQuests();
    }
    handleRemove();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10001] pointer-events-none flex items-center justify-center"
      onClick={handleClick}
      style={{
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      {/* Backdrop overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isVisible && !isExiting ? 'opacity-30' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
        }}
      />

      {/* Main notification container */}
      <div
        className={`relative transition-all duration-500 ${
          isVisible && !isExiting
            ? 'opacity-100 scale-100'
            : isExiting
            ? 'opacity-0 scale-95 translate-y-4'
            : 'opacity-0 scale-0'
        }`}
        style={{
          transform: isVisible && !isExiting
            ? 'scale(1) translateY(0)'
            : isExiting
            ? 'scale(0.95) translateY(16px)'
            : 'scale(0)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Particle effects container */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Glow rings */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`ring-${i}`}
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid rgba(255, 215, 0, ${0.3 - i * 0.1})`,
                borderRadius: '50%',
                width: `${100 + i * 30}%`,
                height: `${100 + i * 30}%`,
                left: `${-i * 15}%`,
                top: `${-i * 15}%`,
                animation: `glowPulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                filter: 'blur(4px)',
              }}
            />
          ))}

          {/* Sparkle particles */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const distance = 120;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            
            return (
              <div
                key={`sparkle-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 1) 0%, rgba(255, 193, 7, 0.8) 50%, transparent 100%)',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  animation: `sparkleFloat 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                  boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
                }}
              />
            );
          })}

          {/* Light rays */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <div
                key={`ray-${i}`}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '3px',
                  height: '80px',
                  background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.6) 0%, transparent 100%)',
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-40px)`,
                  transformOrigin: 'center bottom',
                  animation: `rayRotate 3s linear infinite`,
                  animationDelay: `${i * 0.2}s`,
                  filter: 'blur(2px)',
                }}
              />
            );
          })}
        </div>

        {/* Main image with bounce animation */}
        <div
          className="relative"
          style={{
            animation: isVisible && !isExiting ? 'imageBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        >
          <img
            src={getAssetUrl("/Asset/nuutor_1hai.png")}
            alt="New Quest"
            className="w-64 h-64 object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 40px rgba(255, 193, 7, 0.4))',
            }}
          />
        </div>

        {/* Quest count text */}
        <div
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
          style={{
            animation: isVisible && !isExiting ? 'textBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' : 'none',
          }}
        >
          <div
            className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
            style={{
              textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 193, 7, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3)',
              animation: 'textPulse 2s ease-in-out infinite',
            }}
          >
            {notification.count === 1
              ? 'You received 1 new Quest!'
              : `You received ${notification.count} new Quests!`}
          </div>
          
          {/* Subtle particles around text */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 360) / 6;
            const distance = 60;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            
            return (
              <div
                key={`text-particle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 1) 0%, transparent 100%)',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  animation: `particleFloat 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: '0 0 6px rgba(255, 215, 0, 0.8)',
                }}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

interface QuestNotificationContainerProps {
  notification: QuestNotificationData | null;
  onRemove: () => void;
  onViewQuests?: () => void;
  theme?: 'light' | 'dark';
}

export const QuestNotificationContainer: React.FC<QuestNotificationContainerProps> = ({
  notification,
  onRemove,
  onViewQuests,
  theme = 'light',
}) => {
  if (!notification) {
    return null;
  }

  return (
    <QuestNotification
      notification={notification}
      onRemove={onRemove}
      onViewQuests={onViewQuests}
      theme={theme}
    />
  );
};
