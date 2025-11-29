'use client';

import React from 'react';
import { X } from 'lucide-react';
import { BackpackItem as BackpackItemType } from '@/types';
import { isItemExpired, hasItemTimePassed, sortItems } from '@/utils/helpers';

interface ItemsOverlayProps {
  items: BackpackItemType[];
  theme: 'light' | 'dark';
  onClose: () => void;
  onUseItem: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
}

export const ItemsOverlay: React.FC<ItemsOverlayProps> = ({
  items,
  theme,
  onClose,
  onUseItem,
  onDeleteItem,
}) => {
  // Sort items by usage status, then by time
  const sortedItems = sortItems(items);

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center animate-fade-in ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`}>
      <div className={`w-full max-w-md rounded-t-xl shadow-lg pb-20 animate-slide-up transition-colors ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div></div>
          <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Items</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items List */}
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sortedItems.map((item) => {
            const isUsed = item.used;
            const timePassed = hasItemTimePassed(item.date);
            const expired = isItemExpired(item.date);
            
            // Determine background color
            let backgroundColor = theme === 'dark' ? '#1f2937' : 'white';
            if (isUsed) {
              backgroundColor = '#e3cd0b'; // Yellow for used
            } else if (expired) {
              backgroundColor = '#ef4444'; // Red for expired
            }
            
            return (
              <div 
                key={item.id}
                className={`flex items-center gap-3 p-4 rounded-xl mb-3 shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
                style={{ backgroundColor }}
              >
                <img src={item.image} alt={item.name} className="w-24 h-18 object-contain rounded-lg" />
                <div className="flex-1">
                  <div className={`font-semibold text-base mb-1 ${theme === 'dark' && !isUsed && !expired ? 'text-white' : 'text-black'}`}>{item.name}</div>
                  <div className={`text-sm mb-1 ${theme === 'dark' && !isUsed && !expired ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</div>
                  <div className={`text-xs ${theme === 'dark' && !isUsed && !expired ? 'text-gray-500' : 'text-gray-500'}`}>{item.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-sm px-3 py-1 rounded-full font-semibold ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-black'}`}>
                    x{item.quantity}
                  </div>
                  {expired && !isUsed && (
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  {!expired && !isUsed && (
                    <button
                      onClick={() => onUseItem(item.id)}
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
          })}
        </div>
      </div>
    </div>
  );
};

