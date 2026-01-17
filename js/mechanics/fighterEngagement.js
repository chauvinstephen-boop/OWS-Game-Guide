/**
 * Fighter Engagement Module
 * Implements OWS Series Rules v2.3 fighter combat mechanics:
 * - Air-to-Air combat sequencing
 * - Escort priority (escorts 1-to-1 first, then excess vs HVUs)
 * - Attack mission demotions (cannot initiate A2A, demoted die)
 * - Best Die rule for decision sequencing
 */

import * as diceModule from './dice.js';

export const FIGHTER_ROLE = {
  ESCORT: 'escort',
  INTERCEPT: 'intercept',
  PROTECT_HVU: 'protect_hvu'
};

export const HIGH_VALUE_UNIT = [
  'bomber',
  'awacs',
  'tanker',
  'transport',
  'aew'
];

/**
 * Classify units by their priority in combat
 * @param {object[]} friendlyFighters - All friendly fighters
 * @returns {object} - { escortFighters, excessFighters }
 */
export function classifyDefenders(friendlyFighters) {
  const escorts = friendlyFighters.filter(f => f.role === FIGHTER_ROLE.ESCORT);
  const interceptors = friendlyFighters.filter(f => f.role === FIGHTER_ROLE.INTERCEPT);
  const protectors = friendlyFighters.filter(f => f.role === FIGHTER_ROLE.PROTECT_HVU);
  
  return {
    escorts: escorts.length,
    interceptors: interceptors.length,
    protectors: protectors.length,
    all: friendlyFighters.length
  };
}

/**
 * Determine engagement priority for in-hex air combat
 * Rule: Escorts must be matched 1-to-1 first
 * Excess defenders then engage high-value targets (HVUs)
 * @param {object[]} defendingFighters - Defending fighters
 * @param {object[]} attackingEscorts - Attacking escort fighters
 * @param {object[]} attackingStrike - Attacking strike/HVU aircraft
 * @returns {object} - Engagement pairs and remaining units
 */
export function resolveEscortPriority(defendingFighters, attackingEscorts, attackingStrike) {
  const engagements = {
    escortMatches: [], // 1-to-1 escort vs escort
    excessVsHVU: [],   // Excess defenders vs strike/HVU
    unengaged: {
      defending: [],
      attacking: []
    }
  };
  
  // Match escorts 1-to-1
  const matchCount = Math.min(defendingFighters.length, attackingEscorts.length);
  for (let i = 0; i < matchCount; i++) {
    engagements.escortMatches.push({
      defender: defendingFighters[i],
      attacker: attackingEscorts[i]
    });
  }
  
  // Remaining defenders vs attacking strike
  const remainingDefenders = defendingFighters.slice(matchCount);
  const matchCount2 = Math.min(remainingDefenders.length, attackingStrike.length);
  
  for (let i = 0; i < matchCount2; i++) {
    engagements.excessVsHVU.push({
      defender: remainingDefenders[i],
      attacker: attackingStrike[i]
    });
  }
  
  // Unengaged units
  engagements.unengaged.defending = remainingDefenders.slice(matchCount2);
  engagements.unengaged.attacking = [
    ...attackingEscorts.slice(matchCount),
    ...attackingStrike.slice(matchCount2)
  ];
  
  return engagements;
}

/**
 * Check if a fighter can initiate air-to-air combat
 * Attack-mission fighters (Strike, Interdiction, CAS) cannot initiate A2A
 * They can only defend if attacked
 * @param {object} fighter - Fighter data
 * @returns {boolean}
 */
export function canInitiateAirToAir(fighter) {
  const attackMissions = ['strike', 'interdiction', 'cas', 'sucap'];
  
  // If no mission assigned, can initiate
  if (!fighter.mission) return true;
  
  // Attack mission fighters cannot initiate
  return !attackMissions.includes(fighter.mission.toLowerCase());
}

/**
 * Get A2A combat die for a fighter
 * Attack-mission fighters use demoted die (one step)
 * @param {object} fighter - Fighter data with { a2aDie: 'd12' }
 * @returns {object} - { die: string, baseDie: string, demoted: boolean }
 */
export function getA2ACombatDie(fighter) {
  const baseDie = fighter.a2aDie || 'd10';
  const isAttackMission = !canInitiateAirToAir(fighter);
  
  if (isAttackMission) {
    const demotedDie = diceModule.demoteDie(baseDie);
    return {
      die: demotedDie,
      baseDie,
      demoted: true,
      reason: `${fighter.mission} mission fighter uses demoted A2A die`
    };
  }
  
  return {
    die: baseDie,
    baseDie,
    demoted: false
  };
}

/**
 * Resolve a single A2A engagement
 * Simultaneous rolls per rules 6.A.4
 * @param {object} attacker - Attacking fighter
 * @param {object} defender - Defending fighter
 * @param {object} options - { useAttackerDie: true, useDefenderDie: true }
 * @returns {object} - Combat result
 */
export function resolveAirToAirEngagement(attacker, defender, options = {}) {
  const attackDieData = getA2ACombatDie(attacker);
  const defenseDieData = getA2ACombatDie(defender);
  
  const attackDie = options.useAttackerDie === false ? 'd0' : attackDieData.die;
  const defenseDie = options.useDefenderDie === false ? 'd0' : defenseDieData.die;
  
  const attackRoll = diceModule.rollDie(attackDie);
  const defenseRoll = diceModule.rollDie(defenseDie);
  
  const attackResult = diceModule.determineSuccess(attackRoll, defender.a2aDefense || 5);
  const defenseResult = diceModule.determineSuccess(defenseRoll, attacker.a2aDefense || 5);
  
  return {
    exchange: {
      attacker: {
        name: attacker.id,
        missionType: attacker.mission,
        die: attackDieData.die,
        roll: attackRoll,
        hits: attackResult.success ? attackResult.criticalHits : 0
      },
      defender: {
        name: defender.id,
        missionType: defender.mission,
        die: defenseDieData.die,
        roll: defenseRoll,
        hits: defenseResult.success ? defenseResult.criticalHits : 0
      }
    },
    simultaneous: true
  };
}

/**
 * Sequence air-to-air battles using Best Die rule
 * Higher die initiates first choice; sequentially alternate
 * @param {object[]} blueAircraft - Blue fighters
 * @param {object[]} redAircraft - Red fighters
 * @returns {object} - Sequence order
 */
export function bestDieSequence(blueAircraft, redAircraft) {
  // Roll one die per side
  const blueRoll = diceModule.rollDie('d10');
  const redRoll = diceModule.rollDie('d10');
  
  let initiative;
  if (blueRoll > redRoll) {
    initiative = 'blue';
  } else if (redRoll > blueRoll) {
    initiative = 'red';
  } else {
    initiative = 'tied'; // Reroll or simultaneous
  }
  
  return {
    blueRoll,
    redRoll,
    initiative,
    blueActsFirst: initiative === 'blue'
  };
}

/**
 * Determine how fighters are matched for I-GO-U-GO combat
 * @param {object} initiativeData - { initiativeTeam, otherTeam }
 * @param {object[]} initiativeFighters - Initiative side's fighters
 * @param {object[]} otherFighters - Other side's fighters
 * @returns {object} - Detailed matching for sequential resolution
 */
export function igoUgoSequence(initiativeData, initiativeFighters, otherFighters) {
  // Initiative player picks matchups first
  const matchups = [];
  
  // Simplified: match available pairs
  const pairs = Math.min(initiativeFighters.length, otherFighters.length);
  for (let i = 0; i < pairs; i++) {
    matchups.push({
      initiative: initiativeFighters[i],
      other: otherFighters[i],
      sequenceNumber: i + 1
    });
  }
  
  return {
    matchups,
    initiative: initiativeData.initiativeTeam,
    firstToAct: initiativeData.initiativeTeam
  };
}

/**
 * Resolve full in-hex fighter battle
 * Priority: Escorts first (1-to-1), then excess vs HVUs
 * @param {object[]} defendingFighters
 * @param {object[]} attackingEscorts
 * @param {object[]} attackingStrike
 * @param {object} options - { useSequencing: 'bestdie'|'igougo'|'simultaneous' }
 * @returns {object} - Full battle resolution
 */
export function resolveInHexFighterBattle(
  defendingFighters,
  attackingEscorts,
  attackingStrike,
  options = {}
) {
  const sequencing = options.useSequencing || 'simultaneous';
  
  // Classify engagements by priority
  const priority = resolveEscortPriority(defendingFighters, attackingEscorts, attackingStrike);
  
  const results = {
    escortMatches: [],
    hvuDefense: [],
    unengaged: priority.unengaged,
    totalBlueHits: 0,
    totalRedHits: 0
  };
  
  // Resolve escort vs escort first
  for (const match of priority.escortMatches) {
    const engagement = resolveAirToAirEngagement(match.attacker, match.defender);
    results.escortMatches.push(engagement);
    results.totalBlueHits += engagement.exchange.attacker.hits;
    results.totalRedHits += engagement.exchange.defender.hits;
  }
  
  // Then excess defenders vs HVUs
  for (const match of priority.excessVsHVU) {
    const engagement = resolveAirToAirEngagement(match.attacker, match.defender);
    results.hvuDefense.push(engagement);
    results.totalBlueHits += engagement.exchange.attacker.hits;
    results.totalRedHits += engagement.exchange.defender.hits;
  }
  
  return results;
}

/**
 * Check if a fighter should defend against attack
 * All fighters defend if attacked, but attack-mission fighters use demoted die
 * @param {object} fighter - Fighter being engaged
 * @returns {boolean}
 */
export function mustDefendWhenEngaged(fighter) {
  // All fighters must defend when engaged
  return true;
}

/**
 * Identify high-value units (HVU) in hex
 * Bombers, AWACS, Tankers, Transports, AEW
 * @param {object[]} aircraft
 * @returns {object[]} - HVU aircraft
 */
export function identifyHVU(aircraft) {
  const hvuTypes = HIGH_VALUE_UNIT;
  return aircraft.filter(a => {
    const type = a.type || a.platform || '';
    return hvuTypes.some(hvu => type.toLowerCase().includes(hvu));
  });
}

/**
 * Calculate whether air superiority is achieved
 * Simplified: side with more surviving fighters has local air superiority
 * @param {number} blueSurviving - Blue fighter count
 * @param {number} redSurviving - Red fighter count
 * @returns {object} - { superiority: 'blue'|'red'|'contested', margin: number }
 */
export function determineAirSuperiority(blueSurviving, redSurviving) {
  const margin = Math.abs(blueSurviving - redSurviving);
  
  if (blueSurviving > redSurviving * 1.5) {
    return { superiority: 'blue', margin };
  } else if (redSurviving > blueSurviving * 1.5) {
    return { superiority: 'red', margin };
  }
  
  return { superiority: 'contested', margin: 0 };
}

export {
  FIGHTER_ROLE,
  HIGH_VALUE_UNIT
};
