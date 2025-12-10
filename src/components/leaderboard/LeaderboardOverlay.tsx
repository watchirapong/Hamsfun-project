'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HouseLeaderboardItem, TeamLeaderboardItem } from '@/types';
import { HouseLeaderboardItemComponent } from './HouseLeaderboardItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaderboardOverlayProps {
  houseLeaderboard: HouseLeaderboardItem[];
  teamLeaderboard?: TeamLeaderboardItem[];
  isHamster?: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  onFetchMembers?: (houseId: string) => Promise<any[]>;
  currentUserDiscordUsername?: string;
}

const USERS_PER_PAGE = 100;

export const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = ({
  houseLeaderboard,
  teamLeaderboard = [],
  isHamster = false,
  theme,
  onClose,
  onFetchMembers,
  currentUserDiscordUsername,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Choose data source based on isHamster
  const leaderboardData = isHamster ? teamLeaderboard : houseLeaderboard;
  const totalPages = Math.ceil(leaderboardData.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentPageItems = leaderboardData.slice(startIndex, endIndex);
  const pageRange = `${startIndex + 1}-${Math.min(endIndex, leaderboardData.length)}`;

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

  // Check if target is inside header area (only header allows dragging)
  const isInsideHeader = (target: HTMLElement): boolean => {
    if (!headerRef.current) return false;
    return headerRef.current.contains(target) || target.closest('.drag-handle') !== null;
  };

  // Native touch event handlers
  const handleTouchStartNative = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    
    // Only allow dragging from header area
    if (!isInsideHeader(target)) {
      // Not in header - let normal behavior happen
      return;
    }
    
    // Only preventDefault if event is cancelable
    if (e.cancelable) {
      e.preventDefault();
    }
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
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
    
    // Only allow dragging from header area
    if (!isInsideHeader(target)) {
      // Not in header - let normal behavior happen
      return;
    }
    
    e.preventDefault();
    startY.current = e.clientY;
    setIsDragging(true);
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

  // Toggle team expansion
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

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
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
        } ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
         {/* Expanded draggable area (includes home indicator + header) */}
         <div 
           ref={headerRef}
           className="drag-handle cursor-grab active:cursor-grabbing"
           onMouseDown={handleMouseDown}
         >
           {/* iPhone-style home indicator bar */}
           <div className="flex justify-center pt-3 pb-2">
             <div className={`w-12 h-1 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
           </div>

           {/* Header - visible text area */}
           <div 
             className={`pt-2 pb-4 px-4 border-b flex justify-center items-center ${
               theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
             }`}
           >
             <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
               {isHamster ? '🐹 Team Leaderboard' : 'Leaderboard'}
             </h2>
           </div>
         </div>

        {/* Pagination Info */}
        <div className={`p-4 border-b flex justify-between items-center ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {pageRange} of {leaderboardData.length}
          </div>
          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Page {currentPage} of {totalPages || 1}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {isHamster ? (
            // Team Leaderboard for Hamster users
            (currentPageItems as TeamLeaderboardItem[]).map((team) => (
              <div 
                key={team._id}
                className={`p-3 mb-2 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-600/30 hover:border-yellow-500/50' 
                    : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-300'
                }`}
                onClick={() => toggleTeamExpansion(team._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold w-8 text-center ${
                      team.rank === 1 ? 'text-yellow-500' : 
                      team.rank === 2 ? 'text-gray-400' : 
                      team.rank === 3 ? 'text-amber-600' : 
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {team.rank <= 3 ? ['🥇', '🥈', '🥉'][team.rank - 1] : team.rank}
                    </div>
                    <div className="text-2xl">{team.icon}</div>
                    <div>
                      <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {team.name}
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {team.memberCount} members
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-500">🔵 {team.totalBalls}</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      avg: {team.avgBalls}/member
                    </div>
                  </div>
                </div>
                
                {/* Expanded Members List */}
                {expandedTeamId === team._id && team.members && team.members.length > 0 && (
                  <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Team Members
                    </div>
                    {team.members.map((member, idx) => (
                      <div 
                        key={member._id}
                        className={`flex items-center justify-between py-2 ${
                          idx < team.members.length - 1 
                            ? `border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-100'}` 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.discordNickname || member.discordUsername} 
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {(member.discordNickname || member.discordUsername || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                              {member.discordNickname || member.discordUsername}
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {member.hamsterRank}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-yellow-500">
                          🔵 {member.balls}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            // House Leaderboard for regular users
            (currentPageItems as HouseLeaderboardItem[]).map((item) => (
              <HouseLeaderboardItemComponent 
                key={item.houseId || item.rank} 
                item={item}
                onFetchMembers={onFetchMembers}
                theme={theme}
                currentUserDiscordUsername={currentUserDiscordUsername}
              />
            ))
          )}
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
            disabled={currentPage === totalPages || totalPages === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === totalPages || totalPages === 0
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

