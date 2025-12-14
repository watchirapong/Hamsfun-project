'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quest } from '@/types';
import { QuestCard } from './QuestCard';
import { isQuestTrulyCompleted } from '@/utils/helpers';
import { BossArrivalCinematic } from './BossArrivalCinematic';

interface AnimatedQuestDisplayProps {
  quests: Quest[];
  newQuestIds: string[];
  onQuestClick: (questId: number) => void;
  theme: 'light' | 'dark';
  onBossCinematicChange?: (isActive: boolean) => void; // Callback when Boss cinematic starts/ends
}

export const AnimatedQuestDisplay: React.FC<AnimatedQuestDisplayProps> = ({
  quests,
  newQuestIds,
  onQuestClick,
  theme,
  onBossCinematicChange,
}) => {
  const [mainQuest, setMainQuest] = useState<Quest | null>(null);
  const [temporaryQuests, setTemporaryQuests] = useState<Quest[]>([]);
  const [containerRect, setContainerRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showBossCinematic, setShowBossCinematic] = useState(false);
  const [isBossRevealing, setIsBossRevealing] = useState(false);
  const [shouldShowBossQuest, setShouldShowBossQuest] = useState(false);
  const hasAnimatedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Get filtered and sorted quests (Boss first, then Main, then others)
  const filteredQuests = useMemo(() => {
    return quests
      .filter(quest => !isQuestTrulyCompleted(quest))
      .sort((a, b) => {
        const aIsBoss = a.type === "Boss";
        const bIsBoss = b.type === "Boss";
        const aIsMain = a.type === "Main";
        const bIsMain = b.type === "Main";
        
        // Boss quests always come first
        if (aIsBoss && !bIsBoss) return -1;
        if (!aIsBoss && bIsBoss) return 1;
        
        // Then Main quests
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        
        return 0;
      });
  }, [quests]);

  // Check if there are new quests to animate
  const newQuests = useMemo(() => {
    return filteredQuests.filter(quest => 
      newQuestIds.includes(String(quest.id)) && !hasAnimatedRef.current.has(String(quest.id))
    );
  }, [filteredQuests, newQuestIds]);

  // Initialize with first quest if available
  useEffect(() => {
    if (filteredQuests.length > 0 && !mainQuest) {
      setMainQuest(filteredQuests[0]);
    }
  }, [filteredQuests, mainQuest]);

  // Trigger animation sequence when new quests are detected
  useEffect(() => {
    if (newQuests.length === 0 || newQuestIds.length === 0) {
      return;
    }

    // Mark these quests as animated
    newQuests.forEach(quest => {
      hasAnimatedRef.current.add(String(quest.id));
    });

    // Check if any new quest is a Boss quest
    const hasBossQuest = newQuests.some(quest => quest.type === "Boss");
    const firstQuest = filteredQuests[0];
    const isFirstQuestBoss = firstQuest?.type === "Boss";
    const isFirstQuestNew = firstQuest && newQuestIds.includes(String(firstQuest.id));

    // If first quest is a new Boss quest, trigger cinematic
    if (isFirstQuestBoss && isFirstQuestNew && firstQuest) {
      setShowBossCinematic(true);
      setIsBossRevealing(true);
      setShouldShowBossQuest(false); // Hide quest until reveal phase
      setMainQuest(firstQuest); // Set the quest but hide it
      onBossCinematicChange?.(true); // Notify parent to hide notifications
      return; // Exit early, cinematic will handle the reveal
    }

    // Regular quest animation (non-Boss or Boss not first)
    // Separate new quests: first quest vs others
    const otherNewQuests = newQuests.filter(q => q.id !== firstQuest?.id);

    // If the first quest is new, animate it landing in the main slot
    if (isFirstQuestNew && firstQuest) {
      // The first quest will fly in and replace the main quest
      setMainQuest(null); // Clear first to trigger exit animation
      setTimeout(() => {
        setMainQuest(firstQuest);
      }, 100);
    }

    // Other new quests fly in as temporary overlays
    if (otherNewQuests.length > 0) {
      setTemporaryQuests(otherNewQuests);

      // Remove temporary quests after they fade out
      // Duration: fly-in (800ms + stagger) + visible time (400ms) + fade out (600ms)
      const fadeOutDuration = 800 + (otherNewQuests.length - 1) * 200 + 400 + 600;
      setTimeout(() => {
        setTemporaryQuests([]);
      }, fadeOutDuration);
    }
  }, [newQuests, filteredQuests, newQuestIds.length]);

  // Update main quest when filtered quests change (non-animation case)
  useEffect(() => {
    if (filteredQuests.length > 0) {
      const firstQuest = filteredQuests[0];
      // Update if not currently animating new quests
      // Always update to keep mainQuest in sync with latest quest data
      if (newQuests.length === 0) {
        // Update mainQuest to latest data (even if same quest ID, data may have changed)
        setMainQuest(firstQuest);
      }
    } else {
      setMainQuest(null);
    }
  }, [filteredQuests, newQuests.length]);

  // Update container position for temporary quests
  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerRect({
          top: rect.top + rect.height,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [mainQuest]);

  // Handle Boss quest reveal start (immediately after intro completes)
  const handleBossRevealStart = () => {
    const firstQuest = filteredQuests[0];
    if (firstQuest && firstQuest.type === "Boss") {
      // Show Boss quest card immediately
      setMainQuest(firstQuest);
      setShouldShowBossQuest(true);
    }
  };

  // Handle Boss cinematic completion
  const handleBossCinematicComplete = () => {
    setIsBossRevealing(false);
    setShowBossCinematic(false);
    // Ensure Boss Quest is visible and clickable after cinematic
    const firstQuest = filteredQuests[0];
    if (firstQuest && firstQuest.type === "Boss") {
      setMainQuest(firstQuest);
      setShouldShowBossQuest(true);
    }
    onBossCinematicChange?.(false); // Notify parent to show notifications again
  };

  // Make Boss Quest clickable after intro completes (when glow starts)
  const isBossClickable = mainQuest?.type === "Boss" && shouldShowBossQuest && !showBossCinematic;

  // Get quest slot position for cinematic
  const questSlotPosition = containerRef.current
    ? (() => {
        const rect = containerRef.current!.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
        };
      })()
    : null;

  // Animation variants for first quest (lands in slot)
  const firstQuestVariants = {
    initial: {
      x: typeof window !== 'undefined' ? window.innerWidth * 0.3 : 300,
      y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
      opacity: 0,
      rotate: -15,
      scale: 0.8,
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  // Animation variants for temporary quests (fly in, drift down, fade out)
  const temporaryQuestVariants = {
    initial: (index: number) => ({
      x: typeof window !== 'undefined' ? window.innerWidth * 0.3 : 300,
      y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
      opacity: 0,
      rotate: -15 + (index * 5),
      scale: 0.8,
    }),
    animate: (index: number) => ({
      x: 0,
      y: 100 + (index * 20), // Drift down, stacked
      opacity: [0, 1, 1, 0],
      rotate: 0,
      scale: [0.8, 1, 1, 0.9],
      transition: {
        duration: 1.8,
        delay: index * 0.2,
        times: [0, 0.4, 0.6, 1], // Fly in at 40%, visible at 60%, fade out
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 150,
      transition: {
        duration: 0.3,
        ease: 'easeIn' as const,
      },
    },
  };

  return (
    <>
      {/* Boss Arrival Cinematic */}
      <BossArrivalCinematic
        isActive={showBossCinematic}
        onComplete={handleBossCinematicComplete}
        onRevealStart={handleBossRevealStart}
        questSlotPosition={questSlotPosition}
        theme={theme}
      />

      {/* Main quest slot - always shows first quest */}
      <div ref={containerRef} className="relative">
        <AnimatePresence mode="wait">
          {mainQuest && (
            <motion.div
              key={mainQuest.id}
              initial={
                (newQuestIds.includes(String(mainQuest.id)) && !isBossRevealing && mainQuest.type !== "Boss") ? 'initial' : false
              }
              animate={
                (newQuestIds.includes(String(mainQuest.id)) && !isBossRevealing && mainQuest.type !== "Boss") ? 'animate' : {}
              }
              exit="exit"
              variants={firstQuestVariants}
              style={{
                pointerEvents: (showBossCinematic || isBossRevealing) ? 'none' : 'auto',
                opacity: (mainQuest.type === "Boss" && showBossCinematic && !shouldShowBossQuest) ? 0 : 1,
              }}
            >
              {/* Boss Quest with dark red glow effect */}
              {mainQuest.type === "Boss" && shouldShowBossQuest ? (
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Dark Red Glow Effect - Pulses then fades out */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.8, 0.6, 0.4, 0],
                      scale: [1, 1.05, 1.02, 1.05, 1.1],
                    }}
                    transition={{
                      duration: 2,
                      times: [0, 0.2, 0.4, 0.6, 1],
                      ease: 'easeInOut',
                    }}
                    style={{
                      background: theme === 'dark'
                        ? 'radial-gradient(ellipse at center, rgba(139, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.8) 50%, transparent 100%)'
                        : 'radial-gradient(ellipse at center, rgba(139, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%)',
                      boxShadow: theme === 'dark'
                        ? '0 0 60px rgba(139, 0, 0, 0.8), 0 0 100px rgba(0, 0, 0, 0.6), inset 0 0 40px rgba(139, 0, 0, 0.3)'
                        : '0 0 60px rgba(139, 0, 0, 0.6), 0 0 100px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(139, 0, 0, 0.2)',
                      filter: 'blur(2px)',
                      zIndex: -1,
                      margin: '-10px',
                    }}
                  />
                  {/* Additional outer glow layer for more intensity */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.5, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      times: [0, 0.3, 0.6, 1],
                      ease: 'easeInOut',
                    }}
                    style={{
                      background: 'radial-gradient(ellipse at center, transparent 0%, rgba(139, 0, 0, 0.3) 40%, transparent 100%)',
                      boxShadow: '0 0 80px rgba(139, 0, 0, 0.5)',
                      filter: 'blur(4px)',
                      zIndex: -2,
                      margin: '-20px',
                    }}
                  />
                  <div className="relative z-10">
                    <QuestCard 
                      quest={mainQuest} 
                      onQuestClick={isBossClickable ? onQuestClick : () => {}}
                      theme={theme}
                    />
                  </div>
                </motion.div>
              ) : (
                <QuestCard 
                  quest={mainQuest} 
                  onQuestClick={(showBossCinematic || isBossRevealing) ? () => {} : onQuestClick}
                  theme={theme}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Temporary quest overlays - fly in and fade out */}
      {containerRect && (
        <AnimatePresence>
          {temporaryQuests.map((quest, index) => (
            <motion.div
              key={quest.id}
              custom={index}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={temporaryQuestVariants}
              style={{
                position: 'fixed',
                top: containerRect.top + 20 + (index * 20),
                left: containerRect.left,
                width: containerRect.width || 'calc(100% - 2rem)',
                maxWidth: '428px',
                zIndex: 1000 - index, // Higher z-index for later quests
                pointerEvents: 'none', // Don't block interactions
              }}
            >
              <QuestCard 
                quest={quest} 
                onQuestClick={() => {}} // No click on temporary quests
                theme={theme}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </>
  );
};
