/**
 * Strike Package Module
 * Implements OWS Series Rules v2.3 strike mechanics:
 * - Munitions loading (fighters carry 2, bombers carry 6)
 * - Strike package formation and sequencing
 * - SEAD mechanics and escort priorities
 */

import * as diceModule from './dice.js';

export const MUNITION_TYPE = {
  AIR_TO_AIR: 'air_to_air',
  AIR_TO_GROUND: 'air_to_ground',
  ANTI_SHIP: 'anti_ship',
  CRUISE_MISSILE: 'cruise_missile',
  BALLISTIC_MISSILE: 'ballistic_missile',
  JASSM: 'jassm',
  JASSM_ER: 'jassm_er',
  HARPOON: 'harpoon'
};

export const MUNITION_RANGE = {
  SHORT: 1,
  MEDIUM: 2,
  LONG: 3,
  STANDOFF: 4
};

/**
 * Create a munitions counter
 * @param {object} config - { type, range, quantity, strikeValue }
 * @returns {object}
 */
export function createMunitionsCounter(config) {
  return {
    id: `mun_${Date.now()}`,
    type: config.type,
    range: config.range || MUNITION_RANGE.MEDIUM,
    quantity: config.quantity || 1,
    strikeValue: config.strikeValue || 'd8',
    launched: false,
    ...config
  };
}

/**
 * Load munitions onto an aircraft
 * Fighters can carry 2 salvos, bombers can carry 6
 * @param {object} aircraft - Aircraft to load
 * @param {object[]} munitions - Munitions to load
 * @returns {object} - Updated aircraft or error
 */
export function loadMunitions(aircraft, munitions) {
  const maxCapacity = aircraft.type?.includes('Bomber') ? 6 : 2;
  
  if (munitions.length > maxCapacity) {
    return {
      success: false,
      error: `Cannot load ${munitions.length} salvos on ${aircraft.type}. Capacity: ${maxCapacity}`
    };
  }
  
  // Fighter in strike mission uses organic attack OR munitions, not both
  if (!aircraft.type?.includes('Bomber') && aircraft.missionType === 'strike') {
    return {
      success: true,
      aircraft: {
        ...aircraft,
        munitions: munitions,
        useOrganic: false
      }
    };
  }
  
  return {
    success: true,
    aircraft: {
      ...aircraft,
      munitions: munitions
    }
  };
}

/**
 * Check if an aircraft can carry a specific munition
 * @param {object} aircraft - Aircraft data
 * @param {object} munition - Munition data
 * @returns {boolean}
 */
export function canCarryMunition(aircraft, munition) {
  const carriableTypes = aircraft.carriesWeapons || [];
  
  // All aircraft can carry their standard munitions
  if (!munition.type) return true;
  
  // Check if specific weapon is carried
  return carriableTypes.includes(munition.type) || true; // Simplified: allow all for now
}

/**
 * Calculate range ring for a strike
 * @param {object} strikeAircraft - Aircraft performing strike
 * @param {number} targetHexDistance - Distance to target in hexes
 * @returns {object} - { canReach: boolean, range: number, dieModifier: 0 }
 */
export function canReachTarget(strikeAircraft, targetHexDistance) {
  let maxRange = strikeAircraft.combatRadius || 3;
  
  // Munitions may have extended range
  if (strikeAircraft.munitions && strikeAircraft.munitions.length > 0) {
    maxRange = Math.max(maxRange, strikeAircraft.munitions[0].range || 3);
  }
  
  // Standoff munitions like JASSM-ER have very long range
  if (strikeAircraft.munitions?.some(m => m.type === 'jassm_er')) {
    maxRange = 5;
  }
  
  return {
    canReach: targetHexDistance <= maxRange,
    range: targetHexDistance,
    maxRange,
    strikeDistance: targetHexDistance
  };
}

/**
 * Launch a strike from an aircraft
 * @param {object} aircraft - Aircraft launching
 * @param {object} target - Target hex { x, y }
 * @param {string} targetType - 'SAM'|'ASP'|'Airfield'|etc
 * @returns {object} - Strike launch result
 */
export function launchStrike(aircraft, target, targetType) {
  // Determine attack die
  let strikeDie;
  if (aircraft.munitions && aircraft.munitions.length > 0) {
    strikeDie = aircraft.munitions[0].strikeValue || aircraft.organicStrike || 'd8';
  } else {
    strikeDie = aircraft.organicStrike || 'd8';
  }
  
  return {
    id: `strike_${Date.now()}`,
    aircraft: aircraft.id,
    target,
    targetType,
    strikeDie,
    launched: true,
    timestamp: new Date()
  };
}

/**
 * Resolve a strike attempt
 * @param {string} strikeDie - Strike attack die
 * @param {number} targetDefense - Target's red shield
 * @param {number} greyShieldValue - Grey shield (0 if none)
 * @param {boolean} seadSupport - Whether SEAD is supporting (promotes die)
 * @param {boolean} ewSupport - Whether EW is promoting
 * @returns {object} - Strike result
 */
export function resolveStrike(strikeDie, targetDefense, greyShieldValue = 0, seadSupport = false, ewSupport = false) {
  // SEAD promotes strike die
  let finalDie = strikeDie;
  if (seadSupport) {
    finalDie = diceModule.promoteDie(finalDie);
  }
  if (ewSupport) {
    finalDie = diceModule.promoteDie(finalDie);
  }
  
  const rollValue = diceModule.rollDie(finalDie);
  
  // Check grey shield first if present
  let hitGrey = false;
  if (greyShieldValue > 0) {
    if (rollValue >= greyShieldValue) {
      hitGrey = true;
    } else {
      return {
        hits: 0,
        rollValue,
        finalDie,
        blocked: 'grey shield',
        success: false
      };
    }
  }
  
  // Check red shield
  const { success, criticalHits } = diceModule.determineSuccess(rollValue, targetDefense);
  
  return {
    hits: success ? criticalHits : 0,
    rollValue,
    finalDie,
    hitGrey,
    redShieldHits: success ? criticalHits : 0,
    success,
    seadSupport,
    ewSupport
  };
}

/**
 * Resolve SEAD attack against SAM/Air Defense
 * @param {object} seadAircraft - SEAD aircraft { seadDie: 'd10' }
 * @param {object} target - SAM/AD unit { defense: 5 }
 * @param {boolean} ewSupport - Whether EW is supporting
 * @returns {object} - SEAD result
 */
export function resolveSead(seadAircraft, target, ewSupport = false) {
  let seadDie = seadAircraft.seadDie || 'd10';
  
  if (ewSupport) {
    seadDie = diceModule.promoteDie(seadDie);
  }
  
  const rollValue = diceModule.rollDie(seadDie);
  const { success, criticalHits } = diceModule.determineSuccess(rollValue, target.defense);
  
  return {
    hits: success ? criticalHits : 0,
    rollValue,
    seadDie,
    targetDefense: target.defense,
    ewSupport,
    success,
    samSuppressed: success,
    samDestroyed: success && criticalHits >= 2
  };
}

/**
 * Build and validate a strike package
 * @param {object} config - { strikeAircraft, escorts, sead, ew, tanker, target }
 * @returns {object} - Package validation result
 */
export function buildStrikePackage(config) {
  const errors = [];
  
  // Check strike aircraft
  if (!config.strikeAircraft || config.strikeAircraft.length === 0) {
    errors.push('No strike aircraft assigned');
  }
  
  // Check escorts (not required but recommended)
  if (config.strikeAircraft?.length > 0 && (!config.escorts || config.escorts.length === 0)) {
    // This is a warning, not an error
  }
  
  // Check SEAD (required if SAM threat present)
  if (config.targetType === 'SAM' && (!config.sead || config.sead.length === 0)) {
    // Warning: SEAD recommended against SAM
  }
  
  // Check munitions are loaded
  for (const aircraft of (config.strikeAircraft || [])) {
    if (!aircraft.munitions && !aircraft.organicStrike) {
      errors.push(`${aircraft.id} has no munitions loaded and no organic strike`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    package: {
      strikeAircraft: config.strikeAircraft,
      escorts: config.escorts || [],
      sead: config.sead || [],
      ew: config.ew,
      tanker: config.tanker,
      target: config.target,
      id: `pkg_${Date.now()}`
    }
  };
}

/**
 * Determine escort priority
 * All escort fighters must be matched 1-to-1 before excess can engage HVUs
 * @param {number} escortCount - Number of escort fighters
 * @param {number} attackerFighterCount - Number of attacking fighters
 * @returns {object} - { escortsNeeded: number, excessDefense: number }
 */
export function calculateEscortPriority(escortCount, attackerFighterCount) {
  const escortsNeeded = Math.min(escortCount, attackerFighterCount);
  const excessDefense = Math.max(0, escortCount - attackerFighterCount);
  
  return {
    escortsNeeded,
    excessDefense,
    allEscortsEngaged: escortCount <= attackerFighterCount
  };
}

/**
 * Check if SEAD is in range of SAM
 * SEAD at true standoff can strike without entering SAM envelope
 * @param {object} seadMission - SEAD aircraft
 * @param {object} samLocation - SAM location
 * @returns {object} - { inRange: boolean, standoff: boolean }
 */
export function isSeadInRange(seadMission, samLocation) {
  const distance = calculateDistance(seadMission.location, samLocation);
  const seadRange = seadMission.seadRange || 2;
  const samEnvelope = seadMission.targetSam?.envelope || 1;
  
  return {
    inRange: distance <= seadRange,
    standoff: distance > samEnvelope,
    distance,
    seadRange,
    samEnvelope
  };
}

/**
 * Helper to calculate hex distance
 */
function calculateDistance(loc1, loc2) {
  const dx = Math.abs(loc2.x - loc1.x);
  const dy = Math.abs(loc2.y - loc1.y);
  return (dx + dy + Math.abs(-loc2.x - loc2.y + loc1.x + loc1.y)) / 2;
}

/**
 * Determine if munitions are interceptable
 * Cruise missiles can be intercepted by CAP
 * Ballistic/Hypersonic cannot be intercepted
 * @param {object} munition - Munition data
 * @returns {boolean}
 */
export function isInterceptable(munition) {
  return !['ballistic_missile', 'hypersonic', 'SRBM', 'MRBM', 'IRBM'].includes(munition.type);
}

export {
  MUNITION_TYPE,
  MUNITION_RANGE
};
