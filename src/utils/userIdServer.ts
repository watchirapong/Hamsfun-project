/**
 * Server-side utility to extract user ID from cookies
 * For use in Next.js server components (layout, page with 'use server')
 */

import { cookies } from 'next/headers';

/**
 * Get user ID from cookies (server-side)
 * Reads common cookie names: userId, user_id, id
 */
export const getUserIdFromCookies = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    
    // Try common cookie names
    const userId = cookieStore.get('userId')?.value 
      || cookieStore.get('user_id')?.value 
      || cookieStore.get('id')?.value;
    
    return userId ? String(userId) : null;
  } catch (error) {
    console.error('Error reading user ID from cookies (server-side):', error);
    return null;
  }
};

