/**
 * Calculate rank letter based on leaderboard score
 * @param score - The leaderboard score
 * @returns Rank letter: G, F, E, D, C, B, A, or S
 */
export function getRankFromScore(score: number): 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' {
  if (score >= 111) return 'S';
  if (score >= 96) return 'A';
  if (score >= 81) return 'B';
  if (score >= 66) return 'C';
  if (score >= 51) return 'D';
  if (score >= 36) return 'E';
  if (score >= 21) return 'F';
  return 'G';
}

/**
 * Get rank priority for sorting (higher number = higher rank)
 */
export function getRankPriority(rank: string): number {
  const priorityMap: Record<string, number> = {
    'S': 7,
    'A': 6,
    'B': 5,
    'C': 4,
    'D': 3,
    'E': 2,
    'F': 1,
    'G': 0,
  };
  return priorityMap[rank] ?? 0;
}

/**
 * Convert rank letter to fancy script character
 */
export function getRankScriptChar(rank: string): string {
  const scriptMap: Record<string, string> = {
    'G': '𝓖',
    'F': '𝓕',
    'E': '𝓔',
    'D': '𝓓',
    'C': '𝓒',
    'B': '𝓑',
    'A': '𝓐',
    'S': '𝓢',
  };
  return scriptMap[rank] || rank;
}

/**
 * Get rank color based on rank letter
 */
export function getRankColor(rank: string, theme: 'light' | 'dark' = 'dark'): {
  color: string;
  glowColor: string;
  bgColor: string;
} {
  const rankColors: Record<string, { color: string; glowColor: string; bgColor: string }> = {
    'S': {
      color: '#FFD700', // Gold
      glowColor: 'rgba(255, 215, 0, 0.6)',
      bgColor: 'rgba(255, 215, 0, 0.15)',
    },
    'A': {
      color: '#FF6B6B', // Red
      glowColor: 'rgba(255, 107, 107, 0.6)',
      bgColor: 'rgba(255, 107, 107, 0.15)',
    },
    'B': {
      color: '#4ECDC4', // Teal
      glowColor: 'rgba(78, 205, 196, 0.6)',
      bgColor: 'rgba(78, 205, 196, 0.15)',
    },
    'C': {
      color: '#95E1D3', // Mint
      glowColor: 'rgba(149, 225, 211, 0.6)',
      bgColor: 'rgba(149, 225, 211, 0.15)',
    },
    'D': {
      color: '#F38181', // Pink
      glowColor: 'rgba(243, 129, 129, 0.6)',
      bgColor: 'rgba(243, 129, 129, 0.15)',
    },
    'E': {
      color: '#AA96DA', // Purple
      glowColor: 'rgba(170, 150, 218, 0.6)',
      bgColor: 'rgba(170, 150, 218, 0.15)',
    },
    'F': {
      color: '#C5E3F6', // Light Blue
      glowColor: 'rgba(197, 227, 246, 0.6)',
      bgColor: 'rgba(197, 227, 246, 0.15)',
    },
    'G': {
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280', // Gray
      glowColor: theme === 'dark' ? 'rgba(156, 163, 175, 0.4)' : 'rgba(107, 114, 128, 0.4)',
      bgColor: theme === 'dark' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(107, 114, 128, 0.1)',
    },
  };

  return rankColors[rank] || rankColors['G'];
}

