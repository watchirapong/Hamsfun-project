import { itemAPI } from '@/lib/api';
import { getAssetUrl } from './helpers';

// Cache for item details to avoid repeated API calls
const itemCache = new Map<string, { name: string; icon: string; description?: string }>();

/**
 * Fetches item details by ID and caches the result
 * @param itemId - The item ID
 * @returns Item details with name and icon
 */
export const getItemDetails = async (itemId: string): Promise<{ name: string; icon: string; description?: string } | null> => {
  // Check cache first
  if (itemCache.has(itemId)) {
    return itemCache.get(itemId)!;
  }

  try {
    // Try to get from items list first (if already fetched)
    // Otherwise, fetch item by ID
    const response = await itemAPI.getItemById(itemId);
    const item = response.data || response;

    if (item && item.icon) {
      const itemDetails = {
        name: item.name || 'Item',
        icon: item.icon,
        description: item.description
      };

      // Cache the result
      itemCache.set(itemId, itemDetails);
      return itemDetails;
    }
  } catch (error) {
    console.error(`Failed to fetch item ${itemId}:`, error);
  }

  return null;
};

/**
 * Fetches multiple item details at once
 * @param itemIds - Array of item IDs
 * @returns Map of itemId to item details
 */
export const getItemDetailsBatch = async (itemIds: string[]): Promise<Map<string, { name: string; icon: string; description?: string }>> => {
  const results = new Map<string, { name: string; icon: string; description?: string }>();

  // Filter out already cached items
  const uncachedIds = itemIds.filter(id => !itemCache.has(id));

  // Fetch all uncached items in parallel
  const promises = uncachedIds.map(id => getItemDetails(id));
  await Promise.all(promises);

  // Collect results from cache
  itemIds.forEach(id => {
    if (itemCache.has(id)) {
      results.set(id, itemCache.get(id)!);
    }
  });

  return results;
};

/**
 * Gets item icon URL, with fallback
 * @param itemIcon - Optional icon URL (if already available)
 * @returns Icon URL with proper base URL if needed
 */
export const getItemIconUrl = (itemIcon?: string): string => {
  if (!itemIcon) {
    return getAssetUrl("/Asset/item/classTicket.png");
  }

  // If icon is a relative path (starts with /) but not a local asset, prepend API base URL
  if (itemIcon.startsWith('/') && !itemIcon.startsWith('/Asset')) {
    return `${process.env.NEXT_BACKEND_URL}${itemIcon}`;
  }

  // If it's already a full URL, return as-is
  if (itemIcon.startsWith('http://') || itemIcon.startsWith('https://')) {
    return itemIcon;
  }

  // Local asset paths (starting with /Asset) or other relative paths
  if (itemIcon.startsWith('/Asset')) {
    return getAssetUrl(itemIcon);
  }

  return itemIcon;
};
