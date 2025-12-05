/**
 * Items Hook with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { userAPI } from '@/lib/api';
import { hasItemTimePassed } from '@/utils/helpers';
import { getAssetUrl } from '@/utils/helpers';

/**
 * Parse item date string and extract start/end times
 */
const parseItemDate = (dateString) => {
  // Format: "20/11/2025 (19:00-21:00)"
  try {
    const datePart = dateString.split(' ')[0]; // "20/11/2025"
    const timePart = dateString.match(/\((\d{2}):(\d{2})-(\d{2}):(\d{2})\)/);

    if (!timePart) return null;

    const [day, month, year] = datePart.split('/');
    const startHour = parseInt(timePart[1], 10);
    const startMinute = parseInt(timePart[2], 10);
    const endHour = parseInt(timePart[3], 10);
    const endMinute = parseInt(timePart[4], 10);

    const startTime = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), startHour, startMinute);
    const endTime = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), endHour, endMinute);

    return { startTime, endTime };
  } catch (error) {
    return null;
  }
};

/**
 * Check if item is expired locally
 */
const isItemExpiredLocal = (dateString) => {
  const times = parseItemDate(dateString);
  if (!times) return false;
  const now = new Date();
  return now > times.endTime;
};

/**
 * Map inventory items from API response
 */
const mapInventoryItems = (inventory) => {
  return inventory.map((inv) => ({
    id: inv._id,
    type: inv.itemId?.type || 'NormalItem',
    name: inv.itemId?.name || 'Item',
    description: inv.itemId?.description || '',
    date: inv.itemId?.date || '',
    quantity: inv.quantity || 1,
    image: inv.itemId?.icon || inv.itemId?.image || getAssetUrl("/Asset/item/classTicket.png"),
    icon: inv.itemId?.icon,
    used: inv.used || false,
    active: inv.active || false
  }));
};

export const useItems = () => {
  const [backpackItems, setBackpackItems] = useState([]);

  // Handle item usage - only 1 used item at a time across all types
  const handleUseItem = useCallback(async (itemId) => {
    const item = backpackItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      await userAPI.useItem(itemId);

      // Update local state optimistically
      setBackpackItems(prevItems => {
        return prevItems.map(i => {
          if (i.id === itemId) {
            return { ...i, used: true, active: true };
          } else {
            // Un-use and deactivate all other items (only 1 used at a time across all types)
            return { ...i, used: false, active: false };
          }
        });
      });

      // Refresh inventory from API
      const inventory = await userAPI.getMyInventory();
      const mappedItems = mapInventoryItems(inventory);
      setBackpackItems(mappedItems);
    } catch (error) {
      console.error('Error using item:', error);
      if (typeof window !== 'undefined') {
        alert('Failed to use item. Please try again.');
      }
    }
  }, [backpackItems]);

  // Handle item deletion
  const handleDeleteItem = useCallback((itemId) => {
    setBackpackItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  // Filter expired items helper
  const filterExpiredItems = useCallback((items) => {
    return items.filter(item => {
      // Remove if used AND time has passed
      if (item.used && hasItemTimePassed(item.date)) {
        return false;
      }
      return true;
    });
  }, []);

  // Remove items that are used and their time has passed
  useEffect(() => {
    setBackpackItems(prevItems => filterExpiredItems(prevItems));

    // Check every minute for expired items
    const interval = setInterval(() => {
      setBackpackItems(prevItems => filterExpiredItems(prevItems));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [filterExpiredItems]);

  // Memoized return value
  return useMemo(() => ({
    backpackItems,
    setBackpackItems,
    handleUseItem,
    handleDeleteItem,
    isItemExpired: isItemExpiredLocal
  }), [backpackItems, handleUseItem, handleDeleteItem]);
};

