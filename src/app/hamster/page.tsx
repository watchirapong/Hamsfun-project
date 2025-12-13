'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { hamsterAPI, authAPI, leaderboardAPI, getToken } from '@/lib/api';
import { Quest } from '@/types';
import { isQuestTrulyCompleted, sortItems } from '@/utils/helpers';
import { Header } from '@/components/profile/Header';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { QuestCard } from '@/components/quests/QuestCard';
import { SkillCard } from '@/components/skills/SkillCard';
import { RewardAnimation } from '@/components/common/RewardAnimation';
import { RewardNotificationContainer } from '@/components/common/RewardNotification';
import { QuestNotificationContainer, QuestNotificationData } from '@/components/common/QuestNotification';
import { TeamLeaderboardItemComponent } from '@/components/leaderboard/TeamLeaderboardItem';
import { BackpackItemComponent } from '@/components/items/BackpackItem';
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
import { useRouter } from 'next/navigation';

/**
 * Hamster Page - For Hamster users (staff/mentors/admin with isHamster: true)
 * Route: /hamster-quest/hamster
 */
const HamsterPage: React.FC = () => {
  const router = useRouter();
  
  // Theme management
  const { theme, setTheme, toggleTheme, showSettingsOverlay, setShowSettingsOverlay } = useTheme();
  
  // Authentication and user data
  const { isLoading, setIsLoading, isAuthenticated, setIsAuthenticated, user, setUser, skills, setSkills, handleLogout } = useAuth();
  
  // Redirect if user is not a hamster
  useEffect(() => {
    if (!isLoading && isAuthenticated && !user.isHamster) {
      router.replace('/student');
    }
  }, [isLoading, isAuthenticated, user.isHamster, router]);
  
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
    objectiveComment,
    setObjectiveComment,
  } = ui;
  
  // Items management
  const { backpackItems, setBackpackItems, handleUseItem, handleDeleteItem } = useItems();
  
  // Ref to prevent duplicate reward awarding
  const processingObjectives = useRef<Set<string>>(new Set());
  
  // Ref to track if quest panel should animate
  const questPanelShouldAnimate = useRef<boolean>(false);
  
  // Ref to track scroll position
  const scrollPositionRef = useRef<{ container: HTMLElement | null; scrollTop: number }>({
    container: null,
    scrollTop: 0
  });
  
  // Ref for ball display position (used by Header component)
  const coinDisplayRef = useRef<HTMLDivElement>(null);
  
  // Quest notification state
  const [questNotification, setQuestNotification] = useState<QuestNotificationData | null>(null);
  
  const [questsState, setQuestsState] = useState<Quest[]>([]);
  
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
          initializeApp({
            setIsLoading: () => {},
            setIsAuthenticated,
            setUser,
            setSkills,
            setQuestsState,
            setBackpackItems
          });
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
    applyPendingRewardsWithAnimations,
    triggerRewardAnimation,
    awardObjectiveReward,
    awardQuestRewards,
    handleSkillLevelUp,
    awardedRewards,
  } = useRewards(setUser, setSkills);
  
  // Apply pending rewards with animations
  // Note: Hamster users don't get coin rewards, so coin flight animations are disabled
  useEffect(() => {
    if (!showQuestOverlay && pendingRewards.length > 0) {
      setRewardAnimations(prev => prev.map(anim => ({ ...anim, forceBurst: true })));
      
      // Hamster users don't use coins, so skip coin flight animations
      // Only process other reward types (exp, items, etc.)
      
      setTimeout(() => {
        if (applyPendingRewardsWithAnimations) {
          applyPendingRewardsWithAnimations(user, skills, setUser, setSkills);
        }
      }, 300);
      
      setTimeout(() => {
        setRewardAnimations([]);
      }, 600);
    }
  }, [showQuestOverlay, pendingRewards, applyPendingRewardsWithAnimations, user, skills, setRewardAnimations]);
  
  // Coin flight handler removed - hamster users don't use coin animations
  
  // Use new quest notification hook (for hamsters, isHamster = true)
  const { hasNewQuests, newQuestIds } = useNewQuestNotification(
    isAuthenticated,
    true // Hamsters are hamster users
  );
  
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
  
  const handleRemoveQuestNotification = useCallback(() => {
    setQuestNotification(null);
  }, []);
  
  const handleViewQuests = useCallback(() => {
    setSelectedQuestId(null);
    setShowQuestOverlay(true);
    setQuestNotification(null);
  }, [setSelectedQuestId, setShowQuestOverlay]);
  
  // Leaderboard data (teams for hamsters)
  const { teamLeaderboard, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard(true);
  
  // Reward polling
  useRewardPolling({
    isHamster: true,
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
    applyPendingRewards: () => {},
  });
  
  const {
    handleQuestCardClick,
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
  
  // Show loading screen
  if (isLoading) {
    return <LoadingScreen theme={theme} />;
  }
  
  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`rounded-xl shadow-lg p-8 max-w-md w-full mx-4 relative ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <button
            onClick={toggleTheme}
            className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <h1 className={`text-2xl font-bold text-center mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Welcome to HamsterWorld</h1>
          <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Please login to continue</p>
          <div className="space-y-4">
            <button
              onClick={() => {
                try {
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
      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`mx-auto max-w-[428px] min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 text-white shadow-2xl' : 'bg-white text-black shadow-2xl'}`}>
          {showSettingsOverlay && (
            <SettingsOverlay
              theme={theme}
              onClose={() => setShowSettingsOverlay(false)}
              onThemeChange={setTheme}
              onLogout={handleLogout}
            />
          )}
          
          {rewardAnimations
            .filter(animation => animation.type !== 'coins')
            .map((animation) => (
              <RewardAnimation key={animation.id} animation={animation} theme={theme} />
            ))}
          
          <RewardNotificationContainer
            notifications={rewardNotifications.filter(notif => notif.type !== 'coins')}
            onRemove={removeRewardNotification}
          />
          
          <QuestNotificationContainer
            notification={questNotification}
            onRemove={handleRemoveQuestNotification}
            onViewQuests={handleViewQuests}
            theme={theme}
          />
          
          {/* Coin flight animations disabled for hamster users - they use balls, not coins */}
          
          <Header
            description={description}
            isEditingDescription={isEditingDescription}
            coins={0}
            balls={user.balls !== undefined ? user.balls : undefined}
            isHamster={true}
            theme={theme}
            onDescriptionChange={setDescription}
            onDescriptionEdit={() => setIsEditingDescription(true)}
            onDescriptionBlur={() => setIsEditingDescription(false)}
            onSettingsClick={() => setShowSettingsOverlay(true)}
            coinDisplayRef={coinDisplayRef}
          />
          
          <ProfileSection
            user={user}
            questsState={questsState}
            rankCardFlipped={rankCardFlipped}
            theme={theme}
            onRankCardFlip={() => setRankCardFlipped(!rankCardFlipped)}
            onRankUp={handleRankUp}
            canRankUp={canRankUp}
          />
          
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
          
          <div className="px-4 py-4">
            {questsState
              .filter(quest => !isQuestTrulyCompleted(quest))
              .sort((a, b) => {
                const aIsMain = a.type === "Main";
                const bIsMain = b.type === "Main";
                if (aIsMain && !bIsMain) return -1;
                if (!aIsMain && bIsMain) return 1;
                return 0;
              })
              .slice(0, 1)
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
          
          <div className="px-4 py-4">
            <h2 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>🐹 Team Leaderboard</h2>
            {leaderboardLoading ? (
              <div className="text-center py-4 text-gray-500">Loading leaderboard...</div>
            ) : leaderboardError ? (
              <div className="text-center py-4 text-red-500">Failed to load leaderboard</div>
            ) : teamLeaderboard.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No team data available</div>
            ) : (
              <>
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
            )}
          </div>
          
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
          
          {showItemsOverlay && (
            <ItemsOverlay
              items={backpackItems}
              theme={theme}
              onClose={() => setShowItemsOverlay(false)}
              onUseItem={handleUseItem}
              onDeleteItem={handleDeleteItem}
            />
          )}
          
          {showBadgeOverlay && (
            <BadgeOverlay
              selectedSkill={selectedSkill}
              setShowBadgeOverlay={setShowBadgeOverlay}
              theme={theme}
            />
          )}
          
          {showLeaderboardOverlay && (
            <LeaderboardOverlay
              houseLeaderboard={[]}
              teamLeaderboard={teamLeaderboard}
              isHamster={true}
              theme={theme}
              onClose={() => setShowLeaderboardOverlay(false)}
              onFetchMembers={async () => []}
              currentUserDiscordUsername={user.name}
            />
          )}
          
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
                  setObjectiveComment('');
                }}
                theme={theme}
                userDescription={objectiveComment}
                onUserDescriptionChange={setObjectiveComment}
                hasImageSubmission={
                  (() => {
                    const quest = questsState.find(q => q.id === selectedObjective.questId);
                    const submission = quest?.objectiveSubmissions?.[selectedObjective.objectiveIndex];
                    return submission?.status !== 'none' && submission?.imageUrl !== null;
                  })()
                }
              />
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default HamsterPage;

