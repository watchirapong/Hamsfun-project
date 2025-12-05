/**
 * Rank Helpers with optimized lookups
 * Optimized for 10,000+ concurrent users
 */

/**
 * Rank Calculator with memoization
 */
class RankCalculator {
  constructor() {
    this.scoreCache = new Map();
    this.priorityMap = {
      'S': 7,
      'A': 6,
      'B': 5,
      'C': 4,
      'D': 3,
      'E': 2,
      'F': 1,
      'G': 0,
    };
    this.scriptMap = {
      'G': '𝓖',
      'F': '𝓕',
      'E': '𝓔',
      'D': '𝓓',
      'C': '𝓒',
      'B': '𝓑',
      'A': '𝓐',
      'S': '𝓢',
    };
    this.rankColors = {
      'S': {
        color: '#FFD700',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        bgColor: 'rgba(255, 215, 0, 0.15)',
      },
      'A': {
        color: '#FF6B6B',
        glowColor: 'rgba(255, 107, 107, 0.6)',
        bgColor: 'rgba(255, 107, 107, 0.15)',
      },
      'B': {
        color: '#4ECDC4',
        glowColor: 'rgba(78, 205, 196, 0.6)',
        bgColor: 'rgba(78, 205, 196, 0.15)',
      },
      'C': {
        color: '#95E1D3',
        glowColor: 'rgba(149, 225, 211, 0.6)',
        bgColor: 'rgba(149, 225, 211, 0.15)',
      },
      'D': {
        color: '#F38181',
        glowColor: 'rgba(243, 129, 129, 0.6)',
        bgColor: 'rgba(243, 129, 129, 0.15)',
      },
      'E': {
        color: '#AA96DA',
        glowColor: 'rgba(170, 150, 218, 0.6)',
        bgColor: 'rgba(170, 150, 218, 0.15)',
      },
      'F': {
        color: '#C5E3F6',
        glowColor: 'rgba(197, 227, 246, 0.6)',
        bgColor: 'rgba(197, 227, 246, 0.15)',
      },
      'G': {
        color: '#9CA3AF',
        glowColor: 'rgba(156, 163, 175, 0.4)',
        bgColor: 'rgba(156, 163, 175, 0.1)',
      },
    };
  }

  getRankFromScore(score) {
    // Cache frequently accessed scores
    const cacheKey = Math.floor(score);
    if (this.scoreCache.has(cacheKey)) {
      return this.scoreCache.get(cacheKey);
    }

    let rank;
    if (score >= 111) rank = 'S';
    else if (score >= 96) rank = 'A';
    else if (score >= 81) rank = 'B';
    else if (score >= 66) rank = 'C';
    else if (score >= 51) rank = 'D';
    else if (score >= 36) rank = 'E';
    else if (score >= 21) rank = 'F';
    else rank = 'G';

    // Cache result (limit cache size)
    if (this.scoreCache.size < 1000) {
      this.scoreCache.set(cacheKey, rank);
    }

    return rank;
  }

  getRankPriority(rank) {
    return this.priorityMap[rank] ?? 0;
  }

  getRankScriptChar(rank) {
    return this.scriptMap[rank] || rank;
  }

  getRankColor(rank, theme = 'dark') {
    const colors = this.rankColors[rank] || this.rankColors['G'];
    
    // Adjust G rank colors based on theme
    if (rank === 'G') {
      return {
        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        glowColor: theme === 'dark' ? 'rgba(156, 163, 175, 0.4)' : 'rgba(107, 114, 128, 0.4)',
        bgColor: theme === 'dark' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(107, 114, 128, 0.1)',
      };
    }

    return colors;
  }
}

const rankCalculator = new RankCalculator();

export const getRankFromScore = (score) => {
  return rankCalculator.getRankFromScore(score);
};

export const getRankPriority = (rank) => {
  return rankCalculator.getRankPriority(rank);
};

export const getRankScriptChar = (rank) => {
  return rankCalculator.getRankScriptChar(rank);
};

export const getRankColor = (rank, theme = 'dark') => {
  return rankCalculator.getRankColor(rank, theme);
};

