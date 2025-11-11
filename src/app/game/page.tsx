'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import LevelOne from './levels/LevelOne';
import LevelTwo from './levels/LevelTwo';
import LevelThree from './levels/LevelThree';
import BossEventLevel from './levels/BossEventLevel';
import { BASE_PLAYER_STATS, MIN_SHOOT_INTERVAL } from './Player';
import type { PlayerStats } from './Player';

const LEVELS = {
  level1: { label: 'Level 1', Component: LevelOne },
  level2: { label: 'Level 2', Component: LevelTwo },
  level3: { label: 'Level 3', Component: LevelThree },
} as const;

type LevelKey = keyof typeof LEVELS | null;

const BASE_STAT_VALUE = 10;
const INITIAL_POINTS = 10;
const HP_PER_POINT = 20;
const MOVE_SPEED_PER_POINT = 0.3;
const SHOOT_INTERVAL_REDUCTION_PER_POINT = 15;
const ATTACK_PER_POINT = 1;

interface UpgradeRowProps {
  label: string;
  value: number;
  description: string;
  onIncrement: () => void;
  disabled: boolean;
}

function UpgradeRow({ label, value, description, onIncrement, disabled }: UpgradeRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-6 py-5 shadow-inner">
      <div>
        <div className="text-3xl font-extrabold tracking-wide">{label}</div>
        <div className="text-sm uppercase tracking-widest text-white/50">{description}</div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-3xl font-extrabold">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-3xl font-bold text-black shadow-lg transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface BossEvent {
  isActive: boolean;
  bossLevel: number;
  bossHp: number;
  maxBossHp: number;
  startedAt: string | null;
}

interface Player {
  discordId: string;
  name: string;
  avatarUrl?: string;
  damage: number;
  position?: { x: number; y: number };
  health?: number;
  maxHealth?: number;
}

export default function GamePage() {
  const router = useRouter();
  const [cookies] = useCookies(['discord_user']);
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [atk, setAtk] = useState(BASE_STAT_VALUE);
  const [hp, setHp] = useState(BASE_STAT_VALUE);
  const [agi, setAgi] = useState(BASE_STAT_VALUE);
  const [bossEvent, setBossEvent] = useState<BossEvent | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [userDamage, setUserDamage] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const atkBonus = atk - BASE_STAT_VALUE;
  const hpBonus = hp - BASE_STAT_VALUE;
  const agiBonus = agi - BASE_STAT_VALUE;

  const playerStats: PlayerStats = useMemo(() => {
    const shootInterval = Math.max(
      MIN_SHOOT_INTERVAL,
      BASE_PLAYER_STATS.shootInterval - agiBonus * SHOOT_INTERVAL_REDUCTION_PER_POINT,
    );

    return {
      ...BASE_PLAYER_STATS,
      attackPowerBoss: BASE_PLAYER_STATS.attackPowerBoss + atkBonus * ATTACK_PER_POINT,
      attackPowerMinion: BASE_PLAYER_STATS.attackPowerMinion + atkBonus * ATTACK_PER_POINT,
      maxHealth: BASE_PLAYER_STATS.maxHealth + hpBonus * HP_PER_POINT,
      moveSpeed: BASE_PLAYER_STATS.moveSpeed + agiBonus * MOVE_SPEED_PER_POINT,
      shootInterval,
    };
  }, [atkBonus, hpBonus, agiBonus]);

  const handleUpgrade = (stat: 'atk' | 'hp' | 'agi') => {
    if (points <= 0) return;
    setPoints((prev) => prev - 1);
    if (stat === 'atk') setAtk((prev) => prev + 1);
    if (stat === 'hp') setHp((prev) => prev + 1);
    if (stat === 'agi') setAgi((prev) => prev + 1);
  };

  const handleLevelSelect = (level: LevelKey) => {
    setShowUpgrade(false);
    setSelectedLevel(level);
  };

  const handleLevelComplete = () => {
    setPoints((prev) => prev + 2);
    setSelectedLevel(null);
  };

  const handlePlayerDefeated = () => {
    // Clear boss event first to exit boss event mode
    if (bossEvent?.isActive) {
      setBossEvent(null);
    }
    // Then clear selected level to return to default page
    setSelectedLevel(null);
  };

  // Get user info
  const getUserInfo = () => {
    try {
      const userData = typeof cookies.discord_user === 'string' 
        ? JSON.parse(cookies.discord_user) 
        : cookies.discord_user;
      return {
        discordId: userData?.id || 'unknown',
        name: userData?.nickname || userData?.username || userData?.global_name || 'Player',
        avatarUrl: userData?.avatar 
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=64`
          : undefined,
      };
    } catch {
      return {
        discordId: 'unknown',
        name: 'Player',
        avatarUrl: undefined,
      };
    }
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

  // Fetch active players
  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/boss-event/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  // Sync player position to API
  const syncPlayerPosition = async (position: { x: number; y: number }, health: number) => {
    const userInfo = getUserInfo();
    try {
      await fetch('/api/boss-event/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: userInfo.discordId,
          name: userInfo.name,
          avatarUrl: userInfo.avatarUrl,
          position,
          health,
          maxHealth: playerStats.maxHealth,
        }),
      });
    } catch (error) {
      console.error('Error syncing player position:', error);
    }
  };


  useEffect(() => {
    fetchBossEvent();
    fetchPlayers();

    pollIntervalRef.current = setInterval(() => {
      fetchBossEvent();
      fetchPlayers();
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const SelectedLevel = selectedLevel ? LEVELS[selectedLevel]?.Component : null;

  // Deal damage to boss (for bullet hell game)
  const handleBossDamage = async (damage: number) => {
    try {
      const response = await fetch('/api/boss-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'damage', damage }),
      });

      if (response.ok) {
        const data = await response.json();
        const wasActive = bossEvent?.isActive;
        setBossEvent(prev => prev ? { ...prev, bossHp: data.bossHp, isActive: data.isActive } : null);
        setUserDamage(prev => prev + damage);
        
        // If boss was active but now is not, boss was defeated
        if (wasActive && !data.isActive) {
          console.log('🎉 Boss defeated detected in handleBossDamage!');
          // Claim rewards when boss is defeated
          const userInfo = getUserInfo();
          console.log('User info:', userInfo);
          
          try {
            console.log('📞 Calling claim-rewards API for:', userInfo.discordId);
            const claimResponse = await fetch('/api/boss-event/claim-rewards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ discordId: userInfo.discordId }),
            });
            
            console.log('📥 Claim response status:', claimResponse.status, claimResponse.statusText);
            const claimData = await claimResponse.json();
            console.log('📦 Claim response data:', claimData);
            
            if (claimResponse.ok) {
              console.log('✅ Rewards claimed successfully!', claimData);
              console.log('💰 New balance - Points:', claimData.newBalance?.points, 'HamsterCoin:', claimData.newBalance?.hamsterCoin);
              alert(`Rewards claimed! Points: +${claimData.rewards?.statPoint || 0}, HamsterCoin: +${claimData.rewards?.hamsterCoin || 0}`);
            } else {
              console.error('❌ Failed to claim rewards:', claimData.error, claimData.details);
              alert(`Failed to claim rewards: ${claimData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('💥 Error claiming rewards:', error);
            alert(`Error claiming rewards: ${error}`);
          }
          
          setSelectedLevel(null);
          
          // Redirect to the page before boss event teleport
          const previousPage = localStorage.getItem('bossEventPreviousPage');
          if (previousPage && previousPage !== '/game' && previousPage !== '/admin') {
            localStorage.removeItem('bossEventPreviousPage');
            router.push(previousPage);
          }
        }
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
    }
  };

  // Show boss event UI if active - use bullet hell game
  if (bossEvent?.isActive) {
    const userInfo = getUserInfo();

    return (
      <main className="relative w-full h-screen bg-black overflow-hidden">
        {/* Players List Overlay */}
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-600 min-w-[200px]">
            <div className="text-white font-bold mb-2">
              Players ({players.length})
            </div>
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.discordId} className="flex items-center gap-2 text-white text-sm">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-600" />
                  )}
                  <span>{player.name}</span>
                  {player.discordId === userInfo.discordId && (
                    <span className="text-yellow-400">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bullet Hell Game for Boss Event */}
        <BossEventLevel
          playerStats={playerStats}
          bossLevel={bossEvent.bossLevel}
          bossHp={bossEvent.bossHp}
          maxBossHp={bossEvent.maxBossHp}
          onBossDamage={handleBossDamage}
          onBossDefeated={async () => {
            console.log('🎉 BOSS DEFEATED! onBossDefeated callback triggered');
            // Claim rewards when boss is defeated
            const userInfo = getUserInfo();
            console.log('User info:', userInfo);
            
            try {
              console.log('📞 Calling claim-rewards API for:', userInfo.discordId);
              const response = await fetch('/api/boss-event/claim-rewards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId: userInfo.discordId }),
              });
              
              console.log('📥 Response status:', response.status, response.statusText);
              const data = await response.json();
              console.log('📦 Response data:', data);
              
              if (response.ok) {
                console.log('✅ Rewards claimed successfully!', data);
                console.log('💰 New balance - Points:', data.newBalance?.points, 'HamsterCoin:', data.newBalance?.hamsterCoin);
                alert(`Rewards claimed! Points: +${data.rewards?.statPoint || 0}, HamsterCoin: +${data.rewards?.hamsterCoin || 0}`);
              } else {
                console.error('❌ Failed to claim rewards:', data.error, data.details);
                alert(`Failed to claim rewards: ${data.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('💥 Error claiming rewards:', error);
              alert(`Error claiming rewards: ${error}`);
            }
            
            setBossEvent(null);
            setSelectedLevel(null);
            
            // Redirect to the page before boss event teleport
            const previousPage = localStorage.getItem('bossEventPreviousPage');
            if (previousPage && previousPage !== '/game' && previousPage !== '/admin') {
              localStorage.removeItem('bossEventPreviousPage');
              router.push(previousPage);
            }
          }}
          onPlayerDefeated={handlePlayerDefeated}
          otherPlayers={players.filter(p => p.discordId !== userInfo.discordId).map(p => ({
            discordId: p.discordId,
            name: p.name,
            avatarUrl: p.avatarUrl,
            position: p.position || { x: 683, y: 688 }, // Default position if not set
            health: p.health || playerStats.maxHealth,
            maxHealth: p.maxHealth || playerStats.maxHealth,
          }))}
          currentPlayerId={userInfo.discordId}
          onPositionUpdate={syncPlayerPosition}
        />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-black text-white">
      {!selectedLevel && (
        <button
          onClick={() => setShowUpgrade((prev) => !prev)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-yellow-500 text-black font-semibold rounded shadow hover:bg-yellow-400 transition-colors"
        >
          {showUpgrade ? 'Close Upgrades' : 'Open Upgrades'}
        </button>
      )}

      {showUpgrade && !selectedLevel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-black/80 border border-white/10 shadow-2xl text-white px-8 py-10">
            <button
              onClick={() => setShowUpgrade(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-xl"
              aria-label="Close upgrade panel"
            >
              ✕
            </button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/60">Stat</p>
                <h2 className="text-3xl font-extrabold">Spaceship Upgrades</h2>
              </div>
              <div className="text-right">
                <p className="text-sm uppercase tracking-widest text-white/60">My Points</p>
                <p className="text-3xl font-extrabold text-yellow-400">{points}</p>
              </div>
            </div>

            <div className="space-y-6 text-2xl font-bold">
              <UpgradeRow
                label="Atk"
                value={atk}
                description="Increases bullet damage"
                onIncrement={() => handleUpgrade('atk')}
                disabled={points <= 0}
              />
              <UpgradeRow
                label="Hp"
                value={hp}
                description="Raises maximum health"
                onIncrement={() => handleUpgrade('hp')}
                disabled={points <= 0}
              />
              <UpgradeRow
                label="Agi"
                value={agi}
                description="Boosts speed & fire rate"
                onIncrement={() => handleUpgrade('agi')}
                disabled={points <= 0}
              />
            </div>

            <p className="mt-8 text-sm text-white/60">
              Each stat starts at {BASE_STAT_VALUE}. Allocate points to tailor your ship. Upgrades apply to every
              level.
            </p>
          </div>
        </div>
      )}

      {!selectedLevel && (
        <div className="max-w-xl w-full text-center">
          <h1 className="text-4xl font-bold mb-6">Bullet Hell Levels</h1>
          <p className="mb-8 text-lg">Select a level to begin your battle.</p>
          <div className="grid gap-4">
            {Object.entries(LEVELS).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => handleLevelSelect(key as LevelKey)}
                className={`px-6 py-3 rounded-lg transition-colors font-semibold text-white ${
                  key === 'level1'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : key === 'level2'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedLevel && SelectedLevel && (
        <div className="relative w-full">
          <div className="mb-6 flex flex-col items-center">
            <p className="text-sm uppercase tracking-widest text-white/40">Current Level</p>
            <h2 className="text-4xl font-extrabold text-white drop-shadow">{LEVELS[selectedLevel].label}</h2>
          </div>

          <button
            onClick={() => setSelectedLevel(null)}
            className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-white text-xl shadow-lg hover:bg-gray-600 transition-colors"
            aria-label="Back to Level Select"
          >
            ←
          </button>

          <SelectedLevel
            playerStats={playerStats}
            onLevelComplete={handleLevelComplete}
            onPlayerDefeated={() => setSelectedLevel(null)}
          />
        </div>
      )}
    </main>
  );
}
