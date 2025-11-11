'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BossEventRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if on admin page or game page
    if (pathname === '/admin' || pathname === '/game') {
      return;
    }

    const checkBossEvent = async () => {
      try {
        const response = await fetch('/api/boss-event');
        if (response.ok) {
          const data = await response.json();
          if (data.isActive) {
            // Store the current page before redirecting
            localStorage.setItem('bossEventPreviousPage', pathname);
            // Redirect to game page for boss event
            router.push('/game');
          }
        }
      } catch (error) {
        console.error('Error checking boss event:', error);
      }
    };

    // Check immediately
    checkBossEvent();

    // Poll every 2 seconds
    const interval = setInterval(checkBossEvent, 2000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  return null;
}

