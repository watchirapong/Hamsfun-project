'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Quest } from '@/types';
import { areAllObjectivesCompleted, isQuestTrulyCompleted, formatShortNumber, getAssetUrl } from '@/utils/helpers';
import { getItemDetails, getItemIconUrl } from '@/utils/itemHelpers';

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
  handleClaimObjectiveReward: (questId: number, objectiveIndex: number) => void;
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
  handleClaimObjectiveReward,
}) => {
  // Separate completed and uncompleted quests, then sort so Main Quests appear first
  const uncompletedQuests = questsState
    .filter(q => !isQuestTrulyCompleted(q))
    .sort((a, b) => {
      // Main Quests first
      const aIsMain = a.type === "Main";
      const bIsMain = b.type === "Main";
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;
      // If both are Main Quests or both are not, maintain original order
      return 0;
    });
  
  const completedQuests = questsState
    .filter(q => isQuestTrulyCompleted(q))
    .sort((a, b) => {
      // Main Quests first
      const aIsMain = a.type === "Main";
      const bIsMain = b.type === "Main";
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;
      // If both are Main Quests or both are not, maintain original order
      return 0;
    });
  
  // Track opening animation state
  const [isOpening, setIsOpening] = useState(false);
  
  // Handle opening animation - always animate when panel opens
  useEffect(() => {
    if (showQuestOverlay) {
      // Always animate on open
      setIsOpening(true);
      // Remove animation class after animation completes (300ms for slide-up)
      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    } else {
      // Reset when closed
      setIsOpening(false);
    }
  }, [showQuestOverlay]);

  // Scroll to selected quest when overlay opens (after animation completes)
  useEffect(() => {
    if (selectedQuestId && showQuestOverlay && !isOpening) {
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
  }, [selectedQuestId, showQuestOverlay, isOpening]);

  // State to store item details for rewards
  const [itemDetailsCache, setItemDetailsCache] = useState<Map<string, { name: string; icon: string }>>(new Map());
  
  // Fetch item details for all item rewards when quests change
  useEffect(() => {
    const fetchItemDetails = async () => {
      const itemIds = new Set<string>();
      
      // Collect all item IDs from quest rewards
      questsState.forEach(quest => {
        quest.rewards?.forEach(reward => {
          if (reward.type === 'item' && reward.itemId) {
            itemIds.add(reward.itemId);
          }
        });
        quest.objectives?.forEach(objective => {
          const rewards = Array.isArray(objective.reward) ? objective.reward : [objective.reward];
          rewards.forEach(reward => {
            if (reward?.type === 'item' && reward.itemId) {
              itemIds.add(reward.itemId);
            }
          });
        });
      });
      
      // Fetch details for items not in cache
      const uncachedIds = Array.from(itemIds).filter(id => !itemDetailsCache.has(id));
      if (uncachedIds.length > 0) {
        const detailsMap = new Map(itemDetailsCache);
        await Promise.all(
          uncachedIds.map(async (itemId) => {
            const details = await getItemDetails(itemId);
            if (details) {
              detailsMap.set(itemId, details);
            }
          })
        );
        setItemDetailsCache(detailsMap);
      }
    };
    
    if (questsState.length > 0) {
      fetchItemDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questsState]);
  
  // Format reward display helper
  const getRewardDisplay = (reward: any) => {
    // Hide badge points (skill) and leaderboard points from UI
    if (reward.type === 'skill' || reward.type === 'leaderboard') {
      return null;
    }
    
    // Helper to format min-max range with shortened notation
    const formatRange = (min?: number, max?: number, value?: number) => {
      if (min !== undefined && max !== undefined && min !== max) {
        return `${formatShortNumber(min)} - ${formatShortNumber(max)}`;
      } else if (value !== undefined) {
        return formatShortNumber(value);
      } else if (min !== undefined) {
        return formatShortNumber(min);
      }
      return '0';
    };
    
    // Get item details from cache if available
    const getItemInfo = (itemId?: string) => {
      if (!itemId) return null;
      return itemDetailsCache.get(itemId) || null;
    };

    if (reward.type === 'exp' && typeof reward.value === 'number') {
      const displayValue = formatRange(reward.minValue, reward.maxValue, reward.value);
      return (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center text-white text-xs font-bold text-center px-1">
            {displayValue} XP
          </div>
        </div>
      );
    } else if (reward.type === 'coins' && typeof reward.value === 'number') {
      const displayValue = formatRange(reward.minValue, reward.maxValue, reward.value);
      return (
        <div className="flex items-center gap-1.5">
          <img src={getAssetUrl("/Asset/item/coin.png")} alt="Coins" className="w-8 h-8 object-contain flex-shrink-0" />
          <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
            {reward.minValue !== undefined && reward.maxValue !== undefined && reward.minValue !== reward.maxValue 
              ? `${formatShortNumber(reward.minValue)} - ${formatShortNumber(reward.maxValue)}` 
              : `x${displayValue}`}
          </div>
        </div>
      );
    } else if (reward.type === 'skill' && typeof reward.value === 'number') {
      const displayValue = formatRange(reward.minValue, reward.maxValue, reward.value);
      return (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold text-center px-1">
            {displayValue}
          </div>
          {reward.skillName && (
            <div className={`text-xs font-semibold mt-1 text-center max-w-[80px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {reward.skillName}
            </div>
          )}
        </div>
      );
    } else if (reward.type === 'rank' && typeof reward.value === 'number') {
      const displayValue = formatRange(reward.minValue, reward.maxValue, reward.value);
      return (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md text-center leading-tight px-1">
            {displayValue} RP
          </div>
        </div>
      );
    } else if (reward.type === 'leaderboard' && typeof reward.value === 'number') {
      const displayValue = formatRange(reward.minValue, reward.maxValue, reward.value);
      return (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md text-center px-1">
            {displayValue} LP
          </div>
        </div>
      );
    } else if (reward.type === 'petExp' && typeof reward.value === 'number') {
      const displayValue = formatRange(reward.minValue, reward.maxValue, reward.value);
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-pink-400 to-pink-600 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
            {reward.minValue !== undefined && reward.maxValue !== undefined && reward.minValue !== reward.maxValue 
              ? `${formatShortNumber(reward.minValue)} - ${formatShortNumber(reward.maxValue)}` 
              : `x${displayValue}`}
          </div>
        </div>
      );
    } else if (reward.type === 'item' && reward.itemId) {
      const displayValue = formatRange(reward.minValue, reward.maxValue, typeof reward.value === 'number' ? reward.value : undefined);
      const itemInfo = getItemInfo(reward.itemId);
      const itemName = reward.itemName || itemInfo?.name || 'Item';
      const itemIcon = reward.itemIcon || itemInfo?.icon || getAssetUrl("/Asset/item/classTicket.png");
      const iconUrl = getItemIconUrl(itemIcon);
      
      return (
        <div className="flex items-center gap-1.5">
          <img 
            src={iconUrl} 
            alt={itemName} 
            className="w-8 h-8 object-contain flex-shrink-0"
            onError={(e) => {
              // Fallback to default icon if item icon fails to load
              (e.target as HTMLImageElement).src = getAssetUrl("/Asset/item/classTicket.png");
            }}
          />
          {displayValue && displayValue !== '0' && (
            <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
              x{displayValue}
            </div>
          )}
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
    }
    return null;
  };

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isScrollingContent = useRef(false);
  const dragStartTarget = useRef<HTMLElement | null>(null);
  const panelHeightRef = useRef<number>(0);

  const handleClose = () => {
    if (!panelRef.current) return;
    
    setIsClosing(true);
    setIsAnimating(true);
    setIsDragging(false);
    
    // Get current panel height for smooth closing animation
    const panel = panelRef.current;
    panelHeightRef.current = panel.offsetHeight;
    
    // Animate from current dragY position to full panel height
    const currentY = dragY;
    const targetY = panelHeightRef.current;
    
    // Set smooth transition and animate to closed position (GPU optimized)
    panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    panel.style.transform = `translate3d(0, ${targetY}px, 0)`;
    panel.style.willChange = 'transform';
    
    setTimeout(() => {
      setShowQuestOverlay(false);
      setSelectedQuestId(null);
      setIsClosing(false);
      setIsAnimating(false);
      setDragY(0);
    }, 300); // Match animation duration
  };

  // Get panel height for close threshold (70% of panel height)
  const getCloseThreshold = () => {
    if (panelRef.current) {
      return panelRef.current.offsetHeight * 0.7;
    }
    return 400; // Fallback
  };

  // Check if target is inside scrollable content area
  const isInsideScrollableContent = (target: HTMLElement): boolean => {
    if (!scrollableContentRef.current) return false;
    return scrollableContentRef.current.contains(target);
  };

  // Check if target is inside header area (only header allows dragging)
  const isInsideHeader = (target: HTMLElement): boolean => {
    if (!headerRef.current) return false;
    return headerRef.current.contains(target);
  };

  // Check if scrollable content can scroll in the given direction
  const canScrollContent = (direction: 'up' | 'down'): boolean => {
    if (!scrollableContentRef.current) return false;
    const element = scrollableContentRef.current;
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    if (direction === 'up') {
      return scrollTop > 0; // Can scroll up
    } else {
      return scrollTop < scrollHeight - clientHeight; // Can scroll down
    }
  };

  // Native touch event handlers (to allow preventDefault)
  const handleTouchStartNative = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    dragStartTarget.current = target;
    
    // Only allow dragging from header area
    if (!isInsideHeader(target)) {
      // Not in header - let normal behavior happen (scrolling, etc.)
      return;
    }
    
    // Check if inside scrollable content (shouldn't happen if header check works, but safety check)
    if (isInsideScrollableContent(target)) {
      // Let the content handle scrolling first
      isScrollingContent.current = true;
      return; // Don't prevent default, let content scroll
    }
    
    // Start panel drag from header only
    // Only preventDefault if event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
    isScrollingContent.current = false;
  };

  const handleTouchMoveNative = (e: TouchEvent) => {
    if (isScrollingContent.current && scrollableContentRef.current) {
      // Check if we should switch to panel dragging
      const element = scrollableContentRef.current;
      const { scrollTop, scrollHeight, clientHeight } = element;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      // If dragging down and at top of scroll, or dragging up and at bottom, switch to panel drag
      if (diff > 0 && scrollTop === 0) {
        // Dragging down at top - switch to panel drag
        // Only preventDefault if event is cancelable
        if (e.cancelable) {
          e.preventDefault();
        }
        isScrollingContent.current = false;
        setIsDragging(true);
        setDragY(Math.max(0, diff));
      } else if (diff < 0 && scrollTop >= scrollHeight - clientHeight - 1) {
        // Dragging up at bottom - switch to panel drag (but only allow upward if panel is already dragged down)
        if (dragY > 0) {
          // Only preventDefault if event is cancelable
          if (e.cancelable) {
            e.preventDefault();
          }
          isScrollingContent.current = false;
          setIsDragging(true);
          setDragY(Math.max(0, dragY + diff));
        }
      }
      // Otherwise, let content scroll naturally
      return;
    }
    
    if (!isDragging) {
      return;
    }
    
    // Only preventDefault if event is cancelable (not already in progress)
    if (e.cancelable) {
      e.preventDefault(); // Prevent background scrolling while dragging
      e.stopPropagation(); // Prevent event bubbling
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    // Panel follows drag smoothly, but only positive (downward) for closing
    setDragY(Math.max(0, diff));
  };

  const handleTouchEndNative = () => {
    if (isScrollingContent.current) {
      isScrollingContent.current = false;
      return;
    }
    
    if (!isDragging) return;
    
    const threshold = getCloseThreshold();
    if (dragY > threshold) {
      handleClose();
    } else {
      // Snap back smoothly from current position
      snapBackToOpen();
    }
    setIsDragging(false);
    dragStartTarget.current = null;
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement);
    dragStartTarget.current = target;
    
    // Only allow dragging from header area
    if (!isInsideHeader(target)) {
      // Not in header - let normal behavior happen
      return;
    }
    
    // Check if inside scrollable content (shouldn't happen if header check works, but safety check)
    if (isInsideScrollableContent(target)) {
      // Let the content handle scrolling first
      isScrollingContent.current = true;
      return; // Don't prevent default, let content scroll
    }
    
    // Start panel drag from header only
    e.preventDefault(); // Prevent text selection
    startY.current = 'clientY' in e ? e.clientY : (e as React.MouseEvent).clientY;
    setIsDragging(true);
    isScrollingContent.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isScrollingContent.current && scrollableContentRef.current) {
      // Check if we should switch to panel dragging
      const element = scrollableContentRef.current;
      const { scrollTop, scrollHeight, clientHeight } = element;
      const currentY = e.clientY;
      const diff = currentY - startY.current;
      
      // If dragging down and at top of scroll, or dragging up and at bottom, switch to panel drag
      if (diff > 0 && scrollTop === 0) {
        // Dragging down at top - switch to panel drag
        // Only preventDefault if event is cancelable
        if (e.cancelable) {
          e.preventDefault();
        }
        isScrollingContent.current = false;
        setIsDragging(true);
        setDragY(Math.max(0, diff));
      } else if (diff < 0 && scrollTop >= scrollHeight - clientHeight - 1) {
        // Dragging up at bottom - switch to panel drag (but only allow upward if panel is already dragged down)
        if (dragY > 0) {
          // Only preventDefault if event is cancelable
          if (e.cancelable) {
            e.preventDefault();
          }
          isScrollingContent.current = false;
          setIsDragging(true);
          setDragY(Math.max(0, dragY + diff));
        }
      }
      // Otherwise, let content scroll naturally
      return;
    }
    
    if (!isDragging) return;
    
    // Only preventDefault if event is cancelable
    if (e.cancelable) {
      e.preventDefault(); // Prevent default behavior
      e.stopPropagation(); // Prevent event bubbling
    }
    const currentY = e.clientY;
    const diff = currentY - startY.current;
    // Panel follows drag smoothly, but only positive (downward) for closing
    setDragY(Math.max(0, diff));
  };

  const handleMouseUp = () => {
    if (isScrollingContent.current) {
      isScrollingContent.current = false;
      return;
    }
    
    if (!isDragging) return;
    
    const threshold = getCloseThreshold();
    if (dragY > threshold) {
      handleClose();
    } else {
      // Snap back smoothly from current position
      snapBackToOpen();
    }
    setIsDragging(false);
    dragStartTarget.current = null;
  };
  
  // Smooth snap-back animation from current drag position
  const snapBackToOpen = () => {
    if (!panelRef.current) return;
    
    setIsAnimating(true);
    const panel = panelRef.current;
    
    // Animate from current dragY position back to 0 (GPU optimized)
    panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    panel.style.transform = 'translate3d(0, 0, 0)';
    panel.style.willChange = 'transform';
    
    // Update state after animation completes
    setTimeout(() => {
      setDragY(0);
      setIsAnimating(false);
    }, 300);
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
    
    // Don't interfere if we're animating (closing or snapping back) or opening
    if (isAnimating || isOpening) {
      return;
    }
    
    if (isDragging || dragY > 0) {
      // Remove animation classes to prevent conflicts
      panel.classList.remove('animate-slide-up', 'animate-slide-down');
      // Directly set transform during drag (no transition, GPU optimized)
      panel.style.transform = `translate3d(0, ${dragY}px, 0)`;
      panel.style.transition = 'none';
      panel.style.willChange = 'transform';
    } else if (dragY === 0 && !isClosing) {
      // Panel is open and at rest
      panel.classList.remove('animate-slide-up', 'animate-slide-down');
      panel.style.transform = 'translate3d(0, 0, 0)';
      panel.style.transition = '';
      panel.style.willChange = 'auto';
    }
  }, [isDragging, dragY, isClosing, isAnimating, isOpening]);

  useEffect(() => {
    // Attach mouse events to document for global drag detection
    if (showQuestOverlay) {
      document.addEventListener('mousedown', handleMouseDown as any);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousedown', handleMouseDown as any);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [showQuestOverlay, isDragging, dragY]);
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end justify-center ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      } ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`}
      onClick={(e) => {
        // Close panel when clicking outside (on the background overlay)
        if (e.target === e.currentTarget && !isDragging && !isClosing) {
          handleClose();
        }
      }}
      onTouchStart={(e) => {
        // Handle touch outside for mobile
        if (e.target === e.currentTarget && !isDragging && !isClosing) {
          handleClose();
        }
      }}
    >
      <div 
        ref={panelRef}
        className={`w-full max-w-md rounded-t-xl shadow-lg pb-20 transition-colors ${
          isOpening ? 'animate-slide-up' : ''
        } ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Expanded draggable area (includes home indicator + header) */}
        <div 
          ref={headerRef}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* iPhone-style home indicator bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className={`w-12 h-1 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
          </div>

          {/* Header - visible text area */}
          <div 
            className={`pt-2 pb-4 px-4 border-b flex justify-center items-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
          >
            <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Quests</h2>
          </div>
        </div>

        {/* Quest List with Full Details */}
        <div 
          ref={scrollableContentRef}
          className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
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
                        const rewardAwarded = quest.objectiveRewardsAwarded?.[index] || false;
                        
                        // Normalize reward to array and filter out hidden rewards
                        const rewards = Array.isArray(objective.reward) 
                          ? objective.reward.filter(r => r.type !== 'skill' && r.type !== 'leaderboard')
                          : (objective.reward && objective.reward.type !== 'skill' && objective.reward.type !== 'leaderboard' 
                              ? [objective.reward] 
                              : []);
                        
                        // Determine objective state:
                        // 1. Normal: status === 'none' (not submitted)
                        // 2. Claimable (orange): status !== 'none' AND rewardAwarded === false (submitted but not claimed)
                        // 3. Completed (green): status !== 'none' AND rewardAwarded === true (submitted and claimed)
                        const isNormal = status === 'none';
                        const isClaimable = status !== 'none' && !rewardAwarded;
                        const isCompletedState = status !== 'none' && rewardAwarded;
                        const isRejected = status === 'rejected';
                        
                        // Clickable for normal state (to submit) or rejected (to resubmit)
                        const isClickable = isNormal || isRejected;

                        return (
                          <div 
                            key={index} 
                            className={`relative transition-all ${
                              isRejected
                                ? `border-b last:border-b-0 ${theme === 'dark' ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-200'} ${isCompletedState ? 'py-1.5 px-4' : 'py-2 px-4'}`
                                : isClaimable
                                ? `rounded-2xl mx-2 my-2 px-5 py-3 border-0 bg-[#FFB246] cursor-pointer hover:shadow-lg transition-all duration-200`
                                : isCompletedState
                                ? `rounded-2xl mx-2 my-2 px-5 py-2 border-0 bg-[#E3D8FC]`
                                : isClickable 
                                ? `border-b last:border-b-0 ${theme === 'dark' ? 'bg-gray-800/30 cursor-pointer hover:bg-gray-800/40' : 'bg-white cursor-pointer hover:bg-gray-50'} py-2 px-4`
                                : `border-b last:border-b-0 ${theme === 'dark' ? 'bg-gray-900/10' : 'bg-white'} py-2 px-4`
                            } ${
                              theme === 'dark' && !isClaimable ? 'border-gray-800' : !isClaimable ? 'border-gray-200' : ''
                            }`}
                            onClick={() => {
                              if (isClaimable) {
                                // Click to claim reward
                                handleClaimObjectiveReward(quest.id, index);
                              } else if (isClickable) {
                                // Click to submit/resubmit
                                handleObjectiveClick(quest.id, index);
                              }
                            }}
                          >
                            {isClaimable ? (
                              // Premium centered "CLAIM REWARD" state
                              <div className="flex items-center justify-center relative w-full">
                                <span className="text-base font-bold tracking-wide drop-shadow-sm text-white">
                                  CLAIM REWARD
                                </span>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  {rewards.map((reward, rewardIndex) => {
                                    const rewardDisplay = getRewardDisplay(reward);
                                    return rewardDisplay ? (
                                      <div key={rewardIndex} className="flex-shrink-0 flex items-center">
                                        {rewardDisplay}
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            ) : (
                              // Normal layout for other states
                              <div className="flex items-center justify-between w-full">
                                <div className="flex-1 flex flex-col gap-1 min-w-0 pr-3">
                                  <div className="flex items-center gap-2">
                                    {isCompletedState ? (
                                      // Completed "Task completed" state
                                      <span className="text-sm font-semibold text-[#9A86F1]">
                                        {objective.text} task completed
                                      </span>
                                    ) : (
                                      // Normal state
                                      <span 
                                        className={`text-sm truncate ${
                                          isRejected
                                            ? 'text-red-600 font-semibold'
                                            : theme === 'dark' ? 'text-white' : 'text-black'
                                        }`}
                                      >
                                        {objective.text}
                                      </span>
                                    )}
                                    {isRejected && (
                                      <span className="text-xs text-red-600 font-semibold flex-shrink-0">(Rejected - Click to resubmit)</span>
                                    )}
                                  </div>
                                  {/* Tap to details label for clickable objectives (normal state only) */}
                                  {isClickable && !isRejected && (
                                    <span className={`text-xs italic ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                      tap to details
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {isCompletedState ? (
                                    // Show checkmark icon for completed state
                                    <Check className="w-5 h-5 flex-shrink-0 text-[#9A86F1]" />
                                  ) : (
                                    // Show reward icon for normal states
                                    rewards.map((reward, rewardIndex) => {
                                      const rewardDisplay = getRewardDisplay(reward);
                                      return rewardDisplay ? (
                                        <div key={rewardIndex} className="flex-shrink-0 flex items-center">
                                          {rewardDisplay}
                                        </div>
                                      ) : null;
                                    })
                                  )}
                                </div>
                              </div>
                            )}
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
                              : theme === 'dark' ? 'bg-gray-900/50 cursor-not-allowed opacity-15' : 'bg-gray-100 cursor-not-allowed opacity-15'
                          }`}
                        >
                          {quest.rewardSubmissionStatus === 'pending' && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                              <span className={`text-sm font-semibold px-3 py-1 rounded ${
                                theme === 'dark' 
                                  ? 'text-white bg-purple-400/60' 
                                  : 'text-white bg-black/50'
                              }`}>waited…</span>
                            </div>
                          )}
                          <div className={`flex justify-center gap-6 ${quest.rewardSubmissionStatus === 'pending' ? 'opacity-30' : ''}`}>
                            {quest.rewards.filter(reward => reward.type !== 'skill' && reward.type !== 'leaderboard').map((reward, index) => {
                              const formatRange = (min?: number, max?: number, value?: number) => {
                                if (min !== undefined && max !== undefined && min !== max) {
                                  return `${formatShortNumber(min)} - ${formatShortNumber(max)}`;
                                } else if (value !== undefined) {
                                  return formatShortNumber(value);
                                } else if (min !== undefined) {
                                  return formatShortNumber(min);
                                }
                                return '0';
                              };

                              return (
                                <div key={index} className="flex flex-col items-center">
                                  {reward.type === 'exp' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md text-center px-1">
                                      {formatRange(reward.minValue, reward.maxValue, reward.value)} XP
                                    </div>
                                  ) : reward.type === 'coins' && typeof reward.value === 'number' ? (
                                    <>
                                      <img src={getAssetUrl("/Asset/item/coin.png")} alt="Coins" className="w-12 h-12 object-contain mb-2" />
                                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                                        {reward.minValue !== undefined && reward.maxValue !== undefined && reward.minValue !== reward.maxValue 
                                          ? `${formatShortNumber(reward.minValue)} - ${formatShortNumber(reward.maxValue)}` 
                                          : `x${formatRange(reward.minValue, reward.maxValue, reward.value)}`}
                                      </div>
                                    </>
                                  ) : reward.type === 'skill' && typeof reward.value === 'number' ? (
                                    <div className="flex flex-col items-center">
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md text-center px-1">
                                        {formatRange(reward.minValue, reward.maxValue, reward.value)}
                                      </div>
                                      {reward.skillName && (
                                        <div className={`text-xs font-semibold text-center max-w-[100px] ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
                                          {reward.skillName}
                                        </div>
                                      )}
                                    </div>
                                  ) : reward.type === 'rank' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md text-center px-1">
                                      {formatRange(reward.minValue, reward.maxValue, reward.value)} RP
                                    </div>
                                  ) : reward.type === 'leaderboard' && typeof reward.value === 'number' ? (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md text-center px-1">
                                      {formatRange(reward.minValue, reward.maxValue, reward.value)} LP
                                    </div>
                                  ) : reward.type === 'petExp' && typeof reward.value === 'number' ? (
                                    <>
                                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-pink-400 to-pink-600 flex items-center justify-center mb-2 shadow-md">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                      </div>
                                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                                        {reward.minValue !== undefined && reward.maxValue !== undefined && reward.minValue !== reward.maxValue 
                                          ? `${formatShortNumber(reward.minValue)} - ${formatShortNumber(reward.maxValue)}` 
                                          : `x${formatRange(reward.minValue, reward.maxValue, reward.value)}`}
                                      </div>
                                      <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Pet EXP
                                      </div>
                                    </>
                                  ) : reward.type === 'item' && reward.itemId ? (
                                    (() => {
                                      const itemInfo = itemDetailsCache.get(reward.itemId);
                                      const itemName = reward.itemName || itemInfo?.name || 'Item';
                                      const itemIcon = reward.itemIcon || itemInfo?.icon || getAssetUrl("/Asset/item/classTicket.png");
                                      const iconUrl = getItemIconUrl(itemIcon);
                                      const quantity = formatRange(reward.minValue, reward.maxValue, typeof reward.value === 'number' ? reward.value : undefined);
                                      
                                      return (
                                        <>
                                          <img 
                                            src={iconUrl} 
                                            alt={itemName} 
                                            className="w-20 h-20 object-contain mb-2"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = getAssetUrl("/Asset/item/classTicket.png");
                                            }}
                                          />
                                          <div className={`text-xs font-semibold text-center max-w-[100px] mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
                                            {itemName}
                                          </div>
                                          {quantity && quantity !== '0' && (
                                            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                                              x{quantity}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()
                                  ) : reward.type === 'animal' ? (
                                  <>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                                      </svg>
                                    </div>
                                    <div className={`text-xs font-semibold text-center ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>ANIMAL<br/>APPEAR!</div>
                                  </>
                                ) : null}
                                </div>
                              );
                            })}
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
                  className="rounded-2xl mx-2 my-2 px-5 py-2 border-0 bg-[#E3D8FC] mb-4 shadow-sm transition-all"
                >
                  {/* Completed Quest - Simplified Display */}
                  <div className="flex items-center justify-center relative w-full">
                    <span className="text-sm font-semibold text-[#9A86F1]">
                      {quest.title} completed
                    </span>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <Check className="w-5 h-5 flex-shrink-0 text-[#9A86F1]" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

