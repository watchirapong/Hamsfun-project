'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import LoadingScreen from '@/components/common/LoadingScreen';

/**
 * Root page that redirects users to the appropriate route based on their role
 * - Normal users (students) → /hamster-quest/student
 * - Hamster users (staff/mentors/admin) → /hamster-quest/hamster
 */
const RootPage: React.FC = () => {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on user role
      if (user.isHamster) {
        router.push('/hamster');
      } else {
        router.push('/student');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading screen while checking auth or redirecting
  if (isLoading || (isAuthenticated && user && (user.isHamster !== undefined))) {
    return <LoadingScreen theme={theme} />;
  }

  // If not authenticated, show login screen
  // (This should rarely happen as auth/handover should handle login)
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`rounded-xl shadow-lg p-8 max-w-md w-full mx-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h1 className={`text-2xl font-bold text-center mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Redirecting...
        </h1>
      </div>
    </div>
  );
};

export default RootPage;
