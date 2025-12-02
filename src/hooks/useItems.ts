import { useState, useEffect } from 'react';
import { BackpackItem } from '@/types';
import { userAPI } from '@/lib/api';
import { hasItemTimePassed } from '@/utils/helpers';
import { getAssetUrl } from '@/utils/helpers';

// Helper function to parse date string and check if time has passed
const parseItemDate = (dateString: string): { startTime: Date; endTime: Date } | null => {
  // Format: "20/11/2025 (19:00-21:00)"
  try {
    const datePart = dateString.split(' ')[0]; // "20/11/2025"
    const timePart = dateString.match(/\((\d{2}):(\d{2})-(\d{2}):(\d{2})\)/);

    if (!timePart) return null;

    const [day, month, year] = datePart.split('/');
    const startHour = parseInt(timePart[1]);
    const startMinute = parseInt(timePart[2]);
    const endHour = parseInt(timePart[3]);
    const endMinute = parseInt(timePart[4]);

    const startTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), startHour, startMinute);
    const endTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), endHour, endMinute);

    return { startTime, endTime };
  } catch (error) {
    return null;
  }
};

// Check if item is expired (current date/time has passed the ticket's end time)
const isItemExpiredLocal = (dateString: string): boolean => {
  const times = parseItemDate(dateString);
  if (!times) return false;
  const now = new Date();
  return now > times.endTime;
};

export const useItems = () => {
  const [backpackItems, setBackpackItems] = useState<BackpackItem[]>([]);

  // Handle item usage - only 1 used item at a time across all types
  const handleUseItem = async (itemId: string) => {
    const item = backpackItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      await userAPI.useItem(itemId);

      // Update local state
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
      const mappedItems = inventory.map((inv: any, idx: number) => ({
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
      setBackpackItems(mappedItems);
    } catch (error) {
      console.error('Error using item:', error);
      alert('Failed to use item. Please try again.');
    }
  };

  // Handle item deletion
  const handleDeleteItem = (itemId: string) => {
    setBackpackItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Remove items that are used and their time has passed
  useEffect(() => {
    setBackpackItems(prevItems => {
      return prevItems.filter(item => {
        // Remove if used AND time has passed
        if (item.used && hasItemTimePassed(item.date)) {
          return false;
        }
        return true;
      });
    });

    // Check every minute for expired items
    const interval = setInterval(() => {
      setBackpackItems(prevItems => {
        return prevItems.filter(item => {
          if (item.used && hasItemTimePassed(item.date)) {
            return false;
          }
          return true;
        });
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    backpackItems,
    setBackpackItems,
    handleUseItem,
    handleDeleteItem,
    isItemExpired: isItemExpiredLocal
  };
};

