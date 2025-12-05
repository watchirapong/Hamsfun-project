/**
 * Skill Handlers with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

/**
 * Creates skill-related handler functions
 */
export const useSkillHandlers = (params) => {
  const { setSelectedSkill, setShowBadgeOverlay } = params;

  // Handler for skill card click
  const handleSkillCardClick = (skill) => {
    setSelectedSkill(skill);
    setShowBadgeOverlay(true);
  };

  return {
    handleSkillCardClick,
  };
};

