'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';

export default function Home() {
  const [cookies, setCookie, removeCookie] = useCookies(['discord_user', 'discord_token']);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    if (cookies.discord_user) {
      try {
        const user = typeof cookies.discord_user === 'string' 
          ? JSON.parse(cookies.discord_user) 
          : cookies.discord_user;
        setUserData(user);
        setIsLoggedIn(true);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      setIsLoggedIn(false);
      setUserData(null);
    }
  }, [cookies.discord_user]);

  const handleLogin = () => {
    // Redirect to Discord OAuth
    window.location.href = '/api/auth/discord';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      removeCookie('discord_user');
      removeCookie('discord_token');
      setIsLoggedIn(false);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear cookies locally
      removeCookie('discord_user');
      removeCookie('discord_token');
      setIsLoggedIn(false);
      setUserData(null);
    }
  };

  // Get user avatar URL
  const getAvatarUrl = () => {
    if (!userData?.avatar) return null;
    const avatarId = userData.avatar;
    const userId = userData.id;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.png?size=64`;
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

      {/* User Info - Top Right Corner (only when logged in) */}
      {isLoggedIn && userData && (
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          {/* Username/Nickname */}
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
        </div>
      )}

      {/* Logout Button - Bottom Right Corner (only when logged in) */}
      {isLoggedIn && (
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={handleLogout}
            className="cursor-pointer hover:scale-110 transition-transform duration-300 p-2"
            title="Logout"
          >
            <img
              src="/Asset/material-symbols_logout-rounded.png"
              alt="Logout"
              width={32}
              height={32}
              className="object-contain"
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => {
                console.error('Failed to load logout icon:', e);
              }}
            />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between w-full h-screen">
        {/* Top Section - Title and Thai Text */}
        <div className="flex flex-col items-center pt-12 pb-8">
          {/* Hamstellar Title */}
          <div className="mb-6">
            <Image
              src="/Asset/เรียน 1.png"
              alt="Hamstellar"
              width={1000}
              height={250}
              className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] w-auto h-auto max-w-[90vw]"
              priority
            />
          </div>

          {/* Thai Text */}
          <div>
            <Image
              src="/Asset/ปกป้องโลกจากภัยร้าย.png"
              alt="ปกป้องโลกจากภัยร้าย"
              width={600}
              height={100}
              className="object-contain w-auto h-auto max-w-[80vw]"
              priority
            />
          </div>
        </div>

        {/* Login/Start Button - Centered */}
        <div className="w-full flex items-center justify-center pb-10" style={{ transform: "translateY(-300px)" }}>
          {isLoggedIn ? (
            <Link href="/UnityBasic" className="cursor-pointer hover:scale-110 transition-transform duration-300">
              <div className="text-white text-6xl font-bold" style={{ 
                fontFamily: 'Jersey 25, sans-serif',
                textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)',
                imageRendering: 'pixelated',
                letterSpacing: '0.1em'
              }}>
                START
              </div>
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="cursor-pointer hover:scale-110 transition-transform duration-300"
            >
              <div className="text-white text-6xl font-bold" style={{ 
                fontFamily: 'Jersey 25, sans-serif',
                textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)',
                imageRendering: 'pixelated',
                letterSpacing: '0.1em'
              }}>
                LOGIN
              </div>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

