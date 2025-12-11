import { Variants } from 'framer-motion';

export const rankCardAttention: Variants = {
  inactive: {
    x: 0,
    rotate: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1], // easeOut cubic bezier
    },
  },
  active: {
    // Phone vibration style: subtle, slow horizontal shake with expressive rotational jitter (30% speed, increased angle)
    x: [0, -0.75, 0.75, -0.6, 0.6, -0.45, 0.45, -0.6, 0.6, -0.3, 0.3, 0], // reduced amplitude horizontal micro-movements
    rotate: [0, -0.6, 0.6, -0.45, 0.45, -0.3, 0.3, -0.4, 0.4, -0.25, 0.25, 0], // increased rotational jitter for more expressive shake
    transition: {
      duration: 1.3, // slower vibration cycle (30% speed = ~3.3x slower)
      ease: [0.4, 0, 0.6, 1], // linear-like for realistic vibration feel
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  },
};

