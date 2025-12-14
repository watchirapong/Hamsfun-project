import { itemAPI } from '@/lib/api';
import { getAssetUrl } from './helpers';

// Cache for item details - populated from inventory data or other sources
const itemCache = new Map<string, { name: string; icon: string; description?: string }>();

/**
 * Populates the item cache from inventory data
 * Call this after fetching inventory from /me or /inventory endpoint
 * @param inventoryItems - Array of inventory items with populated itemId data
 */
export const populateItemCache = (inventoryItems: any[]): void => {
  inventoryItems.forEach(inv => {
    if (inv.itemId && typeof inv.itemId === 'object' && inv.itemId._id) {
      const itemId = inv.itemId._id.toString();
      if (!itemCache.has(itemId)) {
        itemCache.set(itemId, {
          name: inv.itemId.name || 'Item',
          icon: inv.itemId.icon || '',
          description: inv.itemId.description
        });
      }
    }
  });
};

/**
 * Adds a single item to the cache
 * @param itemId - The item ID
 * @param itemData - Item details (name, icon, description)
 */
export const addItemToCache = (itemId: string, itemData: { name: string; icon: string; description?: string }): void => {
  if (!itemCache.has(itemId)) {
    itemCache.set(itemId, itemData);
  }
};

/**
 * Gets item details from cache (no API call)
 * @param itemId - The item ID
 * @returns Item details with name and icon from cache, or null if not found
 */
export const getItemDetails = async (itemId: string): Promise<{ name: string; icon: string; description?: string } | null> => {
  // Only return from cache - no individual API calls
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
 * Gets item details from cache synchronously
 * @param itemId - The item ID
 * @returns Item details with name and icon from cache, or null if not found
 */
export const getItemDetailsSync = (itemId: string): { name: string; icon: string; description?: string } | null => {
  return itemCache.get(itemId) || null;
};

/**
 * Gets multiple item details from cache
 * @param itemIds - Array of item IDs
 * @returns Map of itemId to item details (only items found in cache)
 */
export const getItemDetailsBatch = async (itemIds: string[]): Promise<Map<string, { name: string; icon: string; description?: string }>> => {
  const results = new Map<string, { name: string; icon: string; description?: string }>();

  // Collect results from cache only
  itemIds.forEach(id => {
    if (itemCache.has(id)) {
      results.set(id, itemCache.get(id)!);
    }
  });

  return results;
};

/**
 * Clears the item cache (useful for testing or cache invalidation)
 */
export const clearItemCache = (): void => {
  itemCache.clear();
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
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}${itemIcon}`;
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
