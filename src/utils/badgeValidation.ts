import { Quest, QuestObjective, ObjectiveReward } from '@/types';
import { mapApiSkillNameToDisplayName } from './rewardHelpers';

/**
 * Validates that badge points received from backend match expected rewards
 * @param expectedRewards - Array of expected rewards from quest/objective
 * @param grantedBadgePoints - Badge points object received from backend
 * @param questId - Quest ID for logging
 * @param objectiveIndex - Objective index for logging
 * @returns Validation result with isValid flag and any mismatches
 */
export interface BadgeValidationResult {
  isValid: boolean;
  mismatches: Array<{
    skillName: string;
    expected: number;
    received: number;
  }>;
  warnings: string[];
}

export const validateBadgePoints = (
  expectedRewards: ObjectiveReward[],
  grantedBadgePoints: { [skillName: string]: number } | undefined,
  questId: number,
  objectiveIndex?: number
): BadgeValidationResult => {
  const result: BadgeValidationResult = {
    isValid: true,
    mismatches: [],
    warnings: []
  };

  // Log validation attempt
  console.log(`[Badge Validation] Validating badge points for quest ${questId}${objectiveIndex !== undefined ? ` objective ${objectiveIndex}` : ''}`);
  console.log(`[Badge Validation] Expected rewards:`, expectedRewards);
  console.log(`[Badge Validation] Granted badge points:`, grantedBadgePoints);

  // If no badge points expected and none granted, it's valid
  const expectedBadgeRewards = expectedRewards.filter(r => r.type === 'skill');
  if (expectedBadgeRewards.length === 0 && (!grantedBadgePoints || Object.keys(grantedBadgePoints).length === 0)) {
    return result;
  }

  // If badge points are expected but none granted, it's invalid
  if (expectedBadgeRewards.length > 0 && (!grantedBadgePoints || Object.keys(grantedBadgePoints).length === 0)) {
    result.isValid = false;
    result.warnings.push(`Expected badge points but none were granted for quest ${questId}${objectiveIndex !== undefined ? ` objective ${objectiveIndex}` : ''}`);
    return result;
  }

  // Validate each expected badge reward
  expectedBadgeRewards.forEach(expectedReward => {
    if (!expectedReward.skillName) {
      result.warnings.push(`Badge reward missing skillName in quest ${questId}`);
      return;
    }

    const expectedValue = typeof expectedReward.value === 'number' ? expectedReward.value : 0;
    if (expectedValue <= 0) {
      return; // Skip validation for zero or invalid values
    }

    // Map display name to API skill name for comparison
    // The backend might return API names (GameDesign, Art, etc.) while frontend uses display names
    const apiSkillName = getApiSkillNameFromDisplayName(expectedReward.skillName);
    const displayName = mapApiSkillNameToDisplayName(apiSkillName);

    // Check both API name and display name
    const receivedPoints = grantedBadgePoints?.[apiSkillName] ||
      grantedBadgePoints?.[displayName] ||
      grantedBadgePoints?.[expectedReward.skillName] ||
      0;

    // Allow some tolerance (backend might grant slightly different amounts due to min/max ranges)
    // But log if there's a significant mismatch
    if (receivedPoints === 0 && expectedValue > 0) {
      result.isValid = false;
      result.mismatches.push({
        skillName: expectedReward.skillName,
        expected: expectedValue,
        received: 0
      });
    } else if (Math.abs(receivedPoints - expectedValue) > expectedValue * 0.5) {
      // If difference is more than 50% of expected, log as warning
      result.warnings.push(
        `Badge points mismatch for ${expectedReward.skillName}: expected ~${expectedValue}, received ${receivedPoints}`
      );
    }
  });

  // Check for unexpected badge points (granted but not expected)
  if (grantedBadgePoints) {
    Object.keys(grantedBadgePoints).forEach(apiSkillName => {
      const displayName = mapApiSkillNameToDisplayName(apiSkillName);
      const hasExpectedReward = expectedBadgeRewards.some(
        r => r.skillName === displayName || r.skillName === apiSkillName
      );

      if (!hasExpectedReward && grantedBadgePoints[apiSkillName] > 0) {
        result.warnings.push(
          `Unexpected badge points granted for ${apiSkillName}: ${grantedBadgePoints[apiSkillName]}`
        );
      }
    });
  }

  return result;
};

/**
 * Maps display skill name back to API skill name
 * @param displayName - Display name (e.g., "Game Design")
 * @returns API skill name (e.g., "GameDesign")
 */
const getApiSkillNameFromDisplayName = (displayName: string): string => {
  const normalized = displayName.toLowerCase().trim();

  if (normalized.includes('game') || normalized === 'explorer') {
    return 'GameDesign';
  } else if (normalized.includes('level')) {
    return 'LevelDesign';
  } else if (normalized.includes('art') || normalized.includes('drawing')) {
    return 'Art';
  } else if (normalized.includes('programming') || normalized.includes('code') || normalized.includes('c#')) {
    return 'Programming';
  }

  // Return as-is if no match (might already be API name)
  return displayName;
};

/**
 * Validates badge points for a quest objective
 * @param quest - Quest containing the objective
 * @param objectiveIndex - Index of the objective
 * @param grantedBadgePoints - Badge points received from backend
 * @returns Validation result
 */
export const validateObjectiveBadgePoints = (
  quest: Quest,
  objectiveIndex: number,
  grantedBadgePoints: { [skillName: string]: number } | undefined
): BadgeValidationResult => {
  const objective = quest.objectives[objectiveIndex];
  if (!objective) {
    return {
      isValid: false,
      mismatches: [],
      warnings: [`Objective ${objectiveIndex} not found in quest ${quest.id}`]
    };
  }

  // Normalize reward to array
  const rewards = Array.isArray(objective.reward) ? objective.reward : [objective.reward];
  const expectedRewards: ObjectiveReward[] = rewards;
  return validateBadgePoints(expectedRewards, grantedBadgePoints, quest.id, objectiveIndex);
};

/**
 * Validates badge points for a quest completion reward
 * @param quest - Quest with completion rewards
 * @param grantedBadgePoints - Badge points received from backend
 * @returns Validation result
 */
export const validateQuestCompletionBadgePoints = (
  quest: Quest,
  grantedBadgePoints: { [skillName: string]: number } | undefined
): BadgeValidationResult => {
  const expectedRewards = quest.rewards || [];
  return validateBadgePoints(expectedRewards, grantedBadgePoints, quest.id);
};

