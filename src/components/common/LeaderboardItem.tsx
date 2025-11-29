'use client';

import React from 'react';
import { LeaderboardItem as LeaderboardItemType } from '@/types';

interface LeaderboardItemProps {
  item: LeaderboardItemType;
}

export const LeaderboardItemComponent: React.FC<LeaderboardItemProps> = ({ item }) => (
  <div className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2 shadow-sm border border-gray-100">
    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-sm">
      {item.rank}
    </div>
    <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full" />
    <div className="flex-1">
      <div className="font-semibold text-sm text-black">{item.name}</div>
      <div className="text-xs text-gray-500">Dogv Lv{item.level}</div>
    </div>
    <div className="font-bold text-sm text-black">{item.score}</div>
  </div>
);

