'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Quest } from '@/types';
import { areAllObjectivesCompleted, isQuestTrulyCompleted } from '@/utils/helpers';

interface QuestListOverlayProps {
  questsState: Quest[];
  theme: 'light' | 'dark';
  showQuestOverlay: boolean;
  setShowQuestOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  selectedQuestId: number | null;
  setSelectedQuestId: React.Dispatch<React.SetStateAction<number | null>>;
  questPanelShouldAnimate: React.MutableRefObject<boolean>;
  handleObjectiveClick: (questId: number, objectiveIndex: number) => void;
  handleClaimReward: (questId: number) => void;
  handleApproveObjective: (questId: number, objectiveIndex: number) => void;
  handleApproveReward: (questId: number) => void;
}

export const QuestListOverlay: React.FC<QuestListOverlayProps> = ({
  questsState,
  theme,
  showQuestOverlay,
  setShowQuestOverlay,
  selectedQuestId,
  setSelectedQuestId,
  questPanelShouldAnimate,
  handleObjectiveClick,
  handleClaimReward,
  handleApproveObjective,
  handleApproveReward,
}) => {
  // Separate completed and uncompleted quests
  const uncompletedQuests = questsState.filter(q => !isQuestTrulyCompleted(q));
  const completedQuests = questsState.filter(q => isQuestTrulyCompleted(q));
  
  // Track if panel should animate (only on manual open)
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Reset animation flag when overlay closes
  useEffect(() => {
    if (!showQuestOverlay) {
      questPanelShouldAnimate.current = false;
      setShouldAnimate(false);
    } else if (showQuestOverlay && questPanelShouldAnimate.current) {
      // Only animate if manually opened
      setShouldAnimate(true);
      // Remove animation classes after animation completes
      setTimeout(() => {
        setShouldAnimate(false);
        questPanelShouldAnimate.current = false; // Reset flag after animation
      }, 400); // Slightly longer than animation duration
    }
  }, [showQuestOverlay, questPanelShouldAnimate]);

  // Scroll to selected quest when overlay opens (only if quest was manually selected, not from objective submission)
  useEffect(() => {
    if (selectedQuestId && questPanelShouldAnimate.current) {
      const element = document.getElementById(`quest-${selectedQuestId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the quest briefly
          element.classList.add('ring-2', 'ring-blue-500');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500');
          }, 2000);
        }, 100);
      }
    }
  }, [selectedQuestId, showQuestOverlay, questPanelShouldAnimate]);

  // Format reward display helper
  const getRewardDisplay = (reward: any) => {
    if (reward.type === 'exp' && typeof reward.value === 'number') {
      return (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold">
            {reward.value.toLocaleString()} XP
          </div>
        </div>
      );
    } else if (reward.type === 'coins' && typeof reward.value === 'number') {
      return (
        <div className="flex flex-col items-center">
          <img src="/Asset/item/coin.png" alt="Coins" className="w-8 h-8 object-contain" />
          <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
        </div>
      );
    } else if (reward.type === 'skill' && typeof reward.value === 'number') {
      return (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {reward.value}
          </div>
          {reward.skillName && (
            <div className={`text-xs font-semibold mt-1 text-center max-w-[80px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {reward.skillName}
            </div>
          )}
        </div>
      );
    } else if (reward.type === 'rank' && typeof reward.value === 'number') {
      return (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md text-center leading-tight whitespace-nowrap">
            {reward.value.toLocaleString()} RP
          </div>
        </div>
      );
    } else if (reward.type === 'animal') {
      return (
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
            </svg>
          </div>
        </div>
      );
    } else if (reward.type === 'item') {
      return (
        <div className="flex flex-col items-center">
          {reward.itemImage ? (
            <img src={reward.itemImage} alt={reward.itemName || 'Item'} className="w-8 h-8 object-contain" />
          ) : (
            <div className={`w-8 h-8 rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <span className="text-lg">🎁</span>
            </div>
          )}
          {reward.quantity && (
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.quantity}</div>
          )}
        </div>
      );
    }
    return null;
  };

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowQuestOverlay(false);
      setSelectedQuestId(null);
    }, 300); // Match animation duration
  };

  // Get panel height for close threshold (70% of panel height)
  const getCloseThreshold = () => {
    if (panelRef.current) {
      return panelRef.current.offsetHeight * 0.7;
    }
    return 400; // Fallback
  };

  // Native touch event handlers (to allow preventDefault)
  const handleTouchStartNative = (e: TouchEvent) => {
    // Only start drag if touching the drag handle area
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      e.preventDefault();
      startY.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  };

  const handleTouchMoveNative = (e: TouchEvent) => {
    if (!isDragging) {
      return;
    }
    e.preventDefault(); // Prevent background scrolling while dragging
    e.stopPropagation(); // Prevent event bubbling
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    // Panel follows drag smoothly, but only positive (downward) for closing
    setDragY(Math.max(0, diff));
  };

  const handleTouchEndNative = () => {
    const threshold = getCloseThreshold();
    if (dragY > threshold) {
      handleClose();
    } else {
      // Snap back smoothly
      setDragY(0);
    }
    setIsDragging(false);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the drag handle area
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      e.preventDefault(); // Prevent text selection
      startY.current = e.clientY;
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    const currentY = e.clientY;
    const diff = currentY - startY.current;
    // Panel follows drag smoothly, but only positive (downward) for closing
    setDragY(Math.max(0, diff));
  };

  const handleMouseUp = () => {
    const threshold = getCloseThreshold();
    if (dragY > threshold) {
      handleClose();
    } else {
      // Snap back smoothly
      setDragY(0);
    }
    setIsDragging(false);
  };

  // Prevent background scrolling when panel is open
  useEffect(() => {
    if (showQuestOverlay) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showQuestOverlay]);

  // Add native touch event listeners with passive: false
  useEffect(() => {
    if (!panelRef.current) return;

    const panel = panelRef.current;
    panel.addEventListener('touchstart', handleTouchStartNative, { passive: false });
    panel.addEventListener('touchmove', handleTouchMoveNative, { passive: false });
    panel.addEventListener('touchend', handleTouchEndNative, { passive: false });

    return () => {
      panel.removeEventListener('touchstart', handleTouchStartNative);
      panel.removeEventListener('touchmove', handleTouchMoveNative);
      panel.removeEventListener('touchend', handleTouchEndNative);
    };
  }, [isDragging, dragY]);

  // Directly update transform style to override CSS animations
  useEffect(() => {
    if (!panelRef.current) return;
    
    const panel = panelRef.current;
    if (isClosing) {
      // When closing, remove inline styles to allow CSS animation to work
      panel.style.transform = '';
      panel.style.transition = '';
      // Ensure closing animation class is applied
      panel.classList.add('animate-slide-down');
      panel.classList.remove('animate-slide-up');
    } else if (isDragging || dragY > 0) {
      // Remove animation class to prevent conflicts
      panel.classList.remove('animate-slide-up', 'animate-slide-down');
      // Directly set transform
      panel.style.transform = `translateY(${dragY}px)`;
      panel.style.transition = 'none';
    } else {
      // Restore transition when not dragging
      panel.style.transition = 'transform 0.3s ease-out';
      if (dragY === 0) {
        panel.style.transform = 'translateY(0)';
      }
    }
  }, [isDragging, dragY, isClosing]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragY]);

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    } ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`}>
      <div 
        ref={panelRef}
        className={`w-full max-w-md rounded-t-xl shadow-lg pb-20 transition-colors ${
          isClosing ? 'animate-slide-down' : (!isDragging && dragY === 0 ? 'animate-slide-up' : '')
        } ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iPhone-style home indicator bar - drag handle */}
        <div 
          className="flex justify-center pt-3 pb-2 drag-handle cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className={`w-12 h-1 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
        </div>

        {/* Header - drag handle */}
        <div 
          className={`p-4 border-b flex justify-center items-center drag-handle cursor-grab active:cursor-grabbing ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
          onMouseDown={handleMouseDown}
        >
          <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Quests</h2>
        </div>

        {/* Quest List with Full Details */}
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Uncompleted Quests */}
          {uncompletedQuests.length > 0 && (
            <>
              {uncompletedQuests.map((quest) => (
                <div 
                  key={`uncompleted-${quest.id}`}
                  id={`quest-${quest.id}`}
                  className={`rounded-xl p-4 mb-4 shadow-sm border transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                >
                  {/* Quest Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={16} className="text-purple-600" />
                      <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                        {quest.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <span className="text-xs">🎮</span>
                      </div>
                      <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{quest.title}</h3>
                    </div>
                  </div>
                  {/* Objectives */}
                  <div className="mb-4">
                    <div className="space-y-1">
                      {quest.objectives.map((objective, index) => {
                        const isCompleted = quest.objectiveCompleted[index] || false;
                        const submission = quest.objectiveSubmissions[index];
                        const status = submission?.status || 'none';
                        const reward = objective.reward;
                        
                        // Determine visual state
                        // Note: 'pending' status is shown as completed to user (optimistic UI)
                        const isPending = status === 'pending';
                        const isApproved = status === 'approved' || status === 'pending'; // Show pending as approved visually
                        const isFullyApproved = status === 'approved'; // Fully approved (not just pending)
                        const isRejected = status === 'rejected';
                        const isClickable = isRejected || (status !== 'approved' && status !== 'pending'); // Allow resubmission if rejected

                        return (
                          <div 
                            key={index} 
                            className={`relative flex items-center justify-between py-2 border-b last:border-b-0 transition-all ${
                              theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            } ${
                              isRejected
                                ? theme === 'dark' ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'
                                : isApproved 
                                ? theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50' 
                                : isClickable 
                                ? theme === 'dark' ? 'bg-green-900/30 border-green-500 cursor-pointer hover:bg-green-900/40' : 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100' 
                                : ''
                            }`}
                            onClick={() => isClickable && handleObjectiveClick(quest.id, index)}
                          >
                            <div className="flex-1 flex items-center gap-2">
                              <span className={`text-sm ${
                                isApproved 
                                  ? 'text-green-600 font-semibold' 
                                  : isRejected
                                  ? 'text-red-600 font-semibold'
                                  : theme === 'dark' ? 'text-gray-300' : 'text-black'
                              }`}>
                                {objective.text}
                              </span>
                              {isPending && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                              {isFullyApproved && (
                                <div className="flex items-center gap-0.5">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                              {isRejected && (
                                <span className="text-xs text-red-600 font-semibold">(Rejected - Click to resubmit)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                {getRewardDisplay(reward)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* REWARDS Section */}
                  {quest.rewards && quest.rewards.length > 0 && (
                    <div className="mb-4 relative">
                      <div className="flex justify-center absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-[#F67BA4] text-white text-center py-2.5 px-16">
                          <span className="text-m font-semibold uppercase">REWARDS</span>
                        </div>
                      </div>
                      <div className={`relative rounded-lg pt-8 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                        <button
                          onClick={() => {
                            if (areAllObjectivesCompleted(quest) && !quest.rewardClaimed && quest.rewardSubmissionStatus === 'none') {
                              handleClaimReward(quest.id);
                            }
                          }}
                          disabled={quest.rewardClaimed || !areAllObjectivesCompleted(quest) || quest.rewardSubmissionStatus === 'pending'}
                          className={`w-full p-8 rounded-lg transition-all relative ${
                            quest.rewardClaimed
                              ? theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed'
                              : quest.rewardSubmissionStatus === 'pending'
                              ? theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed opacity-70' : 'bg-gray-100 cursor-not-allowed opacity-70'
                              : areAllObjectivesCompleted(quest) && !quest.rewardClaimed && quest.rewardSubmissionStatus === 'none'
                              ? theme === 'dark' ? 'bg-green-900/40 border-2 border-green-500 hover:bg-green-900/50 cursor-pointer' : 'bg-green-50 border-2 border-green-200 hover:bg-green-100 cursor-pointer'
                              : theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed opacity-50' : 'bg-gray-100 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {quest.rewardSubmissionStatus === 'pending' && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                              <span className="text-sm font-semibold text-white bg-black/50 px-3 py-1 rounded">waited…</span>
                            </div>
                          )}
                          <div className={`flex justify-center gap-6 ${quest.rewardSubmissionStatus === 'pending' ? 'opacity-30' : ''}`}>
                            {quest.rewards.filter(reward => reward.type !== 'skill').map((reward, index) => (
                              <div key={index} className="flex flex-col items-center">
                                {reward.type === 'exp' && typeof reward.value === 'number' ? (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                    {reward.value.toLocaleString()} XP
                                  </div>
                                ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                                  <>
                                    <img src="/Asset/item/coin.png" alt="Coins" className="w-12 h-12 object-contain mb-2" />
                                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
                                  </>
                                ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                                  <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                      {reward.value}
                                    </div>
                                    {reward.skillName && (
                                      <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
                                        {reward.skillName}
                                      </div>
                                    )}
                                  </div>
                                ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                    {reward.value.toLocaleString()} RP
                                  </div>
                                ) : reward.type === 'animal' ? (
                                  <>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                      </svg>
                                    </div>
                                    <div className={`text-xs font-semibold text-center ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>ANIMAL<br/>APPEAR!</div>
                                  </>
                                ) : reward.type === 'item' ? (
                                  <>
                                    {reward.itemImage ? (
                                      <img src={reward.itemImage} alt={reward.itemName || 'Item'} className="w-12 h-12 object-contain mb-2" />
                                    ) : (
                                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <span className="text-4xl">🎁</span>
                                      </div>
                                    )}
                                    {reward.quantity && (
                                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.quantity}</div>
                                    )}
                                    {reward.itemName && (
                                      <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {reward.itemName}
                                      </div>
                                    )}
                                  </>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          
          {/* Completed Quests Section */}
          {completedQuests.length > 0 && (
            <>
              <div className={`text-xs font-semibold uppercase mb-2 mt-6 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Completed
              </div>
              {completedQuests.map((quest) => (
                <div 
                  key={`completed-${quest.id}`}
                  id={`quest-${quest.id}`}
                  className={`rounded-xl p-4 mb-4 shadow-sm border transition-all opacity-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                >
                  {/* Quest Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={16} className="text-purple-600" />
                      <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                        {quest.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <span className="text-xs">🎮</span>
                      </div>
                      <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{quest.title}</h3>
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="mb-4">
                    <div className="space-y-1">
                      {quest.objectives.map((objective, index) => {
                        const isCompleted = quest.objectiveCompleted[index] || false;
                        const submission = quest.objectiveSubmissions[index];
                        const status = submission?.status || 'none';
                        const reward = objective.reward;
                        
                        const isApproved = status === 'approved';

                        return (
                          <div 
                            key={index} 
                            className={`relative flex items-center justify-between py-2 border-b last:border-b-0 transition-all ${
                              theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                            } ${
                              isApproved ? theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50' : ''
                            }`}
                          >
                            <div className="flex-1 flex items-center gap-2">
                              <span className={`text-sm ${
                                isApproved 
                                  ? 'text-green-600 font-semibold' 
                                  : theme === 'dark' ? 'text-gray-300' : 'text-black'
                              }`}>
                                {objective.text}
                              </span>
                              {isApproved && (
                                <div className="flex items-center gap-0.5">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                {getRewardDisplay(reward)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* REWARDS Section */}
                  {quest.rewards && quest.rewards.length > 0 && (
                    <div className="mb-4 relative">
                      <div className="flex justify-center absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-[#BF5475] text-white text-center py-2 px-6 rounded-lg">
                          <span className="text-sm font-semibold uppercase">REWARDS</span>
                        </div>
                      </div>
                      <div className={`relative rounded-lg pt-2 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                        <div className={`w-full p-4 rounded-lg cursor-not-allowed ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                          <div className="flex justify-center gap-6">
                            {quest.rewards.filter(reward => reward.type !== 'skill').map((reward, index) => (
                              <div key={index} className="flex flex-col items-center">
                                {reward.type === 'exp' && typeof reward.value === 'number' ? (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                    {reward.value.toLocaleString()} XP
                                  </div>
                                ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                                  <>
                                    <img src="/Asset/item/coin.png" alt="Coins" className="w-12 h-12 object-contain mb-2" />
                                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.value}</div>
                                  </>
                                ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                                  <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                      {reward.value}
                                    </div>
                                    {reward.skillName && (
                                      <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
                                        {reward.skillName}
                                      </div>
                                    )}
                                  </div>
                                ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                                  <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md">
                                    {reward.value.toLocaleString()} RP
                                  </div>
                                ) : reward.type === 'animal' ? (
                                  <>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                      </svg>
                                    </div>
                                    <div className={`text-xs font-semibold text-center ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>ANIMAL<br/>APPEAR!</div>
                                  </>
                                ) : reward.type === 'item' ? (
                                  <>
                                    {reward.itemImage ? (
                                      <img src={reward.itemImage} alt={reward.itemName || 'Item'} className="w-12 h-12 object-contain mb-2" />
                                    ) : (
                                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <span className="text-4xl">🎁</span>
                                      </div>
                                    )}
                                    {reward.quantity && (
                                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>x{reward.quantity}</div>
                                    )}
                                    {reward.itemName && (
                                      <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {reward.itemName}
                                      </div>
                                    )}
                                  </>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

