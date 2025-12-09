/**
 * Utility functions for tracking quest state in localStorage
 * to detect new quests on page reload
 */

const STORAGE_KEY = 'hamsfun_quest_ids';

/**
 * Check if quest tracking has been initialized (localStorage key exists)
 */
export const isQuestTrackingInitialized = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Get stored quest IDs from localStorage
 * Returns null if the key doesn't exist (first load), empty Set if key exists but is empty (user had no quests)
 */
export const getStoredQuestIds = (): Set<string> | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      // Key doesn't exist - first time ever loading
      return null;
    }
    const ids = JSON.parse(stored);
    // Key exists - return the stored IDs (empty array means user had no quests before)
    return new Set(Array.isArray(ids) ? ids : []);
  } catch (error) {
    console.error('Error reading quest IDs from localStorage:', error);
    return null;
  }
};

/**
 * Store quest IDs to localStorage
 */
export const storeQuestIds = (questIds: string[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questIds));
  } catch (error) {
    console.error('Error storing quest IDs to localStorage:', error);
  }
};

/**
 * Compare current quests with stored quests and return new quest IDs
 * If storedQuestIds is null, returns empty array (first load - handled separately)
 * If storedQuestIds is empty Set AND currentQuests has items, returns all current quest IDs (0 → some transition)
 * If storedQuestIds has items, returns only quest IDs that are new
 */
export const detectNewQuests = (
  currentQuests: Array<{ id: string | number }>,
  storedQuestIds: Set<string> | null
): string[] => {
  if (storedQuestIds === null) {
    // First load - handled separately, return empty
    return [];
  }
  
  const currentQuestIds = currentQuests.map(q => String(q.id));
  
  // If stored set is empty (user had 0 quests) AND current quests exist, all current quests are "new"
  // This handles the 0 → some quests transition
  if (storedQuestIds.size === 0 && currentQuestIds.length > 0) {
    return currentQuestIds;
  }
  
  // Otherwise, find quest IDs that are in current but not in stored
  const newQuestIds = currentQuestIds.filter(id => !storedQuestIds.has(id));
  return newQuestIds;
};

/**
 * Update stored quest IDs with current quest IDs
 */
export const updateStoredQuestIds = (quests: Array<{ id: string | number }>): void => {
  const questIds = quests.map(q => String(q.id));
  storeQuestIds(questIds);
};

