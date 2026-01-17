/**
 * Supply System Module
 * Implements OWS Series Rules v2.3 supply mechanics:
 * - Supply line tracing
 * - Normal, Extended, and Out-of-Supply status
 * - Supply source identification
 * - Ground unit combat modifiers based on supply
 */

export const SUPPLY_STATUS = {
  NORMAL: 'normal',
  EXTENDED: 'extended',
  OUT_OF_SUPPLY: 'out_of_supply'
};

/**
 * Check if a unit can trace an uninterrupted line of supply to a source
 * @param {object} unit - Unit with position
 * @param {object} supplySource - Supply unit (CSS unit, depot, etc.)
 * @param {object[]} hexesInLine - Hexes between unit and source
 * @param {object[]} enemyZOC - Enemy zones of control
 * @returns {object} - { hasSupply: boolean, uninterrupted: boolean }
 */
export function canTraceSupply(unit, supplySource, hexesInLine, enemyZOC) {
  if (!supplySource) {
    return { hasSupply: false, uninterrupted: false, reason: 'No supply source identified' };
  }
  
  // Check if line is interrupted by enemy ZOC
  const uninterrupted = !hexesInLine.some(hex => {
    return enemyZOC.some(zoc => zoc.x === hex.x && zoc.y === hex.y);
  });
  
  return {
    hasSupply: uninterrupted,
    uninterrupted,
    hexesChecked: hexesInLine.length
  };
}

/**
 * Determine supply status based on distance and line of supply
 * @param {object} unit - Unit position
 * @param {object} supplySource - Supply source position
 * @param {number} distanceInHexes - Number of hexes from source
 * @param {boolean} uninterruptedLine - Whether supply line is clear
 * @returns {object} - { status: string, modifier: number, movementPenalty: number }
 */
export function determineSupplyStatus(unit, supplySource, distanceInHexes, uninterruptedLine) {
  // Must have uninterrupted line first
  if (!uninterruptedLine) {
    return {
      status: SUPPLY_STATUS.OUT_OF_SUPPLY,
      modifier: -2, // -2 columns on GCAT
      movementPenalty: 0.5, // Can only move half MP
      description: 'Out of Supply: No uninterrupted line to supply source'
    };
  }
  
  // Per rules 11.1: Normal supply within 2 zones (large yellow hexes)
  // Treating zone as ~2 hex equivalents for simplified digital version
  const normalSupplyRange = 4; // 2 zones = ~4 hexes
  
  if (distanceInHexes <= normalSupplyRange) {
    return {
      status: SUPPLY_STATUS.NORMAL,
      modifier: 0,
      movementPenalty: 0,
      description: 'Normal Supply'
    };
  }
  
  // Extended supply: beyond 2 zones but with uninterrupted line
  if (distanceInHexes <= normalSupplyRange * 1.5) {
    return {
      status: SUPPLY_STATUS.EXTENDED,
      modifier: -1, // -1 columns on GCAT
      movementPenalty: 0,
      description: 'Low Supply: Extended line reduces combat effectiveness'
    };
  }
  
  // Beyond extended range but with line = out of supply
  return {
    status: SUPPLY_STATUS.OUT_OF_SUPPLY,
    modifier: -2,
    movementPenalty: 0.5,
    description: 'Out of Supply: Too far from source'
  };
}

/**
 * Check all units on the map for supply status
 * @param {object[]} groundUnits - Array of ground unit data
 * @param {object} mapData - Map with hex connectivity
 * @param {object[]} enemyUnits - Enemy units for ZOC
 * @returns {object} - Supply status for each unit
 */
export function checkSupplyForAllUnits(groundUnits, mapData, enemyUnits) {
  const supplyStatus = {};
  
  for (const unit of groundUnits) {
    if (!unit.css || !unit.css.sourceId) {
      supplyStatus[unit.id] = {
        status: SUPPLY_STATUS.OUT_OF_SUPPLY,
        reason: 'No CSS unit assigned'
      };
      continue;
    }
    
    // Find CSS (supply) unit
    const cssUnit = groundUnits.find(u => u.id === unit.css.sourceId);
    if (!cssUnit) {
      supplyStatus[unit.id] = {
        status: SUPPLY_STATUS.OUT_OF_SUPPLY,
        reason: 'CSS unit not found'
      };
      continue;
    }
    
    // Trace supply path
    const distance = calculateHexDistance(unit.position, cssUnit.position);
    const path = traceSupplyPath(unit.position, cssUnit.position, mapData);
    const enemyZOCs = getEnemyZOCs(cssUnit.team, enemyUnits);
    const lineUninterrupted = !path.some(hex => 
      enemyZOCs.some(zoc => zoc.x === hex.x && zoc.y === hex.y)
    );
    
    supplyStatus[unit.id] = determineSupplyStatus(unit, cssUnit, distance, lineUninterrupted);
  }
  
  return supplyStatus;
}

/**
 * Calculate hex distance using simple hex distance formula
 * @param {object} hex1 - { x, y } coordinates
 * @param {object} hex2 - { x, y } coordinates
 * @returns {number} - Distance in hexes
 */
export function calculateHexDistance(hex1, hex2) {
  // Cube coordinate distance formula for hex grids
  const dx = Math.abs(hex2.x - hex1.x);
  const dy = Math.abs(hex2.y - hex1.y);
  return (dx + dy + Math.abs(-hex2.x - hex2.y + hex1.x + hex1.y)) / 2;
}

/**
 * Trace supply path from unit to supply source
 * Simplified A* pathfinding
 * @param {object} start - Starting hex
 * @param {object} goal - Goal hex
 * @param {object} mapData - Map connectivity data
 * @returns {object[]} - Path hexes
 */
export function traceSupplyPath(start, goal, mapData) {
  // Simplified: return hexes along straight line
  // In real implementation, would use A* with terrain costs
  const path = [start];
  
  let current = { ...start };
  while (current.x !== goal.x || current.y !== goal.y) {
    if (current.x < goal.x) current.x += 1;
    else if (current.x > goal.x) current.x -= 1;
    
    if (current.y < goal.y) current.y += 1;
    else if (current.y > goal.y) current.y -= 1;
    
    path.push({ ...current });
  }
  
  return path;
}

/**
 * Get all enemy zones of control
 * ZOC extends 1 hex around enemy combat units
 * @param {string} friendlyTeam - 'blue' or 'red'
 * @param {object[]} enemyUnits - Enemy unit array
 * @returns {object[]} - Array of hex ZOCs
 */
export function getEnemyZOCs(friendlyTeam, enemyUnits) {
  const zocs = [];
  const enemyTeam = friendlyTeam === 'blue' ? 'red' : 'blue';
  
  for (const unit of enemyUnits) {
    if (unit.team !== enemyTeam || !unit.position) continue;
    
    // ZOC extends 1 hex around combat units
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        zocs.push({
          x: unit.position.x + dx,
          y: unit.position.y + dy
        });
      }
    }
  }
  
  return zocs;
}

/**
 * Get GCAT modifier based on supply status
 * Ground Combat Adjudication Table column shift
 * @param {object} supplyStatus - Supply status object
 * @returns {number} - Modifier for GCAT (typically -2, -1, or 0)
 */
export function getSupplyCATModifier(supplyStatus) {
  return supplyStatus.modifier || 0;
}

/**
 * Get movement penalty based on supply
 * Out of supply units can only move half their MP allowance
 * @param {object} supplyStatus - Supply status
 * @param {number} normalMovement - Normal movement points
 * @returns {number} - Allowed movement points
 */
export function getAllowedMovement(supplyStatus, normalMovement) {
  return Math.floor(normalMovement * (1 - supplyStatus.movementPenalty));
}

/**
 * Check if a unit can conduct operations
 * Out-of-supply units can fight but at reduced effectiveness
 * @param {object} supplyStatus - Supply status
 * @returns {boolean} - Whether unit can fight
 */
export function canConductOperations(supplyStatus) {
  // All units can conduct operations, but penalties apply
  return true;
}

/**
 * Generate supply report for a team
 * @param {object} allUnitsSupplyStatus - Supply status map
 * @param {string} team - 'blue' or 'red'
 * @returns {object} - Summary of supply situation
 */
export function generateSupplyReport(allUnitsSupplyStatus, team) {
  const normalSupply = Object.values(allUnitsSupplyStatus).filter(
    s => s.status === SUPPLY_STATUS.NORMAL
  ).length;
  
  const extendedSupply = Object.values(allUnitsSupplyStatus).filter(
    s => s.status === SUPPLY_STATUS.EXTENDED
  ).length;
  
  const outOfSupply = Object.values(allUnitsSupplyStatus).filter(
    s => s.status === SUPPLY_STATUS.OUT_OF_SUPPLY
  ).length;
  
  return {
    team,
    normalSupply,
    extendedSupply,
    outOfSupply,
    totalUnits: normalSupply + extendedSupply + outOfSupply,
    supplyHealth: (normalSupply / (normalSupply + extendedSupply + outOfSupply)) * 100
  };
}
