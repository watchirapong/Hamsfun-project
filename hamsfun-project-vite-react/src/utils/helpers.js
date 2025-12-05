/**
 * Helper utilities with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

// Cache for asset URLs to reduce string operations
const assetUrlCache = new Map();

/**
 * Get asset URL with caching for performance
 */
export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Check cache first
  if (assetUrlCache.has(path)) {
    return assetUrlCache.get(path);
  }

  const baseUrl = import.meta.env.VITE_APP_URL || '';
  const fullPath = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  
  // Cache the result (limit cache size to prevent memory issues)
  if (assetUrlCache.size < 1000) {
    assetUrlCache.set(path, fullPath);
  }
  
  return fullPath;
}

/**
 * Badge icon path resolver with memoization
 */
class BadgePathResolver {
  constructor() {
    this.cache = new Map();
    this.folderMap = this._buildFolderMap();
    this.tierMap = { 1: 'u', 2: 'b', 3: 's', 4: 'g', 5: 'd' };
  }

  _buildFolderMap() {
    return {
      game: { folder: 'gameDesign', abbr: 'game' },
      gamedesign: { folder: 'gameDesign', abbr: 'game' },
      explorer: { folder: 'gameDesign', abbr: 'game' },
      level: { folder: 'levelDesign', abbr: 'level' },
      leveldesign: { folder: 'levelDesign', abbr: 'level' },
      art: { folder: 'art', abbr: 'art' },
      drawing: { folder: 'art', abbr: 'art' },
      programming: { folder: 'programming', abbr: 'prog' },
      program: { folder: 'programming', abbr: 'prog' },
      prog: { folder: 'programming', abbr: 'prog' },
      'c#': { folder: 'programming', abbr: 'prog' },
      csharp: { folder: 'programming', abbr: 'prog' }
    };
  }

  _normalizeSkillName(skillName) {
    return skillName.toLowerCase().trim();
  }

  _findSkillMapping(normalizedName) {
    for (const [key, value] of Object.entries(this.folderMap)) {
      if (normalizedName.includes(key)) {
        return value;
      }
    }
    return { folder: 'art', abbr: 'art' }; // default
  }

  getPath(skillName, level) {
    const cacheKey = `${skillName}_${level}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const normalizedName = this._normalizeSkillName(skillName);
    const mapping = this._findSkillMapping(normalizedName);
    const validLevel = Math.max(1, Math.min(5, level));
    const tier = this.tierMap[validLevel] || 'u';
    const path = getAssetUrl(`/Asset/badge/${mapping.folder}/${mapping.abbr}_${tier}.png`);

    // Cache result
    if (this.cache.size < 500) {
      this.cache.set(cacheKey, path);
    }

    return path;
  }
}

const badgePathResolver = new BadgePathResolver();

export const getBadgeIconPath = (skillName, level) => {
  return badgePathResolver.getPath(skillName, level);
};

/**
 * Rank icon path resolver with caching
 */
class RankPathResolver {
  constructor() {
    this.cache = new Map();
    this.iconMap = {
      'meteor i': () => getAssetUrl('/Asset/ranks/meteor I.png'),
      'meteor ii': () => getAssetUrl('/Asset/ranks/meteor II.png'),
      'meteor iii': () => getAssetUrl('/Asset/ranks/meteor III.png'),
      'planet i': () => getAssetUrl('/Asset/ranks/planet.png'),
      'planet ii': () => getAssetUrl('/Asset/ranks/planet II.png'),
      'planet iii': () => getAssetUrl('/Asset/ranks/planet III.png'),
      'star i': () => getAssetUrl('/Asset/ranks/star I.png'),
      'star ii': () => getAssetUrl('/Asset/ranks/star II.png'),
      'star iii': () => getAssetUrl('/Asset/ranks/star III.png'),
    };
  }

  getPath(rankName) {
    const rankLower = rankName.toLowerCase();
    
    if (this.cache.has(rankLower)) {
      return this.cache.get(rankLower);
    }

    let path;
    if (rankLower === 'supernova' || rankLower === 'cosmic') {
      path = `https://placehold.co/80x80/4A90E2/FFFFFF?text=${encodeURIComponent(rankName.toUpperCase())}`;
    } else {
      const getter = this.iconMap[rankLower];
      path = getter ? getter() : `https://placehold.co/80x80/4A90E2/FFFFFF?text=${encodeURIComponent(rankName.toUpperCase())}`;
    }

    if (this.cache.size < 100) {
      this.cache.set(rankLower, path);
    }

    return path;
  }
}

const rankPathResolver = new RankPathResolver();

export const getRankIconPath = (rankName) => {
  return rankPathResolver.getPath(rankName);
};

/**
 * Number formatter with optimized logic
 */
export const formatShortNumber = (num) => {
  if (num < 1000) return num.toString();
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum < 1000000) {
    const thousands = absNum / 1000;
    const rounded = thousands % 1 === 0 ? thousands : Math.round(thousands * 100) / 100;
    return `${sign}${rounded}k`;
  }
  
  if (absNum < 1000000000) {
    const millions = absNum / 1000000;
    const rounded = millions % 1 === 0 ? millions : Math.round(millions * 100) / 100;
    return `${sign}${rounded}m`;
  }
  
  if (absNum < 1000000000000) {
    const billions = absNum / 1000000000;
    const rounded = billions % 1 === 0 ? billions : Math.round(billions * 100) / 100;
    return `${sign}${rounded}b`;
  }
  
  const trillions = absNum / 1000000000000;
  const rounded = trillions % 1 === 0 ? trillions : Math.round(trillions * 100) / 100;
  return `${sign}${rounded}t`;
};

/**
 * Quest progress calculator
 */
export const calculateProgress = (quest) => {
  if (!quest.objectives || quest.objectives.length === 0) return 0;
  const completedCount = quest.objectiveCompleted.filter(Boolean).length;
  return (completedCount / quest.objectives.length) * 100;
};

export const areAllObjectivesCompleted = (quest) => {
  if (!quest.objectives || quest.objectives.length === 0) return false;
  return quest.objectiveCompleted.every(Boolean);
};

export const isQuestTrulyCompleted = (quest) => {
  return areAllObjectivesCompleted(quest) && quest.rewardClaimed;
};

export const getApprovedObjectivesCount = (quest) => {
  if (!quest.objectiveSubmissions) return 0;
  return quest.objectiveSubmissions.filter(sub => sub.status === 'approved').length;
};

/**
 * Date parser with memoization
 */
const dateCache = new Map();

export const parseDate = (dateString) => {
  if (dateCache.has(dateString)) {
    return new Date(dateCache.get(dateString));
  }
  
  const datePart = dateString.split(' ')[0];
  const [day, month, year] = datePart.split('/');
  const timestamp = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
  
  if (dateCache.size < 500) {
    dateCache.set(dateString, timestamp);
  }
  
  return new Date(timestamp);
};

/**
 * Item expiration checker with caching
 */
const expirationCache = new Map();

export const hasItemTimePassed = (dateString) => {
  const cacheKey = `passed_${dateString}`;
  if (expirationCache.has(cacheKey)) {
    return expirationCache.get(cacheKey);
  }
  
  const datePart = dateString.split(' ')[0];
  const [day, month, year] = datePart.split('/');
  const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const now = new Date();
  const result = itemDate.getTime() < now.getTime();
  
  if (expirationCache.size < 500) {
    expirationCache.set(cacheKey, result);
  }
  
  return result;
};

export const isItemExpired = (dateString) => {
  const cacheKey = `expired_${dateString}`;
  if (expirationCache.has(cacheKey)) {
    return expirationCache.get(cacheKey);
  }
  
  const parts = dateString.split(' ');
  if (parts.length < 2) {
    expirationCache.set(cacheKey, false);
    return false;
  }

  const datePart = parts[0];
  const timePart = parts[1];
  const [day, month, year] = datePart.split('/');
  const timeMatch = timePart.match(/\((\d{2}):(\d{2})-(\d{2}):(\d{2})\)/);

  if (!timeMatch) {
    expirationCache.set(cacheKey, false);
    return false;
  }

  const [, , , endHour, endMin] = timeMatch;
  const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMin));
  const now = new Date();
  const result = itemDate.getTime() < now.getTime();
  
  if (expirationCache.size < 500) {
    expirationCache.set(cacheKey, result);
  }
  
  return result;
};

/**
 * Optimized item sorter
 */
export const sortItems = (items) => {
  if (!items || items.length === 0) return [];
  
  const getPriority = (used, expired) => {
    if (used) return 0;
    if (expired) return 2;
    return 1;
  };

  return [...items].sort((a, b) => {
    const expiredA = isItemExpired(a.date);
    const expiredB = isItemExpired(b.date);
    const priorityA = getPriority(a.used, expiredA);
    const priorityB = getPriority(b.used, expiredB);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

