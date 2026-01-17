/**
 * Air Tasking Module
 * Implements OWS Series Rules v2.3 air operations:
 * - Combat radius and fuel source constraints
 * - Tanker support and extended range
 * - Carrier operations and basing
 * - Squadron generation and air mission placement
 */

export const MISSION_TYPE = {
  CAP: 'cap',           // Combat Air Patrol
  OCA: 'oca',           // Offensive Counter Air
  DCA: 'dca',           // Defensive Counter Air
  CAS: 'cas',           // Close Air Support
  STRIKE: 'strike',     // Strike/Attack
  SEAD: 'sead',         // Suppression of Enemy Air Defenses
  INTERDICTION: 'interdiction', // Interdiction
  AEW: 'aew',           // Airborne Early Warning
  TANKER: 'tanker',     // Aerial Refueling
  ASW: 'asw',           // Anti-Submarine Warfare
  TRANSPORT: 'transport' // Air Transport
};

export const FUEL_SOURCE_TYPE = {
  AIRBASE: 'airbase',
  CARRIER: 'carrier',
  TANKER: 'tanker',
  FARP: 'farp'          // Forward Arming and Refueling Point
};

/**
 * Check if an air mission can base at a location
 * @param {object} mission - Air mission { type: 'F-35A', carrier: boolean }
 * @param {object} base - Airbase or carrier
 * @returns {object} - { canBase: boolean, reason: string }
 */
export function canBaseAt(mission, base) {
  // Carrier-only aircraft can only base on carriers
  if (mission.carrierOnly && base.type !== FUEL_SOURCE_TYPE.CARRIER) {
    return {
      canBase: false,
      reason: 'Carrier-capable aircraft only'
    };
  }
  
  // Check base capacity
  if (base.maxAircraft && (base.basedAircraft || 0) >= base.maxAircraft) {
    return {
      canBase: false,
      reason: `Base full (${base.basedAircraft}/${base.maxAircraft})`
    };
  }
  
  return { canBase: true };
}

/**
 * Calculate combat radius for an air mission
 * @param {object} aircraft - Aircraft data { combatRadius: number }
 * @param {object} mission - Mission { type: 'CAP'|'Strike'|etc }
 * @returns {number} - Combat radius in hexes
 */
export function getCombatRadius(aircraft, mission) {
  const radius = aircraft.combatRadius || 3;
  
  // Strike missions use 3x combat radius maximum without tanker
  // CAP missions use 2x combat radius maximum
  const limits = {
    [MISSION_TYPE.STRIKE]: 3,
    [MISSION_TYPE.INTERDICTION]: 3,
    [MISSION_TYPE.CAS]: 2,
    [MISSION_TYPE.OCA]: 2,
    [MISSION_TYPE.DCA]: 2
  };
  
  return radius;
}

/**
 * Get maximum operating range for a mission
 * @param {object} aircraft - Aircraft data
 * @param {string} missionType - Mission type
 * @returns {number} - Max operating range as multiple of combat radius
 */
export function getMaxOperatingRange(aircraft, missionType) {
  const radius = aircraft.combatRadius || 3;
  
  if (missionType === MISSION_TYPE.STRIKE || missionType === MISSION_TYPE.INTERDICTION) {
    return radius * 3; // 3x combat radius without tanker
  }
  
  if ([MISSION_TYPE.CAP, MISSION_TYPE.OCA, MISSION_TYPE.DCA, MISSION_TYPE.CAS].includes(missionType)) {
    return radius * 2; // 2x combat radius
  }
  
  return radius; // Default to combat radius
}

/**
 * Check if a mission location is within combat radius of a fuel source
 * @param {object} mission - Mission { location: { x, y } }
 * @param {object} fuelSource - Airbase/tanker/FARP { location: { x, y } }
 * @param {number} combatRadius - Mission's combat radius
 * @returns {boolean}
 */
export function isWithinCombatRadius(mission, fuelSource, combatRadius) {
  const dx = Math.abs(mission.location.x - fuelSource.location.x);
  const dy = Math.abs(mission.location.y - fuelSource.location.y);
  const distance = (dx + dy + Math.abs(-fuelSource.location.x - fuelSource.location.y + mission.location.x + mission.location.y)) / 2;
  
  return distance <= combatRadius;
}

/**
 * Get fuel sources for an air mission
 * Must trace to a valid fuel source per rule 6.5.2
 * @param {object} mission - Air mission
 * @param {object[]} airbases - Available airbases
 * @param {object[]} carriers - Aircraft carriers
 * @param {object[]} tankers - Tanker aircraft
 * @param {object[]} farps - Forward arming points
 * @returns {object[]} - Array of valid fuel sources
 */
export function getValidFuelSources(mission, airBase, carriers, tankers, farps) {
  const sources = [];
  
  // Check airbases
  for (const ab of (airBase || [])) {
    if (isWithinCombatRadius(mission, ab, mission.combatRadius || 3)) {
      sources.push({
        type: FUEL_SOURCE_TYPE.AIRBASE,
        name: ab.name,
        location: ab.location
      });
    }
  }
  
  // Check carriers (only for carrier-capable aircraft)
  if (mission.carrierCapable) {
    for (const cv of (carriers || [])) {
      if (isWithinCombatRadius(mission, cv, mission.combatRadius || 3)) {
        sources.push({
          type: FUEL_SOURCE_TYPE.CARRIER,
          name: cv.name,
          location: cv.location
        });
      }
    }
  }
  
  // Check tankers
  for (const tanker of (tankers || [])) {
    if (isWithinCombatRadius(mission, tanker, mission.combatRadius || 3)) {
      sources.push({
        type: FUEL_SOURCE_TYPE.TANKER,
        name: tanker.name,
        location: tanker.location,
        supportedAircraft: tanker.supportCapacity || 1
      });
    }
  }
  
  // Check FARPs
  for (const farp of (farps || [])) {
    if (isWithinCombatRadius(mission, farp, mission.combatRadius || 3)) {
      sources.push({
        type: FUEL_SOURCE_TYPE.FARP,
        name: farp.name,
        location: farp.location
      });
    }
  }
  
  return sources;
}

/**
 * Validate that an air mission can legally be placed
 * Must be within combat radius of fuel source and follow all constraints
 * @param {object} mission - Mission to place
 * @param {object} placement - { location: { x, y } }
 * @param {object[]} fuelSources - Available fuel sources
 * @param {object[]} otherMissions - Other placed missions
 * @returns {object} - { valid: boolean, errors: array }
 */
export function validateAirMissionPlacement(mission, placement, fuelSources, otherMissions = []) {
  const errors = [];
  
  // Check fuel source
  const validSources = getValidFuelSources(mission, [], [], [], []);
  if (validSources.length === 0) {
    errors.push('No valid fuel source within combat radius');
  }
  
  // Check stacking (simplified: multiple missions can occupy same hex)
  // In full implementation, would enforce actual stacking limits
  
  return {
    valid: errors.length === 0,
    errors,
    validFuelSources: validSources
  };
}

/**
 * Generate air missions from a carrier
 * Carriers generate 1-4 air missions depending on size/damage
 * @param {object} carrier - Carrier data { steps: 2, maxGenerateCapacity: 3 }
 * @returns {number} - Number of missions it can generate
 */
export function getCarrierAirGenerationCapacity(carrier) {
  const baseCapacity = carrier.maxGenerateCapacity || 3;
  const stepLosses = carrier.stepLosses || 0;
  const reducedCapacity = Math.max(0, baseCapacity - stepLosses);
  
  return reducedCapacity;
}

/**
 * Check if tanker can support an air mission
 * KC-135: supports 2 missions
 * KC-46: supports unlimited (*)
 * KC-130J: supports 1 mission
 * MQ-25: supports 1 mission
 * @param {object} tanker - Tanker data
 * @returns {number} - Support capacity
 */
export function getTankerSupportCapacity(tanker) {
  const capacities = {
    'KC-135': 2,
    'KC-46': Infinity, // Unlimited
    'KC-130J': 1,
    'MQ-25': 1
  };
  
  return capacities[tanker.type] || 1;
}

/**
 * Calculate extended range with tanker support
 * @param {number} baseCombatRadius - Normal combat radius
 * @param {number} tankerCount - Number of tankers supporting
 * @returns {number} - Extended combat radius
 */
export function getExtendedRangeWithTanker(baseCombatRadius, tankerCount) {
  // Each tanker extends range by 1 hex
  return baseCombatRadius + tankerCount;
}

/**
 * Check if aircraft can be loaded with munitions
 * Bombers carry up to 6 salvos
 * Fighters carry up to 2 salvos
 * @param {object} aircraft - Aircraft data
 * @param {number} munitionsSalvos - Number of munition salvos to load
 * @returns {object} - { canLoad: boolean, capacity: number }
 */
export function canLoadMunitions(aircraft, munitionsSalvos) {
  const capacity = aircraft.type?.includes('Bomber') ? 6 : 2;
  
  return {
    canLoad: munitionsSalvos <= capacity,
    capacity,
    requested: munitionsSalvos
  };
}

/**
 * Create a strike package (groups multiple missions together)
 * @param {object[]} strikeAircraft - Strike/SEAD missions
 * @param {object[]} escorts - CAP missions for escort
 * @param {object[]} support - AEW, Tanker support
 * @returns {object} - Strike package object
 */
export function createStrikePackage(strikeAircraft, escorts, support = []) {
  return {
    id: `pkg_${Date.now()}`,
    strikeAircraft,
    escorts,
    support,
    launched: false,
    targetHex: null,
    createdAt: new Date()
  };
}

/**
 * Check if an aircraft is cleared for launch
 * - Must be at airbase/carrier
 * - Must have been assigned a mission
 * - Must have valid munitions if strike/SEAD
 * @param {object} mission - Air mission
 * @returns {object} - { cleared: boolean, issues: array }
 */
export function isClearedForLaunch(mission) {
  const issues = [];
  
  if (!mission.missionType) issues.push('No mission assigned');
  if (!mission.baseLocation) issues.push('Not at airbase/carrier');
  if (mission.stepLosses && mission.stepLosses >= mission.maxSteps) {
    issues.push('Aircraft destroyed');
  }
  
  if ([MISSION_TYPE.STRIKE, MISSION_TYPE.SEAD].includes(mission.missionType)) {
    if (!mission.munitions && !mission.organicStrike) {
      issues.push('No munitions loaded and no organic strike capability');
    }
  }
  
  return {
    cleared: issues.length === 0,
    issues
  };
}

export {
  MISSION_TYPE,
  FUEL_SOURCE_TYPE
};
