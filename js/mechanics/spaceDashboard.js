/**
 * Space Capability Dashboard Module
 * Implements OWS Series Rules v2.3 space-based capabilities:
 * - C2 Satellite Constellation (determines long-range strike actions)
 * - Position, Navigation, and Timing (PNT) constellation
 * - Theater ISR Satellite Constellation (detection capability)
 * - Disruption and recovery mechanics
 */

// Space dashboard tracks
export const SPACE_TRACK = {
  C2: 'c2',
  PNT: 'pnt',
  ISR: 'isr'
};

// States for space capabilities
export const SPACE_STATE = {
  NOMINAL: 'nominal',
  DEGRADED: 'degraded',
  DISRUPTED: 'disrupted'
};

/**
 * Space Capability Dashboard state
 */
export const createSpaceDashboard = () => ({
  // C2 Track: Number of long-range strike actions available per turn
  c2: {
    state: SPACE_STATE.NOMINAL,
    value: 3, // Default value, varies by scenario
    disruptionTokens: 0,
    maxValue: 5
  },
  
  // PNT Track: Position, Navigation, Timing constellation
  pnt: {
    state: SPACE_STATE.NOMINAL,
    disruptionTokens: 0,
    // In disrupted state, long-range strikes beyond 1 hex are demoted
    demotesLongRangeStrikes: false
  },
  
  // ISR Track: Theater ISR capability
  isr: {
    state: SPACE_STATE.NOMINAL,
    detectionDie: 'd10', // Base die for ISR attempts
    isrPawns: 3, // Number of ISR pawns available
    disruptionTokens: 0,
    // Can target either die level (detectionDie) or pawn count
    disruptionTarget: null // 'die'|'pawns'|null
  }
});

/**
 * Get current C2 strike action limit
 * @param {object} dashboard - Space dashboard
 * @returns {number} - Number of long-range strike actions available
 */
export function getC2StrikeActions(dashboard) {
  return dashboard.c2.value - dashboard.c2.disruptionTokens;
}

/**
 * Apply Disrupt C2 token
 * @param {object} dashboard - Space dashboard
 * @param {number} tokens - Number of Disrupt C2 tokens applied
 * @returns {object} - Updated dashboard
 */
export function applyDisruptC2(dashboard, tokens = 1) {
  const updated = JSON.parse(JSON.stringify(dashboard)); // Deep copy
  updated.c2.disruptionTokens += tokens;
  
  if (updated.c2.disruptionTokens > 0) {
    updated.c2.state = SPACE_STATE.DISRUPTED;
  }
  
  return updated;
}

/**
 * Check if PNT is disrupted
 * Disrupted PNT demotes all long-range strikes beyond 1 hex
 * @param {object} dashboard - Space dashboard
 * @returns {boolean}
 */
export function isPntDisrupted(dashboard) {
  return dashboard.pnt.disruptionTokens > 0;
}

/**
 * Apply Disrupt C2 to PNT constellation
 * @param {object} dashboard - Space dashboard
 * @returns {object} - Updated dashboard with PNT disrupted
 */
export function applyDisruptPnt(dashboard) {
  const updated = JSON.parse(JSON.stringify(dashboard));
  updated.pnt.state = SPACE_STATE.DISRUPTED;
  updated.pnt.disruptionTokens += 1;
  updated.pnt.demotesLongRangeStrikes = true;
  
  return updated;
}

/**
 * Get ISR detection die based on disruption
 * @param {object} dashboard - Space dashboard
 * @returns {string} - Die type for ISR attempts
 */
export function getIsrDetectionDie(dashboard) {
  return dashboard.isr.detectionDie;
}

/**
 * Get number of ISR pawns available
 * Can be reduced by Disrupt C2 targeting the pawn count
 * @param {object} dashboard - Space dashboard
 * @returns {number} - Available ISR pawns
 */
export function getIsrPawnCount(dashboard) {
  if (dashboard.isr.disruptionTarget === 'pawns') {
    // Each disruption token reduces pawn count
    return Math.max(1, dashboard.isr.isrPawns - dashboard.isr.disruptionTokens);
  }
  return dashboard.isr.isrPawns;
}

/**
 * Apply Disrupt C2 targeting ISR capability
 * Can target either the detection die level OR the pawn count
 * @param {object} dashboard - Space dashboard
 * @param {string} target - 'die'|'pawns'
 * @returns {object} - Updated dashboard
 */
export function applyDisruptISR(dashboard, target = 'die') {
  const updated = JSON.parse(JSON.stringify(dashboard));
  
  if (target === 'die') {
    // Demote the ISR detection die
    updated.isr.detectionDie = demoteDie(updated.isr.detectionDie);
    updated.isr.disruptionTarget = 'die';
  } else if (target === 'pawns') {
    // Reduce pawn count
    updated.isr.disruptionTokens += 1;
    updated.isr.disruptionTarget = 'pawns';
  }
  
  if (updated.isr.disruptionTokens > 0) {
    updated.isr.state = SPACE_STATE.DISRUPTED;
  }
  
  return updated;
}

/**
 * Apply Assured C2 defensive token
 * Protects against Disrupt C2 by adding a layer of defense
 * @param {object} dashboard - Space dashboard
 * @param {string} target - 'c2'|'pnt'|'isr'
 * @returns {object} - Updated dashboard
 */
export function applyAssuredC2(dashboard, target = 'c2') {
  const updated = JSON.parse(JSON.stringify(dashboard));
  
  if (target === 'c2') {
    updated.c2.assuredC2 = true;
  } else if (target === 'pnt') {
    updated.pnt.assuredC2 = true;
  } else if (target === 'isr') {
    updated.isr.assuredC2 = true;
  }
  
  return updated;
}

/**
 * Reset space dashboard at end of turn
 * Defensive tokens remain; offensive disruptions may be removed per scenario rules
 * @param {object} dashboard - Space dashboard
 * @returns {object} - Reset dashboard
 */
export function resetSpaceDashboard(dashboard) {
  const updated = JSON.parse(JSON.stringify(dashboard));
  
  // Assure C2 remains
  // Disrupt C2 may be removed (depends on scenario rules)
  // For now, we keep disruption to model ongoing effects
  
  return updated;
}

/**
 * Helper: Demote a die (for ISR die demotion)
 * @param {string} die - Die type
 * @returns {string} - Demoted die
 */
function demoteDie(die) {
  const scale = ['d4', 'd6', 'd8', 'd10', 'd12', 'd16', 'd20'];
  const idx = scale.indexOf(die);
  if (idx > 0) {
    return scale[idx - 1];
  }
  return die; // Capped at d4
}

/**
 * Generate initial space dashboard for a scenario
 * @param {object} scenarioRules - Scenario special rules
 * @returns {object} - Populated dashboard
 */
export function generateSpaceDashboard(scenarioRules = {}) {
  const dashboard = createSpaceDashboard();
  
  // Apply scenario-specific values
  if (scenarioRules.c2StrikeActions) {
    dashboard.c2.value = scenarioRules.c2StrikeActions;
  }
  
  if (scenarioRules.isrDetectionDie) {
    dashboard.isr.detectionDie = scenarioRules.isrDetectionDie;
  }
  
  if (scenarioRules.isrPawns) {
    dashboard.isr.isrPawns = scenarioRules.isrPawns;
  }
  
  return dashboard;
}

/**
 * Get dashboard status summary
 * @param {object} dashboard - Space dashboard
 * @returns {object} - Summary of all three constellations
 */
export function getDashboardStatus(dashboard) {
  return {
    c2: {
      available: getC2StrikeActions(dashboard),
      state: dashboard.c2.state,
      disruptionTokens: dashboard.c2.disruptionTokens
    },
    pnt: {
      state: dashboard.pnt.state,
      disrupted: isPntDisrupted(dashboard),
      effect: 'Demotes long-range strikes beyond 1 hex'
    },
    isr: {
      detectionDie: getIsrDetectionDie(dashboard),
      pawns: getIsrPawnCount(dashboard),
      state: dashboard.isr.state,
      disruptionTokens: dashboard.isr.disruptionTokens
    }
  };
}

export {
  SPACE_TRACK,
  SPACE_STATE
};
