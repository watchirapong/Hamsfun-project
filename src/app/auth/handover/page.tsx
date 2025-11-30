'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/lib/api';

function AuthHandoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const redirectUri = searchParams.get('redirectUri');

    if (error) {
      console.error('Authentication error:', error);
      // Redirect to login page with error
      router.push(`/?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      // Store token in localStorage
      setToken(token);
      console.log('Token received and stored');
      
      // Redirect to the original redirect URI or home page
      if (redirectUri) {
        // Remove query params from redirectUri to avoid duplicate tokens
        const redirectUrl = new URL(redirectUri);
        redirectUrl.search = ''; // Clear existing query params
        window.location.href = redirectUrl.toString();
      } else {
        // Redirect to home page
        router.push('/');
      }
    } else {
      // No token received, redirect to login
      console.warn('No token received in handover');
      router.push('/?error=no_token');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-900">Completing Login...</h1>
        <p className="text-gray-600 text-center">Please wait while we complete your authentication.</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function AuthHandoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-900">Loading...</h1>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    }>
      <AuthHandoverContent />
    </Suspense>
  );
}

