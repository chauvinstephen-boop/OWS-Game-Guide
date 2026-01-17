/**
 * Ground Combat Module
 * Implements OWS Series Rules v2.3 ground operations:
 * - Ground Combat Adjudication Table (GCAT)
 * - Terrain effects and modifiers
 * - Unit organization (Main Effort, Reserve)
 * - Suppression and step losses
 */

export const UNIT_TYPE = {
  INFANTRY: 'infantry',
  MECHANIZED: 'mechanized',
  ARMOR: 'armor',
  ARTILLERY: 'artillery',
  AIR_DEFENSE: 'air_defense',
  HELICOPTER: 'helicopter'
};

export const TERRAIN_TYPE = {
  OPEN: 'open',
  ROUGH: 'rough',
  FOREST: 'forest',
  URBAN: 'urban',
  MOUNTAIN: 'mountain',
  WATER: 'water'
};

export const UNIT_ORGANIZATION = {
  MAIN_EFFORT: 'main_effort',
  RESERVE: 'reserve',
  NORMAL: 'normal'
};

export const SUPPRESSION_LEVEL = {
  NOT_SUPPRESSED: 0,
  SUPPRESSED_ONE: 1,
  SUPPRESSED_TWO: 2,
  SUPPRESSED_THREE: 3
};

/**
 * Ground Combat Adjudication Table (GCAT)
 * Maps force ratios to combat outcomes
 * Simplified version: actual GCAT uses 15-column lookup table
 */
const GCAT_BASE = {
  '1-3': { columnShift: -3, outcome: 'defender_attacker_loss' },
  '1-2': { columnShift: -2, outcome: 'defender_attacker_loss' },
  '1-1': { columnShift: -1, outcome: 'defender_loss' },
  '2-1': { columnShift: 0, outcome: 'mutual_loss' },
  '3-1': { columnShift: 1, outcome: 'attacker_loss' },
  '4-1': { columnShift: 2, outcome: 'attacker_loss' },
  '5-1': { columnShift: 3, outcome: 'defender_retreats' }
};

/**
 * Calculate force ratio for GCAT
 * @param {number} attackerSteps - Total steps of attacking units
 * @param {number} defenderSteps - Total steps of defending units
 * @returns {string} - Ratio as 'X-Y' or comparison
 */
export function calculateForceRatio(attackerSteps, defenderSteps) {
  if (defenderSteps === 0) return '5-1'; // Auto-assault if no defender
  
  const ratio = attackerSteps / defenderSteps;
  
  if (ratio <= 0.33) return '1-3';
  if (ratio <= 0.5) return '1-2';
  if (ratio <= 0.75) return '1-1';
  if (ratio <= 1.5) return '2-1';
  if (ratio <= 3) return '3-1';
  if (ratio <= 4) return '4-1';
  return '5-1';
}

/**
 * Get base GCAT column shift
 * @param {string} forceRatio - Force ratio ('1-3' to '5-1')
 * @returns {number} - Column shift modifier
 */
export function getGcatColumnShift(forceRatio) {
  return GCAT_BASE[forceRatio]?.columnShift || 0;
}

/**
 * Determine terrain modifier for combat
 * @param {string} terrainType - Terrain type
 * @param {string} unitType - Unit type (affects how terrain is used)
 * @returns {number} - Column shift modifier
 */
export function getTerrainModifier(terrainType, unitType) {
  const modifiers = {
    [TERRAIN_TYPE.OPEN]: { infantry: 0, mechanized: 1, armor: 1 },
    [TERRAIN_TYPE.ROUGH]: { infantry: 0, mechanized: -1, armor: -1 },
    [TERRAIN_TYPE.FOREST]: { infantry: 1, mechanized: -2, armor: -2 },
    [TERRAIN_TYPE.URBAN]: { infantry: 2, mechanized: 0, armor: -1 },
    [TERRAIN_TYPE.MOUNTAIN]: { infantry: 2, mechanized: -2, armor: -3 }
  };
  
  const terrainMods = modifiers[terrainType] || {};
  return terrainMods[unitType] || 0;
}

/**
 * Get supply modifier for GCAT
 * Supply status affects combat capability
 * @param {object} unitSupplyStatus - Supply status of attacking/defending unit
 * @returns {number} - Column shift modifier
 */
export function getSupplyModifier(unitSupplyStatus) {
  const modifiers = {
    'normal': 0,
    'extended': -1,
    'out_of_supply': -2
  };
  
  return modifiers[unitSupplyStatus?.status] || 0;
}

/**
 * Get Main Effort bonus
 * Main Effort units receive +1 column shift advantage
 * @param {object} unit - Unit data
 * @returns {number} - Modifier
 */
export function getMainEffortModifier(unit) {
  return unit?.organization === UNIT_ORGANIZATION.MAIN_EFFORT ? 1 : 0;
}

/**
 * Calculate total GCAT column shift
 * Sum of all modifiers
 * @param {object} scenario - {
 *   forceRatio: '2-1',
 *   terrain: 'forest',
 *   supply: 'normal',
 *   mainEffort: false,
 *   weather: 'clear',
 *   fortified: false
 * }
 * @returns {number} - Total column shift
 */
export function calculateTotalColumnShift(scenario) {
  let total = 0;
  
  // Base from force ratio
  total += getGcatColumnShift(scenario.forceRatio);
  
  // Terrain
  if (scenario.terrain) {
    total += getTerrainModifier(scenario.terrain, scenario.unitType || 'mechanized');
  }
  
  // Supply
  if (scenario.supply) {
    total += getSupplyModifier(scenario.supply);
  }
  
  // Main Effort
  if (scenario.mainEffort) {
    total += 1;
  }
  
  // Fortifications
  if (scenario.fortified) {
    total -= 2;
  }
  
  // Weather (simplified)
  if (scenario.weather === 'storm') {
    total -= 1;
  }
  
  return total;
}

/**
 * Resolve ground combat using GCAT
 * Includes casualty determination
 * @param {object[]} attackingUnits - Attacker units
 * @param {object[]} defendingUnits - Defender units
 * @param {object} environment - Terrain, supply, etc.
 * @returns {object} - Combat result
 */
export function resolveGroundCombat(attackingUnits, defendingUnits, environment) {
  // Calculate total steps
  const attackerSteps = attackingUnits.reduce((sum, u) => sum + (u.maxSteps - (u.stepLosses || 0)), 0);
  const defenderSteps = defendingUnits.reduce((sum, u) => sum + (u.maxSteps - (u.stepLosses || 0)), 0);
  
  // Get force ratio
  const forceRatio = calculateForceRatio(attackerSteps, defenderSteps);
  
  // Calculate modifiers
  const columnShift = calculateTotalColumnShift({
    forceRatio,
    ...environment
  });
  
  // Determine casualties (simplified: roll D10)
  const roll = Math.floor(Math.random() * 10) + 1;
  
  const outcomes = {
    low: { attacker: 1, defender: 3 },
    medium: { attacker: 2, defender: 2 },
    high: { attacker: 3, defender: 1 }
  };
  
  const outcome = roll <= 4 ? outcomes.low : (roll <= 7 ? outcomes.medium : outcomes.high);
  
  return {
    forceRatio,
    columnShift,
    roll,
    attackerCasualties: outcome.attacker,
    defenderCasualties: outcome.defender,
    attackerSteps,
    defenderSteps
  };
}

/**
 * Apply suppression to a unit
 * Suppressed units cannot move and have reduced combat effectiveness
 * @param {object} unit - Unit to suppress
 * @param {number} suppressionLevel - Number of suppression markers
 * @returns {object} - Updated unit
 */
export function applySuppression(unit, suppressionLevel = 1) {
  return {
    ...unit,
    suppressed: true,
    suppressionLevel: (unit.suppressionLevel || 0) + suppressionLevel,
    canMove: false,
    combatDieDemotion: (unit.suppressionLevel || 0) + suppressionLevel
  };
}

/**
 * Get suppression modifier to combat die
 * Each suppression marker demotes die by 1
 * @param {number} suppressionLevel
 * @returns {number} - Demotion count
 */
export function getSuppressionDemotion(suppressionLevel) {
  return suppressionLevel || 0;
}

/**
 * Check if a unit can move while suppressed
 * Suppressed units cannot move
 * @param {object} unit - Unit to check
 * @returns {boolean}
 */
export function canMoveWhileSuppressed(unit) {
  return !(unit.suppressed && unit.suppressionLevel > 0);
}

/**
 * Remove suppression at end of turn
 * All suppression markers are removed
 * @param {object} unit - Unit
 * @returns {object} - Updated unit with suppression removed
 */
export function removeSuppression(unit) {
  return {
    ...unit,
    suppressed: false,
    suppressionLevel: 0,
    canMove: true
  };
}

/**
 * Resolve a strike against ground units using Fire Effects Table
 * @param {object} target - Target unit
 * @param {number} hits - Number of hits from strike
 * @returns {object} - Effect (suppression, step loss, or destruction)
 */
export function applyStrikeToGroundUnit(target, hits) {
  if (hits === 0) {
    return { effect: 'no_effect' };
  }
  
  // Simplified GCAT: most units need 2-3 hits for step loss
  const hitsNeededForStepLoss = {
    'light_infantry': 1,
    'infantry': 2,
    'mechanized': 3,
    'armor': 3,
    'artillery': 2
  };
  
  const threshold = hitsNeededForStepLoss[target.type] || 2;
  
  if (hits >= threshold) {
    const stepLoss = Math.floor(hits / threshold);
    const remaining = hits % threshold;
    
    return {
      effect: 'step_loss',
      stepLoss,
      suppression: remaining > 0,
      description: `${stepLoss} step loss${remaining > 0 ? ' + suppression' : ''}`
    };
  }
  
  // Hits less than threshold = suppression only
  return {
    effect: 'suppression',
    suppressionLevel: hits,
    description: `${hits} suppression marker(s)`
  };
}

/**
 * Check if a unit is destroyed
 * Unit is destroyed when step losses >= max steps
 * @param {object} unit - Unit with { stepLosses, maxSteps }
 * @returns {boolean}
 */
export function isUnitDestroyed(unit) {
  return (unit.stepLosses || 0) >= (unit.maxSteps || 1);
}

/**
 * Get movement points for a unit based on organization and status
 * Main Effort units move better
 * Reserve units move slower but can exploit
 * Suppressed units cannot move
 * @param {object} unit - Unit data
 * @param {number} baseMovement - Base MP allowance
 * @returns {number} - Allowed movement points
 */
export function getAllowedMovement(unit, baseMovement) {
  if (unit.suppressed) {
    return 0; // Cannot move while suppressed
  }
  
  let allowed = baseMovement;
  
  if (unit.organization === UNIT_ORGANIZATION.MAIN_EFFORT) {
    allowed = Math.floor(allowed * 1.25); // 25% bonus
  } else if (unit.organization === UNIT_ORGANIZATION.RESERVE) {
    allowed = Math.floor(allowed * 0.75); // 25% penalty but can exploit
  }
  
  return allowed;
}

export {
  UNIT_TYPE,
  TERRAIN_TYPE,
  UNIT_ORGANIZATION,
  SUPPRESSION_LEVEL
};
