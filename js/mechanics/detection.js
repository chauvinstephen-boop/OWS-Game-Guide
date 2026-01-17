/**
 * Detection & ISR System Module
 * Implements OWS Series Rules v2.3 detection mechanics:
 * - Theater ISR (with ISR pawns from Space Dashboard)
 * - Local detections (AEW, fighters, SAMs, etc.)
 * - Signature types (High vs Low signature)
 * - Stealth rules (d12 cap for stealth aircraft, requires local detection)
 * - Cooperative sensing
 */

import * as diceModule from './dice.js';

// Signature types
export const SIGNATURE_TYPE = {
  HIGH: 'high',  // Theater detection possible (satellite symbol)
  LOW: 'low'      // Local detection only (sensor symbol)
};

// Detection methods
export const DETECTION_METHOD = {
  THEATER_ISR: 'theater_isr',
  AEW: 'aew',
  FIGHTER_RADAR: 'fighter_radar',
  SAM_RADAR: 'sam_radar',
  SHIP_RADAR: 'ship_radar',
  ASW: 'asw',
  VISUAL: 'visual',
  SOF: 'sof'
};

// Unit types for detection
export const UNIT_TYPE = {
  FIGHTER: 'fighter',
  BOMBER: 'bomber',
  AEW: 'aew',
  TANKER: 'tanker',
  TRANSPORT: 'transport',
  SUBMARINE: 'submarine',
  SHIP: 'ship',
  SAM: 'sam',
  RADAR: 'radar',
  AIRFIELD: 'airfield',
  SOF: 'sof'
};

/**
 * Perform a theater ISR detection attempt
 * @param {number} isrDieType - ISR die from Space Dashboard (e.g., 'd10')
 * @param {number} targetSignature - Target's signature value
 * @returns {object} - { detected: boolean, rollValue: number }
 */
export function resolveTheaterISR(isrDieType, targetSignature) {
  const rollValue = diceModule.rollDie(isrDieType);
  const detected = rollValue >= targetSignature;
  
  return { detected, rollValue, targetSignature, method: DETECTION_METHOD.THEATER_ISR };
}

/**
 * Perform a local detection attempt
 * @param {string} sensorDie - Sensor's detection die (e.g., 'd12')
 * @param {number} targetSignature - Target's local detection signature
 * @param {boolean} isStealthAircraft - Whether target is stealth aircraft
 * @returns {object} - { detected: boolean, rollValue: number }
 */
export function resolveLocalDetection(sensorDie, targetSignature, isStealthAircraft = false) {
  // Stealth aircraft capped at d12 maximum
  const cappedDie = isStealthAircraft ? capStealthDetection(sensorDie) : sensorDie;
  const rollValue = diceModule.rollDie(cappedDie);
  const detected = rollValue >= targetSignature;
  
  return {
    detected,
    rollValue,
    targetSignature,
    sensorDie: cappedDie,
    isStealthAircraft,
    method: DETECTION_METHOD.FIGHTER_RADAR
  };
}

/**
 * Cap detection die at d12 for stealth aircraft (per rules 6.5.7)
 * @param {string} detectionDie
 * @returns {string} - Die capped at d12
 */
export function capStealthDetection(detectionDie) {
  const comparison = diceModule.compareDice(detectionDie, 'd12');
  if (comparison > 0) {
    return 'd12'; // Demote to d12
  }
  return detectionDie;
}

/**
 * Resolve AEW detection with range-based demotion
 * AEW rolls a full die in its own hex, demoted 1 step per hex of range
 * @param {string} baseAewDie - AEW's base detection die (e.g., 'd12')
 * @param {number} rangeInHexes - Distance in hexes (0 = same hex)
 * @param {number} targetSignature - Target's signature value
 * @param {boolean} isStealthAircraft - Whether target is stealth
 * @returns {object} - { detected: boolean, usedDie: string, rollValue: number }
 */
export function resolveAewDetection(baseAewDie, rangeInHexes, targetSignature, isStealthAircraft = false) {
  // Apply range demotion
  const adjustedDie = diceModule.demoteDie(baseAewDie, rangeInHexes);
  
  // Cap at d12 for stealth
  const finalDie = isStealthAircraft ? capStealthDetection(adjustedDie) : adjustedDie;
  
  const rollValue = diceModule.rollDie(finalDie);
  const detected = rollValue >= targetSignature;
  
  return {
    detected,
    baseAewDie,
    rangeInHexes,
    adjustedDie,
    usedDie: finalDie,
    rollValue,
    targetSignature,
    isStealthAircraft
  };
}

/**
 * Cooperative sensing: combine multiple sensors
 * Don't promote beyond d12 for ASW or stealth aircraft
 * @param {string[]} sensorDice - Array of sensor dice types
 * @param {number} targetSignature - Target signature
 * @param {boolean} isLowSignature - Whether ASW or stealth (cap at d12)
 * @returns {object} - { detected: boolean, combinedDie: string, rollValue: number }
 */
export function resolveCooperativeSensing(sensorDice, targetSignature, isLowSignature = false) {
  if (sensorDice.length === 0) {
    throw new Error('No sensors provided');
  }
  
  if (sensorDice.length === 1) {
    // Single sensor, just use it
    const die = isLowSignature ? capStealthDetection(sensorDice[0]) : sensorDice[0];
    const rollValue = diceModule.rollDie(die);
    return { detected: rollValue >= targetSignature, combinedDie: die, rollValue, targetSignature };
  }
  
  // Multiple sensors: promote highest
  let maxDie = sensorDice[0];
  for (const die of sensorDice.slice(1)) {
    if (diceModule.compareDice(die, maxDie) > 0) {
      maxDie = die;
    }
  }
  
  // Promote once for each additional sensor
  let promotedDie = maxDie;
  for (let i = 1; i < sensorDice.length; i++) {
    promotedDie = diceModule.promoteDie(promotedDie);
  }
  
  // Cap at d12 for low-signature
  const finalDie = isLowSignature ? capStealthDetection(promotedDie) : promotedDie;
  
  const rollValue = diceModule.rollDie(finalDie);
  const detected = rollValue >= targetSignature;
  
  return {
    detected,
    sensors: sensorDice,
    combinedDie: finalDie,
    rollValue,
    targetSignature,
    promotionCount: sensorDice.length - 1
  };
}

/**
 * Check if a unit is automatically detected
 * Fixed installations (airfields, ports, ASPs) are always detected
 * @param {string} unitType - Type of unit
 * @returns {boolean} - Whether unit is automatically detected
 */
export function isAutomaticallyDetected(unitType) {
  const autoDetected = [UNIT_TYPE.AIRFIELD, UNIT_TYPE.SAM, UNIT_TYPE.RADAR];
  return autoDetected.includes(unitType);
}

/**
 * Determine if a unit is in EMCON (Emissions Control)
 * EMCON units with stealth are harder to detect
 * @param {object} unit - Unit object with emcon and stealth properties
 * @returns {boolean}
 */
export function isInEmcon(unit) {
  return unit?.emcon === true;
}

/**
 * Get unit's signature based on type and status
 * @param {object} unit - Unit data
 * @param {string} detectionMethod - Which detection method being used
 * @returns {object} - { signature: number, signatureType: string, modifiers: array }
 */
export function getUnitSignature(unit, detectionMethod) {
  const signature = {
    signature: unit?.signature || 7,
    signatureType: unit?.signatureType || SIGNATURE_TYPE.HIGH,
    modifiers: []
  };
  
  // Stealth aircraft have lower signature for local detection
  if (unit?.stealth && detectionMethod !== DETECTION_METHOD.THEATER_ISR) {
    signature.signature = unit?.stealthSignature || 8;
  }
  
  // EMCON reduces signature
  if (isInEmcon(unit) && detectionMethod !== DETECTION_METHOD.VISUAL) {
    signature.modifiers.push({ name: 'EMCON', effect: 'harder to detect' });
  }
  
  return signature;
}

/**
 * Resolve a complete detection scenario
 * @param {object} scenario - {
 *   sensorType: 'aew'|'theater_isr'|'local',
 *   sensorDie: 'd12',
 *   targetSignature: 7,
 *   rangeHexes: 1,
 *   isStealthTarget: false
 * }
 * @returns {object} - Full detection result
 */
export function resolveDetection(scenario) {
  const {
    sensorType,
    sensorDie,
    targetSignature,
    rangeHexes = 0,
    isStealthTarget = false
  } = scenario;
  
  switch (sensorType) {
    case DETECTION_METHOD.THEATER_ISR:
      return resolveTheaterISR(sensorDie, targetSignature);
    
    case DETECTION_METHOD.AEW:
      return resolveAewDetection(sensorDie, rangeHexes, targetSignature, isStealthTarget);
    
    case DETECTION_METHOD.FIGHTER_RADAR:
    case DETECTION_METHOD.SAM_RADAR:
    case DETECTION_METHOD.SHIP_RADAR:
      return resolveLocalDetection(sensorDie, targetSignature, isStealthTarget);
    
    default:
      throw new Error(`Unknown sensor type: ${sensorType}`);
  }
}

/**
 * Check if two units in the same hex are automatically detected
 * (Per rules 8.3.2: Naval and air units detected when in same hex)
 * @param {object} unit1
 * @param {object} unit2
 * @returns {boolean}
 */
export function areSameHexAutoDetected(unit1, unit2) {
  const airTypes = [UNIT_TYPE.FIGHTER, UNIT_TYPE.BOMBER, UNIT_TYPE.AEW, UNIT_TYPE.TANKER, UNIT_TYPE.TRANSPORT];
  const navalTypes = [UNIT_TYPE.SHIP, UNIT_TYPE.SUBMARINE];
  
  const unit1IsAir = airTypes.includes(unit1?.type);
  const unit1IsNaval = navalTypes.includes(unit1?.type);
  const unit2IsAir = airTypes.includes(unit2?.type);
  const unit2IsNaval = navalTypes.includes(unit2?.type);
  
  return (unit1IsAir && unit2IsAir) || (unit1IsNaval && unit2IsNaval);
}

export {
  DETECTION_METHOD,
  UNIT_TYPE,
  SIGNATURE_TYPE
};
