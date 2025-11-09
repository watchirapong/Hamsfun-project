'use client';

import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

interface Answer {
  text?: string;
  imageUrl?: string;
  earthNumber?: number;
}

interface User {
  discordId: string;
  username: string;
  nickname: string;
  avatarUrl?: string;
  points: number;
  unityBasicProgress: number;
  unityAssetProgress: number;
  answers: {
    unityBasic: Answer[];
    unityAsset: Answer[];
  };
  updatedAt: string;
}

export default function AdminPage() {
  const [cookies] = useCookies(['discord_user']);
  const [activeTab, setActiveTab] = useState<'profile' | 'check' | 'book'>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Enable page scrolling for admin page
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  return (
    <main className="relative w-full space-background" style={{ 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: '#0a0a2e',
      padding: '1rem',
      paddingTop: '5rem'
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
      <div className="w-full max-w-7xl xl:max-w-[90vw] 2xl:max-w-[1400px] mx-auto bg-gray-800 rounded-2xl shadow-2xl flex flex-col min-h-[600px]">
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-12 md:w-16 bg-black flex flex-col items-center py-4 md:py-8 gap-4 md:gap-6 flex-shrink-0">
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
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-4 md:p-6" style={{ background: 'transparent' }}>
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by nickname, username, or Discord ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchUsers();
                      }
                    }}
                    className="w-full bg-gray-600 text-white px-3 md:px-4 py-2 md:py-3 pr-10 md:pr-12 rounded-lg text-base md:text-lg font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 hover:bg-gray-500 transition-colors cursor-text"
                    style={{ fontFamily: 'Jersey 25, sans-serif' }}
                    autoFocus={false}
                  />
                  <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* User List */}
                {loading ? (
                  <div className="text-white text-center py-8">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-white text-center py-8">No users found</div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => {
                      const isExpanded = expandedUsers.has(user.discordId);
                      return (
                        <div key={user.discordId} className="bg-gray-600 rounded-lg overflow-hidden relative">
                          {/* User Row */}
                          <div
                            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-500 transition-colors select-none relative z-10"
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
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-400 flex-shrink-0 overflow-hidden">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.nickname}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to default avatar if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                                  <span className="text-gray-600 text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-white font-semibold text-sm md:text-base truncate" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                              {user.nickname}
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
                            <div className="px-4 pb-4 pt-2 space-y-4 bg-gray-500">
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
                                        <div key={`basic-${idx}`} className="text-white text-sm bg-gray-600 p-2 rounded break-words space-y-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
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
                                        <div key={`asset-${idx}`} className="text-white text-sm bg-gray-600 p-2 rounded break-words space-y-2" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
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
              <div className="text-white text-center py-8" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                Check tab - Coming soon
              </div>
            )}

            {activeTab === 'book' && (
              <div className="text-white text-center py-8" style={{ fontFamily: 'Jersey 25, sans-serif' }}>
                Book tab - Coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

