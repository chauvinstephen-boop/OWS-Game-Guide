/**
 * IO/Cyber Adjudication Module
 * Implements OWS Series Rules v2.3 information operations:
 * - Disrupt C2 token adjudication
 * - Assure C2 defensive capability
 * - SIGINT/EMSO token effects
 * - Active/Passive Countermeasures
 * - Cyber attack resolution
 */

import * as diceModule from './dice.js';

export const IO_TOKEN_TYPE = {
  DISRUPT_C2: 'disrupt_c2',
  ASSURE_C2: 'assure_c2',
  SIGINT_EMSO: 'sigint_emso',
  ACTIVE_CM: 'active_countermeasures',
  PASSIVE_CM: 'passive_countermeasures'
};

export const IO_TARGET = {
  HQ: 'hq',
  SHIP: 'ship',
  ARTILLERY: 'artillery',
  SAM: 'sam',
  AIR_MISSION: 'air_mission',
  SPACE_C2: 'space_c2',
  SPACE_ISR: 'space_isr',
  SPACE_PNT: 'space_pnt'
};

/**
 * Place an IO token on the map
 * Tokens are placed face-down and revealed when needed
 * @param {string} tokenType - Type of IO token
 * @param {object} target - Target unit { id, type, location }
 * @returns {object} - IO token object
 */
export function placeIOToken(tokenType, target) {
  return {
    id: `io_${Date.now()}`,
    type: tokenType,
    target,
    placed: new Date(),
    revealed: false,
    faceDown: true
  };
}

/**
 * Adjudicate Disrupt C2 against a target
 * Disrupt C2 has an attack die
 * Assure C2 provides defensive layer (grey shield)
 * Must defeat grey shield (Assure C2) then red shield (target's defense)
 * @param {string} disruptDie - Disrupt C2 attack die
 * @param {number} targetDefense - Target's red shield
 * @param {boolean} hasAssureC2 - Whether Assured C2 is defending
 * @param {number} assureCDefense - Assure C2's grey shield value
 * @returns {object} - Adjudication result
 */
export function adjudicateDisruptC2(
  disruptDie,
  targetDefense,
  hasAssureC2 = false,
  assureCDefense = 6
) {
  const rollValue = diceModule.rollDie(disruptDie);
  
  // If Assured C2 present, must defeat it first
  if (hasAssureC2) {
    if (rollValue < assureCDefense) {
      return {
        success: false,
        disruptedSuccess: false,
        blockedBy: 'assure_c2',
        rollValue,
        description: 'Disrupt C2 blocked by Assure C2'
      };
    }
    
    // Assure C2 defeated, now check against target red shield
    const { success, criticalHits } = diceModule.determineSuccess(rollValue, targetDefense);
    return {
      success: success,
      disruptedSuccess: success,
      penetratedAssure: true,
      rollValue,
      targetDefense,
      description: success ? 'Target disrupted' : 'Assure C2 defeated but target resisted'
    };
  }
  
  // No Assure C2, check directly against target
  const { success, criticalHits } = diceModule.determineSuccess(rollValue, targetDefense);
  return {
    success,
    disruptedSuccess: success,
    rollValue,
    targetDefense,
    description: success ? 'Target disrupted' : 'Disrupt C2 ineffective'
  };
}

/**
 * Apply Disrupt C2 effects to a unit
 * Effects vary by unit type
 * @param {object} target - Target unit
 * @param {boolean} disruptSuccess - Whether Disrupt C2 succeeded
 * @returns {object} - Effects applied to unit
 */
export function applyDisruptEffect(target, disruptSuccess) {
  if (!disruptSuccess) {
    return { disrupted: false };
  }
  
  const effects = {
    hq: {
      disrupted: true,
      canGenerateIOTokens: false,
      canDesignateMainEffort: false,
      effect: 'HQ cannot generate IO tokens or Main Effort'
    },
    ship: {
      disrupted: true,
      canFire: false,
      effect: 'Ship cannot fire'
    },
    artillery: {
      disrupted: true,
      canFire: false,
      effect: 'Artillery cannot fire'
    },
    sam: {
      disrupted: true,
      canFire: false,
      effect: 'Air defense cannot fire'
    },
    air_mission: {
      disrupted: true,
      attackDieDemotion: 1,
      effect: 'Aircraft attack die demoted'
    },
    space: {
      disrupted: true,
      demoted: true,
      effect: 'Space function demoted'
    }
  };
  
  return effects[target.type] || { disrupted: true, effect: 'General disruption' };
}

/**
 * Resolve SIGINT/EMSO token effect
 * Promotes detections and attacks against targeted unit
 * Can be countered by Active/Passive Countermeasures
 * @param {object} target - Target unit
 * @param {boolean} hasCountermeasures - Whether unit has Active/Passive CM
 * @returns {object} - Effect result
 */
export function resolveSigintEmso(target, hasCountermeasures = false) {
  if (hasCountermeasures) {
    return {
      sigintActive: true,
      neutralized: true,
      by: 'countermeasures',
      description: 'SIGINT/EMSO canceled out by Active/Passive CM'
    };
  }
  
  return {
    sigintActive: true,
    neutralized: false,
    promotions: {
      detection: 1,
      strikes: 1
    },
    description: 'All detections and attacks vs target promoted by 1 die'
  };
}

/**
 * Resolve Active/Passive Countermeasures
 * Defensive IO capability
 * Demotes detection and strike rolls
 * First strike hit is absorbed by CM token
 * @param {object} target - Target with CM
 * @param {object} attack - Attack data { type: 'detection'|'strike'|'combat' }
 * @returns {object} - CM effect
 */
export function resolveCountermeasures(target, attack) {
  const cmActive = target.activeCM || target.passiveCM;
  
  if (!cmActive) {
    return { cmActive: false };
  }
  
  if (attack.type === 'strike') {
    return {
      cmActive: true,
      absorbsHit: true,
      firstHitAbsorbed: true,
      description: 'CM absorbs first hit; token removed'
    };
  }
  
  // For detection and combat, apply demotion
  return {
    cmActive: true,
    demotion: 1,
    description: 'Detection and combat rolls against this unit demoted by 1'
  };
}

/**
 * Adjudicate all IO tokens placed on map
 * Both teams place simultaneously, then adjudicate
 * @param {object[]} blueTokens - Blue IO tokens
 * @param {object[]} redTokens - Red IO tokens
 * @param {object} targets - All targetable units on map
 * @returns {object} - Adjudication results
 */
export function adjudicateIOTokens(blueTokens, redTokens, targets) {
  const results = {
    blueEffects: [],
    redEffects: [],
    disruptions: [],
    defenses: [],
    other: []
  };
  
  // Process red's Disrupt C2 vs blue targets
  for (const token of redTokens) {
    if (token.type !== IO_TOKEN_TYPE.DISRUPT_C2) continue;
    
    const target = targets[token.target.id];
    const assureDefense = blueTokens.find(t => 
      t.type === IO_TOKEN_TYPE.ASSURE_C2 && t.target.id === token.target.id
    );
    
    const result = adjudicateDisruptC2(
      'd8',
      target?.defense || 6,
      !!assureDefense,
      assureDefense?.defense || 6
    );
    
    results.disruptions.push({
      token,
      target: token.target.id,
      result
    });
  }
  
  // Process blue's Disrupt C2 vs red targets
  for (const token of blueTokens) {
    if (token.type !== IO_TOKEN_TYPE.DISRUPT_C2) continue;
    
    const target = targets[token.target.id];
    const assureDefense = redTokens.find(t =>
      t.type === IO_TOKEN_TYPE.ASSURE_C2 && t.target.id === token.target.id
    );
    
    const result = adjudicateDisruptC2(
      'd8',
      target?.defense || 6,
      !!assureDefense,
      assureDefense?.defense || 6
    );
    
    results.disruptions.push({
      token,
      target: token.target.id,
      result
    });
  }
  
  return results;
}

/**
 * Reset IO tokens at end of turn
 * Offensive tokens removed; Defensive tokens remain
 * @param {object[]} activeTokens - Currently placed tokens
 * @returns {object} - { remaining: array, removed: array }
 */
export function resetIOTokens(activeTokens) {
  const remaining = [];
  const removed = [];
  
  const defensiveTokens = [
    IO_TOKEN_TYPE.ASSURE_C2,
    IO_TOKEN_TYPE.ACTIVE_CM,
    IO_TOKEN_TYPE.PASSIVE_CM
  ];
  
  for (const token of activeTokens) {
    if (defensiveTokens.includes(token.type)) {
      remaining.push(token);
    } else {
      removed.push(token);
    }
  }
  
  return { remaining, removed };
}

/**
 * Check which targets are affected by IO effects
 * @param {object} unit - Unit to check
 * @param {object[]} activeTokens - Active IO tokens
 * @returns {object} - Effects on unit
 */
export function getUnitIOStatus(unit, activeTokens) {
  const effects = {
    disrupted: false,
    sigintEmso: false,
    countermeasures: false,
    tokens: []
  };
  
  for (const token of activeTokens) {
    if (token.target.id !== unit.id) continue;
    
    effects.tokens.push(token);
    
    if (token.type === IO_TOKEN_TYPE.DISRUPT_C2) {
      effects.disrupted = true;
    }
    if (token.type === IO_TOKEN_TYPE.SIGINT_EMSO) {
      effects.sigintEmso = true;
    }
    if ([IO_TOKEN_TYPE.ACTIVE_CM, IO_TOKEN_TYPE.PASSIVE_CM].includes(token.type)) {
      effects.countermeasures = true;
    }
  }
  
  return effects;
}

/**
 * Get modifier for a unit's attack based on IO effects
 * SIGINT/EMSO promotes (detection and strikes)
 * Countermeasures demote (but applied to defender)
 * @param {object} attacker - Attacking unit
 * @param {object} defender - Defending unit
 * @param {object[]} ioTokens - Active IO tokens
 * @returns {object} - { netModifier: number, details: array }
 */
export function getIOModifier(attacker, defender, ioTokens) {
  let netModifier = 0;
  const details = [];
  
  // Check if attacker has SIGINT/EMSO support
  const sigintToken = ioTokens.find(t =>
    t.type === IO_TOKEN_TYPE.SIGINT_EMSO && t.target.id === attacker.id
  );
  
  if (sigintToken) {
    netModifier += 1;
    details.push('Attacker has SIGINT/EMSO: +1 promotion');
  }
  
  // Check if defender has CM
  const cmToken = ioTokens.find(t =>
    [IO_TOKEN_TYPE.ACTIVE_CM, IO_TOKEN_TYPE.PASSIVE_CM].includes(t.type) &&
    t.target.id === defender.id
  );
  
  if (cmToken) {
    netModifier -= 1;
    details.push('Defender has Countermeasures: -1 demotion');
  }
  
  return { netModifier, details };
}

export {
  IO_TOKEN_TYPE,
  IO_TARGET
};
