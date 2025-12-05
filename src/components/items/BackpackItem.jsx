'use client';

import React, { useMemo, useCallback } from 'react';
import { isItemExpired, hasItemTimePassed, getAssetUrl } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';

/**
 * Backpack Item Component with performance optimizations
 * Optimized for 10,000+ concurrent users
 */
export const BackpackItemComponent = React.memo(({ item, onUse, onDelete, theme }) => {
  const isUsed = useMemo(() => item.used, [item.used]);
  const timePassed = useMemo(() => hasItemTimePassed(item.date), [item.date]);
  const expired = useMemo(() => isItemExpired(item.date), [item.date]);
  
  // Determine background color
  const backgroundColor = useMemo(() => {
    if (isUsed) {
      return '#e3cd0b'; // Yellow for used
    } else if (expired) {
      return '#ef4444'; // Red for expired
    }
    return theme === 'dark' ? '#1f2937' : 'white';
  }, [isUsed, expired, theme]);

  const handleUse = useCallback(() => {
    onUse(item.id);
  }, [item.id, onUse]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleImageError = useCallback((e) => {
    // Fallback to default icon if item icon fails to load
    e.target.src = getAssetUrl("/Asset/item/classTicket.png");
  }, []);

  const itemIconUrl = useMemo(() => getItemIconUrl(item.icon || item.image), [item.icon, item.image]);

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl mb-2 shadow-sm border ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
      }`}
      style={{ backgroundColor }}
    >
      <img 
        src={itemIconUrl} 
        alt={item.name} 
        className="w-20 h-14 object-contain"
        onError={handleImageError}
      />
      <div className="flex-1">
        <div className={`font-semibold text-sm ${
          theme === 'dark' && !isUsed && !expired ? 'text-white' : 'text-black'
        }`}>{item.name}</div>
        <div className={`text-xs ${
          theme === 'dark' && !isUsed && !expired ? 'text-gray-400' : 'text-gray-500'
        }`}>{item.description}</div>
        <div className={`text-xs ${
          theme === 'dark' && !isUsed && !expired ? 'text-gray-500' : 'text-gray-500'
        }`}>{item.date}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`text-xs px-2 py-1 rounded-full ${
          theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100'
        }`}>x{item.quantity}</div>
        {expired && !isUsed && (
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        )}
        {!expired && !isUsed && item.type !== 'NormalItem' && (
          <button
            onClick={handleUse}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Use
          </button>
        )}
        {isUsed && (
          <span className="text-xs text-gray-600 font-semibold">Used</span>
        )}
      </div>
    </div>
  );
});

BackpackItemComponent.displayName = 'BackpackItemComponent';

