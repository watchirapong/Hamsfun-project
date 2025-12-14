'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl } from '@/utils/helpers';

interface BossArrivalCinematicProps {
  isActive: boolean;
  onComplete: () => void;
  questSlotPosition: { top: number; left: number; width: number } | null;
  theme: 'light' | 'dark';
}

type CinematicPhase = 'fade-to-black' | 'demon-in' | 'demon-out' | 'fade-to-ui' | 'fog' | 'reveal' | 'complete';

export const BossArrivalCinematic: React.FC<BossArrivalCinematicProps> = ({
  isActive,
  onComplete,
  questSlotPosition,
  theme,
}) => {
  const [phase, setPhase] = useState<CinematicPhase>('fade-to-black');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fogStartTimeRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
  }>>([]);

  // Reset phase when cinematic starts
  useEffect(() => {
    if (isActive) {
      setPhase('fade-to-black');
      particlesRef.current = [];
      fogStartTimeRef.current = null;
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

    // Step 4: Fade back to normal UI (600ms)
    timeouts.push(setTimeout(() => {
      setPhase('fog');
      fogStartTimeRef.current = Date.now(); // Track when fog phase starts
    }, 800 + 1200 + 1000 + 600));

    // Step 5: Fog pause (500ms) + rush to quest (2000ms) = 2500ms total
    timeouts.push(setTimeout(() => {
      setPhase('reveal');
    }, 800 + 1200 + 1000 + 600 + 2500));

    // Step 6: Quest reveal and fog disperses (1500ms)
    timeouts.push(setTimeout(() => {
      setPhase('complete');
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 800 + 1200 + 1000 + 600 + 2500 + 1500));

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isActive, onComplete]);

  // Fog particle animation
  useEffect(() => {
    if (phase !== 'fog' && phase !== 'reveal') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get main page container bounds (phone-sized centered container)
    // Typically max-width 428px, centered horizontally
    const mainContainerWidth = 428;
    const mainContainerLeft = (canvas.width - mainContainerWidth) / 2;
    const mainContainerRight = mainContainerLeft + mainContainerWidth;
    const mainContainerTop = 0;
    const mainContainerBottom = canvas.height;

    // Initialize particles (only once) - random sizes and positions within main page area
    if (particlesRef.current.length === 0) {
      const particleCount = 500; // Higher density for more dramatic effect
      
      for (let i = 0; i < particleCount; i++) {
        // Random size distribution: 50% small, 35% medium, 15% large
        const sizeRand = Math.random();
        let size: number;
        if (sizeRand < 0.5) {
          // Small particles
          size = Math.random() * 2 + 1.5;
        } else if (sizeRand < 0.85) {
          // Medium particles
          size = Math.random() * 3 + 3.5;
        } else {
          // Large particles
          size = Math.random() * 4 + 6.5;
        }
        
        // Spawn within main page container bounds
        particlesRef.current.push({
          x: mainContainerLeft + Math.random() * mainContainerWidth,
          y: mainContainerTop + Math.random() * (mainContainerBottom - mainContainerTop),
          vx: (Math.random() - 0.5) * 0.2, // Slow initial velocity for pause
          vy: (Math.random() - 0.5) * 0.2,
          size: size,
          opacity: Math.random() * 0.6 + 0.4,
        });
      }
    }

    const centerX = questSlotPosition 
      ? questSlotPosition.left + questSlotPosition.width / 2 
      : canvas.width / 2;
    const centerY = questSlotPosition 
      ? questSlotPosition.top + 50 
      : canvas.height / 2;

    const animate = () => {
      // Clear canvas - don't draw black background, let UI show through
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate time since fog phase started
      const currentTime = Date.now();
      const timeSinceFogStart = fogStartTimeRef.current 
        ? (currentTime - fogStartTimeRef.current) / 1000 
        : 0;
      const pauseDuration = 0.5; // 500ms pause
      const isPaused = timeSinceFogStart < pauseDuration;
      const isRushing = timeSinceFogStart >= pauseDuration;
      
      particlesRef.current.forEach((particle) => {
        // Calculate distance to quest position
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        if (isPaused) {
          // Pause phase: particles hover with minimal random drift
          const driftX = (Math.random() - 0.5) * 0.15;
          const driftY = (Math.random() - 0.5) * 0.15;
          particle.vx += driftX;
          particle.vy += driftY;
          
          // Strong damping to keep particles mostly still
          particle.vx *= 0.85;
          particle.vy *= 0.85;
        } else if (isRushing) {
          // Rush phase: aggressive pull toward quest position
          let pullStrength = 0.035; // Much stronger pull
          let rotationStrength = 0.15; // Faster rotation
          
          // Even stronger for reveal phase
          if (phase === 'reveal') {
            pullStrength = 0.05;
            rotationStrength = 0.2;
          }
          
          // Strong pull toward quest position
          const pullForce = Math.min(distance * pullStrength, 8); // Higher max force
          particle.vx += Math.cos(angle) * pullForce;
          particle.vy += Math.sin(angle) * pullForce;
          
          // Aggressive vortex rotation
          const rotationForce = rotationStrength * (1 + distance / 300);
          particle.vx += -Math.sin(angle) * rotationForce;
          particle.vy += Math.cos(angle) * rotationForce;
          
          // Less damping for faster motion
          particle.vx *= 0.98;
          particle.vy *= 0.98;
        }
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // During reveal phase, particles fade out as they reach center
        if (phase === 'reveal') {
          if (distance < 120) {
            particle.opacity = Math.max(0, particle.opacity - 0.05);
          }
        }
        
        // Draw particle with enhanced dark glow (semi-transparent so UI shows through)
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.fillStyle = 'rgba(15, 15, 15, 0.9)';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, questSlotPosition]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Step 1: Smooth Fade to Black */}
      <AnimatePresence>
        {(phase === 'fade-to-black' || phase === 'demon-in' || phase === 'demon-out' || phase === 'fade-to-ui') && (
          <motion.div
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

      {/* Step 4-5: Dark Fog Canvas - Visible on Normal UI */}
      {(phase === 'fog' || phase === 'reveal') && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Step 5: Quest Reveal - Dark Fog Silhouette Effect */}
      {phase === 'reveal' && questSlotPosition && (
        <>
          {/* Dark smoke shadow covering quest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 1, 1, 0.3, 0],
              scale: [0.8, 1, 1, 1, 1.1],
            }}
            transition={{ 
              duration: 1.5, 
              times: [0, 0.2, 0.5, 0.8, 1],
              ease: 'easeInOut',
            }}
            className="absolute"
            style={{
              top: questSlotPosition.top - 30,
              left: questSlotPosition.left - 30,
              width: questSlotPosition.width + 60,
              height: '240px',
              background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)',
              pointerEvents: 'none',
              borderRadius: '1rem',
            }}
          />
          {/* Additional swirling fog effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0.4, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ 
              duration: 1.5,
              times: [0, 0.3, 0.7, 1],
            }}
            className="absolute"
            style={{
              top: questSlotPosition.top - 40,
              left: questSlotPosition.left - 40,
              width: questSlotPosition.width + 80,
              height: '260px',
              background: 'radial-gradient(ellipse, rgba(20, 20, 20, 0.8) 0%, transparent 80%)',
              pointerEvents: 'none',
              borderRadius: '1rem',
            }}
          />
        </>
      )}
    </div>
  );
};
