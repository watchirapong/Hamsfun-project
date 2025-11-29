'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Skill } from '@/types';
import { getBadgeIconPath } from '@/utils/helpers';

interface BadgeOverlayProps {
  selectedSkill: Skill | null;
  setShowBadgeOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BadgeOverlay: React.FC<BadgeOverlayProps> = ({
  selectedSkill,
  setShowBadgeOverlay,
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowBadgeOverlay(false);
    }, 300); // Match animation duration
  };

  // Get panel height for close threshold (70% of panel height)
  const getCloseThreshold = () => {
    if (panelRef.current) {
      return panelRef.current.offsetHeight * 0.7;
    }
    return 300; // Fallback
  };

  if (!selectedSkill) return null;

  // Define level names and colors: Bronze, Silver, Gold, Diamond (Unranked has no badge)
  const levelNames = ["Bronze", "Silver", "Gold", "Diamond"];
  const levelColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
  // Map skill level to badge index: level 1=Unranked (no badge), level 2=Bronze (index 0), etc.
  const badgeIndex = selectedSkill.currentLevel - 2; // -1 for Unranked, 0 for Bronze, etc.
  const currentLevelName = badgeIndex >= 0 ? levelNames[badgeIndex] : "Unranked";
  const currentLevelColor = badgeIndex >= 0 ? levelColors[badgeIndex] : "#9CA3AF";
  const isDiamond = selectedSkill.currentLevel === 5; // Diamond has no progression

  // Get current badge icon path
  const currentBadgeLevel = selectedSkill.currentLevel >= 2 ? selectedSkill.currentLevel : 2;
  const currentBadgeIconPath = getBadgeIconPath(selectedSkill.name, currentBadgeLevel);
  
  // Get common badge icon path for background
  const getCommonBadgePath = (skillName: string): string => {
    const normalizedName = skillName.toLowerCase().trim();
    
    if (normalizedName.includes("game") || 
        normalizedName === "gamedesign" || 
        normalizedName === "explorer") {
      return "/Asset/badge/common/game.png";
    } else if (normalizedName.includes("level") || normalizedName === "leveldesign") {
      return "/Asset/badge/common/level.png";
    } else if (normalizedName.includes("programming") || normalizedName.includes("code") || normalizedName.includes("c#")) {
      return "/Asset/badge/common/programming.png";
    } else {
      return "/Asset/badge/common/art.png"; // default
    }
  };
  
  const commonBadgePath = getCommonBadgePath(selectedSkill.name);

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
    if (selectedSkill) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedSkill]);

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
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    }`}>
      <div 
        ref={panelRef}
        className={`bg-white w-full max-w-md rounded-t-xl shadow-lg pb-20 ${
          isClosing ? 'animate-slide-down' : (!isDragging && dragY === 0 ? 'animate-slide-up' : '')
        }`}
      >
        {/* iPhone-style home indicator bar - drag handle */}
        <div 
          className="flex justify-center pt-3 pb-2 drag-handle cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
        </div>

        {/* Badge Info */}
        <div className="p-4">
          <div 
            className="text-center mb-6 drag-handle cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h3 className="font-bold text-xl mb-2">{selectedSkill.name}</h3>
            <p className="text-gray-600 text-sm">{selectedSkill.description || 'No description available.'}</p>
          </div>

          {/* Progress Circle - Hidden for Diamond level */}
          {!isDiamond && (
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                {/* Faded badge icon in background - behind everything */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
                  <img 
                    src={commonBadgePath} 
                    alt="Badge" 
                    className="w-full h-full object-contain"
                    style={{ opacity: 0.15 }}
                    onError={(e) => {
                      console.log('Common badge icon failed to load:', commonBadgePath);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {/* Outer circle */}
                <div className="absolute inset-0 rounded-full border-8 border-blue-100" style={{ zIndex: 1 }}></div>
                {/* Inner circle with progress */}
                <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ zIndex: 2 }}>
                  <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ zIndex: 3 , opacity: 1 }}>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedSkill.points.toLocaleString()}</div>
                      <div className="text-gray-600">/ {selectedSkill.maxPoints.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Level Badges - Only show Bronze, Silver, Gold, Diamond (no Unranked badge) */}
          <div className="flex justify-center gap-2 mb-6">
            {levelNames.map((levelName, index) => {
              // Badge index corresponds to skill level - 2 (Bronze = level 2 = index 0)
              const badgeLevel = index + 2; // Bronze is level 2, Silver is level 3, etc.
              const isUnlocked = badgeLevel <= selectedSkill.currentLevel;
              // Color mapping: Bronze=amber, Silver=gray, Gold=yellow, Diamond=blue
              const borderColorClass = index === 0 ? 'amber' : index === 1 ? 'gray' : index === 2 ? 'yellow' : 'blue';
              
              return (
                <div 
                  key={index} 
                  className={`w-12 h-12 flex items-center justify-center ${
                    !isUnlocked ? 'opacity-50' : ''
                  }`}
                >
                  <img 
                    src={getBadgeIconPath(selectedSkill.name, badgeLevel)} 
                    alt={levelName}
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            })}
          </div>

          {/* Rewards Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-full border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">REWARDS</span>
              <div className="w-full border-t border-gray-300"></div>
            </div>
            
            <div className="flex justify-center gap-6">
              {selectedSkill.rewards.map((reward, index) => (
                <div key={index} className="flex flex-col items-center">
                  {reward.type === "animal" ? (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM21 9V7L15 1V5H13V9H11V5H9V1L3 7V9H1V11H3V13H1V15H3V17H1V19H3V21H5V19H7V21H9V19H11V21H13V19H15V21H17V19H19V21H21V19H23V17H21V15H23V13H21V11H23V9H21Z"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                      <img src="/Asset/item/coin.png" alt="Coins" className="w-6 h-6 object-contain" />
                    </div>
                  )}
                  <div className="text-center text-sm font-medium">
                    {reward.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

