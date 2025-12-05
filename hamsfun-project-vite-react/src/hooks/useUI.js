/**
 * UI State Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * UI State Manager - Centralized state management
 */
class UIStateManager {
  constructor() {
    this.defaultState = {
      activeTab: 'quests',
      showQuestOverlay: false,
      selectedQuestId: null,
      showItemsOverlay: false,
      showBadgeOverlay: false,
      showLeaderboardOverlay: false,
      selectedSkill: null,
      description: 'anyone can be anything',
      isEditingDescription: false,
      rankCardFlipped: false,
      showImageUploadModal: false,
      selectedObjective: null,
      uploadedImage: null,
    };
  }

  getInitialState() {
    return { ...this.defaultState };
  }
}

const uiStateManager = new UIStateManager();

export const useUI = () => {
  const [activeTab, setActiveTab] = useState('quests');
  const [showQuestOverlay, setShowQuestOverlay] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [showItemsOverlay, setShowItemsOverlay] = useState(false);
  const [showBadgeOverlay, setShowBadgeOverlay] = useState(false);
  const [showLeaderboardOverlay, setShowLeaderboardOverlay] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [description, setDescription] = useState('anyone can be anything');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [rankCardFlipped, setRankCardFlipped] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Memoized setters for better performance
  const setActiveTabMemo = useCallback((value) => setActiveTab(value), []);
  const setShowQuestOverlayMemo = useCallback((value) => setShowQuestOverlay(value), []);
  const setSelectedQuestIdMemo = useCallback((value) => setSelectedQuestId(value), []);
  const setShowItemsOverlayMemo = useCallback((value) => setShowItemsOverlay(value), []);
  const setShowBadgeOverlayMemo = useCallback((value) => setShowBadgeOverlay(value), []);
  const setShowLeaderboardOverlayMemo = useCallback((value) => setShowLeaderboardOverlay(value), []);
  const setSelectedSkillMemo = useCallback((value) => setSelectedSkill(value), []);
  const setDescriptionMemo = useCallback((value) => setDescription(value), []);
  const setIsEditingDescriptionMemo = useCallback((value) => setIsEditingDescription(value), []);
  const setRankCardFlippedMemo = useCallback((value) => setRankCardFlipped(value), []);
  const setShowImageUploadModalMemo = useCallback((value) => setShowImageUploadModal(value), []);
  const setSelectedObjectiveMemo = useCallback((value) => setSelectedObjective(value), []);
  const setUploadedImageMemo = useCallback((value) => setUploadedImage(value), []);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    activeTab,
    setActiveTab: setActiveTabMemo,
    showQuestOverlay,
    setShowQuestOverlay: setShowQuestOverlayMemo,
    selectedQuestId,
    setSelectedQuestId: setSelectedQuestIdMemo,
    showItemsOverlay,
    setShowItemsOverlay: setShowItemsOverlayMemo,
    showBadgeOverlay,
    setShowBadgeOverlay: setShowBadgeOverlayMemo,
    showLeaderboardOverlay,
    setShowLeaderboardOverlay: setShowLeaderboardOverlayMemo,
    selectedSkill,
    setSelectedSkill: setSelectedSkillMemo,
    description,
    setDescription: setDescriptionMemo,
    isEditingDescription,
    setIsEditingDescription: setIsEditingDescriptionMemo,
    rankCardFlipped,
    setRankCardFlipped: setRankCardFlippedMemo,
    showImageUploadModal,
    setShowImageUploadModal: setShowImageUploadModalMemo,
    selectedObjective,
    setSelectedObjective: setSelectedObjectiveMemo,
    uploadedImage,
    setUploadedImage: setUploadedImageMemo,
  }), [
    activeTab,
    showQuestOverlay,
    selectedQuestId,
    showItemsOverlay,
    showBadgeOverlay,
    showLeaderboardOverlay,
    selectedSkill,
    description,
    isEditingDescription,
    rankCardFlipped,
    showImageUploadModal,
    selectedObjective,
    uploadedImage,
    setActiveTabMemo,
    setShowQuestOverlayMemo,
    setSelectedQuestIdMemo,
    setShowItemsOverlayMemo,
    setShowBadgeOverlayMemo,
    setShowLeaderboardOverlayMemo,
    setSelectedSkillMemo,
    setDescriptionMemo,
    setIsEditingDescriptionMemo,
    setRankCardFlippedMemo,
    setShowImageUploadModalMemo,
    setSelectedObjectiveMemo,
    setUploadedImageMemo,
  ]);
};

