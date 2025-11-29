# Refactoring Summary: Extracting Functions from page.tsx

## Completed Extractions

### Hooks Created:
1. **useTheme.ts** - Theme management (theme state, localStorage, toggle)
2. **useAuth.ts** - Authentication and user initialization (partial - needs quest/inventory fetching)
3. **useUI.ts** - UI state management (overlays, modals, selected items)
4. **useItems.ts** - Backpack items state and handlers

### Services Created:
1. **rewardService.ts** - Reward calculation utilities (getRequiredXpForLevel, calculatePetLevelProgression)

## Remaining Functions to Extract

### Quest Management (useQuests hook needed):
- `questsState` and `setQuestsState`
- `handleQuestCardClick`
- `handleObjectiveClick`
- `handleImageSelect`
- `handleSubmitImage`
- `handleApproveObjective`
- `handleClaimReward`
- `handleApproveReward`
- `updateQuestStep`
- `toggleQuestExpansion`
- Quest fetching logic from initializeApp

### Reward Management (useRewards hook needed):
- `rewardAnimations` and `setRewardAnimations`
- `levelUpAnimations` and `setLevelUpAnimations`
- `triggerRewardAnimation`
- `awardObjectiveReward`
- `awardQuestRewards`
- `handleSkillLevelUp`
- `processingObjectives` ref
- `rewardAnimationsInProgress` ref
- `awardedRewards` ref
- `animationIdCounter` ref

### User/Rank Management (add to useAuth or create useRank):
- `canRankUp`
- `handleRankUp`
- `rankCardFlipped` state (already in useUI)

### Helper Functions (move to utils/helpers.ts):
- `parseItemDate` (already in useItems, but should be in utils)
- `hasItemTimePassed` (already in utils)
- `isItemExpired` (already in utils)

### Constants:
- `leaderboard` - Move to a constants file or service

## Next Steps

1. Create useQuests hook with all quest-related state and handlers
2. Create useRewards hook with all reward-related state and handlers
3. Update useAuth to include quest and inventory fetching in initialization
4. Update useItems to include initialization from API
5. Move remaining helper functions to utils
6. Update page.tsx to use all hooks

