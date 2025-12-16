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

export const useItems = (onPetEquipped?: () => void) => {
  const [backpackItems, setBackpackItems] = useState<BackpackItem[]>([]);

  // Handle item usage - only 1 used item at a time across all types
  const handleUseItem = async (itemId: string): Promise<{ hatchedPet?: { name: string; icon?: string } } | null> => {
    const item = backpackItems.find(i => i.id === itemId);
    if (!item) return null;

    // Check if this is a pet item or egg item before making the API call
    const isPetItem = item.type === 'PetItem';
    const isEggItem = item.type === 'EggItem';

    try {
      const response = await userAPI.useItem(itemId) as any;

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

      // If a pet item was equipped, trigger the callback to reload partner pet data
      if (isPetItem && onPetEquipped) {
        onPetEquipped();
      }

      // If it's an egg item, extract hatched pet data from response or inventory
      if (isEggItem) {
        let hatchedPet: { name: string; icon?: string; eggIcon?: string } | undefined;

        // Get the egg icon from the item that was used
        const eggIcon = item.icon || item.image;

        // Try to get pet from API response first
        if (response?.pet || response?.hatchedPet) {
          const petData = response.pet || response.hatchedPet;
          hatchedPet = {
            name: petData.name || petData.itemId?.name || 'Unknown Pet',
            icon: petData.icon || petData.itemId?.icon,
            eggIcon: eggIcon,
          };
        } else {
          // Fallback: find the newly added pet in inventory (first Pet item that wasn't there before)
          const previousPetIds = new Set(backpackItems.filter(i => i.type === 'PetItem').map(i => i.id));
          const newPet = inventory.find((inv: any) => 
            inv.itemId?.type === 'Pet' && !previousPetIds.has(inv._id)
          );
          
          if (newPet) {
            hatchedPet = {
              name: newPet.itemId?.name || 'Unknown Pet',
              icon: newPet.itemId?.icon,
              eggIcon: eggIcon,
            };
          } else {
            // If we can't find the pet, still return with egg icon
            hatchedPet = {
              name: 'Unknown Pet',
              eggIcon: eggIcon,
            };
          }
        }

        return { hatchedPet: hatchedPet || { name: 'Unknown Pet', eggIcon: eggIcon } };
      }

      return null;
    } catch (error) {
      console.error('Error using item:', error);
      alert('Failed to use item. Please try again.');
      return null;
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

