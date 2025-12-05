/**
 * Counting Animation Utility with performance optimizations
 * Optimized for smooth animations with minimal performance impact
 */

/**
 * Easing functions for smooth animations
 */
export const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutExpo = (t) => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

/**
 * Animation controller class for better performance
 */
class AnimationController {
  constructor() {
    this.activeAnimations = new Set();
  }

  animate(start, end, options = {}) {
    const {
      duration = 1000,
      easing = easeOutCubic,
      onUpdate,
      onComplete,
    } = options;

    return new Promise((resolve) => {
      const startTime = performance.now();
      const difference = end - start;
      const animationId = Symbol('animation');

      const animate = (currentTime) => {
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
          this.activeAnimations.delete(animationId);
          if (onComplete) {
            onComplete();
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  cancelAll() {
    this.activeAnimations.clear();
  }
}

const animationController = new AnimationController();

/**
 * Animate a number from start to end with smooth counting
 */
export const animateCount = (start, end, options = {}) => {
  return animationController.animate(start, end, options);
};

/**
 * Animate multiple values simultaneously
 */
export const animateMultiple = (animations) => {
  const promises = animations.map(({ start, end, onUpdate, duration, easing }) =>
    animateCount(start, end, { duration, easing, onUpdate })
  );
  return Promise.all(promises).then(() => {});
};

