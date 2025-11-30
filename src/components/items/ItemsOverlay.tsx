'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BackpackItem as BackpackItemType } from '@/types';
import { isItemExpired, hasItemTimePassed, sortItems } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';

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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sort items by usage status, then by time
  const sortedItems = sortItems(items);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
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

  // Allow scrolling on content area, prevent only on drag handle
  // Don't prevent body scrolling - let the content area handle it
  useEffect(() => {
    if (panelRef.current) {
      const contentArea = panelRef.current.querySelector('.overflow-y-auto');
      if (contentArea) {
        (contentArea as HTMLElement).style.overflowY = 'auto';
      }
    }
  }, []);

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
          <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Items</h2>
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
                <img 
                  src={getItemIconUrl(item.icon || item.image)} 
                  alt={item.name} 
                  className="w-24 h-18 object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback to default icon if item icon fails to load
                    (e.target as HTMLImageElement).src = "/Asset/item/classTicket.png";
                  }}
                />
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

