import { useState } from 'react';
import { Skill } from '@/types';

export const useUI = () => {
  const [activeTab, setActiveTab] = useState<string>('quests');
  const [showQuestOverlay, setShowQuestOverlay] = useState<boolean>(false);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [showItemsOverlay, setShowItemsOverlay] = useState<boolean>(false);
  const [showBadgeOverlay, setShowBadgeOverlay] = useState<boolean>(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [description, setDescription] = useState<string>('anyone can be anything');
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [rankCardFlipped, setRankCardFlipped] = useState<boolean>(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState<boolean>(false);
  const [selectedObjective, setSelectedObjective] = useState<{ questId: number; objectiveIndex: number } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  return {
    activeTab,
    setActiveTab,
    showQuestOverlay,
    setShowQuestOverlay,
    selectedQuestId,
    setSelectedQuestId,
    showItemsOverlay,
    setShowItemsOverlay,
    showBadgeOverlay,
    setShowBadgeOverlay,
    selectedSkill,
    setSelectedSkill,
    description,
    setDescription,
    isEditingDescription,
    setIsEditingDescription,
    rankCardFlipped,
    setRankCardFlipped,
    showImageUploadModal,
    setShowImageUploadModal,
    selectedObjective,
    setSelectedObjective,
    uploadedImage,
    setUploadedImage,
  };
};

