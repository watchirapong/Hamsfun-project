'use client';

import { useState, useEffect, useRef } from 'react';
import { useCookies } from 'react-cookie';

interface Answer {
  text?: string;
  imageUrl?: string;
  fileUrl?: string;
  earthNumber?: number;
  createdAt?: string;
  status?: 'pending' | 'accepted' | 'declined';
  adminComment?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface User {
  discordId: string;
  name: string;
  username: string;
  nickname: string;
  avatarUrl?: string;
  hamsterCoin: number;
  gachaTicket: number;
  points: number;
  unlockedPlanets: number[];
  unityBasicProgress: number;
  unityAssetProgress: number;
  answers: {
    unityBasic: Answer[];
    unityAsset: Answer[];
  };
  achievements: Array<{
    id: string;
    name: string;
    description?: string;
    unlockedAt: string;
  }>;
  updatedAt: string;
}

export default function AdminPage() {
  const [cookies] = useCookies(['discord_user']);
  const [activeTab, setActiveTab] = useState<'profile' | 'check' | 'book' | 'event'>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bossEvent, setBossEvent] = useState<{ isActive: boolean; bossLevel: number; bossHp: number; maxBossHp: number } | null>(null);
  const [showBossSettings, setShowBossSettings] = useState(false);
  const [bossLevel, setBossLevel] = useState(1);
  const [bossHp, setBossHp] = useState(1000);
  const [rewardHamsterCoin, setRewardHamsterCoin] = useState(0);
  const [rewardStatPoint, setRewardStatPoint] = useState(0);
  const [pendingAnswers, setPendingAnswers] = useState<Array<{
    user: User;
    answer: Answer;
    answerType: 'unityBasic' | 'unityAsset';
    answerIndex: number;
  }>>([]);
  const [declineComment, setDeclineComment] = useState<Record<string, string>>({});
  const [showDeclineInput, setShowDeclineInput] = useState<Record<string, boolean>>({});
  const recentlyReviewedRef = useRef<Set<string>>(new Set()); // Track recently reviewed answers using ref

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', response.statusText);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Search with debouncing - triggers on mount and when searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Fetch pending answers when check tab is active
  useEffect(() => {
    if (activeTab === 'check') {
      fetchPendingAnswers();
      // Poll for new answers every 5 seconds
      const interval = setInterval(fetchPendingAnswers, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const toggleUser = (discordId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discordId)) {
        newSet.delete(discordId);
      } else {
        newSet.add(discordId);
      }
      return newSet;
    });
  };

  // Fetch boss event state
  const fetchBossEvent = async () => {
    try {
      const response = await fetch('/api/boss-event');
      if (response.ok) {
        const data = await response.json();
        setBossEvent(data);
      }
    } catch (error) {
      console.error('Error fetching boss event:', error);
    }
  };

  // Trigger boss event
  const triggerBossEvent = async () => {
    try {
      console.log('🎮 Triggering boss event with:', {
        bossLevel,
        bossHp,
        rewardHamsterCoin,
        rewardStatPoint,
      });
      
      const response = await fetch('/api/boss-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'trigger', 
          bossLevel, 
          bossHp,
          rewardHamsterCoin: rewardHamsterCoin || 0,
          rewardStatPoint: rewardStatPoint || 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Boss event triggered:', data);
        await fetchBossEvent();
        setShowBossSettings(false);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to trigger boss event:', errorData);
        alert(`Failed to trigger boss event: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Error triggering boss event:', error);
      alert(`Error triggering boss event: ${error}`);
    }
  };

  // Stop boss event
  const stopBossEvent = async () => {
    try {
      const response = await fetch('/api/boss-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (response.ok) {
        await fetchBossEvent();
      }
    } catch (error) {
      console.error('Error stopping boss event:', error);
    }
  };

  // Fetch pending answers
  const fetchPendingAnswers = async () => {
    try {
      // Get all users and extract pending answers
      const response = await fetch(`/api/admin/users?search=`);
      if (response.ok) {
        const data = await response.json();
        const allPendingAnswers: Array<{
          user: User;
          answer: Answer;
          answerType: 'unityBasic' | 'unityAsset';
          answerIndex: number;
        }> = [];

        data.users.forEach((user: User) => {
          // Check unityBasic answers
          if (user.answers?.unityBasic) {
            user.answers.unityBasic.forEach((answer, index) => {
              // Get status - if status is 'accepted', skip it (declined answers are removed from array)
              const status = answer?.status;
              
              // Skip accepted answers (they're already reviewed)
              if (status === 'accepted') {
                return;
              }
              
              // All other answers (pending or no status) are pending for review
              allPendingAnswers.push({
                user,
                answer,
                answerType: 'unityBasic',
                answerIndex: index,
              });
            });
          }
          // Check unityAsset answers
          if (user.answers?.unityAsset) {
            user.answers.unityAsset.forEach((answer, index) => {
              // Get status - if status is 'accepted', skip it (declined answers are removed from array)
              const status = answer?.status;
              
              // Skip accepted answers (they're already reviewed)
              if (status === 'accepted') {
                return;
              }
              
              // All other answers (pending or no status) are pending for review
              allPendingAnswers.push({
                user,
                answer,
                answerType: 'unityAsset',
                answerIndex: index,
              });
            });
          }
        });

        // Sort by creation date (newest first)
        allPendingAnswers.sort((a, b) => {
          const dateA = new Date(a.answer.createdAt || 0).getTime();
          const dateB = new Date(b.answer.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setPendingAnswers(allPendingAnswers);
      }
    } catch (error) {
      console.error('Error fetching pending answers:', error);
    }
  };

  // Review answer (accept or decline)
  const reviewAnswer = async (
    discordId: string,
    answerType: 'unityBasic' | 'unityAsset',
    answerIndex: number,
    action: 'accept' | 'decline',
    comment?: string
  ) => {
    try {
      const userData = typeof cookies.discord_user === 'string' 
        ? JSON.parse(cookies.discord_user) 
        : cookies.discord_user;
      const adminDiscordId = userData?.id || 'admin';

      const response = await fetch('/api/admin/answers/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId,
          answerType,
          answerIndex,
          action,
          adminComment: comment,
          reviewedBy: adminDiscordId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Answer reviewed successfully:', data);
        
        // Create a unique key for this answer
        const answerKey = `${discordId}-${answerType}-${answerIndex}`;
        
        // Mark as recently reviewed to prevent re-adding
        recentlyReviewedRef.current.add(answerKey);
        
        // Immediately remove from pending answers list (optimistic update)
        setPendingAnswers(prev => {
          const filtered = prev.filter(
            item => !(
              item.user.discordId === discordId &&
              item.answerType === answerType &&
              item.answerIndex === answerIndex
            )
          );
          console.log('📋 Removed answer from list. Remaining:', filtered.length, 'Answer key:', answerKey);
          return filtered;
        });
        
        // Don't refresh immediately - let the server update first
        // The polling interval will refresh it naturally
        // Only refresh users list (doesn't affect pending answers)
        await fetchUsers();
        
        // Don't clear the recently reviewed flag - keep it permanently
        // This ensures declined answers never come back, even if server is slow
        // The flag will only be cleared if the page is refreshed, which is fine
        
        // Clear decline comment
        setDeclineComment(prev => {
          const newState = { ...prev };
          delete newState[answerKey];
          return newState;
        });
        setShowDeclineInput(prev => {
          const newState = { ...prev };
          delete newState[answerKey];
          return newState;
        });
      } else {
        console.error('❌ Failed to review answer:', data);
        alert(`Failed to review answer: ${data.error || 'Unknown error'}${data.details ? ` - ${data.details}` : ''}`);
        // If error, refresh to restore correct state
        await fetchPendingAnswers();
      }
    } catch (error: any) {
      console.error('💥 Error reviewing answer:', error);
      alert(`Error reviewing answer: ${error?.message || error}`);
      // If error, refresh to restore correct state
      await fetchPendingAnswers();
    }
  };

  // Enable page scrolling for admin page and apply font globally
  useEffect(() => {
    document.body.style.overflow = 'auto';
    // Apply Jersey 25 font to the entire admin page
    const adminPage = document.querySelector('main');
    if (adminPage) {
      adminPage.style.fontFamily = 'Jersey 25, sans-serif';
      // Apply font to all child elements
      const allElements = adminPage.querySelectorAll('*');
      allElements.forEach((el) => {
        const element = el as HTMLElement;
        if (element.style && !element.style.fontFamily) {
          element.style.fontFamily = 'Jersey 25, sans-serif';
        }
      });
    }
    fetchBossEvent();
    const interval = setInterval(fetchBossEvent, 3000); // Poll every 3 seconds
    return () => {
      document.body.style.overflow = 'hidden';
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="relative w-full space-background admin-page" style={{ 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: '#0a0a2e',
      padding: '1rem',
      paddingTop: '5rem',
      pointerEvents: 'auto',
      zIndex: 1,
      fontFamily: 'Jersey 25, sans-serif'
    }}>
      {/* Admin Header */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-2">
        <div className="text-yellow-400 text-2xl md:text-4xl font-bold" style={{ 
          fontFamily: 'Jersey 25, sans-serif',
          textShadow: '0 0 10px rgba(255, 255, 0, 0.8)',
          imageRendering: 'pixelated'
        }}>
          Admin
        </div>
        <div className="text-yellow-400 text-xl md:text-2xl">👑</div>
      </div>

      {/* Main Content Panel */}
      <div className="w-full max-w-7xl xl:max-w-[90vw] 2xl:max-w-[1400px] mx-auto rounded-2xl shadow-2xl flex flex-col min-h-[600px] relative z-10 border-2" style={{ 
        pointerEvents: 'auto',
        backgroundColor: '#2d2d2d',
        borderColor: '#4a4a4a'
      }}>
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-12 md:w-16 flex flex-col items-center py-4 md:py-8 gap-4 md:gap-6 flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
            {/* Profile Icon */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all ${
                activeTab === 'profile' ? 'bg-gray-700 rounded-lg' : 'hover:bg-gray-800 rounded-lg'
              }`}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Checkmark Icon */}
            <button
              onClick={() => setActiveTab('check')}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all ${
                activeTab === 'check' ? 'bg-gray-700 rounded-lg' : 'hover:bg-gray-800 rounded-lg'
              }`}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Book Icon */}
            <button
              onClick={() => setActiveTab('book')}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all ${
                activeTab === 'book' ? 'bg-gray-700 rounded-lg' : 'hover:bg-gray-800 rounded-lg'
              }`}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </button>

            {/* Event Icon (Crossed Swords) */}
            <button
              onClick={() => setActiveTab('event')}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-all ${
                activeTab === 'event' ? 'bg-gray-700 rounded-lg' : 'hover:bg-gray-800 rounded-lg'
              }`}
            >
              <img 
                src="/Asset/Vector.png" 
                alt="Event" 
                className="w-5 h-5 md:w-6 md:h-6 object-contain"
              />
            </button>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-4 md:p-6 relative" style={{ background: '#2d2d2d', pointerEvents: 'auto', zIndex: 10 }}>
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative" style={{ zIndex: 10 }}>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchUsers();
                      }
                    }}
                    className="w-full text-black px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-lg text-base md:text-lg font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors cursor-text"
                    style={{ 
                      fontFamily: 'Jersey 25, sans-serif', 
                      position: 'relative', 
                      zIndex: 20, 
                      pointerEvents: 'auto',
                      backgroundColor: '#9ca3af'
                    }}
                    autoFocus={false}
                    disabled={false}
                  />
                  <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ zIndex: 30 }}>
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* User List */}
                {loading ? (
                  <div className="text-white text-center py-8" style={{ fontFamily: 'Jersey 25, sans-serif' }}>Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-white text-center py-8" style={{ fontFamily: 'Jersey 25, sans-serif' }}>No users found</div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => {
                      const isExpanded = expandedUsers.has(user.discordId);
                      return (
                        <div key={user.discordId} className="rounded-lg overflow-hidden relative border-b border-gray-600" style={{ backgroundColor: '#2d2d2d' }}>
                          {/* User Row */}
                          <div
                            className="flex items-center gap-4 p-4 cursor-pointer hover:opacity-80 transition-opacity select-none relative z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleUser(user.discordId);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleUser(user.discordId);
                              }
                            }}
                            style={{ position: 'relative', zIndex: 10 }}
                          >
                            {/* Profile Image */}
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#9ca3af' }}>
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatarUrl}.png`}
                                  alt={user.nickname}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to default avatar if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#9ca3af' }}>
                                  <span className="text-gray-600 text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-white font-semibold text-sm md:text-base truncate" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              {user.nickname || user.name || user.username}
                            </div>
                            <div className="text-white pointer-events-none flex-shrink-0">
                              <svg
                                className={`w-5 h-5 md:w-6 md:h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 space-y-4" style={{ backgroundColor: '#2d2d2d' }}>
                              {/* User Info */}
                              <div className="space-y-2">
                                <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                  <span className="font-bold">Name : </span>
                                  <span>{user.name || user.username}</span>
                                </div>
                                <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                  <span className="font-bold">Username : </span>
                                  <span>{user.username}</span>
                                </div>
                                {user.nickname && (
                                  <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                    <span className="font-bold">Nickname : </span>
                                    <span>{user.nickname}</span>
                                  </div>
                                )}
                                <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                  <span className="font-bold">Discord ID : </span>
                                  <span className="text-xs">{user.discordId}</span>
                                </div>
                              </div>

                              {/* Currency */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                  <span className="font-bold">HamsterCoin : </span>
                                  <span className="text-yellow-400">{user.hamsterCoin}</span>
                                </div>
                                <div className="text-white text-right" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                  <span className="font-bold">GachaTicket : </span>
                                  <span className="text-yellow-400">{user.gachaTicket}</span>
                                </div>
                              </div>

                              {/* Skill Point */}
                              <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                <span className="font-bold">Skill Point : </span>
                                <span>{user.points}</span>
                              </div>

                              {/* Progress */}
                              <div>
                                <div className="text-white font-bold mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>Progress</div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                    Unity Basic : {user.unityBasicProgress}%
                                  </div>
                                  <div className="text-white text-right" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                    Unity Asset : {user.unityAssetProgress}%
                                  </div>
                                </div>
                              </div>

                              {/* Answers */}
                              <div>
                                <div className="text-white font-bold mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>Answer</div>
                                <div className="space-y-2">
                                  {/* Unity Basic Answers */}
                                  {user.answers.unityBasic.length > 0 && (
                                    <>
                                      <div className="text-white" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                        <span className="font-semibold">Unity Basic : </span>
                                        <span>{user.answers.unityBasic.length}</span>
                                      </div>
                                      {user.answers.unityBasic.map((answer, idx) => (
                                        <div key={`basic-${idx}`} className="text-white text-sm p-2 rounded break-words space-y-2" style={{ fontFamily: 'Jersey 25, sans-serif', backgroundColor: '#1a1a1a' }}>
                                          {answer.earthNumber && (
                                            <div className="font-bold text-yellow-400">Earth {answer.earthNumber} :</div>
                                          )}
                                          {answer.text && (
                                            <div>Answer : {answer.text}</div>
                                          )}
                                          {answer.imageUrl && (
                                            <div className="mt-2">
                                              <div className="mb-1" style={{ fontFamily: 'Jersey 25, sans-serif' }}>Image :</div>
                                              <img
                                                src={answer.imageUrl}
                                                alt={`Answer image ${idx + 1}`}
                                                className="max-w-full h-auto rounded border border-gray-500 cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                onClick={() => window.open(answer.imageUrl, '_blank')}
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const errorDiv = document.createElement('div');
                                                  errorDiv.className = 'text-red-400 text-xs';
                                                  errorDiv.textContent = 'Failed to load image';
                                                  target.parentElement?.appendChild(errorDiv);
                                                }}
                                              />
                                            </div>
                                          )}
                                          {answer.fileUrl && (
                                            <div className="mt-2">
                                              <div className="mb-1" style={{ fontFamily: 'Jersey 25, sans-serif' }}>File :</div>
                                              <a
                                                href={answer.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 underline break-all"
                                              >
                                                {answer.fileUrl}
                                              </a>
                                            </div>
                                          )}
                                          {answer.createdAt && (
                                            <div className="text-gray-400 text-xs mt-1">
                                              Created: {new Date(answer.createdAt).toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </>
                                  )}
                                  
                                  {/* Unity Asset Answers */}
                                  {user.answers.unityAsset.length > 0 && (
                                    <>
                                      <div className="text-white mt-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                        <span className="font-semibold">Unity Asset : </span>
                                        <span>{user.answers.unityAsset.length}</span>
                                      </div>
                                      {user.answers.unityAsset.map((answer, idx) => (
                                        <div key={`asset-${idx}`} className="text-white text-sm p-2 rounded break-words space-y-2" style={{ fontFamily: 'Jersey 25, sans-serif', backgroundColor: '#1a1a1a' }}>
                                          {answer.earthNumber && (
                                            <div className="font-bold text-yellow-400">Earth {answer.earthNumber} :</div>
                                          )}
                                          {answer.text && (
                                            <div>Answer : {answer.text}</div>
                                          )}
                                          {answer.imageUrl && (
                                            <div className="mt-2">
                                              <div className="mb-1" style={{ fontFamily: 'Jersey 25, sans-serif' }}>Image :</div>
                                              <img
                                                src={answer.imageUrl}
                                                alt={`Answer image ${idx + 1}`}
                                                className="max-w-full h-auto rounded border border-gray-500 cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                onClick={() => window.open(answer.imageUrl, '_blank')}
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const errorDiv = document.createElement('div');
                                                  errorDiv.className = 'text-red-400 text-xs';
                                                  errorDiv.textContent = 'Failed to load image';
                                                  target.parentElement?.appendChild(errorDiv);
                                                }}
                                              />
                                            </div>
                                          )}
                                          {answer.fileUrl && (
                                            <div className="mt-2">
                                              <div className="mb-1" style={{ fontFamily: 'Jersey 25, sans-serif' }}>File :</div>
                                              <a
                                                href={answer.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 underline break-all"
                                              >
                                                {answer.fileUrl}
                                              </a>
                                            </div>
                                          )}
                                          {answer.createdAt && (
                                            <div className="text-gray-400 text-xs mt-1">
                                              Created: {new Date(answer.createdAt).toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </>
                                  )}
                                  
                                  {/* No answers message */}
                                  {user.answers.unityBasic.length === 0 && user.answers.unityAsset.length === 0 && (
                                    <div className="text-gray-400 text-sm" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                      No answers yet
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'check' && (
              <div className="space-y-4">
                {/* Check Title */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white text-2xl font-bold" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                    Check Answers
                  </div>
                  <button
                    onClick={fetchPendingAnswers}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    style={{ fontFamily: 'Jersey 25, sans-serif' }}
                  >
                    Refresh
                  </button>
                </div>

                {/* Pending Answers List */}
                {pendingAnswers.length === 0 ? (
                  <div className="text-white text-center py-8" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                    No pending answers
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAnswers.map((item, idx) => {
                      const answerKey = `${item.user.discordId}-${item.answerType}-${item.answerIndex}`;
                      const questionType = item.answerType === 'unityBasic' ? 'Unity Basic' : 'Unity Asset';
                      const questionText = `Earth ${item.answer.earthNumber || 'N/A'}`;

                      return (
                        <div key={idx} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                          {/* User Profile */}
                          <div className="flex items-center gap-3 mb-4">
                            {item.user.avatarUrl ? (
                              <img 
                                src={item.user.avatarUrl.startsWith('http') ? item.user.avatarUrl : `https://cdn.discordapp.com/avatars/${item.user.discordId}/${item.user.avatarUrl}.png`}
                                alt={item.user.name} 
                                className="w-12 h-12 rounded-full"
                                onError={(e) => {
                                  // Fallback to default Discord avatar
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(item.user.discordId) % 5}.png`;
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-600" />
                            )}
                            <div>
                              <div className="text-white font-bold" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                {item.user.nickname || item.user.name}
                              </div>
                              <div className="text-gray-400 text-sm" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                @{item.user.username}
                              </div>
                            </div>
                          </div>

                          {/* Question Info */}
                          <div className="mb-4">
                            <div className="text-gray-300 text-sm mb-1" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              From: {questionType} - {questionText}
                            </div>
                            <div className="text-gray-400 text-xs" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              Submitted: {item.answer.createdAt ? new Date(item.answer.createdAt).toLocaleString() : 'Unknown'}
                            </div>
                          </div>

                          {/* Answer Content */}
                          <div className="mb-4">
                            <div className="text-white font-bold mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              Answer:
                            </div>
                            {item.answer.text && (
                              <div className="text-white bg-gray-800 rounded p-3 mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                {item.answer.text}
                              </div>
                            )}
                            {(item.answer.imageUrl || item.answer.fileUrl) && (
                              <div className="mb-2">
                                {item.answer.imageUrl ? (
                                  <img 
                                    src={item.answer.imageUrl} 
                                    alt="Answer image" 
                                    className="max-w-full h-auto rounded border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                                    onClick={() => {
                                      if (item.answer.imageUrl) {
                                        window.open(item.answer.imageUrl, '_blank');
                                      }
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : item.answer.fileUrl ? (
                                  <div className="text-blue-400 hover:text-blue-300 underline" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                                    <a 
                                      href={item.answer.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                      View File
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-4">
                            <button
                              onClick={() => reviewAnswer(item.user.discordId, item.answerType, item.answerIndex, 'accept')}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bold"
                              style={{ fontFamily: 'Jersey 25, sans-serif' }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                setShowDeclineInput(prev => ({
                                  ...prev,
                                  [answerKey]: !prev[answerKey],
                                }));
                              }}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold"
                              style={{ fontFamily: 'Jersey 25, sans-serif' }}
                            >
                              Decline
                            </button>
                          </div>

                          {/* Decline Comment Input */}
                          {showDeclineInput[answerKey] && (
                            <div className="mt-4 space-y-2">
                              <textarea
                                value={declineComment[answerKey] || ''}
                                onChange={(e) => setDeclineComment(prev => ({
                                  ...prev,
                                  [answerKey]: e.target.value,
                                }))}
                                placeholder="Write a comment to the user..."
                                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 resize-none"
                                style={{ fontFamily: 'Jersey 25, sans-serif' }}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (declineComment[answerKey]?.trim()) {
                                      reviewAnswer(
                                        item.user.discordId,
                                        item.answerType,
                                        item.answerIndex,
                                        'decline',
                                        declineComment[answerKey]
                                      );
                                    } else {
                                      alert('Please enter a comment before declining');
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                                  style={{ fontFamily: 'Jersey 25, sans-serif' }}
                                >
                                  Submit Decline
                                </button>
                                <button
                                  onClick={() => {
                                    setShowDeclineInput(prev => {
                                      const newState = { ...prev };
                                      delete newState[answerKey];
                                      return newState;
                                    });
                                    setDeclineComment(prev => {
                                      const newState = { ...prev };
                                      delete newState[answerKey];
                                      return newState;
                                    });
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                                  style={{ fontFamily: 'Jersey 25, sans-serif' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'book' && (
              <div className="text-white text-center py-8" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                Book tab - Coming soon
              </div>
            )}

            {activeTab === 'event' && (
              <div className="space-y-4">
                {/* Event Title and Search */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white text-2xl font-bold" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                    Event
                  </div>
                  <div className="relative">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Boss Event Card */}
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                        Boss Event
                      </div>
                      <div className="text-white text-sm" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                        รวมพลังกันพิชิต Boss สุดโหด
                      </div>
                    </div>
                    {bossEvent?.isActive ? (
                      <button
                        onClick={stopBossEvent}
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        <div className="w-6 h-6 bg-white rounded-sm" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBossSettings(true)}
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
                      >
                        <img 
                          src="/Asset/streamline_button-play-solid.png" 
                          alt="Play" 
                          className="w-6 h-6 object-contain"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Boss Event Setting Modal */}
                {showBossSettings && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-600 min-w-[400px] max-w-[500px]">
                      <div className="text-white font-bold text-xl mb-4" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                        Boss Event Setting
                      </div>
                      
                      <div className="space-y-4">
                        {/* Boss Level Selector */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setBossLevel(Math.max(1, bossLevel - 1))}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                            style={{ fontFamily: 'Jersey 25, sans-serif' }}
                          >
                            -
                          </button>
                          <div className="flex-1">
                            <div className="text-white mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              Boss LV Selector
                            </div>
                            <input
                              type="number"
                              value={bossLevel}
                              onChange={(e) => setBossLevel(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                              style={{ fontFamily: 'Jersey 25, sans-serif' }}
                              min="1"
                            />
                          </div>
                          <button
                            onClick={() => setBossLevel(bossLevel + 1)}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                            style={{ fontFamily: 'Jersey 25, sans-serif' }}
                          >
                            +
                          </button>
                        </div>

                        {/* Boss HP Input */}
                        <div>
                          <div className="text-white mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                            Set Boss HP
                          </div>
                          <input
                            type="number"
                            value={bossHp}
                            onChange={(e) => setBossHp(Math.max(1, parseInt(e.target.value) || 1000))}
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                            style={{ fontFamily: 'Jersey 25, sans-serif' }}
                            min="1"
                          />
                        </div>

                        {/* Reward Section */}
                        <div className="border-t border-gray-600 pt-4 mt-4">
                          <div className="text-white font-bold text-lg mb-3" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                            Set Reward
                          </div>
                          
                          {/* HamsterCoin Reward */}
                          <div className="mb-4">
                            <div className="text-white mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              1. HamsterCoin
                            </div>
                            <input
                              type="number"
                              value={rewardHamsterCoin}
                              onChange={(e) => setRewardHamsterCoin(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                              style={{ fontFamily: 'Jersey 25, sans-serif' }}
                              min="0"
                              placeholder="0"
                            />
                          </div>

                          {/* Stat Point Reward */}
                          <div>
                            <div className="text-white mb-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              2. Stat Point
                            </div>
                            <input
                              type="number"
                              value={rewardStatPoint}
                              onChange={(e) => setRewardStatPoint(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                              style={{ fontFamily: 'Jersey 25, sans-serif' }}
                              min="0"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end mt-6">
                          <button
                            onClick={() => setShowBossSettings(false)}
                            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                            style={{ fontFamily: 'Jersey 25, sans-serif' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={triggerBossEvent}
                            className="px-6 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition-colors font-bold"
                            style={{ fontFamily: 'Jersey 25, sans-serif' }}
                          >
                            Trigger
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

