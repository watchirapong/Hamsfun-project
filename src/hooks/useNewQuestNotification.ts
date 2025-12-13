import { useState, useEffect, useCallback, useRef } from 'react';
import { userAPI, hamsterAPI } from '@/lib/api';
import { getUserId, getQuestStorageKey } from '@/utils/userId';

interface NewQuestNotificationResult {
  hasNewQuests: boolean;
  newQuestIds: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to detect new quests by comparing backend active quests with localStorage
 * Uses backend API as source of truth and localStorage to remember previous state
 */
export const useNewQuestNotification = (
  isAuthenticated: boolean,
  isHamsterUser: boolean = false
): NewQuestNotificationResult => {
  const [hasNewQuests, setHasNewQuests] = useState(false);
  const [newQuestIds, setNewQuestIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasCheckedRef = useRef(false);

  /**
   * Get previous quest IDs from localStorage (user-specific)
   */
  const getPreviousQuestIds = useCallback((): string[] | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const userId = getUserId();
      const storageKey = getQuestStorageKey(userId, isHamsterUser);
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.error('Error reading previous quest IDs from localStorage:', error);
      return null;
    }
  }, [isHamsterUser]);

  /**
   * Store current quest IDs to localStorage (user-specific)
   */
  const storeCurrentQuestIds = useCallback((questIds: string[]): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const userId = getUserId();
      const storageKey = getQuestStorageKey(userId, isHamsterUser);
      localStorage.setItem(storageKey, JSON.stringify(questIds));
    } catch (error) {
      console.error('Error storing quest IDs to localStorage:', error);
    }
  }, [isHamsterUser]);

  /**
   * Extract quest IDs from backend active quests response
   */
  const extractQuestIds = useCallback((activeQuests: any[]): string[] => {
    return activeQuests
      .filter((aq: any) => {
        // Filter out quests where questId is null or not populated
        if (!aq.questId) return false;
        // Handle both object and string formats
        if (typeof aq.questId === 'object' && aq.questId._id) {
          return true;
        }
        if (typeof aq.questId === 'string') {
          return true;
        }
        return false;
      })
      .map((aq: any) => {
        // Extract stable quest identifier
        if (typeof aq.questId === 'object' && aq.questId._id) {
          return String(aq.questId._id);
        }
        if (typeof aq.questId === 'string') {
          return aq.questId;
        }
        return null;
      })
      .filter((id: string | null): id is string => id !== null);
  }, []);

  /**
   * Detect new quests by comparing current with previous
   * Follows the spec:
   * - Case A: No previous data → if currentQuestIds.length > 0, treat as new
   * - Case B: Previous quests exist → compute new quest IDs
   * - Case C: Only order changed → no new quest IDs (set-based comparison)
   */
  const detectNewQuests = useCallback((
    currentQuestIds: string[],
    prevQuestIds: string[] | null
  ): { hasNew: boolean; newIds: string[] } => {
    // Case A: No previous data (first time / storage empty)
    if (prevQuestIds === null || prevQuestIds === undefined) {
      // If currentQuestIds.length === 0 → NO notification (user still has no quests)
      // If currentQuestIds.length > 0 → SHOW notification (treat as "new quests")
      return {
        hasNew: currentQuestIds.length > 0,
        newIds: currentQuestIds.length > 0 ? currentQuestIds : [],
      };
    }

    // Case B: Previous quests exist - compute new quest IDs
    const newQuestIds = currentQuestIds.filter(
      id => !prevQuestIds.includes(id)
    );

    // Case C: Only order changed, no new quest IDs
    // Set-based comparison (already handled by filter above)
    return {
      hasNew: newQuestIds.length > 0,
      newIds: newQuestIds,
    };
  }, []);

  /**
   * Check for new quests by fetching from backend and comparing
   */
  const checkForNewQuests = useCallback(async () => {
    if (!isAuthenticated || hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch current active quests from backend (source of truth)
      const activeQuests = isHamsterUser
        ? await hamsterAPI.getActiveQuests()
        : await userAPI.getActiveQuests();

      // Extract current quest IDs
      const currentQuestIds = extractQuestIds(activeQuests);

      // Get previous quest IDs from localStorage
      const prevQuestIds = getPreviousQuestIds();

      // Detect new quests
      const detectionResult = detectNewQuests(currentQuestIds, prevQuestIds);

      // Update state
      setHasNewQuests(detectionResult.hasNew);
      setNewQuestIds(detectionResult.newIds);

      // Always update localStorage with current quest IDs after check
      // This ensures localStorage is in sync with backend state
      storeCurrentQuestIds(currentQuestIds);
    } catch (err) {
      console.error('Error checking for new quests:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setHasNewQuests(false);
      setNewQuestIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    isHamsterUser,
    extractQuestIds,
    getPreviousQuestIds,
    detectNewQuests,
    storeCurrentQuestIds,
  ]);

  // Check for new quests when authenticated (on mount/reload)
  useEffect(() => {
    if (isAuthenticated) {
      // Reset check flag on authentication change to allow re-check on reload
      hasCheckedRef.current = false;
      checkForNewQuests();
    }
  }, [isAuthenticated, checkForNewQuests]);

  return {
    hasNewQuests,
    newQuestIds,
    isLoading,
    error,
  };
};

