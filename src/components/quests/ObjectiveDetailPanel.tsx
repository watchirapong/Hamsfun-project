'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { X, Link as LinkIcon, Image as ImageIcon, Video, Check } from 'lucide-react';

type SubmissionType = 'link' | 'image' | 'video' | null;

interface ObjectiveDetailPanelProps {
  isOpen: boolean;
  questTitle: string;
  objectiveDescription: string;
  uploadedImage: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClose: () => void;
  theme?: 'light' | 'dark';
  userDescription?: string; // Comment field
  onUserDescriptionChange?: (value: string) => void;
  // Track which submission types have been sent
  hasLinkSubmission?: boolean;
  hasImageSubmission?: boolean;
  hasVideoSubmission?: boolean;
}

export const ObjectiveDetailPanel: React.FC<ObjectiveDetailPanelProps> = ({
  isOpen,
  questTitle,
  objectiveDescription,
  uploadedImage,
  onImageSelect,
  onSubmit,
  onClose,
  theme = 'light',
  userDescription = '',
  onUserDescriptionChange,
  hasLinkSubmission = false,
  hasImageSubmission = false,
  hasVideoSubmission = false,
}) => {
  const [activePanel, setActivePanel] = useState<SubmissionType>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [panelContainerHeight, setPanelContainerHeight] = useState<number>(0);

  // Refs for measuring content heights
  const linkPanelContentRef = useRef<HTMLDivElement>(null);
  const imagePanelContentRef = useRef<HTMLDivElement>(null);
  const videoPanelContentRef = useRef<HTMLDivElement>(null);
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const staticContentRef = useRef<HTMLDivElement>(null);

  // Local state for comment if no external handler
  const [localComment, setLocalComment] = useState('');
  const currentComment = onUserDescriptionChange ? userDescription : localComment;
  const handleCommentChange = onUserDescriptionChange || setLocalComment;

  // Function to measure and update panel container height
  const updatePanelHeight = React.useCallback(() => {
    if (!panelContainerRef.current) return;

    let panelContentHeight = 0;

    // Measure the active panel's content height
    // offsetHeight works even when parent is translated, as it measures the element's actual rendered size
    if (activePanel === 'link' && linkPanelContentRef.current) {
      panelContentHeight = linkPanelContentRef.current.offsetHeight || linkPanelContentRef.current.scrollHeight;
    } else if (activePanel === 'image' && imagePanelContentRef.current) {
      panelContentHeight = imagePanelContentRef.current.offsetHeight || imagePanelContentRef.current.scrollHeight;
    } else if (activePanel === 'video' && videoPanelContentRef.current) {
      panelContentHeight = videoPanelContentRef.current.offsetHeight || videoPanelContentRef.current.scrollHeight;
    }

    // Set the container height (minimum 0 if no panel is active)
    setPanelContainerHeight(panelContentHeight);
  }, [activePanel, uploadedImage, linkUrl, videoFile]);

  // Update panel height when active panel changes or content changes
  useLayoutEffect(() => {
    if (!isOpen) return;

    // Measure immediately, then again after a short delay to catch any async updates
    updatePanelHeight();
    
    const timeoutId = setTimeout(() => {
      updatePanelHeight();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isOpen, activePanel, uploadedImage, linkUrl, videoFile, updatePanelHeight]);

  // Use ResizeObserver to watch for content size changes
  useEffect(() => {
    if (!isOpen) return;

    const elements = [
      linkPanelContentRef.current,
      imagePanelContentRef.current,
      videoPanelContentRef.current,
    ].filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const resizeObserver = new ResizeObserver(() => {
      updatePanelHeight();
    });

    elements.forEach(el => resizeObserver.observe(el));

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, activePanel, updatePanelHeight]);

  // Also update when images load
  useEffect(() => {
    if (!isOpen || !uploadedImage) return;

    const img = new Image();
    img.onload = () => {
      updatePanelHeight();
    };
    img.src = uploadedImage;
  }, [uploadedImage, isOpen, updatePanelHeight]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActivePanel(null);
      setLinkUrl('');
      setVideoFile(null);
      setIsAnimating(false);
      setPanelContainerHeight(0);
    }
  }, [isOpen]);

  // Handle panel switching with animation
  const handlePanelSwitch = (panelType: SubmissionType) => {
    if (activePanel === panelType) {
      // If clicking the same button, close the panel
      setIsAnimating(true);
      setTimeout(() => {
        setActivePanel(null);
        setIsAnimating(false);
      }, 300);
    } else {
      // Switch to new panel
      setIsAnimating(true);
      setTimeout(() => {
        setActivePanel(panelType);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Check if can submit (at least one submission method has content)
  const canSubmit = 
    (activePanel === 'link' && linkUrl.trim().length > 0) ||
    (activePanel === 'image' && uploadedImage !== null) ||
    (activePanel === 'video' && videoFile !== null) ||
    currentComment.trim().length > 0;

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg w-full max-w-md mx-4 animate-slide-up overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>
            Objective Details
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={staticContentRef}
          className="p-4 overflow-y-auto flex-1"
        >
          {/* Quest Title */}
          <div className="mb-4">
            <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-black'}`}>
              {questTitle}
            </h3>
          </div>

          {/* Objective Description */}
          <div className="mb-6">
            <div className="flex items-start gap-2">
              <span className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description:
              </span>
              <p className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {objectiveDescription}
              </p>
            </div>
          </div>

          {/* Three Submission Method Buttons */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-3">
              {/* Link Button */}
              <button
                onClick={() => handlePanelSwitch('link')}
                className={`relative aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  activePanel === 'link'
                    ? isDark
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-blue-500 bg-blue-50'
                    : isDark
                    ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <LinkIcon 
                  size={32} 
                  className={activePanel === 'link' 
                    ? 'text-blue-500' 
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                  } 
                />
                {hasLinkSubmission && (
                  <div className="absolute top-1 right-1">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </button>

              {/* Image Button */}
              <button
                onClick={() => handlePanelSwitch('image')}
                className={`relative aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  activePanel === 'image'
                    ? isDark
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-blue-500 bg-blue-50'
                    : isDark
                    ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <ImageIcon 
                  size={32} 
                  className={activePanel === 'image' 
                    ? 'text-blue-500' 
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                  } 
                />
                {hasImageSubmission && (
                  <div className="absolute top-1 right-1">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </button>

              {/* Video Button */}
              <button
                onClick={() => handlePanelSwitch('video')}
                className={`relative aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  activePanel === 'video'
                    ? isDark
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-blue-500 bg-blue-50'
                    : isDark
                    ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <Video 
                  size={32} 
                  className={activePanel === 'video' 
                    ? 'text-blue-500' 
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                  } 
                />
                {hasVideoSubmission && (
                  <div className="absolute top-1 right-1">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Animated Input Panels Container */}
          <div 
            ref={panelContainerRef}
            className="relative mb-4 overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              height: `${panelContainerHeight}px`,
              minHeight: activePanel ? '0' : '0',
            }}
          >
            {/* Link Input Panel */}
            <div
              className={`absolute inset-x-0 top-0 transition-transform duration-300 ease-in-out ${
                activePanel === 'link'
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-full opacity-0 pointer-events-none'
              }`}
            >
              <div 
                ref={linkPanelContentRef}
                className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
              >
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Link URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter a URL to your submission
                </p>
              </div>
            </div>

            {/* Image Input Panel */}
            <div
              className={`absolute inset-x-0 top-0 transition-transform duration-300 ease-in-out ${
                activePanel === 'image'
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-full opacity-0 pointer-events-none'
              }`}
            >
              <div 
                ref={imagePanelContentRef}
                className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
              >
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image Upload
                </label>
                <label htmlFor="image-upload-input" className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-4 transition-colors text-center ${
                    isDark 
                      ? 'border-gray-600 hover:border-blue-400' 
                      : 'border-gray-300 hover:border-blue-500'
                  }`}>
                    {uploadedImage ? (
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded" 
                        className="max-w-full max-h-48 mx-auto rounded"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon 
                          size={48} 
                          className={`mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                        />
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Click to select image
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageSelect}
                    className="hidden"
                    id="image-upload-input"
                  />
                </label>
              </div>
            </div>

            {/* Video Input Panel */}
            <div
              className={`absolute inset-x-0 top-0 transition-transform duration-300 ease-in-out ${
                activePanel === 'video'
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-full opacity-0 pointer-events-none'
              }`}
            >
              <div 
                ref={videoPanelContentRef}
                className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
              >
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Video Upload
                </label>
                <label htmlFor="video-upload-input" className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-4 transition-colors text-center ${
                    isDark 
                      ? 'border-gray-600 hover:border-blue-400' 
                      : 'border-gray-300 hover:border-blue-500'
                  }`}>
                    {videoFile ? (
                      <div className="text-center">
                        <Video size={48} className={`mx-auto mb-2 text-blue-500`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {videoFile.name}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video 
                          size={48} 
                          className={`mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                        />
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Click to select video
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                      }
                    }}
                    className="hidden"
                    id="video-upload-input"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Comment Field */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Comment (Optional)
            </label>
            <textarea
              value={currentComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
              canSubmit
                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                : isDark
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

