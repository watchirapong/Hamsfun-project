import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '@/lib/api';

function AuthHandoverPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Extract token from URL
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const redirectUri = searchParams.get('redirectUri');

    if (error) {
      console.error('Authentication error:', error);
      // Redirect to login page with error
      navigate(`/?error=${encodeURIComponent(error)}`);
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
        navigate('/');
      }
    } else {
      // No token received, redirect to login
      console.warn('No token received in handover');
      navigate('/?error=no_token');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full mx-4 transition-colors">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white transition-colors">Completing Login...</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center transition-colors">Please wait while we complete your authentication.</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-500"></div>
        </div>
      </div>
    </div>
  );
}

export default AuthHandoverPage;

