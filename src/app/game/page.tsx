'use client';

import { useMemo, useState } from 'react';
import LevelOne from './levels/LevelOne';
import LevelTwo from './levels/LevelTwo';
import LevelThree from './levels/LevelThree';
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

export default function GamePage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [atk, setAtk] = useState(BASE_STAT_VALUE);
  const [hp, setHp] = useState(BASE_STAT_VALUE);
  const [agi, setAgi] = useState(BASE_STAT_VALUE);

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
    setSelectedLevel(null);
  };

  const SelectedLevel = selectedLevel ? LEVELS[selectedLevel]?.Component : null;

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
            onPlayerDefeated={handlePlayerDefeated}
          />
        </div>
      )}
    </main>
  );
}
