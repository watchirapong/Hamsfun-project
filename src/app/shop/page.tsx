'use client';

import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ShopPage() {
  const [cookies] = useCookies(['discord_user']);
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [hamsterCoin, setHamsterCoin] = useState(0);

  useEffect(() => {
    // Get user data from cookies
    if (cookies.discord_user) {
      try {
        const user = typeof cookies.discord_user === 'string' 
          ? JSON.parse(cookies.discord_user) 
          : cookies.discord_user;
        setUserData(user);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Load user progress to get hamster coin
    const loadProgress = async () => {
      if (cookies.discord_user) {
        try {
          const user = typeof cookies.discord_user === 'string' 
            ? JSON.parse(cookies.discord_user) 
            : cookies.discord_user;
          
          console.log('🪙 Loading hamster coin for user:', user.id);
          console.log('🪙 Full user object:', user);
          const response = await fetch(`/api/progress/load?discordId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('🪙 Full API response:', data);
            console.log('🪙 Received hamster coin data:', data.hamsterCoin, 'Type:', typeof data.hamsterCoin);
            const coinValue = Number(data.hamsterCoin) || 0;
            console.log('🪙 Setting hamster coin to:', coinValue);
            setHamsterCoin(coinValue);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to load progress:', response.status, response.statusText, errorData);
          }
        } catch (error) {
          console.error('❌ Error loading progress:', error);
        }
      }
    };

    loadProgress();
    
    // Refresh hamster coin every 5 seconds to keep it updated
    const refreshInterval = setInterval(() => {
      loadProgress();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [cookies.discord_user]);

  // Get user avatar URL
  const getAvatarUrl = () => {
    if (!userData?.avatar) return null;
    const avatarId = userData.avatar;
    const userId = userData.id;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=64`;
  };

  const handle2DClick = () => {
    router.push('/shop/2d');
  };

  const handle3DClick = () => {
    router.push('/shop/3d');
  };

  return (
    <main 
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden space-background" 
      style={{ 
        minHeight: '100vh', 
        width: '100%',
        backgroundColor: '#0a0a2e',
        position: 'relative'
      }}
    >
      {/* User Info - Top Right Corner */}
      {userData && (
        <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
          {/* Username */}
          <div className="text-white text-sm font-semibold" style={{ 
            fontFamily: 'monospace',
            textShadow: '0 0 5px rgba(255,255,255,0.8)',
            imageRendering: 'pixelated'
          }}>
            {userData.nickname || userData.username || userData.global_name || '#username'}
          </div>
          
          {/* Profile Picture */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/80" style={{ 
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}>
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()!}
                alt="Profile"
                width={48}
                height={48}
                className="object-cover w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                <span className="text-gray-600 text-xs">?</span>
              </div>
            )}
          </div>

          {/* Hamster Coins with Amount */}
          <div className="flex items-center gap-2">
            {/* Coin Icon */}
            <img
              src="/Asset/Vector (1).png"
              alt="Hamster Coin"
              className="w-8 h-8 object-contain"
              style={{
                imageRendering: 'pixelated'
              }}
            />
            {/* Coin Amount */}
            <div className="text-yellow-400 text-lg font-bold" style={{ 
              fontFamily: 'monospace',
              textShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
              imageRendering: 'pixelated'
            }}>
              {hamsterCoin}
            </div>
          </div>
        </div>
      )}

      {/* Hamster Shop Title */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <div 
          className="px-8 py-3 rounded-lg border-2 border-white/80"
          style={{
            backgroundColor: '#000000',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)',
          }}
        >
          <h1 
            className="text-white text-2xl font-bold"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 5px rgba(255,255,255,0.8)',
              imageRendering: 'pixelated',
            }}
          >
            Hamster Shop
          </h1>
        </div>
      </div>

      {/* 2D and 3D Buttons */}
      <div className="flex items-center justify-center gap-8 z-20">
        {/* 2D Button */}
        <button
          onClick={handle2DClick}
          className="w-64 h-64 rounded-lg transition-all hover:opacity-80 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: '#4a4a4a',
            boxShadow: '0 0 20px rgba(255,255,255,0.3)',
            border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          <span 
            className="text-white text-6xl font-bold"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 10px rgba(255,255,255,0.8)',
              imageRendering: 'pixelated',
            }}
          >
            2D
          </span>
        </button>

        {/* 3D Button */}
        <button
          onClick={handle3DClick}
          className="w-64 h-64 rounded-lg transition-all hover:opacity-80 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: '#4a4a4a',
            boxShadow: '0 0 20px rgba(255,255,255,0.3)',
            border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          <span 
            className="text-white text-6xl font-bold"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 10px rgba(255,255,255,0.8)',
              imageRendering: 'pixelated',
            }}
          >
            3D
          </span>
        </button>
      </div>

      {/* Exit Button - Bottom Right */}
      <button
        onClick={() => router.push('/')}
        className="absolute bottom-6 right-6 z-20 text-white text-2xl hover:opacity-80 transition-opacity"
        style={{
          fontFamily: 'monospace',
          textShadow: '0 0 5px rgba(255,255,255,0.8)',
        }}
      >
        [→]
      </button>
    </main>
  );
}

