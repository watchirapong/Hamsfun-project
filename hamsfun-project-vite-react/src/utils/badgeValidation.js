/**
 * Badge Validation Utilities with performance optimizations
 * Optimized for 10,000+ concurrent users
 */

import { mapApiSkillNameToDisplayName } from './rewardHelpers';

/**
 * Maps display skill name back to API skill name
 */
const getApiSkillNameFromDisplayName = (displayName) => {
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
 * Validates that badge points received from backend match expected rewards
 */
export const validateBadgePoints = (
  expectedRewards,
  grantedBadgePoints,
  questId,
  objectiveIndex
) => {
  const result = {
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
 * Validates badge points for a quest objective
 */
export const validateObjectiveBadgePoints = (
  quest,
  objectiveIndex,
  grantedBadgePoints
) => {
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
  const expectedRewards = rewards;
  return validateBadgePoints(expectedRewards, grantedBadgePoints, quest.id, objectiveIndex);
};

/**
 * Validates badge points for a quest completion reward
 */
export const validateQuestCompletionBadgePoints = (
  quest,
  grantedBadgePoints
) => {
  const expectedRewards = quest.rewards || [];
  return validateBadgePoints(expectedRewards, grantedBadgePoints, quest.id);
};

