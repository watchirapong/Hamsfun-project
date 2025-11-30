'use client';

import React from 'react';
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
}) => {
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
          <div className="flex items-center gap-1">
            <img src={getAssetUrl("/Asset/item/coin.png")} alt="Coins" className="w-6 h-6 object-contain" />
            <span className={`font-bold px-4 py-2 rounded shadow-sm ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>{coins}</span>
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

