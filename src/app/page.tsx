'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Gamepad2, Monitor, Paintbrush, Code, ChevronRight, Star, Crown, Users, Ticket, Coins, Edit2, Gift } from 'lucide-react';
import { userAPI, questAPI, authAPI, leaderboardAPI, getToken, setToken, removeToken } from '@/lib/api';
import { 
  User, 
  Skill, 
  Quest, 
  LeaderboardItem, 
  BackpackItem,
  RANKS,
  type RankName,
  type RankObjective,
  type ObjectiveReward,
  type ApprovalStatus,
  type QuestObjective,
  type ObjectiveSubmission
} from '@/types';
import { 
  getBadgeIconPath, 
  getRankIconPath, 
  calculateProgress, 
  areAllObjectivesCompleted, 
  isQuestTrulyCompleted,
  getApprovedObjectivesCount,
  isItemExpired,
  hasItemTimePassed,
  parseDate,
  sortItems
} from '@/utils/helpers';
import {
  mapBackendRewardTypeToFrontend,
  calculateRewardValue,
  mapBackendRewardEntryToFrontend,
  extractSubQuestIdFromProgress,
  extractSubQuestIdFromSubQuest
} from '@/utils/questHelpers';
import {
  mapApiSkillNameToDisplayName,
  processBadgePointsFromApi,
  processCoinsFromApi,
  processRankPointsFromApi,
  hasValidGrantedRewards
} from '@/utils/rewardHelpers';
import { Header } from '@/components/profile/Header';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { QuestCard } from '@/components/quests/QuestCard';
import { SkillCard } from '@/components/skills/SkillCard';
import { RewardAnimation } from '@/components/common/RewardAnimation';
import { LeaderboardItemComponent } from '@/components/common/LeaderboardItem';
import { HouseLeaderboardItemComponent } from '@/components/leaderboard/HouseLeaderboardItem';
import { BackpackItemComponent } from '@/components/items/BackpackItem';
import { ImageUploadModal } from '@/components/quests/ImageUploadModal';
import { ItemsOverlay } from '@/components/items/ItemsOverlay';
import { SettingsOverlay } from '@/components/common/SettingsOverlay';
import { QuestListOverlay } from '@/components/quests/QuestListOverlay';
import { BadgeOverlay } from '@/components/skills/BadgeOverlay';
import { LeaderboardOverlay } from '@/components/leaderboard/LeaderboardOverlay';
import { mockQuests } from '@/data/mockQuests';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUI } from '@/hooks/useUI';
import { useItems } from '@/hooks/useItems';
import { useRewards } from '@/hooks/useRewards';
import { initializeApp } from '@/services/appInitialization';
import { useQuestHandlers } from '@/handlers/questHandlers';
import { useProfileHandlers } from '@/handlers/profileHandlers';
import { useSkillHandlers } from '@/handlers/skillHandlers';

const App: React.FC = () => {
  // Theme management
  const { theme, setTheme, showSettingsOverlay, setShowSettingsOverlay } = useTheme();
  
  // Authentication and user data
  const { isLoading, setIsLoading, isAuthenticated, setIsAuthenticated, user, setUser, skills, setSkills, handleLogout } = useAuth();
  
  // UI state management
  const ui = useUI();
  const {
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
    showLeaderboardOverlay,
    setShowLeaderboardOverlay,
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
  } = ui;
  
  // Items management
  const { backpackItems, setBackpackItems, handleUseItem, handleDeleteItem } = useItems();
  
  // Ref to prevent duplicate reward awarding (React StrictMode causes double execution in dev)
  const processingObjectives = useRef<Set<string>>(new Set());
  
  // Ref to track if quest panel should animate (only on manual open)
  const questPanelShouldAnimate = useRef<boolean>(false);
  
  // Ref to track scroll position to preserve it during updates
  const scrollPositionRef = useRef<{ container: HTMLElement | null; scrollTop: number }>({
    container: null,
    scrollTop: 0
  });
  
  // Reward refs are now in useRewards hook

  // Handle authentication and fetch initial data
  useEffect(() => {
    initializeApp({
      setIsLoading,
      setIsAuthenticated,
      setUser,
      setSkills,
      setQuestsState,
      setBackpackItems
    });
  }, []);

  // Cancel reward animations when quest overlay closes
  useEffect(() => {
    if (!showQuestOverlay) {
      // Clear all reward animations when overlay closes
      setRewardAnimations([]);
    }
  }, [showQuestOverlay]);

  // Restore scroll position when image upload modal closes
  useEffect(() => {
    if (!showImageUploadModal && scrollPositionRef.current.container) {
      // Restore scroll position after modal closes
      setTimeout(() => {
        const containers = document.querySelectorAll('.overflow-y-auto');
        const container = Array.from(containers).find(el => {
          const rect = el.getBoundingClientRect();
          return rect.height > 200;
        }) as HTMLElement;
        
        if (container && scrollPositionRef.current.scrollTop > 0) {
          container.scrollTop = scrollPositionRef.current.scrollTop;
        }
      }, 0);
      }
  }, [showImageUploadModal]);
  
  // Rewards management
  const {
    rewardAnimations,
    setRewardAnimations,
    levelUpAnimations,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    awardedRewards,
  } = useRewards(setUser, setSkills);
  
  const [questsState, setQuestsState] = useState<Quest[]>(mockQuests);

  // User and skills are managed by useAuth hook

  // Leaderboard data from API (houses)
  const { houseLeaderboard, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard();
  
  // Handler to fetch house members
  const handleFetchHouseMembers = async (houseId: string) => {
    try {
      const members = await leaderboardAPI.getHouseMembers(houseId);
      // Sort members by leaderboardScore (descending)
      return members.sort((a: any, b: any) => (b.leaderboardScore || 0) - (a.leaderboardScore || 0));
    } catch (error) {
      console.error('Failed to fetch house members:', error);
      return [];
    }
  };

  // parseItemDate is now in useItems hook

  // Items are managed by useItems hook

  // Quest handlers
  const questHandlers = useQuestHandlers({
    questsState,
    setQuestsState,
    setSelectedQuestId,
    setShowQuestOverlay,
    setShowImageUploadModal,
    setSelectedObjective,
    setUploadedImage,
    setDescription,
    setRewardAnimations,
    setUser,
    setSkills,
    triggerRewardAnimation,
    handleSkillLevelUp,
    awardedRewards,
    processingObjectives,
    questPanelShouldAnimate,
    scrollPositionRef,
    selectedObjective,
    uploadedImage,
    description,
    awardObjectiveReward,
    awardQuestRewards,
  });

  const {
    handleQuestCardClick,
    toggleQuestExpansion,
    handleObjectiveClick,
    handleImageSelect,
    handleSubmitImage,
    handleApproveObjective,
    handleClaimReward,
    handleApproveReward,
  } = questHandlers;

  // Profile handlers
  const profileHandlers = useProfileHandlers({
    user,
    questsState,
    setUser,
  });

  const { canRankUp, handleRankUp } = profileHandlers;

  // Skill handlers
  const skillHandlers = useSkillHandlers({
    setSelectedSkill,
    setShowBadgeOverlay,
  });

  const { handleSkillCardClick } = skillHandlers;


  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
    }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Welcome to HamsterWorld</h1>
          <p className="text-gray-600 text-center mb-6">Please login to continue</p>
          <div className="space-y-4">
            <button
              onClick={() => authAPI.discordLogin(window.location.origin)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Login with Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full screen background with theme */}
      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Centered page container with fixed width (mobile-like) */}
        <div className={`mx-auto max-w-[428px] min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 text-white shadow-2xl' : 'bg-white text-black shadow-2xl'}`}>
        {/* Settings Overlay */}
        {showSettingsOverlay && (
          <SettingsOverlay
            theme={theme}
            onClose={() => setShowSettingsOverlay(false)}
            onThemeChange={setTheme}
            onLogout={handleLogout}
          />
        )}
        
        {/* Reward Animations */}
        {rewardAnimations.map((animation) => (
          <RewardAnimation key={animation.id} animation={animation} />
        ))}
        {/* Header */}
        <Header
        description={description}
        isEditingDescription={isEditingDescription}
        coins={user.coins}
        theme={theme}
        onDescriptionChange={setDescription}
        onDescriptionEdit={() => setIsEditingDescription(true)}
        onDescriptionBlur={() => setIsEditingDescription(false)}
        onSettingsClick={() => setShowSettingsOverlay(true)}
      />

      {/* User Profile Section with Rank Card */}
      <ProfileSection
        user={user}
        questsState={questsState}
        rankCardFlipped={rankCardFlipped}
        theme={theme}
        onRankCardFlip={() => setRankCardFlipped(!rankCardFlipped)}
        onRankUp={handleRankUp}
        canRankUp={canRankUp}
      />

      {/* Skills Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-black text-lg mb-3">Complete tasks and Badge</h2>
        <div className="grid grid-cols-4 gap-4">
          {skills.map((skill, index) => (
            <SkillCard 
              key={index} 
              skill={skill} 
              levelUpAnimations={levelUpAnimations}
              onSkillClick={handleSkillCardClick}
            />
          ))}
        </div>
      </div>

      {/* Quests Section */}
      <div className="px-4 mb-4">
        {/* Show first 2 uncompleted quests on main page (including those with all objectives done but reward not claimed) */}
        {questsState
          .filter(quest => !isQuestTrulyCompleted(quest))
          .slice(0, 2)
          .map((quest) => (
            <QuestCard 
              key={quest.id} 
              quest={quest} 
              onQuestClick={handleQuestCardClick}
            />
          ))}
        <button 
          className="w-full bg-[#4EAAFF] text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          onClick={() => {
            setSelectedQuestId(null);
            setShowQuestOverlay(true);
          }}
        >
          More Quests
        </button>
          </div>
          
      {/* Leaderboard Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-lg mb-3 text-black">Leader Board</h2>
        {leaderboardLoading ? (
          <div className="text-center py-4 text-gray-500">Loading leaderboard...</div>
        ) : leaderboardError ? (
          <div className="text-center py-4 text-red-500">Failed to load leaderboard</div>
        ) : houseLeaderboard.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No leaderboard data available</div>
        ) : (
          <>
            {/* Show only top 5 houses on main page */}
            {houseLeaderboard.slice(0, 5).map((item) => (
              <HouseLeaderboardItemComponent 
                key={item.houseId || item.rank} 
                item={item}
                onFetchMembers={handleFetchHouseMembers}
              />
            ))}
            {houseLeaderboard.length > 5 && (
              <div 
                onClick={() => setShowLeaderboardOverlay(true)}
                className="text-center py-2 text-blue-500 text-sm font-medium cursor-pointer"
              >
                View All ({houseLeaderboard.length} houses)
              </div>
            )}
          </>
        )}
      </div>

      {/* Backpack Section */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-lg mb-3 text-black">Items in Backpack</h2>
        {sortItems(backpackItems).slice(0, 3).map((item) => (
          <BackpackItemComponent key={item.id} item={item} onUse={handleUseItem} onDelete={handleDeleteItem} />
        ))}
        <button 
          className="w-full bg-[#4EAAFF] text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          onClick={() => setShowItemsOverlay(true)}
        >
          More Items
        </button>
        </div>

      {/* Quest Overlay */}
      {showQuestOverlay && (
        <QuestListOverlay
          questsState={questsState}
          theme={theme}
          showQuestOverlay={showQuestOverlay}
          setShowQuestOverlay={setShowQuestOverlay}
          selectedQuestId={selectedQuestId}
          setSelectedQuestId={setSelectedQuestId}
          questPanelShouldAnimate={questPanelShouldAnimate}
          handleObjectiveClick={handleObjectiveClick}
          handleClaimReward={handleClaimReward}
          handleApproveObjective={handleApproveObjective}
          handleApproveReward={handleApproveReward}
            />
      )}

      {/* Items Overlay */}
      {showItemsOverlay && (
        <ItemsOverlay
          items={backpackItems}
          theme={theme}
          onClose={() => setShowItemsOverlay(false)}
          onUseItem={handleUseItem}
          onDeleteItem={handleDeleteItem}
        />
      )}
      
      {/* Badge Overlay */}
      {showBadgeOverlay && (
        <BadgeOverlay
          selectedSkill={selectedSkill}
          setShowBadgeOverlay={setShowBadgeOverlay}
        />
      )}
      
      {/* Leaderboard Overlay */}
      {showLeaderboardOverlay && (
        <LeaderboardOverlay
          houseLeaderboard={houseLeaderboard}
          theme={theme}
          onClose={() => setShowLeaderboardOverlay(false)}
          onFetchMembers={handleFetchHouseMembers}
        />
      )}

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageUploadModal && selectedObjective !== null}
        uploadedImage={uploadedImage}
        onImageSelect={handleImageSelect}
        onSubmit={handleSubmitImage}
        onClose={() => {
          setShowImageUploadModal(false);
          setSelectedObjective(null);
          setUploadedImage(null);
        }}
      />
        </div>
      </div>
    </>
  );
};

export default App;
