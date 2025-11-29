import { Skill } from '@/types';

interface SkillHandlersParams {
  setSelectedSkill: React.Dispatch<React.SetStateAction<Skill | null>>;
  setShowBadgeOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Creates skill-related handler functions
 */
export const useSkillHandlers = (params: SkillHandlersParams) => {
  const { setSelectedSkill, setShowBadgeOverlay } = params;

  // Handler for skill card click
  const handleSkillCardClick = (skill: Skill) => {
    setSelectedSkill(skill);
    setShowBadgeOverlay(true);
  };

  return {
    handleSkillCardClick,
  };
};

