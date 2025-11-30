'use client';

import React from 'react';
import { BackpackItem as BackpackItemType } from '@/types';
import { isItemExpired, hasItemTimePassed } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';
import { getAssetUrl } from '@/utils/helpers';

interface BackpackItemProps {
  item: BackpackItemType;
  onUse: (id: number) => void;
  onDelete: (id: number) => void;
}

export const BackpackItemComponent: React.FC<BackpackItemProps> = ({ item, onUse, onDelete }) => {
  const isUsed = item.used;
  const timePassed = hasItemTimePassed(item.date);
  const expired = isItemExpired(item.date);
  
  // Determine background color
  let backgroundColor = 'white';
  if (isUsed) {
    backgroundColor = '#e3cd0b'; // Yellow for used
  } else if (expired) {
    backgroundColor = '#ef4444'; // Red for expired
  }
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl mb-2 shadow-sm border border-gray-100`}
      style={{ backgroundColor }}
    >
      <img 
        src={getItemIconUrl(item.icon || item.image)} 
        alt={item.name} 
        className="w-20 h-14 object-contain"
        onError={(e) => {
          // Fallback to default icon if item icon fails to load
          (e.target as HTMLImageElement).src = getAssetUrl("/Asset/item/classTicket.png");
        }}
      />
      <div className="flex-1">
        <div className="font-semibold text-sm text-black">{item.name}</div>
        <div className="text-xs text-gray-500">{item.description}</div>
        <div className="text-xs text-gray-500">{item.date}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">x{item.quantity}</div>
        {expired && !isUsed && (
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        )}
        {!expired && !isUsed && (
          <button
            onClick={() => onUse(item.id)}
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
};

