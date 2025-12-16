'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '@/utils/helpers';
import { getItemIconUrl } from '@/utils/itemHelpers';

interface HatchedPet {
  name: string;
  icon?: string;
  eggIcon?: string;
}

interface EggHatchCinematicProps {
  isActive: boolean;
  onComplete: () => void;
  hatchedPet: HatchedPet | null;
  theme: 'light' | 'dark';
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
}) => {
  const [phase, setPhase] = useState<CinematicPhase>('egg-enter');
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Reset phase when cinematic starts
  useEffect(() => {
    if (isActive) {
      setPhase('egg-enter');
      // Start with very subtle shake immediately
      setShakeIntensity(0.3);
    }
  }, [isActive]);

  // Phase transitions with timing - NO SKIPPING ALLOWED
  useEffect(() => {
    if (!isActive || !hatchedPet) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Step 1: Egg enters from bottom (600ms) - PROGRESSIVE SHAKE WHILE MOVING UP
    // Start shaking immediately and gradually increase as egg moves up
    timeouts.push(setTimeout(() => {
      setShakeIntensity(0.6); // Slightly stronger
    }, 150)); // 150ms into upward movement
    
    timeouts.push(setTimeout(() => {
      setShakeIntensity(1.0); // Noticeable shake
    }, 300)); // 300ms into upward movement
    
    timeouts.push(setTimeout(() => {
      setShakeIntensity(1.5); // Strong shake as it approaches center
    }, 450)); // 450ms into upward movement
    
    timeouts.push(setTimeout(() => {
      setPhase('egg-shake');
      // Already at strong intensity when reaching center
      setShakeIntensity(2.0);
    }, 600)); // When egg reaches center (reduced from 800ms)

    // Step 2: Quick intensity ramp at center (reduced to 250ms)
    timeouts.push(setTimeout(() => {
      setShakeIntensity(2.8); // Rapid increase
    }, 600 + 125)); // 125ms after reaching center
    
    timeouts.push(setTimeout(() => {
      setShakeIntensity(3.5); // Peak intensity
    }, 600 + 250)); // 250ms after reaching center (reduced from 400ms)
    
    // Step 3: Magic circle appears while egg continues shaking (reduced to 800ms)
    timeouts.push(setTimeout(() => {
      setPhase('magic-circle');
      setShakeIntensity(4.0); // Strong shaking during magic
    }, 600 + 250 + 150)); // 1000ms total (reduced from 1200ms)

    // Step 4: Magic circle completes, egg turns golden (500ms)
    timeouts.push(setTimeout(() => {
      setPhase('golden-egg');
      setShakeIntensity(5.0); // Very strong shaking before golden
    }, 600 + 250 + 150 + 800)); // 1800ms total (reduced from 2600ms)

    // Step 5: Golden egg → white flash (300ms)
    timeouts.push(setTimeout(() => {
      setPhase('white-flash');
    }, 600 + 250 + 150 + 800 + 500)); // 2300ms total (reduced from 3400ms)

    // Step 6: Fade back to normal UI (500ms)
    timeouts.push(setTimeout(() => {
      setPhase('fade-back');
    }, 600 + 250 + 150 + 800 + 500 + 300)); // 2600ms total (reduced from 3800ms)

    // Step 7: Reveal pet (immediate after fade-back)
    timeouts.push(setTimeout(() => {
      setPhase('pet-reveal');
    }, 600 + 250 + 150 + 800 + 500 + 300 + 500 + 50)); // 3150ms total (reduced from 4700ms)

    // Step 8: Pet stays in center (1200ms)
    timeouts.push(setTimeout(() => {
      setPhase('pet-exit');
    }, 600 + 250 + 150 + 800 + 500 + 300 + 500 + 50 + 1200)); // 4350ms total (reduced from 6700ms)

    // Step 9: Complete after pet exits (600ms)
    timeouts.push(setTimeout(() => {
      setPhase('complete');
      setTimeout(() => {
        onComplete();
      }, 200);
    }, 600 + 250 + 150 + 800 + 500 + 300 + 500 + 50 + 1200 + 600)); // 4950ms total (reduced from 7700ms)

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isActive, hatchedPet, onComplete]);

  if (!isActive || !hatchedPet) return null;

  // Calculate shake values based on intensity (0-5)
  const getShakeValues = (intensity: number) => {
    const base = intensity * 0.5;
    return {
      rotate: [0, -base * 2, base * 2, -base * 2, base * 2, -base, base, 0],
      x: [0, -base * 3, base * 3, -base * 3, base * 3, -base * 2, base * 2, 0],
      y: [0, -base, base, -base, base, -base * 0.5, base * 0.5, 0],
    };
  };

  const shakeValues = getShakeValues(shakeIntensity);
  // Egg shakes during enter phase (moving up) and all subsequent phases
  const isShaking = phase === 'egg-enter' || phase === 'egg-shake' || phase === 'magic-circle' || phase === 'golden-egg';
  const shouldBlockInteractions = phase !== 'complete';

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Full-screen interaction blocker - prevents ALL interactions during animation */}
      {shouldBlockInteractions && (
        <div 
          className="absolute inset-0 z-[10000]"
          style={{ 
            pointerEvents: 'auto',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {/* Step 1-4: Egg and magic circle phases */}
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
                y: phase === 'egg-enter' 
                  ? 0 
                  : isShaking 
                    ? shakeValues.y 
                    : 0,
                scale: phase === 'egg-enter' ? 1 : 1,
                rotate: isShaking ? shakeValues.rotate : 0,
                x: isShaking ? shakeValues.x : 0,
                filter: phase === 'golden-egg' 
                  ? 'brightness(1.8) drop-shadow(0 0 40px rgba(255, 215, 0, 1)) saturate(1.5)' 
                  : phase === 'magic-circle'
                  ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
                  : 'none',
              }}
              transition={{
                y: phase === 'egg-enter' 
                  ? { duration: 0.6, ease: 'easeOut' } 
                  : isShaking 
                    ? { 
                        duration: 0.12, 
                        repeat: Infinity, 
                        ease: 'easeInOut',
                        times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
                      }
                    : { duration: 0.2 },
                scale: phase === 'egg-enter' ? { duration: 0.6, ease: 'easeOut' } : {},
                rotate: isShaking ? { 
                  duration: 0.12, 
                  repeat: Infinity, 
                  ease: 'easeInOut',
                  times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
                } : { duration: 0.2 },
                x: isShaking ? { 
                  duration: 0.12, 
                  repeat: Infinity, 
                  ease: 'easeInOut',
                  times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
                } : { duration: 0.2 },
                filter: { duration: 0.4 },
              }}
            >
              {/* Egg image - use actual egg icon from item */}
              {hatchedPet.eggIcon ? (
                <img
                  src={getItemIconUrl(hatchedPet.eggIcon)}
                  alt="Egg"
                  className="w-64 h-64 object-contain"
                  style={{
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
                  }}
                  onError={(e) => {
                    // Fallback to default egg design if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('.egg-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'egg-fallback';
                      fallback.style.cssText = `
                        width: 256px;
                        height: 256px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 -20px 60px rgba(0, 0, 0, 0.1);
                        border: 4px solid #fbbf24;
                        position: relative;
                      `;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                // Fallback egg design
                <div
                  className="w-64 h-64 rounded-full relative"
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
              )}
            </motion.div>

            {/* Magic Circle - appears during magic-circle phase while egg is still shaking */}
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
                  duration: 0.8,
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

            {/* Golden light effects during magic circle phase */}
            {phase === 'magic-circle' && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.3, 0.5, 0.3, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeInOut',
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
                  width: '500px',
                  height: '500px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 5: White flash - full screen - MUST PLAY */}
      <AnimatePresence>
        {phase === 'white-flash' && (
          <motion.div
            key="white-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white z-[10001]"
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
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 bg-white z-[10001]"
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
            className="absolute inset-0 flex flex-col items-center justify-center z-[10002]"
          >
            {/* Pet icon */}
            <motion.img
              src={hatchedPet.icon ? getItemIconUrl(hatchedPet.icon) : getAssetUrl('/Asset/item/classTicket.png')}
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
            className="absolute inset-0 flex flex-col items-center justify-center z-[10002]"
          >
            {/* Pet icon */}
            <img
              src={hatchedPet.icon ? getItemIconUrl(hatchedPet.icon) : getAssetUrl('/Asset/item/classTicket.png')}
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
    </div>
  );
};
