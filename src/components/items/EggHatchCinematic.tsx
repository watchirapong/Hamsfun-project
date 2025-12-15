'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '@/utils/helpers';

interface HatchedPet {
  name: string;
  icon?: string;
}

interface EggHatchCinematicProps {
  isActive: boolean;
  onComplete: () => void;
  hatchedPet: HatchedPet | null;
  theme: 'light' | 'dark';
  onSkip?: () => void;
}

type CinematicPhase = 
  | 'egg-enter' 
  | 'egg-shake' 
  | 'magic-circle' 
  | 'golden-egg' 
  | 'white-flash' 
  | 'fade-back' 
  | 'pet-reveal' 
  | 'pet-exit' 
  | 'complete';

export const EggHatchCinematic: React.FC<EggHatchCinematicProps> = ({
  isActive,
  onComplete,
  hatchedPet,
  theme,
  onSkip,
}) => {
  const [phase, setPhase] = useState<CinematicPhase>('egg-enter');
  const [canSkip, setCanSkip] = useState(false);

  // Reset phase when cinematic starts
  useEffect(() => {
    if (isActive) {
      setPhase('egg-enter');
      setCanSkip(false);
    }
  }, [isActive]);

  // Phase transitions with timing
  useEffect(() => {
    if (!isActive || !hatchedPet) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Step 1: Egg enters from bottom (800ms)
    timeouts.push(setTimeout(() => {
      setPhase('egg-shake');
    }, 800));

    // Step 2: Egg shakes (1200ms)
    timeouts.push(setTimeout(() => {
      setPhase('magic-circle');
      setCanSkip(true); // Allow skip after magic circle appears
    }, 800 + 1200));

    // Step 3: Magic circle appears and rushes to egg (1500ms)
    timeouts.push(setTimeout(() => {
      setPhase('golden-egg');
    }, 800 + 1200 + 1500));

    // Step 4: Golden egg → white flash (600ms)
    timeouts.push(setTimeout(() => {
      setPhase('white-flash');
    }, 800 + 1200 + 1500 + 600));

    // Step 5: Fade back to normal UI (800ms)
    timeouts.push(setTimeout(() => {
      setPhase('fade-back');
    }, 800 + 1200 + 1500 + 600 + 800));

    // Step 6: Reveal pet (immediate after fade-back)
    timeouts.push(setTimeout(() => {
      setPhase('pet-reveal');
    }, 800 + 1200 + 1500 + 600 + 800 + 100));

    // Step 7: Pet stays in center (1500ms)
    timeouts.push(setTimeout(() => {
      setPhase('pet-exit');
    }, 800 + 1200 + 1500 + 600 + 800 + 100 + 1500));

    // Step 8: Complete after pet exits (1000ms)
    timeouts.push(setTimeout(() => {
      setPhase('complete');
      setTimeout(() => {
        onComplete();
      }, 300);
    }, 800 + 1200 + 1500 + 600 + 800 + 100 + 1500 + 1000));

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isActive, hatchedPet, onComplete]);

  // Handle skip
  const handleSkip = () => {
    if (!canSkip) return;
    if (phase === 'egg-enter' || phase === 'egg-shake' || phase === 'magic-circle') {
      // Skip to pet reveal
      setPhase('pet-reveal');
      setTimeout(() => {
        setPhase('pet-exit');
        setTimeout(() => {
          setPhase('complete');
          setTimeout(() => {
            onComplete();
          }, 300);
        }, 1000);
      }, 1500);
    } else if (phase === 'golden-egg' || phase === 'white-flash' || phase === 'fade-back') {
      // Skip to pet reveal
      setPhase('pet-reveal');
      setTimeout(() => {
        setPhase('pet-exit');
        setTimeout(() => {
          setPhase('complete');
          setTimeout(() => {
            onComplete();
          }, 300);
        }, 1000);
      }, 1500);
    } else if (phase === 'pet-reveal') {
      // Skip to exit
      setPhase('pet-exit');
      setTimeout(() => {
        setPhase('complete');
        setTimeout(() => {
          onComplete();
        }, 300);
      }, 1000);
    }
  };

  if (!isActive || !hatchedPet) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] pointer-events-auto"
      onClick={canSkip ? handleSkip : undefined}
      style={{ cursor: canSkip ? 'pointer' : 'default' }}
    >
      {/* Step 1-5: Egg and magic circle phases */}
      <AnimatePresence mode="wait">
        {(phase === 'egg-enter' || phase === 'egg-shake' || phase === 'magic-circle' || phase === 'golden-egg') && (
          <motion.div
            key="egg-container"
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Egg */}
            <motion.div
              className="relative"
              initial={phase === 'egg-enter' ? { y: '100vh', scale: 0.5 } : false}
              animate={{
                y: phase === 'egg-enter' ? 0 : 0,
                scale: phase === 'egg-enter' ? 1 : 1,
                rotate: phase === 'egg-shake' ? [0, -2, 2, -2, 2, -1, 1, 0] : 0,
                x: phase === 'egg-shake' ? [0, -3, 3, -3, 3, -2, 2, 0] : 0,
                filter: phase === 'golden-egg' ? 'brightness(1.5) drop-shadow(0 0 30px rgba(255, 215, 0, 0.8))' : 'none',
              }}
              transition={{
                y: phase === 'egg-enter' ? { duration: 0.8, ease: 'easeOut' } : {},
                scale: phase === 'egg-enter' ? { duration: 0.8, ease: 'easeOut' } : {},
                rotate: phase === 'egg-shake' ? { 
                  duration: 0.15, 
                  repeat: 8, 
                  ease: 'easeInOut',
                  times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
                } : { duration: 0.2 },
                x: phase === 'egg-shake' ? { 
                  duration: 0.15, 
                  repeat: 8, 
                  ease: 'easeInOut',
                  times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
                } : { duration: 0.2 },
                filter: phase === 'golden-egg' ? { duration: 0.3 } : {},
              }}
            >
              {/* Egg image - using a placeholder, replace with actual egg asset if available */}
              <div
                className="w-64 h-80 rounded-full relative"
                style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 -20px 60px rgba(0, 0, 0, 0.1)',
                  border: '4px solid #fbbf24',
                }}
              >
                {/* Egg shine effect */}
                <div
                  className="absolute top-4 left-8 w-24 h-32 rounded-full opacity-60"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                  }}
                />
                {/* Egg spots/pattern */}
                <div
                  className="absolute top-20 right-12 w-8 h-8 rounded-full opacity-40"
                  style={{ background: '#f59e0b' }}
                />
                <div
                  className="absolute bottom-24 left-16 w-6 h-6 rounded-full opacity-40"
                  style={{ background: '#f59e0b' }}
                />
              </div>
            </motion.div>

            {/* Magic Circle - appears during magic-circle phase */}
            {phase === 'magic-circle' && (
              <motion.div
                className="absolute"
                initial={{ opacity: 0, scale: 0.5, rotateX: -90 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1.2, 1.2, 0.3],
                  rotateX: [90, 0, 0, 0],
                  rotateZ: [0, 360, 720],
                  y: [0, -20, -40],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '400px',
                  height: '400px',
                  perspective: '1000px',
                }}
              >
                {/* Golden magic circle */}
                <svg
                  width="400"
                  height="400"
                  viewBox="0 0 400 400"
                  className="absolute inset-0"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
                  }}
                >
                  {/* Outer circle */}
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth="4"
                    opacity="0.8"
                  />
                  {/* Inner circle */}
                  <circle
                    cx="200"
                    cy="200"
                    r="140"
                    fill="none"
                    stroke="#ffed4e"
                    strokeWidth="3"
                    opacity="0.6"
                  />
                  {/* Decorative runes/symbols */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const x = 200 + 160 * Math.cos(rad);
                    const y = 200 + 160 * Math.sin(rad);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="8"
                        fill="#ffd700"
                        opacity="0.9"
                      />
                    );
                  })}
                  {/* Glowing center */}
                  <circle
                    cx="200"
                    cy="200"
                    r="60"
                    fill="none"
                    stroke="#ffed4e"
                    strokeWidth="2"
                    opacity="0.4"
                  />
                </svg>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 5: White flash - full screen */}
      <AnimatePresence>
        {phase === 'white-flash' && (
          <motion.div
            key="white-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Step 6: Fade back to normal UI */}
      <AnimatePresence>
        {phase === 'fade-back' && (
          <motion.div
            key="fade-back"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Step 7: Pet reveal with bounce */}
      <AnimatePresence>
        {phase === 'pet-reveal' && (
          <motion.div
            key="pet-reveal"
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: [0, 1.2, 1],
              y: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.6,
              scale: {
                times: [0, 0.6, 1],
                duration: 0.6,
                ease: 'easeOut',
              },
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Pet icon */}
            <motion.img
              src={hatchedPet.icon || getAssetUrl('/Asset/item/classTicket.png')}
              alt={hatchedPet.name}
              className="w-32 h-32 object-contain mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ 
                delay: 0.1,
                duration: 0.5,
                ease: 'easeOut',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getAssetUrl('/Asset/item/classTicket.png');
              }}
            />
            {/* Pet name */}
            <motion.div
              className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: [20, -10, 0],
              }}
              transition={{ 
                delay: 0.3,
                duration: 0.5,
                ease: 'easeOut',
              }}
            >
              {hatchedPet.name}
            </motion.div>
            {/* Celebration text */}
            <motion.div
              className={`text-lg mt-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              New Pet Hatched!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 8: Pet slides down and exits */}
      <AnimatePresence>
        {phase === 'pet-exit' && (
          <motion.div
            key="pet-exit"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: '100vh', opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeIn' }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Pet icon */}
            <img
              src={hatchedPet.icon || getAssetUrl('/Asset/item/classTicket.png')}
              alt={hatchedPet.name}
              className="w-32 h-32 object-contain mb-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getAssetUrl('/Asset/item/classTicket.png');
              }}
            />
            {/* Pet name */}
            <div
              className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {hatchedPet.name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip hint (optional) */}
      {canSkip && phase !== 'pet-reveal' && phase !== 'pet-exit' && phase !== 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Click to skip
        </motion.div>
      )}
    </div>
  );
};

