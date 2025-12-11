import { Variants } from 'framer-motion';

export const rankCardGlowPulse: Variants = {
  inactive: {
    boxShadow: "0 0 0px rgba(255, 215, 0, 0)", // no glow
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1], // easeOut cubic bezier
    },
  },
  active: {
    // No scale - only glow effect to preserve fixed height
    boxShadow: [
      "0 0 0px rgba(255, 215, 0, 0.0)",
      "0 0 14px rgba(255, 215, 0, 0.75)",
      "0 0 8px rgba(255, 215, 0, 0.4)",
      "0 0 16px rgba(255, 215, 0, 0.85)",
      "0 0 0px rgba(255, 215, 0, 0.0)",
    ],
    transition: {
      duration: 1.5,
      ease: [0.42, 0, 0.58, 1], // easeInOut cubic bezier
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  },
};

