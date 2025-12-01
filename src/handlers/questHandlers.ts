import { useCallback } from 'react';
import { questAPI } from '@/lib/api';
import { Quest, ObjectiveReward } from '@/types';
import { getApprovedObjectivesCount, areAllObjectivesCompleted } from '@/utils/helpers';
import { hasValidGrantedRewards } from '@/utils/rewardHelpers';
import { processBadgePointsFromApi, processCoinsFromApi, processRankPointsFromApi, processLeaderboardPointsFromApi, processItemsFromApi } from '@/utils/rewardHelpers';
import { getItemIconUrl } from '@/utils/itemHelpers';
import { validateObjectiveBadgePoints, validateQuestCompletionBadgePoints } from '@/utils/badgeValidation';
import { refreshBadgeDataFromBackend } from '@/utils/badgeSync';

interface QuestHandlersParams {
  questsState: Quest[];
  setQuestsState: React.Dispatch<React.SetStateAction<Quest[]>>;
  setSelectedQuestId: React.Dispatch<React.SetStateAction<number | null>>;
  setShowQuestOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  setShowImageUploadModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedObjective: React.Dispatch<React.SetStateAction<{ questId: number; objectiveIndex: number } | null>>;
  setUploadedImage: React.Dispatch<React.SetStateAction<string | null>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setRewardAnimations: React.Dispatch<React.SetStateAction<any[]>>;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  setSkills: React.Dispatch<React.SetStateAction<any[]>>;
  triggerRewardAnimation: (reward: any) => void;
  handleSkillLevelUp: (skillName: string, newLevel: number, skillRewards?: { type: string; value: string }[]) => void;
  awardedRewards: Set<string>;
  processingObjectives: React.MutableRefObject<Set<string>>;
  questPanelShouldAnimate: React.MutableRefObject<boolean>;
  scrollPositionRef: React.MutableRefObject<{ container: HTMLElement | null; scrollTop: number }>;
  selectedObjective: { questId: number; objectiveIndex: number } | null;
  uploadedImage: string | null;
  description: string;
  awardObjectiveReward: (reward: ObjectiveReward, contextKey?: string) => void;
  awardQuestRewards: (rewards: ObjectiveReward[], questId: number) => void;
}

/**
 * Creates quest-related handler functions
 */
export const useQuestHandlers = (params: QuestHandlersParams) => {
  const {
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
  } = params;

  // Helper function to update quest step based on approved objectives
  const updateQuestStep = (questId: number) => {
    setQuestsState(prevQuests =>
      prevQuests.map(quest => {
        if (quest.id === questId && quest.steps) {
          const approvedCount = getApprovedObjectivesCount(quest);
          return {
            ...quest,
            currentStep: Math.min(approvedCount, quest.steps.length)
          };
        }
        return quest;
      })
    );
  };

  // Handler for quest card click
  const handleQuestCardClick = (questId: number) => {
    questPanelShouldAnimate.current = true;
    setSelectedQuestId(questId);
    setShowQuestOverlay(true);
  };

  // Handler to toggle quest expansion
  const toggleQuestExpansion = (questId: number) => {
    setSelectedQuestId(prev => prev === questId ? null : questId);
  };

  // Handler to open image upload modal
  const handleObjectiveClick = (questId: number, objectiveIndex: number) => {
    // Preserve scroll position before opening modal
    const questListContainers = document.querySelectorAll('.overflow-y-auto');
    const questListContainer = Array.from(questListContainers).find(el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 200; // Likely the main quest list container
    }) as HTMLElement;
    
    if (questListContainer) {
      scrollPositionRef.current = {
        container: questListContainer,
        scrollTop: questListContainer.scrollTop
      };
    }
    
    const quest = questsState.find(q => q.id === questId);
    if (!quest) return;
    
    // Ensure objectiveSubmissions array exists and has enough entries
    if (!quest.objectiveSubmissions) {
      quest.objectiveSubmissions = [];
    }
    
    // Initialize submission if it doesn't exist
    if (!quest.objectiveSubmissions[objectiveIndex]) {
      quest.objectiveSubmissions[objectiveIndex] = {
        imageUrl: null,
        status: 'none'
      };
    }
    
    const submission = quest.objectiveSubmissions[objectiveIndex];
    // Allow upload if: not approved, not pending (user can resubmit if rejected)
    // Note: pending is shown as completed to user, but we still allow resubmission if rejected
    if (submission && (submission.status === 'none' || submission.status === 'rejected')) {
      // Cancel all reward animations when opening a new submission modal
      setRewardAnimations([]);
      
      setSelectedObjective({ questId, objectiveIndex });
      setUploadedImage(submission.imageUrl || null);
      setShowImageUploadModal(true);
    }
  };

  // Handler for image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler to submit image
  const handleSubmitImage = async () => {
    if (!selectedObjective) return;
    
    // Image is optional according to API guide, but we'll require it for better UX
    if (!uploadedImage) {
      alert('Please upload an image proof before submitting.');
      return;
    }

    // Preserve scroll position before state updates
    const questListContainers = document.querySelectorAll('.overflow-y-auto');
    const questListContainer = Array.from(questListContainers).find(el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 200;
    }) as HTMLElement;
    
    if (questListContainer) {
      scrollPositionRef.current = {
        container: questListContainer,
        scrollTop: questListContainer.scrollTop
      };
    }

    const quest = questsState.find(q => q.id === selectedObjective.questId);
    if (!quest) return;
    
    const objective = quest.objectives[selectedObjective.objectiveIndex];
    if (!objective) return;

    // Check if there's already a pending submission (prevent duplicate API calls)
    const currentSubmission = quest.objectiveSubmissions[selectedObjective.objectiveIndex];
    if (currentSubmission && currentSubmission.status === 'pending') {
      // Already has a pending submission - don't submit again
      alert('This objective already has a pending submission. Please wait for it to be reviewed.');
      return;
    }

    try {
      // Convert base64 image to blob/file
      const formData = new FormData();
      
      // If uploadedImage is a base64 string, convert it to a blob
      if (typeof uploadedImage === 'string' && uploadedImage.startsWith('data:')) {
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        formData.append('imageProof', blob, 'submission.png');
      } else if (uploadedImage && typeof uploadedImage === 'object') {
        // Try to append as File if it's a File object
        try {
          formData.append('imageProof', uploadedImage as any);
        } catch (e) {
          // If not a File, convert to blob
          const blob = new Blob([uploadedImage as any], { type: 'image/png' });
          formData.append('imageProof', blob, 'submission.png');
        }
      }
      
      if (description) {
        formData.append('description', description);
      }
      
      // Add subQuestId to formData if available
      if (objective.subQuestId) {
        formData.append('subQuestId', objective.subQuestId);
      }

      // Submit to API and get response with grantedRewards
      const submitResponse: any = await questAPI.submitQuest(quest.id.toString(), formData);
      
      // Log full response to debug
      console.log('API submitResponse (full):', JSON.stringify(submitResponse, null, 2));
      console.log('API submitResponse keys:', Object.keys(submitResponse || {}));
      
      // Check if rewards were granted by the backend
      // According to API guide: grantedRewards is only present if rewards were actually granted
      // Only show reward UI when grantedRewards is present
      const grantedRewards = submitResponse?.grantedRewards;
      console.log('grantedRewards from API:', grantedRewards);
      
      const hasGrantedRewards = hasValidGrantedRewards(grantedRewards);
      console.log('hasGrantedRewards calculated as:', hasGrantedRewards);

      const processingKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
      
      // Prevent duplicate processing
      if (processingObjectives.current.has(processingKey)) {
        console.log('Already processing this objective, skipping duplicate');
        return;
      }
      processingObjectives.current.add(processingKey);

      // Check if this is a first-time submission by checking current state
      const currentQuest = questsState.find(q => q.id === selectedObjective.questId);
      const currentSubmission = currentQuest?.objectiveSubmissions?.[selectedObjective.objectiveIndex];
      const isFirstTimeSubmission = !currentSubmission || currentSubmission.status === 'none' || currentSubmission.status === 'rejected';
      console.log('Is first-time submission?', isFirstTimeSubmission, 'current status:', currentSubmission?.status);

      // Update local state - status is 'pending' but visually show as completed
      setQuestsState(prevQuests =>
        prevQuests.map(q => {
          if (q.id === selectedObjective.questId) {
            // Ensure arrays exist and have correct length
            const existingRewardsAwarded = q.objectiveRewardsAwarded || [];
            const newRewardsAwarded = [...existingRewardsAwarded];
            while (newRewardsAwarded.length < q.objectives.length) {
              newRewardsAwarded.push(false);
            }
            
            // Mark as awarded only if backend granted rewards
            if (hasGrantedRewards && newRewardsAwarded[selectedObjective.objectiveIndex] !== true) {
              newRewardsAwarded[selectedObjective.objectiveIndex] = true;
            }
            
            const newSubmissions = [...q.objectiveSubmissions];
            newSubmissions[selectedObjective.objectiveIndex] = {
              imageUrl: uploadedImage,
              status: 'pending' // Status is pending in backend, but user sees it as completed
            };
            
            const newCompleted = [...q.objectiveCompleted];
            newCompleted[selectedObjective.objectiveIndex] = true; // Visually show as completed
            
            const updatedQuest = {
              ...q,
              objectiveSubmissions: newSubmissions,
              objectiveCompleted: newCompleted,
              objectiveRewardsAwarded: newRewardsAwarded
            };
            
            // Update step progress
            setTimeout(() => updateQuestStep(selectedObjective.questId), 0);
            
            return updatedQuest;
          }
          return q;
        })
      );

      // Award reward only if backend granted rewards (grantedRewards is present)
      if (hasGrantedRewards) {
        console.log('Processing rewards - hasGrantedRewards:', hasGrantedRewards, 'rewards:', grantedRewards);
        // Process rewards immediately (synchronously) before closing modal
        const rewardKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
        
        // Check if already awarded
        if (!awardedRewards.has(rewardKey)) {
          // Mark as awarded immediately to prevent duplicates
          awardedRewards.add(rewardKey);
          
          // Use grantedRewards from API response
          const rewardsToProcess = grantedRewards;
          
          // Validate badge points before processing
          const currentQuest = questsState.find(q => q.id === selectedObjective.questId);
          if (currentQuest && rewardsToProcess?.badgePoints) {
            const validation = validateObjectiveBadgePoints(
              currentQuest,
              selectedObjective.objectiveIndex,
              rewardsToProcess.badgePoints
            );
            
            if (!validation.isValid) {
              console.error('Badge points validation failed:', validation);
              // Log mismatches but still process rewards (backend is source of truth)
              validation.mismatches.forEach(mismatch => {
                console.error(`Badge mismatch: ${mismatch.skillName} - Expected: ${mismatch.expected}, Received: ${mismatch.received}`);
              });
            }
            
            if (validation.warnings.length > 0) {
              console.warn('Badge points validation warnings:', validation.warnings);
            }
          }
          
          // Process badge points from API response first (if any)
          if (rewardsToProcess && rewardsToProcess.badgePoints && typeof rewardsToProcess.badgePoints === 'object') {
            // Log the badge points being processed for verification
            console.log('Processing badge points from backend:', rewardsToProcess.badgePoints);
            
            processBadgePointsFromApi(
              rewardsToProcess.badgePoints,
              setSkills,
              triggerRewardAnimation,
              handleSkillLevelUp
            );
            
            // Refresh badge data from backend to ensure sync after processing
            // This ensures frontend state matches backend exactly
            setTimeout(async () => {
              await refreshBadgeDataFromBackend(setSkills);
            }, 1000); // Wait 1 second for backend to process
          }
          
          // Also award coins and rank points from API response
          if (rewardsToProcess && rewardsToProcess.coins) {
            processCoinsFromApi(rewardsToProcess.coins, setUser, triggerRewardAnimation);
          }
          
          if (rewardsToProcess && rewardsToProcess.rankPoints) {
            processRankPointsFromApi(rewardsToProcess.rankPoints, setUser, triggerRewardAnimation);
          }
          
          // Process leaderboard points from API response
          if (rewardsToProcess && rewardsToProcess.leaderboardScore) {
            processLeaderboardPointsFromApi(rewardsToProcess.leaderboardScore, setUser, triggerRewardAnimation);
          }
          
          // Process items from API response
          if (rewardsToProcess && rewardsToProcess.items && Array.isArray(rewardsToProcess.items)) {
            processItemsFromApi(rewardsToProcess.items, triggerRewardAnimation, getItemIconUrl);
          }
          
          console.log('Reward awarded for objective:', selectedObjective.objectiveIndex, 'hasGrantedRewards:', hasGrantedRewards);
          
          // Clean up after 5 seconds
          setTimeout(() => {
            awardedRewards.delete(rewardKey);
          }, 5000);
          
          // Close modal after rewards are processed (give time for animations to start)
          setTimeout(() => {
            setShowImageUploadModal(false);
            setSelectedObjective(null);
            setUploadedImage(null);
            setDescription('');
          }, 300);
        } else {
          console.log('Reward already awarded, skipping duplicate:', rewardKey);
          
          // Close modal even if reward was already awarded
          setTimeout(() => {
            setShowImageUploadModal(false);
            setSelectedObjective(null);
            setUploadedImage(null);
            setDescription('');
          }, 100);
        }
        
        // Clear processing flag
        setTimeout(() => {
          processingObjectives.current.delete(processingKey);
        }, 100);
      } else {
        console.log('No rewards granted by backend (resubmission) - skipping reward award for objective:', selectedObjective.objectiveIndex);
        // Clear processing flag even if no reward
        setTimeout(() => {
          processingObjectives.current.delete(processingKey);
        }, 100);
        
        // Close modal even if no rewards (resubmission case)
        setTimeout(() => {
          setShowImageUploadModal(false);
          setSelectedObjective(null);
          setUploadedImage(null);
          setDescription('');
        }, 100);
      }

      // Restore scroll position
      setTimeout(() => {
        if (scrollPositionRef.current.container) {
          scrollPositionRef.current.container.scrollTop = scrollPositionRef.current.scrollTop;
        }
      }, 0);

    } catch (error: any) {
      console.error('Error submitting quest:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      console.error('Full error details:', {
        questId: quest.id,
        questIdString: quest.id.toString(),
        objectiveIndex: selectedObjective.objectiveIndex,
        subQuestId: objective.subQuestId,
        hasImage: !!uploadedImage,
        hasDescription: !!description,
        error: errorMessage,
        errorStack: error?.stack
      });
      
      // Don't close modal on error so user can retry
      alert(`Failed to submit quest: ${errorMessage}. Please check the console for details.`);
      if (selectedObjective) {
        const errorProcessingKey = `${selectedObjective.questId}-${selectedObjective.objectiveIndex}`;
        processingObjectives.current.delete(errorProcessingKey);
      }
      return; // Exit early on error, don't close modal
    }
  };

  // Handler for admin approval (instant confirm for testing)
  const handleApproveObjective = useCallback((questId: number, objectiveIndex: number) => {
    const processingKey = `${questId}-${objectiveIndex}`;
    
    // Prevent duplicate execution (React StrictMode in dev causes double calls)
    if (processingObjectives.current.has(processingKey)) {
      console.log('Already processing this objective, skipping duplicate call');
      return;
    }
    
    // Mark as processing immediately
    processingObjectives.current.add(processingKey);
    
    // Get the reward from current state BEFORE updating (using object ref to access after callback)
        const rewardRef = { value: null as ObjectiveReward | ObjectiveReward[] | null };
    setQuestsState(prevQuests => {
      // First, check if reward was already awarded by looking at current state
      const currentQuest = prevQuests.find(q => q.id === questId);
      if (currentQuest) {
        const existingRewardsAwarded = currentQuest.objectiveRewardsAwarded || [];
        // Ensure array is long enough
        const rewardsAwarded = existingRewardsAwarded.length >= objectiveIndex + 1 
          ? existingRewardsAwarded[objectiveIndex] 
          : false;

        if (rewardsAwarded === true) {
          processingObjectives.current.delete(processingKey);
          console.log('Reward already awarded, skipping');
          return prevQuests; // Return unchanged state if already awarded
        }
        
        // Get the reward from current quest state and store in ref (executes synchronously within callback)
        const objective = currentQuest.objectives[objectiveIndex];
        if (objective) {
          rewardRef.value = objective.reward;
        }
      }
      
      // Now update the state
      return prevQuests.map(quest => {
        if (quest.id === questId) {
          // Ensure objectiveRewardsAwarded array exists and has correct length
          const existingRewardsAwarded = quest.objectiveRewardsAwarded || [];
          const newRewardsAwarded = [...existingRewardsAwarded];
          // Ensure array is long enough for all objectives
          while (newRewardsAwarded.length < quest.objectives.length) {
            newRewardsAwarded.push(false);
          }
          
          // Double-check: if already awarded, don't proceed
          if (newRewardsAwarded[objectiveIndex] === true) {
            processingObjectives.current.delete(processingKey);
            return quest;
          }
          
          // Mark as awarded immediately
          newRewardsAwarded[objectiveIndex] = true;
          
          const newSubmissions = [...quest.objectiveSubmissions];
          newSubmissions[objectiveIndex] = {
            ...newSubmissions[objectiveIndex],
            status: 'approved'
          };
          const newCompleted = [...quest.objectiveCompleted];
          newCompleted[objectiveIndex] = true;

          const updatedQuest = {
            ...quest,
            objectiveSubmissions: newSubmissions,
            objectiveCompleted: newCompleted,
            objectiveRewardsAwarded: newRewardsAwarded
          };
          
          // Update step progress
          setTimeout(() => updateQuestStep(questId), 0);
          
          return updatedQuest;
        }
        return quest;
      });
    });

    // Award reward outside of state update to ensure it only happens once
    // Use setTimeout to ensure the state update callback has executed and rewardRef is set
    setTimeout(() => {
      if (rewardRef.value) {
        // Normalize reward to array
        const rewards = Array.isArray(rewardRef.value) ? rewardRef.value : [rewardRef.value];
        
        // Award each reward
        rewards.forEach((reward, rewardIndex) => {
          // Create unique key for this reward to prevent duplicates
          const rewardKey = `${questId}-${objectiveIndex}-${rewardIndex}`;
          
          // Check if already awarded
          if (!awardedRewards.has(rewardKey)) {
            // Mark as awarded immediately to prevent duplicates
            awardedRewards.add(rewardKey);
            // Pass context key to awardObjectiveReward for better duplicate prevention
            awardObjectiveReward(reward, rewardKey);
            console.log('Reward awarded for objective:', objectiveIndex, 'reward:', rewardIndex);
          } else {
            console.log('Reward already awarded, skipping duplicate:', rewardKey);
          }
        });
      }
    }, 0);
    
    // Clear processing flag after a delay
    setTimeout(() => {
      processingObjectives.current.delete(processingKey);
    }, 100);
  }, [awardedRewards, awardObjectiveReward, processingObjectives, setQuestsState]);

  // Handler to claim reward (submit main quest completion to API)
  const handleClaimReward = async (questId: number) => {
    const quest = questsState.find(q => q.id === questId);
    if (!quest) return;
    
    // Check if all objectives are completed and reward not already claimed
    if (!areAllObjectivesCompleted(quest) || quest.rewardClaimed) {
      return;
    }
    
    // Check if already pending
    if (quest.rewardSubmissionStatus === 'pending') {
      alert('Quest completion reward is already pending approval.');
      return;
    }
    
    try {
      // Submit main quest completion (without subQuestId = submits main quest)
      const formData = new FormData();
      
      // Submit to API - no subQuestId means main quest submission
      const submitResponse: any = await questAPI.submitQuest(quest.id.toString(), formData);
      
      // Check if rewards were granted by the backend
      const grantedRewards = submitResponse?.grantedRewards;
      const hasGrantedRewards = hasValidGrantedRewards(grantedRewards);
      
      // Process rewards from API response
      if (hasGrantedRewards) {
        // Validate badge points before processing
        const validation = validateQuestCompletionBadgePoints(quest, grantedRewards.badgePoints);
        
        if (!validation.isValid) {
          console.error('Quest completion badge points validation failed:', validation);
          validation.mismatches.forEach(mismatch => {
            console.error(`Badge mismatch: ${mismatch.skillName} - Expected: ${mismatch.expected}, Received: ${mismatch.received}`);
          });
        }
        
        if (validation.warnings.length > 0) {
          console.warn('Quest completion badge points validation warnings:', validation.warnings);
        }
        
        // Process badge points from API response
        if (grantedRewards.badgePoints && typeof grantedRewards.badgePoints === 'object') {
          // Log the badge points being processed for verification
          console.log('Processing quest completion badge points from backend:', grantedRewards.badgePoints);
          
          processBadgePointsFromApi(
            grantedRewards.badgePoints,
            setSkills,
            triggerRewardAnimation,
            handleSkillLevelUp
          );
          
          // Refresh badge data from backend to ensure sync after processing
          // This ensures frontend state matches backend exactly
          setTimeout(async () => {
            await refreshBadgeDataFromBackend(setSkills);
          }, 1000); // Wait 1 second for backend to process
        }
        
        // Process coins from API response
        if (grantedRewards.coins) {
          processCoinsFromApi(grantedRewards.coins, setUser, triggerRewardAnimation);
        }
        
        // Process rank points from API response
        if (grantedRewards.rankPoints) {
          processRankPointsFromApi(grantedRewards.rankPoints, setUser, triggerRewardAnimation);
        }
        
        // Process leaderboard points from API response
        if (grantedRewards.leaderboardScore) {
          processLeaderboardPointsFromApi(grantedRewards.leaderboardScore, setUser, triggerRewardAnimation);
        }
        
        // Process items from API response
        if (grantedRewards.items && Array.isArray(grantedRewards.items)) {
          processItemsFromApi(grantedRewards.items, triggerRewardAnimation, getItemIconUrl);
        }
      }
      
      // Update local state to show pending status
      setQuestsState(prevQuests => 
        prevQuests.map(q => {
          if (q.id === questId) {
            return {
              ...q,
              rewardSubmissionStatus: 'pending',
              rewardClaimed: hasGrantedRewards ? true : q.rewardClaimed, // Mark as claimed if rewards were granted
              questRewardsAwarded: hasGrantedRewards ? true : q.questRewardsAwarded
            };
          }
          return q;
        })
      );
      
      console.log('Main quest completion submitted:', submitResponse);
    } catch (error: any) {
      console.error('Error submitting quest completion:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to submit quest completion: ${errorMessage}. Please check the console for details.`);
    }
  };

  // Handler for admin approval of reward (instant confirm for testing)
  const handleApproveReward = useCallback((questId: number) => {
    const processingKey = `quest-reward-${questId}`;
    
    // Prevent duplicate execution (React StrictMode in dev causes double calls)
    if (processingObjectives.current.has(processingKey)) {
      console.log('Already processing quest reward, skipping duplicate call');
      return;
    }
    
    // Mark as processing immediately
    processingObjectives.current.add(processingKey);
    
    // Get the rewards from current state BEFORE updating (using object ref to access after callback)
    const rewardsRef = { value: null as ObjectiveReward[] | null };
    
    setQuestsState(prevQuests => {
      // Normalize questId for comparison (handle string/number differences)
      const normalizedQuestId = String(questId);
      
      // First, check if reward was already awarded by looking at current state
      const currentQuest = prevQuests.find(q => String(q.id) === normalizedQuestId);
      if (currentQuest) {
        // Early check: if reward already awarded, skip
        if (currentQuest.questRewardsAwarded === true) {
          processingObjectives.current.delete(processingKey);
          console.log('Quest reward already awarded, skipping');
          return prevQuests; // Return unchanged state if already awarded
        }
        
        // Store rewards to award outside of state update
        if (currentQuest.rewards && currentQuest.rewards.length > 0) {
          rewardsRef.value = currentQuest.rewards;
        }
      }
      
      // Now update the state
      return prevQuests.map(quest => {
        if (String(quest.id) === normalizedQuestId) {
          // Double-check: if already awarded, don't proceed
          if (quest.questRewardsAwarded === true) {
            processingObjectives.current.delete(processingKey);
            return quest;
          }
          
          return {
            ...quest,
            rewardClaimed: true,
            rewardSubmissionStatus: 'approved',
            questRewardsAwarded: true,
            completed: true
          };
        }
        return quest;
      });
    });
    
    // Award rewards outside of state update to ensure it only happens once
    setTimeout(() => {
      if (rewardsRef.value && rewardsRef.value.length > 0) {
        // Check if any reward from this quest has already been awarded
        // The awardQuestRewards function uses keys like "quest-${questId}-reward-${index}"
        const hasAnyRewardAwarded = rewardsRef.value.some((_, index) => {
          const rewardKey = `quest-${questId}-reward-${index}`;
          return awardedRewards.has(rewardKey);
        });
        
        if (!hasAnyRewardAwarded) {
          // Award all rewards (including badge points) - they will be filtered in UI
          awardQuestRewards(rewardsRef.value, questId);
          console.log('Quest rewards awarded for quest:', questId);
        } else {
          console.log('Quest rewards already awarded, skipping duplicate:', questId);
        }
      }
      
      // Clear processing flag after a delay
      setTimeout(() => {
        processingObjectives.current.delete(processingKey);
      }, 100);
    }, 0);
  }, [awardedRewards, awardQuestRewards, processingObjectives, setQuestsState]);

  return {
    handleQuestCardClick,
    toggleQuestExpansion,
    handleObjectiveClick,
    handleImageSelect,
    handleSubmitImage,
    handleApproveObjective,
    handleClaimReward,
    handleApproveReward,
    updateQuestStep,
  };
};

