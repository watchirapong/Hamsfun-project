'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl, formatShortNumber } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';

export interface RewardData {
  type: string;
  value?: number | string;
  minValue?: number;
  maxValue?: number;
  itemId?: string;
  itemName?: string;
  itemIcon?: string;
  skillName?: string;
}

interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: RewardData[];
  theme: 'light' | 'dark';
}

export const RewardClaimModal: React.FC<RewardClaimModalProps> = ({
  isOpen,
  onClose,
  rewards,
  theme,
}) => {
  // Auto-close after a few seconds if desired, or let user close.
  // For high impact, let user close or click outside.

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
        // Auto-close after 1.5 seconds with fade out
        timer = setTimeout(() => {
            onClose();
        }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  const getRewardIcon = (reward: RewardData) => {
    if (reward.type === 'exp') return null; // We handle this with custom UI
    if (reward.type === 'coins') return getAssetUrl("/Asset/item/coin.png");
    if (reward.type === 'petExp') return null; // Custom UI
    if (reward.type === 'item') return getItemIconUrl(reward.itemIcon || "default");
    if (reward.type === 'balls') return getAssetUrl("/Asset/item/ball.png");
    
    return null;
  };

  const getRewardLabel = (reward: RewardData) => {
    const val = reward.value !== undefined ? formatShortNumber(typeof reward.value === 'string' ? Number(reward.value) : reward.value) : '';
    const range = reward.minValue !== undefined && reward.maxValue !== undefined
        ? `${formatShortNumber(reward.minValue)} - ${formatShortNumber(reward.maxValue)}`
        : val;

    switch (reward.type) {
        case 'exp': return `${range} XP`;
        case 'coins': return `${range} Coins`;
        case 'skill': return `${range} ${reward.skillName || 'Skill Points'}`;
        case 'rank': return `${range} RP`;
        case 'leaderboard': return `${range} LP`;
        case 'petExp': return `${range} Pet XP`;
        case 'balls': return `${range}`;
        case 'item': return `${range ? 'x' + range : ''} ${reward.itemName || 'Item'}`;
        default: return 'Reward';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            {/* Backdrop - Invisible but clickable if we enabled pointer-events, but let's just let clicks pass through mostly, 
                except we want 'click to dismiss'. Actually, if it's 1.5s, maybe just blocking interaction is annoying?
                The user said "if pressed in between, close it". So we need pointer-events-auto on the backdrop.
            */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={`absolute inset-0 z-0 pointer-events-auto ${theme === 'dark' ? 'bg-black/95' : 'bg-black/80'} backdrop-blur-sm`}
            />

            {/* Modal Content - Minimalist Floating */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ 
                    scale: 1, 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                        type: "spring",
                        damping: 12,
                        stiffness: 200
                    }
                }}
                exit={{ 
                    opacity: 0, 
                    y: -30,
                    scale: 0.9,
                    transition: { duration: 0.5, ease: "easeOut" } 
                }}
                className="relative z-10 flex flex-col items-center pointer-events-none"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="mb-4 font-black text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                    style={{ textShadow: '0px 4px 12px rgba(0,0,0,0.5)' }}
                >
                    CLAIMED!
                </motion.div>

                <div className="flex flex-col gap-3">
                    {rewards.filter(r => r.type !== 'leaderboard').map((reward, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 + (idx * 0.1) }}
                            className="flex items-center gap-3 backdrop-blur-md bg-black/40 rounded-full pr-6 pl-2 py-2 border border-white/10 shadow-xl"
                        >
                            {/* Icon Container */}
                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                {reward.type === 'exp' && (
                                    <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-lime-500/40 border-2 border-white/20">XP</div>
                                )}
                                {reward.type === 'skill' && (
                                     <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/40 border-2 border-white/20">SP</div>
                                )}
                                {reward.type === 'rank' && (
                                     <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-green-600/40 border-2 border-white/20">RP</div>
                                )}
                                 {reward.type === 'leaderboard' && (
                                     <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-600/40 border-2 border-white/20">LP</div>
                                )}
                                {reward.type === 'petExp' && (
                                    <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40 border-2 border-white/20">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                    </div>
                                )}
                                {(reward.type === 'coins' || reward.type === 'balls' || reward.type === 'item') && (
                                    <img 
                                        src={getRewardIcon(reward) || ''} 
                                        alt={reward.type}
                                        className="w-10 h-10 object-contain drop-shadow-md"
                                    />
                                )}
                            </div>

                            {/* Text Info - Simplified for impact */}
                            <div className="flex flex-col items-start">
                                <span className="text-xl font-bold text-white drop-shadow-md">{getRewardLabel(reward)}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
