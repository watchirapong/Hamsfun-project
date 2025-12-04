'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HouseLeaderboardItem } from '@/types';
import { HouseLeaderboardItemComponent } from './HouseLeaderboardItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaderboardOverlayProps {
  houseLeaderboard: HouseLeaderboardItem[];
  theme: 'light' | 'dark';
  onClose: () => void;
  onFetchMembers?: (houseId: string) => Promise<any[]>;
  currentUserDiscordUsername?: string;
}

const USERS_PER_PAGE = 100;

export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
  houseLeaderboard,
  theme,
  onClose,
  onFetchMembers,
  currentUserDiscordUsername,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedHouseId, setExpandedHouseId] = useState<string | null>(null);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(houseLeaderboard.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentPageHouses = houseLeaderboard.slice(startIndex, endIndex);
  const pageRange = `${startIndex + 1}-${Math.min(endIndex, houseLeaderboard.length)}`;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getCloseThreshold = () => {
    if (panelRef.current) {
      return panelRef.current.offsetHeight * 0.7;
    }
    return 400;
  };

  // Native touch event handlers
  const handleTouchStartNative = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      e.preventDefault();
      startY.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  };

  const handleTouchMoveNative = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    setDragY(Math.max(0, diff));
  };

  const handleTouchEndNative = () => {
    const threshold = getCloseThreshold();
    if (dragY > threshold) {
      handleClose();
    } else {
      setDragY(0);
    }
    setIsDragging(false);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      e.preventDefault();
      startY.current = e.clientY;
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const currentY = e.clientY;
    const diff = currentY - startY.current;
    setDragY(Math.max(0, diff));
  };

  const handleMouseUp = () => {
    const threshold = getCloseThreshold();
    if (dragY > threshold) {
      handleClose();
    } else {
      setDragY(0);
    }
    setIsDragging(false);
  };

  // Prevent background scrolling when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Add native touch event listeners
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

  // Directly update transform style
  useEffect(() => {
    if (!panelRef.current) return;
    
    const panel = panelRef.current;
    if (isClosing) {
      panel.style.transform = '';
      panel.style.transition = '';
      panel.classList.add('animate-slide-down');
      panel.classList.remove('animate-slide-up');
    } else if (isDragging || dragY > 0) {
      panel.classList.remove('animate-slide-up', 'animate-slide-down');
      panel.style.transform = `translateY(${dragY}px)`;
      panel.style.transition = 'none';
    } else {
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

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    } ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`}>
      <div 
        ref={panelRef}
        className={`w-full max-w-md rounded-t-xl shadow-lg pb-20 transition-colors ${
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
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
          className={`p-4 border-b flex justify-center items-center drag-handle cursor-grab active:cursor-grabbing ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}
          onMouseDown={handleMouseDown}
        >
          <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Leaderboard
          </h2>
        </div>

        {/* Pagination Info */}
        <div className={`p-4 border-b flex justify-between items-center ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {pageRange} of {houseLeaderboard.length}
          </div>
          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {currentPageHouses.map((item) => (
            <HouseLeaderboardItemComponent 
              key={item.houseId || item.rank} 
              item={item}
              onFetchMembers={onFetchMembers}
              theme={theme}
              currentUserDiscordUsername={currentUserDiscordUsername}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        <div className={`p-4 border-t flex justify-between items-center ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

