'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { isItemExpired, hasItemTimePassed, sortItems, getAssetUrl } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';

/**
 * Items Overlay Component with performance optimizations
 * Optimized for 10,000+ concurrent users
 */
export const ItemsOverlay = React.memo(({
  items,
  theme,
  onClose,
  onUseItem,
  onDeleteItem,
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startY = useRef(0);
  const panelRef = useRef(null);
  const headerRef = useRef(null);
  const scrollableContentRef = useRef(null);
  const isScrollingContent = useRef(false);
  const dragStartTarget = useRef(null);
  const panelHeightRef = useRef(0);

  // Sort items by usage status, then by time
  const sortedItems = useMemo(() => sortItems(items), [items]);

  const handleClose = useCallback(() => {
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
    
    // Set smooth transition and animate to closed position
    panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    panel.style.transform = `translateY(${targetY}px)`;
    
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsAnimating(false);
      setDragY(0);
    }, 300); // Match animation duration
  }, [dragY, onClose]);

  // Get panel height for close threshold (70% of panel height)
  const getCloseThreshold = useCallback(() => {
    if (panelRef.current) {
      return panelRef.current.offsetHeight * 0.7;
    }
    return 400; // Fallback
  }, []);

  // Check if target is inside scrollable content area
  const isInsideScrollableContent = useCallback((target) => {
    if (!scrollableContentRef.current) return false;
    return scrollableContentRef.current.contains(target);
  }, []);

  // Check if target is inside header area (only header allows dragging)
  const isInsideHeader = useCallback((target) => {
    if (!headerRef.current) return false;
    return headerRef.current.contains(target);
  }, []);

  // Native touch event handlers (to allow preventDefault)
  const handleTouchStartNative = useCallback((e) => {
    const target = e.target;
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
  }, [isInsideHeader, isInsideScrollableContent]);

  const handleTouchMoveNative = useCallback((e) => {
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
    // Only preventDefault if event is cancelable
    if (e.cancelable) {
      e.preventDefault(); // Prevent background scrolling while dragging
    }
    e.stopPropagation(); // Prevent event bubbling
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    // Panel follows drag smoothly, but only positive (downward) for closing
    setDragY(Math.max(0, diff));
  }, [isDragging, dragY]);

  const handleTouchEndNative = useCallback(() => {
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
  }, [isDragging, dragY, getCloseThreshold, handleClose]);

  // Mouse drag handlers (for document events)
  const handleMouseDown = useCallback((e) => {
    const target = e.target;
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
    startY.current = 'clientY' in e ? e.clientY : e.clientY;
    setIsDragging(true);
    isScrollingContent.current = false;
  }, [isInsideHeader, isInsideScrollableContent]);

  const handleMouseMove = useCallback((e) => {
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
    }
    e.stopPropagation(); // Prevent event bubbling
    const currentY = e.clientY;
    const diff = currentY - startY.current;
    // Panel follows drag smoothly, but only positive (downward) for closing
    setDragY(Math.max(0, diff));
  }, [isDragging, dragY]);

  const handleMouseUp = useCallback(() => {
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
  }, [isDragging, dragY, getCloseThreshold, handleClose]);
  
  // Smooth snap-back animation from current drag position
  const snapBackToOpen = useCallback(() => {
    if (!panelRef.current) return;
    
    setIsAnimating(true);
    const panel = panelRef.current;
    
    // Animate from current dragY position back to 0
    panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    panel.style.transform = 'translateY(0)';
    
    // Update state after animation completes
    setTimeout(() => {
      setDragY(0);
      setIsAnimating(false);
    }, 300);
  }, []);

  // Prevent background scrolling when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Add native touch event listeners to document for global drag detection
  useEffect(() => {
    if (!onClose) return; // Only when overlay is open (onClose exists)

    const handleTouchStart = (e) => {
      handleTouchStartNative(e);
    };
    const handleTouchMove = (e) => {
      handleTouchMoveNative(e);
    };
    const handleTouchEnd = (e) => {
      handleTouchEndNative();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose, handleTouchStartNative, handleTouchMoveNative, handleTouchEndNative]);

  // Directly update transform style to override CSS animations
  useEffect(() => {
    if (!panelRef.current) return;
    
    const panel = panelRef.current;
    
    // Don't interfere if we're animating (closing or snapping back)
    if (isAnimating) {
      return;
    }
    
    if (isDragging || dragY > 0) {
      // Remove animation classes to prevent conflicts
      panel.classList.remove('animate-slide-up', 'animate-slide-down');
      // Directly set transform during drag (no transition)
      panel.style.transform = `translateY(${dragY}px)`;
      panel.style.transition = 'none';
    } else if (dragY === 0 && !isClosing) {
      // Panel is open and at rest
      panel.classList.remove('animate-slide-up', 'animate-slide-down');
      panel.style.transform = 'translateY(0)';
      panel.style.transition = '';
    }
  }, [isDragging, dragY, isClosing, isAnimating]);

  useEffect(() => {
    // Attach mouse events to document for global drag detection
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const handleImageError = useCallback((e) => {
    // Fallback to default icon if item icon fails to load
    e.target.src = getAssetUrl("/Asset/item/classTicket.png");
  }, []);

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
          !isDragging && dragY === 0 && !isAnimating && !isClosing ? 'animate-slide-up' : ''
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
             <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>All Items</h2>
           </div>
         </div>

        {/* Items List */}
        <div 
          ref={scrollableContentRef}
          className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
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
                  onError={handleImageError}
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
                  {!expired && !isUsed && item.type !== 'NormalItem' && (
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
});

ItemsOverlay.displayName = 'ItemsOverlay';

