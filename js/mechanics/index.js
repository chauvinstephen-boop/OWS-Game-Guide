/**
 * OWS Game Mechanics - Master Index
 * Centralizes all game rule implementations from Series Rules v2.3
 * 
 * Modules:
 * - dice: Dice rolling, promotion/demotion, critical hits
 * - detection: Theater ISR, local detection, stealth rules
 * - combat: Hit adjudication, shields, step losses
 * - spaceDashboard: C2, PNT, ISR constellations
 * - supply: Supply tracing, supply status
 * - airTasking: Air missions, combat radius, fuel sources
 * - strikePackage: Munitions, strikes, SEAD
 * - fighterEngagement: Fighter combat, escort priority
 * - ioCyber: IO tokens, Disrupt C2, Assure C2
 * - groundCombat: GCAT, terrain, suppression
 */

import * as dice from './dice.js';
import * as detection from './detection.js';
import * as combat from './combat.js';
import * as spaceDashboard from './spaceDashboard.js';
import * as supply from './supply.js';
import * as airTasking from './airTasking.js';
import * as strikePackage from './strikePackage.js';
import * as fighterEngagement from './fighterEngagement.js';
import * as ioCyber from './ioCyber.js';
import * as groundCombat from './groundCombat.js';

// Export all mechanics modules
export {
  dice,
  detection,
  combat,
  spaceDashboard,
  supply,
  airTasking,
  strikePackage,
  fighterEngagement,
  ioCyber,
  groundCombat
};

/**
 * Convenience export for common operations
 */
export const GameMechanics = {
  // Dice
  rollDie: dice.rollDie,
  resolveAttack: dice.resolveAttack,
  promoteDie: dice.promoteDie,
  demoteDie: dice.demoteDie,
  determineSuccess: dice.determineSuccess,
  
  // Detection
  resolveTheaterISR: detection.resolveTheaterISR,
  resolveLocalDetection: detection.resolveLocalDetection,
  capStealthDetection: detection.capStealthDetection,
  
  // Combat
  resolveShieldedAttack: combat.resolveShieldedAttack,
  applyStepLosses: combat.applyStepLosses,
  resolveMissileSalvo: combat.resolveMissileSalvo,
  resolveAirToAir: combat.resolveAirToAir,
  
  // Space Dashboard
  createSpaceDashboard: spaceDashboard.createSpaceDashboard,
  getC2StrikeActions: spaceDashboard.getC2StrikeActions,
  applyDisruptC2: spaceDashboard.applyDisruptC2,
  
  // Supply
  checkSupplyForAllUnits: supply.checkSupplyForAllUnits,
  determineSupplyStatus: supply.determineSupplyStatus,
  calculateHexDistance: supply.calculateHexDistance,
  
  // Air Tasking
  validateAirMissionPlacement: airTasking.validateAirMissionPlacement,
  getCombatRadius: airTasking.getCombatRadius,
  getValidFuelSources: airTasking.getValidFuelSources,
  
  // Strike Package
  resolveStrike: strikePackage.resolveStrike,
  buildStrikePackage: strikePackage.buildStrikePackage,
  
  // Fighter Engagement
  resolveAirToAirEngagement: fighterEngagement.resolveAirToAirEngagement,
  resolveEscortPriority: fighterEngagement.resolveEscortPriority,
  
  // IO/Cyber
  adjudicateDisruptC2: ioCyber.adjudicateDisruptC2,
  placeIOToken: ioCyber.placeIOToken,
  
  // Ground Combat
  resolveGroundCombat: groundCombat.resolveGroundCombat,
  calculateForceRatio: groundCombat.calculateForceRatio,
  getGcatColumnShift: groundCombat.getGcatColumnShift
};
