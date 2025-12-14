'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '@/utils/helpers';

interface BossArrivalCinematicProps {
  isActive: boolean;
  onComplete: () => void;
  onRevealStart?: () => void; // Callback when quest should start appearing (during reveal phase)
  questSlotPosition: { top: number; left: number; width: number } | null;
  theme: 'light' | 'dark';
}

type CinematicPhase = 'fade-to-black' | 'demon-in' | 'demon-out' | 'fade-to-ui' | 'complete';

export const BossArrivalCinematic: React.FC<BossArrivalCinematicProps> = ({
  isActive,
  onComplete,
  onRevealStart,
  questSlotPosition,
  theme,
}) => {
  const [phase, setPhase] = useState<CinematicPhase>('fade-to-black');
  const [introCompleted, setIntroCompleted] = useState<boolean>(false);

  // Reset phase when cinematic starts
  useEffect(() => {
    if (isActive) {
      setPhase('fade-to-black');
      setIntroCompleted(false); // Reset intro flag
    } else {
      // Reset when cinematic is inactive
      setIntroCompleted(false);
    }
  }, [isActive]);

  // Phase transitions
  useEffect(() => {
    if (!isActive) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Step 1: Smooth fade to black (800ms)
    timeouts.push(setTimeout(() => {
      setPhase('demon-in');
    }, 800));

    // Step 2: Demon fade in (1200ms)
    timeouts.push(setTimeout(() => {
      setPhase('demon-out');
    }, 800 + 1200));

    // Step 3: Demon fade out (1000ms)
    timeouts.push(setTimeout(() => {
      setPhase('fade-to-ui');
    }, 800 + 1200 + 1000));

    // Step 4: Fade back to normal UI (600ms) - then immediately show quest
    timeouts.push(setTimeout(() => {
      setIntroCompleted(true); // Mark intro as completed - never show black overlay again
      // Trigger quest appearance immediately after intro completes
      onRevealStart?.();
    }, 800 + 1200 + 1000 + 600));

    // Step 5: Complete cinematic after brief delay (allow glow to start)
    timeouts.push(setTimeout(() => {
      setPhase('complete');
      setTimeout(() => {
        onComplete();
      }, 300);
    }, 800 + 1200 + 1000 + 600 + 300));

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isActive, onComplete, onRevealStart]);


  if (!isActive) return null;

  // Block interactions only during intro cinematic
  const shouldBlockInteractions = !introCompleted;

  return (
    <div className={`fixed inset-0 z-[9999] ${shouldBlockInteractions ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Step 1: Smooth Fade to Black - ONLY show during intro phases, never again after intro completes */}
      <AnimatePresence>
        {!introCompleted && (phase === 'fade-to-black' || phase === 'demon-in' || phase === 'demon-out' || phase === 'fade-to-ui') && (
          <motion.div
            key="intro-black-overlay"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: phase === 'fade-to-ui' ? 0 : 1 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: phase === 'fade-to-black' ? 0.8 : phase === 'fade-to-ui' ? 0.6 : 0.3,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-black"
          >
            {/* Step 2: Demon Smile - Stage 1: Fade In */}
            <AnimatePresence mode="wait">
              {phase === 'demon-in' && (
                <motion.div
                  key="demon-in"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{ 
                    duration: 1.2,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative">
                    <img
                      src={getAssetUrl("/Asset/evil.png")}
                      alt="Demon"
                      className="w-[250px] h-[250px]"
                      style={{
                        filter: 'drop-shadow(0 0 40px rgba(220, 20, 60, 0.9))',
                      }}
                    />
                    {/* Subtle red aura - static, no animation */}
                    <div
                      className="absolute inset-0 -z-10"
                      style={{
                        background: 'radial-gradient(circle, rgba(220, 20, 60, 0.5) 0%, transparent 70%)',
                        width: '350px',
                        height: '350px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Demon Smile - Stage 2: Fade Out */}
            <AnimatePresence mode="wait">
              {phase === 'demon-out' && (
                <motion.div
                  key="demon-out"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ 
                    opacity: 0,
                    scale: 0.9,
                  }}
                  transition={{ 
                    duration: 1,
                    ease: 'easeIn',
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative">
                    <img
                      src={getAssetUrl("/Asset/evil.png")}
                      alt="Demon"
                      className="w-[250px] h-[250px]"
                      style={{
                        filter: 'drop-shadow(0 0 40px rgba(220, 20, 60, 0.9))',
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
