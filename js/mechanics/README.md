# OWS Game Mechanics Implementation

This directory contains complete implementations of the Operational Wargame System (OWS) Series Rules v2.3 game mechanics in JavaScript.

## Overview

The mechanics are organized into 10 specialized modules, each implementing a major rule system from the Series Rules:

### Module List

#### 1. **dice.js** - Core Dice System
Implements the foundation of OWS: colored multi-sided dice and success determination.

**Key Functions:**
- `rollDie(dieType)` - Roll a d4 through d20
- `promoteDie(currentDie, promotions)` - Increase die size by 1 step per promotion
- `demoteDie(currentDie, demotions)` - Decrease die size by 1 step per demotion
- `determineSuccess(rollValue, defenseNumber)` - Meet-or-beat and critical hit calculation
- `resolveAttack(attackDie, defenseNumber)` - Single attack resolution
- `resolveSalvo(attackDice, defenseNumber)` - Multiple missile attacks

**Reference:** Rules 2.1.1 (Core Adjudication Technique)

#### 2. **detection.js** - ISR & Detection System
Theater ISR and local detection with stealth rules and cooperative sensing.

**Key Functions:**
- `resolveTheaterISR(isrDieType, targetSignature)` - ISR pawn detection
- `resolveLocalDetection(sensorDie, targetSignature, isStealthAircraft)` - Local sensor detection
- `resolveAewDetection(baseAewDie, rangeInHexes, targetSignature, isStealthAircraft)` - AEW with range demotion
- `capStealthDetection(detectionDie)` - Cap stealth detection at d12
- `resolveCooperativeSensing(sensorDice, targetSignature, isLowSignature)` - Multiple sensors
- `getUnitSignature(unit, detectionMethod)` - Unit signature determination

**Reference:** Rules 8.1-8.7 (ISR Phase)

#### 3. **combat.js** - Combat Resolution
Hit adjudication, shield mechanics (red enduring, grey consumable), and step losses.

**Key Functions:**
- `resolveShieldedAttack(attackDie, greyShieldValue, redShieldValue)` - Layered defense resolution
- `applyStepLosses(unit, hitsToApply)` - Unit damage tracking
- `resolveFireEffect(target, hits)` - Fire Effects Table for ground units
- `resolveMissileSalvo(missileDice, greyShieldValue, redShieldValue)` - Multi-missile attacks
- `resolveAirToAir(attacker, defender)` - Simultaneous fighter combat
- `resolveSead(seadAircraft, target, ewSupport)` - SEAD vs SAM
- `resolveInHexBattle(blueUnits, redUnits)` - Multi-fighter engagements

**Reference:** Rules 9.1-9.5 (Combat Phase), 2.2.3 (Shields)

#### 4. **spaceDashboard.js** - Space Capability Dashboard
C2 Satellite Constellation, PNT, and ISR capabilities with disruption mechanics.

**Key Functions:**
- `createSpaceDashboard()` - Initialize dashboard
- `getC2StrikeActions(dashboard)` - Available long-range strike actions
- `applyDisruptC2(dashboard, tokens)` - Apply Disrupt C2 tokens
- `isPntDisrupted(dashboard)` - Check PNT constellation status
- `getIsrDetectionDie(dashboard)` - ISR capability level
- `getIsrPawnCount(dashboard)` - Available ISR pawns
- `applyDisruptISR(dashboard, target)` - Disrupt ISR capability
- `applyAssuredC2(dashboard, target)` - Defensive capability
- `getDashboardStatus(dashboard)` - Current status summary

**Reference:** Rules 7.5 (Space Capability Dashboard)

#### 5. **supply.js** - Supply System
Supply line tracing and supply status determination (Normal, Extended, Out-of-Supply).

**Key Functions:**
- `canTraceSupply(unit, supplySource, hexesInLine, enemyZOC)` - Supply line check
- `determineSupplyStatus(unit, supplySource, distanceInHexes, uninterruptedLine)` - Status determination
- `checkSupplyForAllUnits(groundUnits, mapData, enemyUnits)` - Map-wide supply check
- `calculateHexDistance(hex1, hex2)` - Hex distance calculation
- `getSupplyCATModifier(supplyStatus)` - GCAT column shift
- `getAllowedMovement(supplyStatus, normalMovement)` - Movement point penalty

**Reference:** Rules 11.1 (Supply Check)

#### 6. **airTasking.js** - Air Tasking Order & Movement
Combat radius, fuel sources (airbases, carriers, tankers, FARPs), and mission validation.

**Key Functions:**
- `canBaseAt(mission, base)` - Basing validation
- `getCombatRadius(aircraft, mission)` - Mission combat radius
- `getMaxOperatingRange(aircraft, missionType)` - Extended range limits
- `isWithinCombatRadius(mission, fuelSource, combatRadius)` - Range check
- `getValidFuelSources(mission, airbases, carriers, tankers, farps)` - Fuel source list
- `validateAirMissionPlacement(mission, placement, fuelSources)` - Full placement validation
- `getCarrierAirGenerationCapacity(carrier)` - Carrier sortie generation
- `getTankerSupportCapacity(tanker)` - Tanker support capacity
- `canLoadMunitions(aircraft, munitionsSalvos)` - Munitions loading check

**Reference:** Rules 6.5 (Air Tasking Order and Air Movement)

#### 7. **strikePackage.js** - Strike Packages & Munitions
Munitions loading, strike package formation, and strike resolution.

**Key Functions:**
- `createMunitionsCounter(config)` - Create munitions
- `loadMunitions(aircraft, munitions)` - Load weapons onto aircraft
- `canCarryMunition(aircraft, munition)` - Weapons compatibility
- `canReachTarget(strikeAircraft, targetHexDistance)` - Strike range check
- `launchStrike(aircraft, target, targetType)` - Strike initialization
- `resolveStrike(strikeDie, targetDefense, greyShieldValue, seadSupport, ewSupport)` - Strike resolution
- `resolveSead(seadAircraft, target, ewSupport)` - SEAD attack
- `buildStrikePackage(config)` - Package validation
- `calculateEscortPriority(escortCount, attackerFighterCount)` - Escort matching

**Reference:** Rules 6.5.1 (Strike Packages), 6.B (Strike Warfare)

#### 8. **fighterEngagement.js** - Fighter Engagement & Air-to-Air
Fighter priority sequencing, escort matching, and attack mission penalties.

**Key Functions:**
- `classifyDefenders(friendlyFighters)` - Categorize defenders
- `resolveEscortPriority(defendingFighters, attackingEscorts, attackingStrike)` - Priority sequencing
- `canInitiateAirToAir(fighter)` - Check if fighter can start A2A
- `getA2ACombatDie(fighter)` - A2A die (demoted for attack missions)
- `resolveAirToAirEngagement(attacker, defender)` - Single engagement
- `bestDieSequence(blueAircraft, redAircraft)` - Best Die rule sequencing
- `igoUgoSequence(initiativeData, initiativeFighters, otherFighters)` - I-GO-U-GO sequencing
- `resolveInHexFighterBattle(defendingFighters, attackingEscorts, attackingStrike)` - Full battle
- `identifyHVU(aircraft)` - High Value Unit classification
- `determineAirSuperiority(blueSurviving, redSurviving)` - Air superiority check

**Reference:** Rules 6.A.4 (In-Hex Air-to-Air Combat)

#### 9. **ioCyber.js** - Information Operations & Cyber
IO tokens (Disrupt C2, Assure C2, SIGINT/EMSO, Countermeasures) and adjudication.

**Key Functions:**
- `placeIOToken(tokenType, target)` - Place IO token (face-down)
- `adjudicateDisruptC2(disruptDie, targetDefense, hasAssureC2, assureCDefense)` - Disrupt C2 resolution
- `applyDisruptEffect(target, disruptSuccess)` - Apply disruption effects
- `resolveSigintEmso(target, hasCountermeasures)` - SIGINT/EMSO effect
- `resolveCountermeasures(target, attack)` - Countermeasure defense
- `adjudicateIOTokens(blueTokens, redTokens, targets)` - Phase adjudication
- `resetIOTokens(activeTokens)` - End-of-turn reset
- `getUnitIOStatus(unit, activeTokens)` - Unit IO effect summary
- `getIOModifier(attacker, defender, ioTokens)` - Attack die modifier

**Reference:** Rules 7.2 (IO Token Placement), 3.6 (Phase 4: IO/Cyber)

#### 10. **groundCombat.js** - Ground Movement & Combat
Ground Combat Adjudication Table (GCAT), terrain modifiers, and suppression.

**Key Functions:**
- `calculateForceRatio(attackerSteps, defenderSteps)` - Force ratio determination
- `getGcatColumnShift(forceRatio)` - Base GCAT column
- `getTerrainModifier(terrainType, unitType)` - Terrain effects
- `getSupplyModifier(unitSupplyStatus)` - Supply status GCAT effect
- `getMainEffortModifier(unit)` - Main Effort bonus
- `calculateTotalColumnShift(scenario)` - Sum all modifiers
- `resolveGroundCombat(attackingUnits, defendingUnits, environment)` - Full GCAT resolution
- `applySuppression(unit, suppressionLevel)` - Apply suppression
- `removeSuppression(unit)` - Remove suppression at turn end
- `applyStrikeToGroundUnit(target, hits)` - Strike effects on ground units
- `getAllowedMovement(unit, baseMovement)` - Movement determination

**Reference:** Rules 10 (Ground Movement & Combat)

## Usage

### Basic Example: Resolve an Air-to-Air Engagement

```javascript
import { dice, combat, fighterEngagement } from './js/mechanics/index.js';

// Create two fighters
const f22 = {
  id: 'f22_1',
  a2aDie: 'd12',
  a2aDefense: 6,
  mission: 'CAP'
};

const su35 = {
  id: 'su35_1',
  a2aDie: 'd10',
  a2aDefense: 5,
  mission: 'CAP'
};

// Resolve the engagement
const result = fighterEngagement.resolveAirToAirEngagement(f22, su35);
console.log(result);
// Output: { exchange: { attacker: {...}, defender: {...} }, simultaneous: true }
```

### Example: Resolve a Strike with SEAD Support

```javascript
import { strikePackage } from './js/mechanics/index.js';

const result = strikePackage.resolveStrike(
  'd10',        // Strike die
  6,            // Target defense (red shield)
  3,            // Grey shield (SAM defense)
  true,         // SEAD supporting (promotes die)
  false         // EW support
);
// Rolls d12 (promoted from d10 by SEAD), checks vs target defense
```

### Example: Check Unit Supply Status

```javascript
import { supply } from './js/mechanics/index.js';

const status = supply.determineSupplyStatus(
  myUnit,
  cssUnit,
  5,            // 5 hexes from CSS
  true          // Has uninterrupted supply line
);

if (status.status === 'extended') {
  console.log('Unit at -1 column on GCAT due to extended supply');
}
```

## Integration with Main Application

These mechanics modules are designed to be imported and used in:
- `js/main.js` - Main application logic
- `js/state.js` - Game state management
- `js/ui/rendering.js` - UI rendering with live rule adjudication
- Combat resolution interfaces
- Mission planning tools
- Turn sequence assistants

## Testing

Each module includes clear function signatures and comments. Test cases should cover:
- Dice: Die promotion/demotion limits (d4-d20), critical hit multipliers
- Detection: Theater vs local, stealth d12 cap, range demotion
- Combat: Red/grey shield layering, step loss calculations
- Supply: Distance calculations, uninterrupted line checks
- Air Tasking: Combat radius, fuel source validation
- Fighter Engagement: Escort priority, attack mission demotions
- IO/Cyber: Disrupt C2 resolution with Assure C2 defense
- Ground Combat: GCAT column shifts, terrain modifiers

## References

All implementations based on:
**Operational Wargame System - SERIES RULES - Version 2.3**
Published December 10, 2024
Lead Game Designer: Tim Barrick
Brute Krulak Center for Innovation & Future Warfare, Marine Corps University

## License & Attribution

These implementations are faithful adaptations of the published OWS Series Rules v2.3 for use in the OWS Turn Assistant digital tool.
