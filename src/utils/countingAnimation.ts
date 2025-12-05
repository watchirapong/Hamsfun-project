/**
 * Utility functions for smooth counting animations
 */

export interface CountingAnimationOptions {
  duration?: number; // Animation duration in ms (default: 1000ms)
  easing?: (t: number) => number; // Easing function (default: easeOutCubic)
  onUpdate?: (value: number) => void; // Callback for each frame
  onComplete?: () => void; // Callback when animation completes
}

/**
 * Easing function: easeOutCubic
 * Provides smooth deceleration at the end
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Easing function: easeInOutCubic
 * Provides smooth acceleration and deceleration
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Easing function: easeOutExpo
 * Provides fast start with smooth end
 */
export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

/**
 * Animate a number from start to end with smooth counting
 * @param start Starting value
 * @param end Ending value
 * @param options Animation options
 * @returns Promise that resolves when animation completes
 */
export const animateCount = (
  start: number,
  end: number,
  options: CountingAnimationOptions = {}
): Promise<void> => {
  const {
    duration = 1000,
    easing = easeOutCubic,
    onUpdate,
    onComplete,
  } = options;

  return new Promise((resolve) => {
    const startTime = performance.now();
    const difference = end - start;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = Math.round(start + difference * easedProgress);

      if (onUpdate) {
        onUpdate(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure final value is set
        if (onUpdate) {
          onUpdate(end);
        }
        if (onComplete) {
          onComplete();
        }
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
};

/**
 * Animate multiple values simultaneously
 * @param animations Array of animation configs
 * @returns Promise that resolves when all animations complete
 */
export const animateMultiple = (
  animations: Array<{
    start: number;
    end: number;
    onUpdate: (value: number) => void;
    duration?: number;
    easing?: (t: number) => number;
  }>
): Promise<void> => {
  const promises = animations.map(({ start, end, onUpdate, duration, easing }) =>
    animateCount(start, end, { duration, easing, onUpdate })
  );
  return Promise.all(promises).then(() => {});
};

