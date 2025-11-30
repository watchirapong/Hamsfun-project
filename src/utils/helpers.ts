import { Quest, ObjectiveReward, BackpackItem } from '@/types';

// Function to get badge icon path based on skill name and level
export const getBadgeIconPath = (skillName: string, level: number): string => {
  // Normalize skill name (handle variations from API and display names)
  const normalizedName = skillName.toLowerCase().trim();
  
  // Map skill names to folder names and abbreviations
  // Handle both API badge names and display names
  let folder = "art"; // default
  let skillAbbr = "art"; // default
  
  // Game Design (including "Explorer" badge name)
  if (normalizedName.includes("game") || 
      normalizedName === "gamedesign" || 
      normalizedName === "explorer") {
    folder = "gameDesign";
    skillAbbr = "game";
  } 
  // Level Design
  else if (normalizedName.includes("level") || normalizedName === "leveldesign") {
    folder = "levelDesign";
    skillAbbr = "level";
  } 
  // Art/Drawing
  else if (normalizedName.includes("art") || normalizedName.includes("drawing")) {
    folder = "art";
    skillAbbr = "art";
  } 
  // Programming (including "C# Programming" with special character)
  else if (normalizedName.includes("programming") || 
           normalizedName.includes("program") || 
           normalizedName.includes("prog") ||
           normalizedName.includes("c#") ||
           normalizedName.includes("csharp")) {
    folder = "programming";
    skillAbbr = "prog";
  }
  
  // Map level to tier: 1=u (Unranked), 2=b (Bronze), 3=s (Silver), 4=g (Gold), 5=d (Diamond)
  const tierMap: { [key: number]: string } = {
    1: "u",
    2: "b",
    3: "s",
    4: "g",
    5: "d"
  };
  
  // Ensure level is valid (1-5)
  const validLevel = Math.max(1, Math.min(5, level));
  const tier = tierMap[validLevel] || "u";
  
  const path = `/Asset/badge/${folder}/${skillAbbr}_${tier}.png`;
  return path;
};

// Function to get rank icon path
export const getRankIconPath = (rankName: string): string => {
  const rankLower = rankName.toLowerCase();
  
  // Handle special cases
  if (rankLower === 'supernova' || rankLower === 'cosmic') {
    // No icons yet, return placeholder
    return 'https://placehold.co/80x80/4A90E2/FFFFFF?text=' + encodeURIComponent(rankName.toUpperCase());
  }
  
  // Map rank names to file paths
  const iconMap: Record<string, string> = {
    'meteor i': '/Asset/ranks/meteor I.png',
    'meteor ii': '/Asset/ranks/meteor II.png',
    'meteor iii': '/Asset/ranks/meteor III.png',
    'planet i': '/Asset/ranks/planet.png',
    'planet ii': '/Asset/ranks/planet II.png',
    'planet iii': '/Asset/ranks/planet III.png',
    'star i': '/Asset/ranks/star I.png',
    'star ii': '/Asset/ranks/star II.png',
    'star iii': '/Asset/ranks/star III.png',
  };
  
  return iconMap[rankLower] || 'https://placehold.co/80x80/4A90E2/FFFFFF?text=' + encodeURIComponent(rankName.toUpperCase());
};

/**
 * Formats a number with shortened notation (k, m, b, t)
 * @param num - The number to format
 * @returns Formatted string (e.g., "1k", "1.52k", "10.25k", "100k", "1m")
 */
export const formatShortNumber = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    // Thousands (k)
    const thousands = num / 1000;
    if (thousands % 1 === 0) {
      return `${thousands}k`;
    }
    // Round to 2 decimal places, but remove trailing zeros
    const rounded = Math.round(thousands * 100) / 100;
    return `${rounded}k`;
  }
  
  if (num < 1000000000) {
    // Millions (m)
    const millions = num / 1000000;
    if (millions % 1 === 0) {
      return `${millions}m`;
    }
    const rounded = Math.round(millions * 100) / 100;
    return `${rounded}m`;
  }
  
  if (num < 1000000000000) {
    // Billions (b)
    const billions = num / 1000000000;
    if (billions % 1 === 0) {
      return `${billions}b`;
    }
    const rounded = Math.round(billions * 100) / 100;
    return `${rounded}b`;
  }
  
  // Trillions (t)
  const trillions = num / 1000000000000;
  if (trillions % 1 === 0) {
    return `${trillions}t`;
  }
  const rounded = Math.round(trillions * 100) / 100;
  return `${rounded}t`;
};

// Helper functions for Quest progress
export const calculateProgress = (quest: Quest): number => {
  if (!quest.objectives || quest.objectives.length === 0) return 0;
  const completedCount = quest.objectiveCompleted.filter(Boolean).length;
  return (completedCount / quest.objectives.length) * 100;
};

export const areAllObjectivesCompleted = (quest: Quest): boolean => {
  if (!quest.objectives || quest.objectives.length === 0) return false;
  return quest.objectiveCompleted.every(Boolean);
};

export const isQuestTrulyCompleted = (quest: Quest): boolean => {
  return areAllObjectivesCompleted(quest) && quest.rewardClaimed;
};

// Helper function to get approved objectives count
export const getApprovedObjectivesCount = (quest: Quest): number => {
  if (!quest.objectiveSubmissions) return 0;
  return quest.objectiveSubmissions.filter(sub => sub.status === 'approved').length;
};

// Helper function to check if item time has passed
export const hasItemTimePassed = (dateString: string): boolean => {
  // Extract date part (format: "20/11/2025 (19:00-21:00)")
  const datePart = dateString.split(' ')[0]; // "20/11/2025"
  const [day, month, year] = datePart.split('/');
  const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const now = new Date();
  return itemDate.getTime() < now.getTime();
};

// Helper function to check if item is expired
export const isItemExpired = (dateString: string): boolean => {
  // Extract date part and time range (format: "20/11/2025 (19:00-21:00)")
  const parts = dateString.split(' ');
  if (parts.length < 2) return false;
  
  const datePart = parts[0]; // "20/11/2025"
  const timePart = parts[1]; // "(19:00-21:00)"
  
  const [day, month, year] = datePart.split('/');
  const timeMatch = timePart.match(/\((\d{2}):(\d{2})-(\d{2}):(\d{2})\)/);
  
  if (!timeMatch) return false;
  
  const [, startHour, startMin, endHour, endMin] = timeMatch;
  const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMin));
  const now = new Date();
  
  return itemDate.getTime() < now.getTime();
};

// Helper function to parse date string and convert to sortable format
export const parseDate = (dateString: string): Date => {
  // Extract date part (format: "20/11/2025 (19:00-21:00)")
  const datePart = dateString.split(' ')[0]; // "20/11/2025"
  const [day, month, year] = datePart.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

// Sort items: first by usage (used -> not used -> expired), then by time
export const sortItems = (items: BackpackItem[]): BackpackItem[] => {
  return [...items].sort((a, b) => {
    const expiredA = isItemExpired(a.date);
    const expiredB = isItemExpired(b.date);
    const usedA = a.used;
    const usedB = b.used;
    
    // Determine priority: used = 0, not used = 1, expired = 2
    const getPriority = (used: boolean, expired: boolean): number => {
      if (used) return 0;
      if (expired) return 2;
      return 1;
    };
    
    const priorityA = getPriority(usedA, expiredA);
    const priorityB = getPriority(usedB, expiredB);
    
    // First sort by usage status
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by time (nearest/soonest first)
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

