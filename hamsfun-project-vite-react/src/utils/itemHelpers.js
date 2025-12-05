/**
 * Item Helpers with caching and batch processing
 * Optimized for 10,000+ concurrent users
 */

import { itemAPI } from '@/lib/api';
import { getAssetUrl } from './helpers';

/**
 * Item Cache Manager - OOP pattern for better performance
 */
class ItemCacheManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.maxCacheSize = 1000;
  }

  has(itemId) {
    return this.cache.has(itemId);
  }

  get(itemId) {
    return this.cache.get(itemId);
  }

  set(itemId, item) {
    // Limit cache size to prevent memory issues
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(itemId, item);
  }

  clear() {
    this.cache.clear();
  }

  // Batch fetch with deduplication
  async fetchBatch(itemIds) {
    const uncachedIds = itemIds.filter(id => !this.has(id) && !this.pendingRequests.has(id));
    
    if (uncachedIds.length === 0) {
      return this._getCachedResults(itemIds);
    }

    // Create promises for uncached items
    const promises = uncachedIds.map(id => {
      if (this.pendingRequests.has(id)) {
        return this.pendingRequests.get(id);
      }

      const promise = this._fetchItem(id);
      this.pendingRequests.set(id, promise);
      
      promise.finally(() => {
        this.pendingRequests.delete(id);
      });

      return promise;
    });

    await Promise.all(promises);
    return this._getCachedResults(itemIds);
  }

  async _fetchItem(itemId) {
    try {
      const response = await itemAPI.getItemById(itemId);
      const item = response.data || response;

      if (item && item.icon) {
        const itemDetails = {
          name: item.name || 'Item',
          icon: item.icon,
          description: item.description
        };

        this.set(itemId, itemDetails);
        return itemDetails;
      }
    } catch (error) {
      console.error(`Failed to fetch item ${itemId}:`, error);
    }

    return null;
  }

  _getCachedResults(itemIds) {
    const results = new Map();
    itemIds.forEach(id => {
      if (this.has(id)) {
        results.set(id, this.get(id));
      }
    });
    return results;
  }
}

const itemCacheManager = new ItemCacheManager();

/**
 * Fetches item details by ID and caches the result
 */
export const getItemDetails = async (itemId) => {
  if (itemCacheManager.has(itemId)) {
    return itemCacheManager.get(itemId);
  }

  return await itemCacheManager._fetchItem(itemId);
};

/**
 * Fetches multiple item details at once with batch optimization
 */
export const getItemDetailsBatch = async (itemIds) => {
  return await itemCacheManager.fetchBatch(itemIds);
};

/**
 * Gets item icon URL with caching
 */
const iconUrlCache = new Map();

export const getItemIconUrl = (itemIcon) => {
  if (!itemIcon) {
    return getAssetUrl("/Asset/item/classTicket.png");
  }

  // Check cache
  if (iconUrlCache.has(itemIcon)) {
    return iconUrlCache.get(itemIcon);
  }

  let url;

  // If icon is a relative path (starts with /) but not a local asset, prepend API base URL
  if (itemIcon.startsWith('/') && !itemIcon.startsWith('/Asset')) {
    url = `${import.meta.env.VITE_BACKEND_URL}${itemIcon}`;
  }
  // If it's already a full URL, return as-is
  else if (itemIcon.startsWith('http://') || itemIcon.startsWith('https://')) {
    url = itemIcon;
  }
  // Local asset paths (starting with /Asset) or other relative paths
  else if (itemIcon.startsWith('/Asset')) {
    url = getAssetUrl(itemIcon);
  }
  else {
    url = itemIcon;
  }

  // Cache result
  if (iconUrlCache.size < 500) {
    iconUrlCache.set(itemIcon, url);
  }

  return url;
};

