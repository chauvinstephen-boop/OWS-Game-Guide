/**
 * Dice Mechanics Module
 * Implements OWS Series Rules v2.3 dice system:
 * - Die promotion/demotion (D4 → D6 → D8 → D10 → D12 → D16 → D20)
 * - Meet-or-beat success determination
 * - Critical hits (2x, 3x, 4x defense values)
 */

// Dice scale in order
const DICE_SCALE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd16', 'd20'];
const DICE_VALUES = {
  'd4': { sides: 4, index: 0 },
  'd6': { sides: 6, index: 1 },
  'd8': { sides: 8, index: 2 },
  'd10': { sides: 10, index: 3 },
  'd12': { sides: 12, index: 4 },
  'd16': { sides: 16, index: 5 },
  'd20': { sides: 20, index: 6 }
};

/**
 * Roll a die and return the result
 * @param {string} dieType - Die type (e.g., 'd8', 'd12')
 * @returns {number} - Random value between 1 and die sides
 */
export function rollDie(dieType) {
  const sides = DICE_VALUES[dieType]?.sides;
  if (!sides) throw new Error(`Invalid die type: ${dieType}`);
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Promote a die by one or more steps
 * @param {string} currentDie - Current die type
 * @param {number} promotions - Number of promotions (default 1)
 * @returns {string} - Promoted die type (capped at d20)
 */
export function promoteDie(currentDie, promotions = 1) {
  const current = DICE_VALUES[currentDie];
  if (!current) throw new Error(`Invalid die type: ${currentDie}`);
  
  const newIndex = Math.min(current.index + promotions, DICE_SCALE.length - 1);
  return DICE_SCALE[newIndex];
}

/**
 * Demote a die by one or more steps
 * @param {string} currentDie - Current die type
 * @param {number} demotions - Number of demotions (default 1)
 * @returns {string} - Demoted die type (capped at d4)
 */
export function demoteDie(currentDie, demotions = 1) {
  const current = DICE_VALUES[currentDie];
  if (!current) throw new Error(`Invalid die type: ${currentDie}`);
  
  const newIndex = Math.max(current.index - demotions, 0);
  return DICE_SCALE[newIndex];
}

/**
 * Apply cumulative promotions and demotions to a die
 * @param {string} baseDie - Base die type
 * @param {number} netModifier - Net promotions (positive) or demotions (negative)
 * @returns {string} - Modified die type
 */
export function applyDieModifier(baseDie, netModifier) {
  if (netModifier > 0) {
    return promoteDie(baseDie, netModifier);
  } else if (netModifier < 0) {
    return demoteDie(baseDie, -netModifier);
  }
  return baseDie;
}

/**
 * Determine if an attack roll is successful (meet or beat)
 * @param {number} rollValue - The die roll result
 * @param {number} defenseNumber - The target defense number
 * @returns {object} - { success: boolean, criticalHits: number }
 *   - criticalHits: 0 = failure, 1 = success, 2 = double (2x), 3 = triple (3x), 4 = quad (4x)
 */
export function determineSuccess(rollValue, defenseNumber) {
  if (rollValue < defenseNumber) {
    return { success: false, criticalHits: 0 };
  }
  
  const ratio = rollValue / defenseNumber;
  let criticalHits = 1; // Basic hit
  
  if (ratio >= 4) {
    criticalHits = 4;
  } else if (ratio >= 3) {
    criticalHits = 3;
  } else if (ratio >= 2) {
    criticalHits = 2;
  }
  
  return { success: true, criticalHits };
}

/**
 * Roll and adjudicate an attack in a single function
 * @param {string} attackDie - Attacker's die type
 * @param {number} defenseNumber - Defender's defense number (red shield)
 * @returns {object} - { rollValue: number, success: boolean, hits: number }
 */
export function resolveAttack(attackDie, defenseNumber) {
  const rollValue = rollDie(attackDie);
  const { success, criticalHits } = determineSuccess(rollValue, defenseNumber);
  
  return {
    rollValue,
    success,
    hits: success ? criticalHits : 0
  };
}

/**
 * Roll multiple attacks (salvos)
 * @param {string[]} attackDice - Array of die types to roll
 * @param {number} defenseNumber - Defender's defense number
 * @returns {object} - { rolls: array, totalHits: number, details: array }
 */
export function resolveSalvo(attackDice, defenseNumber) {
  const rolls = attackDice.map(die => rollDie(die));
  const details = rolls.map((value, i) => {
    const result = determineSuccess(value, defenseNumber);
    return {
      dieType: attackDice[i],
      rollValue: value,
      ...result
    };
  });
  
  const totalHits = details.reduce((sum, d) => sum + d.criticalHits, 0);
  
  return { rolls, totalHits, details };
}

/**
 * Resolve a shield defense (grey shield)
 * Grey shields are consumable first-layer defenses
 * @param {string} attackDie - Attacker's die type
 * @param {number} greyShieldValue - Grey shield defense value
 * @param {number} redShieldValue - Red shield defense value
 * @returns {object} - { shieldPenetrated: boolean, redShieldHits: number }
 */
export function resolveLayeredDefense(attackDie, greyShieldValue, redShieldValue) {
  const rollValue = rollDie(attackDie);
  
  // Check against grey shield first
  if (rollValue < greyShieldValue) {
    return { shieldPenetrated: false, redShieldHits: 0, rollValue };
  }
  
  // Grey shield penetrated, check against red shield
  const { success, criticalHits } = determineSuccess(rollValue, redShieldValue);
  
  return {
    shieldPenetrated: true,
    redShieldHits: success ? criticalHits : 0,
    rollValue
  };
}

/**
 * Get the next higher die in the scale
 * @param {string} currentDie
 * @returns {string} - Next die (or d20 if at max)
 */
export function getNextDie(currentDie) {
  return promoteDie(currentDie, 1);
}

/**
 * Get the next lower die in the scale
 * @param {string} currentDie
 * @returns {string} - Previous die (or d4 if at min)
 */
export function getPreviousDie(currentDie) {
  return demoteDie(currentDie, 1);
}

/**
 * Compare two dice to determine relationship
 * @param {string} die1
 * @param {string} die2
 * @returns {number} - -1 if die1 < die2, 0 if equal, 1 if die1 > die2
 */
export function compareDice(die1, die2) {
  const idx1 = DICE_VALUES[die1]?.index;
  const idx2 = DICE_VALUES[die2]?.index;
  
  if (idx1 === undefined || idx2 === undefined) {
    throw new Error('Invalid die type');
  }
  
  if (idx1 < idx2) return -1;
  if (idx1 > idx2) return 1;
  return 0;
}

export { DICE_SCALE, DICE_VALUES };
