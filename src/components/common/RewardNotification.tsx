'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Star, Trophy, Crown, Package, TrendingUp, X, Heart } from 'lucide-react';

export interface RewardNotificationData {
  id: string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard' | 'petExp';
  value: number | string;
  skillName?: string;
  itemName?: string;
  itemIcon?: string;
}

interface RewardNotificationProps {
  notification: RewardNotificationData;
  onRemove: (id: string) => void;
  index: number;
}

export const RewardNotification: React.FC<RewardNotificationProps> = ({ 
  notification, 
  onRemove, 
  index 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-remove after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'coins':
        return <Coins className="w-6 h-6 text-yellow-500 dark:text-yellow-400 transition-colors" />;
      case 'exp':
        return <Star className="w-6 h-6 text-blue-500 dark:text-blue-400 transition-colors" />;
      case 'rank':
        return <Trophy className="w-6 h-6 text-purple-500 dark:text-purple-400 transition-colors" />;
      case 'skill':
        return <Crown className="w-6 h-6 text-green-500 dark:text-green-400 transition-colors" />;
      case 'animal':
        return <span className="text-2xl">🐾</span>;
      case 'item':
        if (notification.itemIcon) {
          return (
            <img 
              src={notification.itemIcon} 
              alt={notification.itemName || 'Item'} 
              className="w-6 h-6 object-contain"
            />
          );
        }
        return <Package className="w-6 h-6 text-indigo-500 dark:text-indigo-400 transition-colors" />;
      case 'leaderboard':
        return <TrendingUp className="w-6 h-6 text-orange-500 dark:text-orange-400 transition-colors" />;
      case 'petExp':
        return <Heart className="w-6 h-6 text-pink-500 dark:text-pink-400 transition-colors" />;
      default:
        return null;
    }
  };

  const getFormattedValue = () => {
    if (typeof notification.value === 'number') {
      return notification.value.toLocaleString();
    }
    return notification.value;
  };

  const getLabel = () => {
    switch (notification.type) {
      case 'coins':
        return `+${getFormattedValue()} Coins`;
      case 'exp':
        return `+${getFormattedValue()} XP`;
      case 'rank':
        return `+${getFormattedValue()} Rank Points`;
      case 'skill':
        return `+${getFormattedValue()} ${notification.skillName || 'Skill'} Points`;
      case 'animal':
        return `${notification.value}`;
      case 'item':
        return `+${getFormattedValue()}x ${notification.itemName || 'Item'}`;
      case 'leaderboard':
        return `+${getFormattedValue()} Leaderboard Points`;
      case 'petExp':
        return `+${getFormattedValue()} Pet EXP`;
      default:
        return '';
    }
  };

  const getRewardName = () => {
    switch (notification.type) {
      case 'coins':
        return 'Coins';
      case 'exp':
        return 'Experience';
      case 'rank':
        return 'Rank Points';
      case 'skill':
        return notification.skillName || 'Skill Points';
      case 'animal':
        return 'Animal';
      case 'item':
        return notification.itemName || 'Item';
      case 'leaderboard':
        return 'Leaderboard Points';
      case 'petExp':
        return 'Pet EXP';
      default:
        return 'Reward';
    }
  };

  const getRewardAmount = () => {
    if (typeof notification.value === 'number') {
      return `+${notification.value.toLocaleString()}`;
    }
    return `+${notification.value}`;
  };

  return (
    <div
      className={`fixed top-4 z-[10000] pointer-events-auto transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{
        // Position at top-right of main page (max-w-[428px] centered)
        // Calculate: 50% (center) + 214px (half of 428px) - 2rem (moved left from edge)
        right: 'calc(50% - 214px + 2rem)',
        maxWidth: '428px',
        transform: isVisible && !isExiting 
          ? `translate3d(0, ${index * 70}px, 0)` 
          : 'translate3d(100%, 0, 0)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, opacity',
      }}
    >
      {/* No background box - only icon and text visible */}
      <div className="flex items-center gap-2">
        {/* Reward name on the left */}
        <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300 whitespace-nowrap drop-shadow-sm dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          {getRewardName()}
        </span>

        {/* Circular icon on the right - closer to text */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-md dark:shadow-lg border-2 border-gray-300 dark:border-gray-500 transition-all duration-300 ring-1 ring-gray-200/50 dark:ring-gray-600/50">
            {getIcon()}
          </div>
          {/* Reward amount below icon */}
          <span className="text-xs font-bold text-gray-900 dark:text-white transition-colors duration-300 drop-shadow-sm dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {getRewardAmount()}
          </span>
        </div>
      </div>
    </div>
  );
};

interface RewardNotificationContainerProps {
  notifications: RewardNotificationData[];
  onRemove: (id: string) => void;
}

export const RewardNotificationContainer: React.FC<RewardNotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  // Notifications are positioned individually in RewardNotification component
  // Container just renders them
  return (
    <>
      {notifications.map((notification, index) => (
        <RewardNotification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
          index={index}
        />
      ))}
    </>
  );
};

