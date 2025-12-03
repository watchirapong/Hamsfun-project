'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Star, Trophy, Crown, Package, TrendingUp, X } from 'lucide-react';

export interface RewardNotificationData {
  id: string;
  type: 'coins' | 'exp' | 'rank' | 'skill' | 'animal' | 'item' | 'leaderboard';
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
      default:
        return '';
    }
  };

  return (
    <div
      className={`absolute top-0 right-0 z-[10000] pointer-events-auto transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{
        transform: isVisible && !isExiting 
          ? `translateX(0) translateY(${index * 80}px)` 
          : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out',
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px] max-w-[320px] flex items-center gap-3 transition-colors duration-300">
        {/* Icon with background glow */}
        <div className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700/50 transition-colors duration-300">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">
            You received a reward!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate transition-colors duration-300">
            {getLabel()}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
        </button>
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
  // Position aligned with Quest panel on the right side
  // Quest panel is max-w-md (448px/28rem) centered, so we position notifications to align with panel's right edge
  // Using custom positioning: 50% (center) - 14rem (half of max-w-md) + 1rem (padding) = right edge of panel
  return (
    <div 
      className="fixed top-4 z-[10000] pointer-events-none"
      style={{ 
        right: 'calc(50% - 14rem + 1rem)',
        maxWidth: '28rem'
      }}
    >
      {notifications.map((notification, index) => (
        <RewardNotification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
          index={index}
        />
      ))}
    </div>
  );
};

