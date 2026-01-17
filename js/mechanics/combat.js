/**
 * Combat Resolution Module
 * Implements OWS Series Rules v2.3 combat mechanics:
 * - Hit adjudication and step losses
 * - Red shield (enduring) vs Grey shield (consumable) mechanics
 * - Layered defense (grey shields must be defeated first)
 * - Fire Effects Table for ground unit strikes
 * - Suppression and step loss tracking
 */

import * as diceModule from './dice.js';

// Fire Effects Table outcomes
export const FIRE_EFFECT = {
  NO_EFFECT: 'no_effect',
  SUPPRESSION: 'suppression',
  STEP_LOSS: 'step_loss',
  DESTRUCTION: 'destruction'
};

// Unit health/integrity states
export const UNIT_STATE = {
  INTACT: 'intact',
  STEP_LOSS: 'step_loss',
  SUPPRESSED: 'suppressed',
  DESTROYED: 'destroyed',
  IN_REGENERATION: 'in_regeneration'
};

/**
 * Resolve a single attack against a unit with shields
 * @param {string} attackDie - Attacker's die type
 * @param {number} greyShieldValue - Grey shield defense (0 if no shield)
 * @param {number} redShieldValue - Red shield defense
 * @returns {object} - { hits: number, shieldPenetrated: boolean, rollValue: number }
 */
export function resolveShieldedAttack(attackDie, greyShieldValue, redShieldValue) {
  const rollValue = diceModule.rollDie(attackDie);
  
  // If there's a grey shield, it must be defeated first
  if (greyShieldValue > 0) {
    if (rollValue < greyShieldValue) {
      return {
        hits: 0,
        shieldPenetrated: false,
        greyShieldDefeated: false,
        redShieldHits: 0,
        rollValue,
        description: 'Attack stopped by grey shield'
      };
    }
    // Grey shield penetrated, now check red shield
    const { success, criticalHits } = diceModule.determineSuccess(rollValue, redShieldValue);
    return {
      hits: success ? criticalHits : 0,
      shieldPenetrated: true,
      greyShieldDefeated: true,
      redShieldHits: success ? criticalHits : 0,
      rollValue,
      description: success ? `Penetrated grey shield, ${criticalHits} hit(s) on red shield` : 'Penetrated grey but stopped by red shield'
    };
  }
  
  // No grey shield, just check red
  const { success, criticalHits } = diceModule.determineSuccess(rollValue, redShieldValue);
  return {
    hits: success ? criticalHits : 0,
    shieldPenetrated: true,
    greyShieldDefeated: false,
    redShieldHits: success ? criticalHits : 0,
    rollValue,
    description: success ? `${criticalHits} hit(s)` : 'No effect'
  };
}

/**
 * Apply hits to a unit and determine state change
 * @param {object} unit - Unit with { stepLosses: number, maxSteps: number, suppressed: boolean }
 * @param {number} hitsToApply - Number of hits sustained
 * @returns {object} - { newState: string, stepLossesNow: number, maxSteps: number, destroyed: boolean }
 */
export function applyStepLosses(unit, hitsToApply) {
  if (hitsToApply <= 0) {
    return {
      newState: UNIT_STATE.INTACT,
      stepLossesNow: unit.stepLosses || 0,
      maxSteps: unit.maxSteps || 1,
      destroyed: false
    };
  }
  
  const currentSteps = (unit.maxSteps || 1) - (unit.stepLosses || 0);
  const newStepLosses = (unit.stepLosses || 0) + hitsToApply;
  const remainingSteps = (unit.maxSteps || 1) - newStepLosses;
  
  if (remainingSteps <= 0) {
    return {
      newState: UNIT_STATE.DESTROYED,
      stepLossesNow: unit.maxSteps || 1,
      maxSteps: unit.maxSteps || 1,
      destroyed: true,
      description: `Unit destroyed (${hitsToApply} hits applied, max was ${unit.maxSteps})`
    };
  }
  
  return {
    newState: UNIT_STATE.STEP_LOSS,
    stepLossesNow: newStepLosses,
    maxSteps: unit.maxSteps || 1,
    destroyed: false,
    remainingSteps,
    description: `${hitsToApply} step loss(es) applied. ${remainingSteps} step(s) remaining`
  };
}

/**
 * Fire Effects Table for ground strikes
 * Determines whether a hit results in suppression, step loss, or destruction
 * @param {object} target - Target unit { type: 'infantry'|'mechanized'|'armor', steps: number }
 * @param {number} hits - Number of hits
 * @returns {object} - { effect: string, stepLoss: number, suppression: boolean }
 */
export function resolveFireEffect(target, hits) {
  if (hits <= 0) {
    return { effect: FIRE_EFFECT.NO_EFFECT, stepLoss: 0, suppression: false };
  }
  
  // Simplified GCAT: most units need 2-3 hits for step loss depending on type
  const hitsNeeded = {
    'light_infantry': 1,
    'infantry': 2,
    'mechanized': 3,
    'armor': 3,
    'artillery': 2
  };
  
  const threshold = hitsNeeded[target.type] || 2;
  
  if (hits >= threshold) {
    return {
      effect: FIRE_EFFECT.STEP_LOSS,
      stepLoss: Math.floor(hits / threshold),
      suppression: hits > threshold
    };
  }
  
  // Hits less than threshold = suppression
  return {
    effect: FIRE_EFFECT.SUPPRESSION,
    stepLoss: 0,
    suppression: true
  };
}

/**
 * Resolve a salvo of missiles against a target
 * @param {string[]} missileDice - Array of missile attack dice
 * @param {number} greyShieldValue - Grey shield value (0 if none)
 * @param {number} redShieldValue - Red shield value
 * @returns {object} - { totalHits: number, missiles: array }
 */
export function resolveMissileSalvo(missileDice, greyShieldValue, redShieldValue) {
  const missiles = missileDice.map(die => resolveShieldedAttack(die, greyShieldValue, redShieldValue));
  const totalHits = missiles.reduce((sum, m) => sum + m.hits, 0);
  
  return { totalHits, missiles, greyShieldValue, redShieldValue };
}

/**
 * Air-to-Air combat between two fighters
 * @param {object} attacker - { die: 'd12', defense: 6 }
 * @param {object} defender - { die: 'd10', defense: 5 }
 * @returns {object} - { attackerHits: number, defenderHits: number }
 */
export function resolveAirToAir(attacker, defender) {
  const attackRoll = diceModule.rollDie(attacker.die);
  const defenseRoll = diceModule.rollDie(defender.die);
  
  const attackResult = diceModule.determineSuccess(attackRoll, defender.defense);
  const defenseResult = diceModule.determineSuccess(defenseRoll, attacker.defense);
  
  return {
    attacker: {
      rollValue: attackRoll,
      defense: attacker.defense,
      hits: attackResult.success ? attackResult.criticalHits : 0
    },
    defender: {
      rollValue: defenseRoll,
      defense: defender.defense,
      hits: defenseResult.success ? defenseResult.criticalHits : 0
    },
    simultaneous: true
  };
}

/**
 * SEAD (Suppression of Enemy Air Defenses) attack
 * @param {string} seadAttackDie - SEAD aircraft attack die
 * @param {number} samDefense - SAM's red shield value
 * @param {boolean} ewSupport - Whether EW asset is promoting the attack
 * @returns {object} - { hits: number, samDestroyed: boolean }
 */
export function resolveSead(seadAttackDie, samDefense, ewSupport = false) {
  // EW support promotes the SEAD die by 1
  const finalDie = ewSupport ? diceModule.promoteDie(seadAttackDie) : seadAttackDie;
  const rollValue = diceModule.rollDie(finalDie);
  const { success, criticalHits } = diceModule.determineSuccess(rollValue, samDefense);
  
  return {
    hits: success ? criticalHits : 0,
    rollValue,
    finalDie,
    ewSupport,
    samDefense,
    success,
    samDestroyed: success && criticalHits >= 2
  };
}

/**
 * Apply missile magazine consumption
 * @param {object} unit - Unit with missile magazines
 * @param {number} salvosExpended - Number of salvos fired
 * @returns {object} - Updated unit with consumed salvos marked
 */
export function consumeMissiles(unit, salvosExpended) {
  const updatedUnit = { ...unit };
  
  // Mark missiles as consumed (this would typically be tracked with dry-erase
  // on physical counters, but in digital version we track it)
  updatedUnit.missilesConsumed = (updatedUnit.missilesConsumed || 0) + salvosExpended;
  updatedUnit.missilesRemaining = Math.max(
    0,
    (updatedUnit.missilesTotal || 0) - updatedUnit.missilesConsumed
  );
  
  return updatedUnit;
}

/**
 * Check if grey shields regenerate at end of turn
 * (Units with curved arrow symbol auto-resupply per rule 2.2.2.4)
 * @param {object} unit - Unit data
 * @returns {boolean}
 */
export function hasAutoResupplyCapability(unit) {
  return unit?.autoResupply === true;
}

/**
 * Resolve a contested hex battle
 * Multiple units from both sides in same hex
 * @param {object[]} blueUnits - Array of blue fighters
 * @param {object[]} redUnits - Array of red fighters
 * @param {boolean} usebestDieRule - Whether using "Best Die" rule for sequencing
 * @returns {object} - { blueHits: number, redHits: number, exchanges: array }
 */
export function resolveInHexBattle(blueUnits, redUnits, usebestDieRule = false) {
  const exchanges = [];
  let blueHits = 0;
  let redHits = 0;
  
  // Simplified: each unit rolls once against each opponent
  for (const blueUnit of blueUnits) {
    for (const redUnit of redUnits) {
      const exchange = resolveAirToAir(blueUnit, redUnit);
      blueHits += exchange.attacker.hits;
      redHits += exchange.defender.hits;
      exchanges.push(exchange);
    }
  }
  
  return {
    blueHits,
    redHits,
    exchanges,
    usebestDieRule,
    blueUnitsCount: blueUnits.length,
    redUnitsCount: redUnits.length
  };
}

/**
 * Calculate demotions/promotions for attack missions
 * Strike/Attack aircraft use demoted die in A2A and cannot initiate
 * @param {object} fighter - Fighter data
 * @param {string} mission - Mission type: 'CAP'|'Strike'|'Interdiction'|'CAS'
 * @returns {object} - { baseDie: string, adjustedDie: string, canInitiate: boolean }
 */
export function getAttackMissionModifier(fighter, mission) {
  const attackMissions = ['Strike', 'Interdiction', 'CAS', 'Interdiction', 'SUCAP'];
  const isAttackMission = attackMissions.includes(mission);
  
  return {
    baseDie: fighter.a2aDie,
    adjustedDie: isAttackMission ? diceModule.demoteDie(fighter.a2aDie) : fighter.a2aDie,
    canInitiate: !isAttackMission,
    missionType: mission,
    demotion: isAttackMission ? 1 : 0
  };
}

/**
 * Layered defense (advanced rule): multiple grey shields against salvos
 * @param {number} greyShieldCount - Number of grey shields
 * @param {string[]} missileDice - Missile attack dice
 * @param {number} redShieldValue - Red shield value
 * @returns {object} - Resolution with layered mechanics
 */
export function resolveLayeredShieldDefense(greyShieldCount, missileDice, redShieldValue) {
  const results = [];
  let greyShieldsUsed = 0;
  let totalRedShieldHits = 0;
  
  for (const die of missileDice) {
    const rollValue = diceModule.rollDie(die);
    
    // Determine if this missile needs to penetrate grey shield
    let greyDefeatAttempts = Math.min(greyShieldCount - greyShieldsUsed, 1);
    let penetratedGrey = true;
    
    if (greyDefeatAttempts > 0) {
      // This is a simplified version; full layered rule allows 2 shields per salvo
      greyShieldsUsed += greyDefeatAttempts;
      // Missile must beat grey shield value (assumed 1 for simplicity)
      penetratedGrey = rollValue >= 3;
    }
    
    if (penetratedGrey) {
      const { success, criticalHits } = diceModule.determineSuccess(rollValue, redShieldValue);
      totalRedShieldHits += success ? criticalHits : 0;
    }
    
    results.push({
      die,
      rollValue,
      penetratedGrey,
      redShieldHits: penetratedGrey ? (diceModule.determineSuccess(rollValue, redShieldValue).criticalHits || 0) : 0
    });
  }
  
  return {
    totalRedShieldHits,
    greyShieldsUsed,
    missiles: results
  };
}

export {
  FIRE_EFFECT,
  UNIT_STATE
};
