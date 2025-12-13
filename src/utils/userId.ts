/**
 * Utility to extract user ID from cookies or JWT token
 * Used for namespacing localStorage keys per user
 */

import { getToken } from '@/lib/api';

/**
 * Read a cookie value by name (client-side)
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

/**
 * Decode JWT token payload (without verification)
 * Returns the payload object or null if invalid
 */
const decodeJWT = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get user ID from cookies, JWT token, or fallback to a stable identifier
 * Priority:
 * 1. Cookie-based user ID (userId, user_id, id)
 * 2. JWT token payload (userId, user_id, id, sub, discordId, discord_id)
 * 3. Fallback: hash of token as stable identifier
 * 
 * Returns a string that uniquely identifies the user for localStorage namespacing
 */
export const getUserId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get user ID from cookies first
  const cookieUserId = getCookie('userId') || getCookie('user_id') || getCookie('id');
  if (cookieUserId) {
    return String(cookieUserId);
  }

  // Fallback to JWT token
  const token = getToken();
  if (!token) {
    return null;
  }

  // Try to decode JWT and extract user ID
  const decoded = decodeJWT(token);
  if (decoded) {
    // Common JWT payload fields for user ID
    const userId = decoded.userId || decoded.user_id || decoded.id || decoded.sub || decoded.discordId || decoded.discord_id;
    if (userId) {
      return String(userId);
    }
  }

  // Fallback: use a hash of the token (first 16 chars) as a stable identifier
  // This ensures same user gets same ID across sessions
  if (token.length > 16) {
    return `token_${token.substring(0, 16)}`;
  }

  return null;
};

/**
 * Get user-specific localStorage key for quest tracking
 * @param userId - User ID for namespacing
 * @param isHamster - Whether user is a Hamster (for complete separation of quest types)
 */
export const getQuestStorageKey = (userId: string | null, isHamster: boolean = false): string => {
  if (!userId) {
    // Fallback to global key if no user ID (shouldn't happen when authenticated)
    const userType = isHamster ? 'hamster' : 'user';
    return `hamster_activeQuestIds_${userType}_v1`;
  }
  const userType = isHamster ? 'hamster' : 'user';
  return `hamster_activeQuestIds_${userId}_${userType}_v1`;
};

