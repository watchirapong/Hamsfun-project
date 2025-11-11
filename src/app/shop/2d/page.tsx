'use client';

import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface ShopAsset {
  _id: string;
  name: string;
  description: string;
  link: string;
  category: 'Enemy' | 'Interactable Object' | 'Player Action' | 'Player Extension';
  subCategory?: string;
  price: number;
  createdBy: string;
}

export default function Shop2DPage() {
  const [cookies] = useCookies(['discord_user']);
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [hamsterCoin, setHamsterCoin] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assets, setAssets] = useState<ShopAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ShopAsset | null>(null);
  const [selectedAssetPosition, setSelectedAssetPosition] = useState<{ x: number; y: number } | null>(null);
  const [purchasedAssets, setPurchasedAssets] = useState<string[]>([]);
  const lastPurchaseTimeRef = useRef<number>(0);

  // Create Asset Form State
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetLink, setAssetLink] = useState('');
  const [assetCategory, setAssetCategory] = useState<'Enemy' | 'Interactable Object' | 'Player Action' | 'Player Extension'>('Enemy');
  const [assetPrice, setAssetPrice] = useState(100000);

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
    const loadProgress = async (skipIfRecentPurchase = false) => {
      if (cookies.discord_user) {
        try {
          // Skip refresh if purchase happened in last 2 seconds
          if (skipIfRecentPurchase && Date.now() - lastPurchaseTimeRef.current < 2000) {
            console.log('⏭️ Skipping refresh - recent purchase');
            return;
          }
          
          const user = typeof cookies.discord_user === 'string' 
            ? JSON.parse(cookies.discord_user) 
            : cookies.discord_user;
          
          const response = await fetch(`/api/progress/load?discordId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('📥 Loaded progress:', {
              hamsterCoin: data.hamsterCoin,
              purchasedAssets: data.purchasedAssets,
              purchasedAssetsCount: data.purchasedAssets?.length || 0,
            });
            setHamsterCoin(Number(data.hamsterCoin) || 0);
            // Only update purchasedAssets if we have data
            if (data.purchasedAssets && Array.isArray(data.purchasedAssets)) {
              setPurchasedAssets(data.purchasedAssets.map((id: any) => String(id)));
            }
          }
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      }
    };

    // Load assets
    const loadAssets = async () => {
      try {
        const response = await fetch('/api/shop/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    };

    loadProgress();
    loadAssets();
    
    // Refresh hamster coin every 5 seconds (but skip if recent purchase)
    const refreshInterval = setInterval(() => {
      loadProgress(true); // Pass true to skip if recent purchase
      loadAssets();
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

  const handleCreateAsset = async () => {
    if (!userData || !assetName || !assetDescription || !assetLink) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/shop/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetName,
          description: assetDescription,
          link: assetLink,
          category: assetCategory,
          price: assetPrice,
          createdBy: userData.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssets([...assets, data.asset]);
        setShowCreateModal(false);
        // Reset form
        setAssetName('');
        setAssetDescription('');
        setAssetLink('');
        setAssetPrice(100000);
      } else {
        const error = await response.json();
        alert(`Failed to create asset: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Error creating asset');
    }
  };

  const handleBuyAsset = async (asset: ShopAsset) => {
    if (!userData) return;

    // Check if already purchased
    if (purchasedAssets.includes(asset._id)) {
      // Open asset link
      if (asset.link) {
        window.open(asset.link, '_blank');
      }
      return;
    }

    if (!confirm(`Buy "${asset.name}" for ${asset.price} HamsterCoin?`)) {
      return;
    }

    try {
      console.log('🛒 Attempting to buy asset:', {
        assetId: asset._id,
        assetPrice: asset.price,
        currentCoins: hamsterCoin,
        discordId: userData.id,
      });

      const response = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset._id,
          discordId: userData.id,
        }),
      });

      const data = await response.json();
      console.log('🛒 Buy response:', data);

      if (response.ok) {
        // Mark purchase time to prevent refresh from overwriting
        const purchaseTime = Date.now();
        lastPurchaseTimeRef.current = purchaseTime;
        
        // Use data from buy response which includes verified values
        // The response contains the updated balance and purchased assets from the database
        const newBalance = Number(data.newBalance) ?? 0;
        const newPurchasedAssets = Array.isArray(data.purchasedAssets) 
          ? data.purchasedAssets.map((id: any) => String(id))
          : [...purchasedAssets, String(asset._id)];
        
        console.log('💰 Updating state after purchase:', {
          newBalance,
          newPurchasedAssets,
          assetId: asset._id,
          assetIdString: String(asset._id),
        });
        
        // Update state immediately with verified values from the buy response
        setHamsterCoin(newBalance);
        setPurchasedAssets(newPurchasedAssets);
        
        // Verify purchase is in the array
        console.log('✅ Purchase verification:', {
          assetId: String(asset._id),
          isInArray: newPurchasedAssets.includes(String(asset._id)),
          arrayContents: newPurchasedAssets,
          currentPurchasedAssetsState: purchasedAssets,
        });
        
        // Reload from server after a delay to ensure consistency (but skip if purchase just happened)
        setTimeout(async () => {
          // Only reload if enough time has passed since purchase
          if (Date.now() - lastPurchaseTimeRef.current >= 2000) {
            try {
              const progressResponse = await fetch(`/api/progress/load?discordId=${userData.id}`);
              if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                const verifiedAssets = (progressData.purchasedAssets || []).map((id: any) => String(id));
                console.log('💰 Verified progress after purchase:', {
                  hamsterCoin: progressData.hamsterCoin,
                  purchasedAssets: verifiedAssets,
                  assetId: String(asset._id),
                  isInVerified: verifiedAssets.includes(String(asset._id)),
                });
                setHamsterCoin(Number(progressData.hamsterCoin) || 0);
                setPurchasedAssets(verifiedAssets);
              }
            } catch (err) {
              console.error('Error verifying purchase:', err);
            }
          } else {
            console.log('⏭️ Skipping reload - purchase too recent');
          }
        }, 1000);
        
        alert(`Successfully purchased "${asset.name}"!`);
        // Keep the panel open so user can see "Go To Asset" button
      } else {
        console.error('❌ Buy failed:', data);
        alert(`Failed to buy asset: ${data.error}${data.details ? ` - ${data.details}` : ''}`);
      }
    } catch (error) {
      console.error('Error buying asset:', error);
      alert('Error buying asset');
    }
  };

  const handleGoToAsset = (asset: ShopAsset) => {
    if (asset.link) {
      window.open(asset.link, '_blank');
    }
  };

  const isAssetPurchased = (assetId: string) => {
    // Convert both to strings for comparison
    const assetIdStr = String(assetId);
    return purchasedAssets.some(id => String(id) === assetIdStr);
  };

  const categories = ['Enemy', 'Interactable Object', 'Player Action', 'Player Extension'];
  const getAssetsByCategory = (category: string) => {
    return assets.filter(asset => asset.category === category);
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
            <img
              src="/Asset/Vector (1).png"
              alt="Hamster Coin"
              className="w-8 h-8 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="text-yellow-400 text-lg font-bold" style={{ 
              fontFamily: 'monospace',
              textShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
              imageRendering: 'pixelated'
            }}>
              {hamsterCoin}
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors text-lg"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 5px rgba(0,0,0,0.8)',
            }}
          >
            Create
          </button>
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

      {/* Main Shop Structure */}
      <div className="flex flex-col items-center gap-4 z-10 relative" style={{ marginTop: '100px', paddingBottom: '100px' }}>
        {/* 2D Button */}
        <button
          className="px-12 py-6 rounded-lg border-2 border-white/80 transition-all hover:opacity-80"
          style={{
            backgroundColor: '#000000',
            boxShadow: '0 0 15px rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
          }}
        >
          2D
        </button>

        {/* Connection Line */}
        <div className="w-1.5 h-10 bg-white/50" />

        {/* Base 2D Button */}
        <button
          className="px-10 py-5 rounded-lg transition-all hover:opacity-80"
          style={{
            backgroundColor: '#4a4a4a',
            boxShadow: '0 0 15px rgba(255,255,255,0.3)',
            border: '2px solid rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            color: 'white',
            fontSize: '26px',
            fontWeight: 'bold',
          }}
        >
          Base 2D
        </button>

        {/* Connection Line */}
        <div className="w-1.5 h-10 bg-white/50" />

        {/* Category Buttons - Horizontal Layout */}
        <div className="flex items-start gap-8 mt-6">
          {categories.map((category) => (
            <div key={category} className="flex flex-col items-center relative">
              <button
                className="px-6 py-4 rounded-lg transition-all hover:opacity-80 mb-3"
                style={{
                  backgroundColor: '#4a4a4a',
                  boxShadow: '0 0 15px rgba(255,255,255,0.3)',
                  border: '2px solid rgba(255,255,255,0.5)',
                  fontFamily: 'monospace',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  minWidth: '200px',
                  whiteSpace: 'nowrap',
                }}
              >
                {category}
              </button>

              {/* Connection Line - Only show if there are assets */}
              {getAssetsByCategory(category).length > 0 && (
                <div className="w-1.5 h-6 bg-white/50 mb-3" />
              )}

              {/* Assets under this category */}
              <div className="flex flex-col items-center gap-3">
                {getAssetsByCategory(category).map((asset, idx) => (
                  <div key={asset._id} className="relative">
                    {/* Connection line from category to first asset */}
                    {idx === 0 && getAssetsByCategory(category).length > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-1.5 h-6 bg-white/50" />
                    )}
                    <button
                      onClick={(e) => {
                        if (selectedAsset?._id === asset._id) {
                          setSelectedAsset(null);
                          setSelectedAssetPosition(null);
                        } else {
                          setSelectedAsset(asset);
                          // Get button position
                          const rect = e.currentTarget.getBoundingClientRect();
                          setSelectedAssetPosition({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }
                      }}
                      className="px-5 py-3 rounded-lg transition-all hover:opacity-80 relative z-10"
                      style={{
                        backgroundColor: selectedAsset?._id === asset._id ? '#6a6a6a' : '#4a4a4a',
                        boxShadow: '0 0 8px rgba(255,255,255,0.3)',
                        border: selectedAsset?._id === asset._id ? '2px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.5)',
                        fontFamily: 'monospace',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '160px',
                      }}
                    >
                      {asset.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Click Detail Panel */}
      {selectedAsset && selectedAssetPosition && (
        <div
          className="fixed z-50 p-6 rounded-lg border-2 border-white/80 pointer-events-auto"
          style={{
            backgroundColor: '#000000',
            boxShadow: '0 0 25px rgba(255,255,255,0.5)',
            left: `${selectedAssetPosition.x}px`,
            top: `${selectedAssetPosition.y + 60}px`,
            transform: 'translateX(-50%)',
            minWidth: '400px',
            maxWidth: '500px',
            fontFamily: 'monospace',
            color: 'white',
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
              {selectedAsset.name}
            </h3>
            <button
              onClick={() => {
                setSelectedAsset(null);
                setSelectedAssetPosition(null);
              }}
              className="text-white hover:text-gray-300 text-3xl font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              ×
            </button>
          </div>
          <p className="text-base mb-4 text-gray-300" style={{ fontFamily: 'monospace' }}>
            {selectedAsset.description || 'This is Description'}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-yellow-400 font-bold text-xl" style={{ fontFamily: 'monospace' }}>
              {selectedAsset.price} HamsterCoin
            </span>
          </div>
          {isAssetPurchased(selectedAsset._id) ? (
            <button
              onClick={() => {
                handleGoToAsset(selectedAsset);
                setSelectedAsset(null);
                setSelectedAssetPosition(null);
              }}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors border-2 border-white/80 text-lg"
              style={{ fontFamily: 'monospace' }}
            >
              Go To Asset
            </button>
          ) : (
            <button
              onClick={() => {
                handleBuyAsset(selectedAsset);
              }}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-lg"
              style={{ fontFamily: 'monospace' }}
            >
              Buy
            </button>
          )}
        </div>
      )}

      {/* Backdrop to close panel when clicking outside */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => {
            setSelectedAsset(null);
            setSelectedAssetPosition(null);
          }}
        />
      )}

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-black border-2 border-white/80 rounded-lg p-8 max-w-2xl w-full mx-4"
            style={{
              boxShadow: '0 0 25px rgba(255,255,255,0.5)',
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'monospace' }}>
              Create Asset
            </h2>
            <p className="text-white mb-6 text-lg" style={{ fontFamily: 'monospace' }}>
              Select Category
            </p>

            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-white mb-3 text-lg" style={{ fontFamily: 'monospace' }}>
                  Category
                </label>
                <select
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value as any)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 text-lg"
                  style={{ fontFamily: 'monospace' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Asset Name */}
              <div>
                <label className="block text-white mb-3 text-lg" style={{ fontFamily: 'monospace' }}>
                  Asset Name
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Type"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 placeholder-gray-500 text-lg"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {/* Asset Description */}
              <div>
                <label className="block text-white mb-3 text-lg" style={{ fontFamily: 'monospace' }}>
                  Asset Description
                </label>
                <textarea
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  placeholder="Type"
                  rows={4}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 placeholder-gray-500 resize-none text-lg"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {/* Asset Link */}
              <div>
                <label className="block text-white mb-3 text-lg" style={{ fontFamily: 'monospace' }}>
                  Asset Link
                </label>
                <input
                  type="text"
                  value={assetLink}
                  onChange={(e) => setAssetLink(e.target.value)}
                  placeholder="Type"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 placeholder-gray-500 text-lg"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {/* Set Price */}
              <div className="flex items-center gap-3">
                <label className="text-white text-lg" style={{ fontFamily: 'monospace' }}>
                  Set Price:
                </label>
                <input
                  type="number"
                  value={assetPrice}
                  onChange={(e) => setAssetPrice(Number(e.target.value))}
                  className="flex-1 bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 text-lg"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors text-lg"
                  style={{ fontFamily: 'monospace' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAsset}
                  className="flex-1 px-6 py-4 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors text-lg"
                  style={{ fontFamily: 'monospace' }}
                >
                  Create Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Button - Bottom Right */}
      <button
        onClick={() => router.push('/shop')}
        className="absolute bottom-6 right-6 z-20 text-white text-2xl hover:opacity-80 transition-opacity"
        style={{
          fontFamily: 'monospace',
          textShadow: '0 0 5px rgba(255,255,255,0.8)',
        }}
      >
        [←]
      </button>
    </main>
  );
}
