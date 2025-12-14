'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft } from 'lucide-react';
import { getAssetUrl, getRankIconPath, getBadgeIconPath } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';
import { mapApiSkillNameToDisplayName } from '@/utils/rewardHelpers';
import LoadingScreen from '@/components/common/LoadingScreen';

interface UserProfile {
  _id: string;
  discordUsername: string;
  discordNickname?: string;
  avatar?: string;
  rank?: {
    currentTier: string;
    points: number;
    nextRankPoints?: number;
  };
  partnerPet?: {
    icon?: string;
    level?: number;
    experience?: number;
    maxExperience?: number;
    currentStats?: {
      maxHealth: number;
      attackDamage: number;
      defense: number;
    };
    iv?: {
      maxHealth: number;
      attackDamage: number;
      defense: number;
    };
  };
  hamster?: {
    hamsterRank?: string;
  };
  isHamster?: boolean;
  badges?: {
    [key: string]: {
      rank?: string;
      points?: number;
      nextRankPoints?: number;
    };
  };
}


// Map display name to level from badge data
const getBadgeLevel = (badgeData: any): number => {
  if (!badgeData || !badgeData.rank) return 1; // Unranked
  const rank = badgeData.rank.toLowerCase();
  if (rank === 'bronze') return 2;
  if (rank === 'silver') return 3;
  if (rank === 'gold') return 4;
  if (rank === 'diamond') return 5;
  return 1; // Unranked
};

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = searchParams.get('userId') || searchParams.get('id');

  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userProfile = await userAPI.getUserProfile(userId);
        setProfile(userProfile);
      } catch (err: any) {
        console.error('Failed to fetch user profile:', err);
        setError(err?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingScreen theme={theme} />;
  }

  if (error || !profile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`rounded-xl shadow-lg p-8 max-w-md w-full mx-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className={`text-2xl font-bold text-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Profile Not Found
          </h1>
          <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {error || 'Unable to load this user\'s profile.'}
          </p>
          <button
            onClick={handleBack}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const displayName = profile.discordNickname || profile.discordUsername;
  const username = profile.discordUsername;
  const rankName = profile.rank?.currentTier || 'Unranked';
  const petLevel = profile.partnerPet?.level || 0;
  const petIcon = profile.partnerPet?.icon;
  const badgeUrl = getRankIconPath(rankName);
  const isHamster = profile.isHamster || false;
  const hamsterRank = profile.hamster?.hamsterRank;

  // Process badges for display
  const badgeSkills = ['C# Programming', 'Level Design', 'Game Design', 'Drawing'];
  const getBadgeData = (skillName: string) => {
    if (!profile.badges) return null;
    
    // Try to find matching badge in API response
    for (const [apiKey, badgeData] of Object.entries(profile.badges)) {
      const mappedName = mapApiSkillNameToDisplayName(apiKey);
      if (mappedName === skillName) {
        return badgeData;
      }
    }
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`mx-auto max-w-[428px] min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-800 text-white shadow-2xl' : 'bg-white text-black shadow-2xl'}`}>
        {/* Header with Back Button */}
        <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={handleBack}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>
              Profile
            </h1>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-4 py-4">
          {/* Top User Info Bar (Top-Left) - Card Style */}
          <div className={`flex items-center w-[220px] gap-3 mb-4 rounded-xl p-3 shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={profile.avatar || getAssetUrl("/Asset/default-avatar.png")}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getAssetUrl("/Asset/default-avatar.png");
                }}
              />
            </div>
            {/* Username & Subtitle */}
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>
                {displayName}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {username}
              </div>
            </div>
          </div>

          {/* Pet Display Section (Center Top) - Free Floating */}
          <div className="relative flex items-center justify-center mb-4" style={{ minHeight: '200px' }}>
            <img 
              src={petIcon ? getItemIconUrl(petIcon) : getAssetUrl("/Asset/pets/whothatpet.png")} 
              alt="Pet" 
              className="w-full h-auto object-contain max-w-full" 
              style={{ maxHeight: '200px' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallbackUrl = getAssetUrl("/Asset/pets/dog.png");
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
            />
            
            {/* Pet Level - Bottom Right, Plain Black Text */}
            {petLevel > 0 && (
              <div className={`absolute bottom-0 right-20 text-xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Lv{petLevel}
              </div>
            )}
          </div>

          {/* Rank & Badge Bar (Below Pet) - Card Style */}
          <div className={`rounded-xl p-4 shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-start gap-6">
              {/* Left Side - Rank */}
              <div className="flex flex-col items-center flex-shrink-0">
                <img 
                  src={badgeUrl} 
                  alt="Rank Badge" 
                  className="w-20 h-20 object-contain mb-2" 
                />
                {isHamster && hamsterRank ? (
                  <div className="text-center">
                    <div className="text-xs font-medium text-yellow-500 uppercase tracking-wider">Hamster</div>
                    <div className="font-bold text-sm text-yellow-400 truncate">{hamsterRank}</div>
                  </div>
                ) : (
                  <div className={`font-bold text-sm text-center ${isDark ? 'text-white' : 'text-black'}`}>
                    {rankName}
                  </div>
                )}
              </div>

              {/* Right Side - Badges (2x2 Grid) */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {badgeSkills.map((skillName) => {
                  const badgeData = getBadgeData(skillName);
                  const level = getBadgeLevel(badgeData);
                  
                  return (
                    <div key={skillName} className="flex flex-col items-center">
                      <img 
                        src={getBadgeIconPath(skillName, level)} 
                        alt={skillName}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileLoadingFallback() {
  const { theme } = useTheme();
  return <LoadingScreen theme={theme} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <ProfileContent />
    </Suspense>
  );
}
