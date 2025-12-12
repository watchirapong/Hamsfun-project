'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Gamepad2, Monitor, Paintbrush, Code, ChevronRight, Star, Crown, Users, Ticket, Coins, Edit2, Gift, Moon, Sun } from 'lucide-react';
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
import { RewardNotificationContainer } from '@/components/common/RewardNotification';
import { CoinFlightAnimation, CoinFlightInstance } from '@/components/common/CoinFlightAnimation';
import { QuestNotificationContainer, QuestNotificationData } from '@/components/common/QuestNotification';
import { LeaderboardItemComponent } from '@/components/common/LeaderboardItem';
import { HouseLeaderboardItemComponent } from '@/components/leaderboard/HouseLeaderboardItem';
import { TeamLeaderboardItemComponent } from '@/components/leaderboard/TeamLeaderboardItem';
import { BackpackItemComponent } from '@/components/items/BackpackItem';
import { ImageUploadModal } from '@/components/quests/ImageUploadModal';
import { ObjectiveDetailPanel } from '@/components/quests/ObjectiveDetailPanel';
import { ItemsOverlay } from '@/components/items/ItemsOverlay';
import { SettingsOverlay } from '@/components/common/SettingsOverlay';
import { QuestListOverlay } from '@/components/quests/QuestListOverlay';
import { BadgeOverlay } from '@/components/skills/BadgeOverlay';
import { LeaderboardOverlay } from '@/components/leaderboard/LeaderboardOverlay';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUI } from '@/hooks/useUI';
import { useItems } from '@/hooks/useItems';
import { useRewards } from '@/hooks/useRewards';
import { useRewardPolling } from '@/hooks/useRewardPolling';
import { useNewQuestNotification } from '@/hooks/useNewQuestNotification';
import { initializeApp } from '@/services/appInitialization';
import { useQuestHandlers } from '@/handlers/questHandlers';
import { useProfileHandlers } from '@/handlers/profileHandlers';
import { useSkillHandlers } from '@/handlers/skillHandlers';
import { socketService } from '@/services/socketService';
import LoadingScreen from '@/components/common/LoadingScreen';

const App: React.FC = () => {
  // Theme management
  const { theme, setTheme, toggleTheme, showSettingsOverlay, setShowSettingsOverlay } = useTheme();
  
  // Authentication and user data
  const { isLoading, setIsLoading, isAuthenticated, setIsAuthenticated, user, setUser, skills, setSkills, handleLogout } = useAuth();
  
  // UI state management
  const ui = useUI();
  const {
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
  
  // Ref for coin display position
  const coinDisplayRef = useRef<HTMLDivElement>(null);
  
  // Coin flight animation state
  const [coinFlights, setCoinFlights] = useState<CoinFlightInstance[]>([]);
  
  // Quest notification state
  const [questNotification, setQuestNotification] = useState<QuestNotificationData | null>(null);
  
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

  // Initialize WebSocket connection
  useEffect(() => {
    if (isAuthenticated) {
      const token = getToken();
      if (token) {
        const socket = socketService.connect({
          url: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.questcity.cloud',
          path: process.env.NEXT_PUBLIC_SOCKET_PATH || '/hamster-world-api/socket.io',
          token: token
        });

        socket.on('quest_updated', (data: any) => {
          console.log('Quest Update Received:', data);
          // Refresh quests to get the latest status
          initializeApp({
            setIsLoading: () => {}, // Don't show loading screen for background refresh
            setIsAuthenticated,
            setUser,
            setSkills,
            setQuestsState,
            setBackpackItems
          });
          
          // You could also show a notification here
          if (data.status === 'Approved') {
            // triggerRewardAnimation or show notification
          }
        });

        return () => {
          socketService.disconnect();
        };
      }
    }
  }, [isAuthenticated]);

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
    rewardNotifications,
    removeRewardNotification,
    pendingRewards,
    applyPendingRewards,
    applyPendingRewardsWithAnimations,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    awardedRewards,
  } = useRewards(setUser, setSkills);

  // Apply pending rewards with smooth animations when quest overlay closes
  useEffect(() => {
    if (!showQuestOverlay && pendingRewards.length > 0) {
      // Trigger burst on all active animations before clearing
      setRewardAnimations(prev => prev.map(anim => ({ ...anim, forceBurst: true })));
      
      // Find coin rewards
      const coinRewards = pendingRewards.filter(r => r.type === 'coins');
      const totalCoins = coinRewards.reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0);
      
      // Trigger coin flight animation if there are coin rewards
      if (totalCoins > 0 && coinDisplayRef.current) {
        const coinDisplayRect = coinDisplayRef.current.getBoundingClientRect();
        const targetX = coinDisplayRect.left + coinDisplayRect.width / 2;
        const targetY = coinDisplayRect.top + coinDisplayRect.height / 2;
        
        // Spawn coins at bottom of screen
        const mainPageWidth = 428;
        const mainPageLeft = (window.innerWidth - mainPageWidth) / 2;
        const mainPageRight = mainPageLeft + mainPageWidth;
        const coinSize = 48;
        const margin = 20;
        const minX = mainPageLeft + margin + coinSize / 2;
        const maxX = mainPageRight - margin - coinSize / 2;
        
        // Create coin flight instances (one per coin, up to a reasonable max)
        const numCoins = Math.min(totalCoins, 30); // Cap at 30 coins for performance
        const newCoinFlights: CoinFlightInstance[] = [];
        const now = Date.now();
        
        for (let i = 0; i < numCoins; i++) {
          const startX = minX + Math.random() * (maxX - minX);
          const startY = window.innerHeight - 100; // Bottom area, not fully off-screen
          const delay = i * 20; // Stagger coins slightly
          
          newCoinFlights.push({
            id: `coin-${now}-${i}`,
            startX,
            startY,
            targetX,
            targetY,
            startTime: now + delay,
          });
        }
        
        setCoinFlights(newCoinFlights);
      }
      
      // Apply pending rewards with smooth counting animations after a short delay
      // Start number increment animation when coins start reaching target
      setTimeout(() => {
        if (applyPendingRewardsWithAnimations) {
          applyPendingRewardsWithAnimations(user, skills, setUser, setSkills);
        }
      }, 300);
      
      // Clear animations after burst completes (600ms)
      setTimeout(() => {
        setRewardAnimations([]);
      }, 600);
    }
  }, [showQuestOverlay, pendingRewards, applyPendingRewardsWithAnimations, user, skills, setRewardAnimations]);
  
  // Handle coin flight completion
  const handleCoinFlightComplete = useCallback((coinId: string) => {
    setCoinFlights(prev => prev.filter(coin => coin.id !== coinId));
  }, []);
  
  const [questsState, setQuestsState] = useState<Quest[]>([]);
  
  // Use new quest notification hook (backend + localStorage based)
  // This hook fetches active quests from backend and compares with localStorage
  const { hasNewQuests, newQuestIds, isLoading: isCheckingNewQuests } = useNewQuestNotification(
    isAuthenticated,
    user.isHamster || false
  );
  
  // Show notification when new quests are detected
  useEffect(() => {
    if (hasNewQuests && newQuestIds.length > 0) {
      const notificationId = `quest-notification-${Date.now()}`;
      setQuestNotification({
        id: notificationId,
        questIds: newQuestIds,
        count: newQuestIds.length,
      });
    }
  }, [hasNewQuests, newQuestIds]);
  
  // Handle quest notification removal
  const handleRemoveQuestNotification = useCallback(() => {
    setQuestNotification(null);
  }, []);
  
  // Handle view quests action
  const handleViewQuests = useCallback(() => {
    setSelectedQuestId(null);
    setShowQuestOverlay(true);
    setQuestNotification(null);
  }, [setSelectedQuestId, setShowQuestOverlay]);

  // User and skills are managed by useAuth hook

  // Leaderboard data from API (houses for regular users, teams for hamsters)
  const { houseLeaderboard, teamLeaderboard, hamsterLeaderboard, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard(user.isHamster);
  
  // Handler to fetch house members
  const handleFetchHouseMembers = async (houseId: string) => {
    try {
      const members = await leaderboardAPI.getHouseMembers(houseId);
      // Sort will be handled by HouseLeaderboardItem component
      return members;
    } catch (error) {
      console.error('Failed to fetch house members:', error);
      return [];
    }
  };

  // parseItemDate is now in useItems hook

  // Items are managed by useItems hook

  // Reward polling for approved rewards
  useRewardPolling({
    questsState,
    setQuestsState,
    setUser,
    setSkills,
    triggerRewardAnimation,
    handleSkillLevelUp,
    awardedRewards,
    awardObjectiveReward
  });

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
    applyPendingRewards,
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
    handleClaimObjectiveReward,
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



// ... (existing imports)

// Inside App component:
  // Show loading screen
  if (isLoading) {
    return <LoadingScreen theme={theme} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`rounded-xl shadow-lg p-8 max-w-md w-full mx-4 relative ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
          
          <h1 className={`text-2xl font-bold text-center mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Welcome to HamsterWorld</h1>
          <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Please login to continue</p>
          <div className="space-y-4">
            <button
              onClick={() => {
                try {
                  // The redirectUri should point to where we want to return after auth
                  // The backend will redirect to /auth/handover with the token
                  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/handover`;
                  authAPI.discordLogin(redirectUri);
                } catch (error) {
                  console.error('Discord login error:', error);
                  alert('Failed to connect to authentication server. Please try again later.');
                }
              }}
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
          <RewardAnimation key={animation.id} animation={animation} theme={theme} />
        ))}
        
        {/* Reward Notifications */}
        <RewardNotificationContainer
          notifications={rewardNotifications}
          onRemove={removeRewardNotification}
        />
        
        {/* Quest Notification */}
        <QuestNotificationContainer
          notification={questNotification}
          onRemove={handleRemoveQuestNotification}
          onViewQuests={handleViewQuests}
          theme={theme}
        />
        
        {/* Coin Flight Animation */}
        <CoinFlightAnimation
          coins={coinFlights}
          onComplete={handleCoinFlightComplete}
          theme={theme}
        />
        
        {/* Header */}
        <Header
        description={description}
        isEditingDescription={isEditingDescription}
        coins={user.coins}
        balls={user.balls}
        isHamster={user.isHamster}
        theme={theme}
        onDescriptionChange={setDescription}
        onDescriptionEdit={() => setIsEditingDescription(true)}
        onDescriptionBlur={() => setIsEditingDescription(false)}
        onSettingsClick={() => setShowSettingsOverlay(true)}
        coinDisplayRef={coinDisplayRef}
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
      <div className="px-4 py-4">
        <h2 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Complete tasks and Badge</h2>
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
      <div className="px-4 py-4">
        {/* Show first 2 uncompleted quests on main page (including those with all objectives done but reward not claimed) */}
        {/* Sort so Main Quests appear first */}
        {questsState
          .filter(quest => !isQuestTrulyCompleted(quest))
          .sort((a, b) => {
            // Main Quests first
            const aIsMain = a.type === "Main";
            const bIsMain = b.type === "Main";
            if (aIsMain && !bIsMain) return -1;
            if (!aIsMain && bIsMain) return 1;
            // If both are Main Quests or both are not, maintain original order
            return 0;
          })
          .slice(0, 2)
          .map((quest) => (
            <QuestCard 
              key={quest.id} 
              quest={quest} 
              onQuestClick={handleQuestCardClick}
              theme={theme}
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
      <div className="px-4 py-4">
        <h2 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          {user.isHamster ? '🐹 Team Leaderboard' : 'Leader Board'}
        </h2>
        {leaderboardLoading ? (
          <div className="text-center py-4 text-gray-500">Loading leaderboard...</div>
        ) : leaderboardError ? (
          <div className="text-center py-4 text-red-500">Failed to load leaderboard</div>
        ) : user.isHamster ? (
          // Hamster user: Show team leaderboard
          teamLeaderboard.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No team data available</div>
          ) : (
            <>
              {/* Show top 5 teams for hamsters */}
              {teamLeaderboard.slice(0, 5).map((team) => (
                <TeamLeaderboardItemComponent 
                  key={team._id} 
                  team={team}
                  theme={theme}
                />
              ))}
              {teamLeaderboard.length > 5 && (
                <div 
                  onClick={() => setShowLeaderboardOverlay(true)}
                  className="text-center py-2 text-yellow-500 text-sm font-medium cursor-pointer"
                >
                  View All ({teamLeaderboard.length} teams)
                </div>
              )}
            </>
          )
        ) : (
          // Regular user: Show house leaderboard
          houseLeaderboard.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No leaderboard data available</div>
          ) : (
            <>
              {/* Show only top 5 houses on main page */}
              {houseLeaderboard.slice(0, 5).map((item) => (
                <HouseLeaderboardItemComponent 
                  key={item.houseId || item.rank} 
                  item={item}
                  onFetchMembers={handleFetchHouseMembers}
                  theme={theme}
                  currentUserDiscordUsername={user.name}
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
          )
        )}
          </div>

      {/* Backpack Section */}
      <div className="px-4 py-4">
        <h2 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Items in Backpack</h2>
        {sortItems(backpackItems).slice(0, 3).map((item) => (
          <BackpackItemComponent 
            key={item.id} 
            item={item} 
            onUse={handleUseItem} 
            onDelete={handleDeleteItem} 
            theme={theme}
          />
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
          handleClaimObjectiveReward={handleClaimObjectiveReward}
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
          theme={theme}
        />
      )}
      
      {/* Leaderboard Overlay */}
      {showLeaderboardOverlay && (
        <LeaderboardOverlay
          houseLeaderboard={houseLeaderboard}
          teamLeaderboard={teamLeaderboard}
          isHamster={user.isHamster}
          theme={theme}
          onClose={() => setShowLeaderboardOverlay(false)}
          onFetchMembers={handleFetchHouseMembers}
          currentUserDiscordUsername={user.name}
        />
      )}

      {/* Objective Detail Panel */}
      {selectedObjective && (() => {
        const quest = questsState.find(q => q.id === selectedObjective.questId);
        const questTitle = quest?.title || 'Quest';
        const objectiveDescription = 
          quest?.objectives[selectedObjective.objectiveIndex]?.description ||
          quest?.description ||
          'No description available';
        
        return (
          <ObjectiveDetailPanel
            isOpen={showImageUploadModal}
            questTitle={questTitle}
            objectiveDescription={objectiveDescription}
          uploadedImage={uploadedImage}
          onImageSelect={handleImageSelect}
          onSubmit={handleSubmitImage}
          onClose={() => {
            setShowImageUploadModal(false);
            setSelectedObjective(null);
            setUploadedImage(null);
            setDescription('');
          }}
          theme={theme}
          userDescription={description}
          onUserDescriptionChange={setDescription}
          hasLinkSubmission={false} // TODO: Track link submissions when implemented
          hasImageSubmission={
            (() => {
              const quest = questsState.find(q => q.id === selectedObjective.questId);
              const submission = quest?.objectiveSubmissions?.[selectedObjective.objectiveIndex];
              return submission?.status !== 'none' && submission?.imageUrl !== null;
            })()
          }
          hasVideoSubmission={false} // TODO: Track video submissions when implemented
          />
        );
      })()}
        </div>
      </div>
    </>
  );
};

export default App;
