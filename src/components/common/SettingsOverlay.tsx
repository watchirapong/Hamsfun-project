'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, LogOut, X } from 'lucide-react';

interface SettingsOverlayProps {
  theme: 'light' | 'dark';
  onClose: () => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  theme,
  onClose,
  onThemeChange,
  onLogout,
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpening, setIsOpening] = useState(true);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
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
      onClose();
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

  // Check if target is inside header area (only header allows dragging)
  const isInsideHeader = (target: HTMLElement): boolean => {
    if (!headerRef.current) return false;
    return headerRef.current.contains(target);
  };

  // Native touch event handlers (to allow preventDefault)
  const handleTouchStartNative = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    dragStartTarget.current = target;
    
    // Only allow dragging from header area
    if (!isInsideHeader(target)) {
      // Not in header - let normal behavior happen
      return;
    }
    
    // Start panel drag from header only
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMoveNative = (e: TouchEvent) => {
    if (!isDragging) {
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only drag if moving downwards
    if (diff > 0) {
        e.preventDefault(); // Prevent background scrolling while dragging
        e.stopPropagation(); // Prevent event bubbling
        // Panel follows drag smoothly
        setDragY(Math.max(0, diff));
    }
  };

  const handleTouchEndNative = () => {
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

  // Mouse drag handlers (for document events)
  const handleMouseDown = (e: MouseEvent | React.MouseEvent) => {
    const target = (e.target as HTMLElement);
    dragStartTarget.current = target;
    
    // Only allow dragging from header area
    if (!isInsideHeader(target)) {
      // Not in header - let normal behavior happen
      return;
    }
    
    // Start panel drag from header only
    e.preventDefault(); // Prevent text selection
    startY.current = 'clientY' in e ? e.clientY : (e as React.MouseEvent).clientY;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
        e.preventDefault(); // Prevent default behavior
        e.stopPropagation(); // Prevent event bubbling
        // Panel follows drag smoothly
        setDragY(Math.max(0, diff));
    }
  };

  const handleMouseUp = () => {
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
    document.body.style.overflow = 'hidden';
    // Trigger opening animation
    setIsOpening(true);
    setTimeout(() => {
      setIsOpening(false);
    }, 400); // Match animation duration
    return () => {
      document.body.style.overflow = '';
      setIsOpening(false);
    };
  }, []);

  // Add native touch event listeners to document for global drag detection
  useEffect(() => {
    if (!onClose) return; // Only when overlay is open (onClose exists)

    const handleTouchStart = (e: TouchEvent) => {
      handleTouchStartNative(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      handleTouchMoveNative(e);
    };
    const handleTouchEnd = (e: TouchEvent) => {
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
    document.addEventListener('mousedown', handleMouseDown as any);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown as any);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onClose, isDragging, dragY]);

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
        className={`w-full max-w-md rounded-t-xl shadow-lg pb-10 transition-colors ${
          (isOpening || (!isDragging && dragY === 0 && !isAnimating && !isClosing)) ? 'animate-slide-up' : ''
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
             className={`pt-2 pb-4 px-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
           >
             <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Settings</h2>
             <button 
               onClick={handleClose}
               className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
               onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close button
               onTouchStart={(e) => e.stopPropagation()} // Prevent drag when tapping close button
             >
               <X size={20} />
             </button>
           </div>
         </div>

        {/* Settings Options */}
        <div className="p-4 space-y-4">
          {/* Theme Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="text-indigo-400" size={24} />
              ) : (
                <Sun className="text-amber-500" size={24} />
              )}
              <div>
                <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Adjust the appearance
                </div>
              </div>
            </div>
            <button
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
                onLogout();
                handleClose();
            }}
            className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-colors border ${
              theme === 'dark' 
                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
            }`}
          >
            <LogOut size={20} />
            Log Out
          </button>
          
          <div className={`text-center text-xs mt-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
            Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};
