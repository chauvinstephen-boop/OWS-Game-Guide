// Application State

import { BASE_SEQUENCE } from "./data/sequence.js";

export const state = {
  inventory: {
    blue: [],
    red: [],
    blueUnits: [],
    redUnits: []
  },
  names: {
    blue: "Blue",
    red: "Red"
  },
  initiative: "blue",
  
  sequence: [],
  flatSteps: [],
  
  indices: {
    phase: 0,
    step: 0
  },
  
  diceHistory: [],
  
  unitStates: {} // { unitId: { hex: "", role: "", dest: "", stealth: false, detected: false, hasEnhancer: false, destroyed: false, cas: false, cap: false, strike: false, sead: false, aew: false, airAssault: false, asw: false, transport: false, tanker: false } }
};

// State mutations
export function setInventory(newInventory) {
  state.inventory = newInventory;
  pruneUnitStates();
  rebuildSequence();
}

// Add assets to existing inventory (for mid-game additions)
export function addAssetsToInventory(newAssets) {
  // Merge new assets with existing
  const existingBlueUnits = new Set(state.inventory.blueUnits);
  const existingRedUnits = new Set(state.inventory.redUnits);
  
  // Add blue units (newAssets.blueUnits contains instance IDs like "f35a_1", "f35a_2", etc.)
  newAssets.blueUnits.forEach(instanceId => {
    if (!existingBlueUnits.has(instanceId)) {
      state.inventory.blueUnits.push(instanceId);
    }
  });
  
  // Add red units
  newAssets.redUnits.forEach(instanceId => {
    if (!existingRedUnits.has(instanceId)) {
      state.inventory.redUnits.push(instanceId);
    }
  });
  
  // Merge categories
  newAssets.blue.forEach(cat => {
    if (!state.inventory.blue.includes(cat)) {
      state.inventory.blue.push(cat);
    }
  });
  
  newAssets.red.forEach(cat => {
    if (!state.inventory.red.includes(cat)) {
      state.inventory.red.push(cat);
    }
  });
  
  rebuildSequence();
}

export function setNames(blue, red) {
  state.names.blue = blue || "Blue";
  state.names.red = red || "Red";
}

export function setInitiative(side) {
  state.initiative = side;
}

export function addDiceRoll(sides, value) {
  state.diceHistory.unshift({ die: `d${sides}`, value });
  state.diceHistory = state.diceHistory.slice(0, 10);
}

// Helper function to get team-prefixed key for unitStates
// This ensures instance IDs are unique across teams (e.g., blue_airfield_1 vs red_airfield_1)
function getUnitStateKey(instanceId, team) {
  // If already prefixed, return as-is
  if (instanceId.startsWith('blue_') || instanceId.startsWith('red_')) {
    return instanceId;
  }
  // Otherwise, add team prefix
  return `${team}_${instanceId}`;
}

// Helper function to extract team and instance ID from a prefixed key
function parseUnitStateKey(key) {
  if (key.startsWith('blue_')) {
    return { team: 'blue', instanceId: key.substring(5) };
  } else if (key.startsWith('red_')) {
    return { team: 'red', instanceId: key.substring(4) };
  }
  // Legacy format - try to determine team from inventory
  if (state.inventory.blueUnits.includes(key)) {
    return { team: 'blue', instanceId: key };
  } else if (state.inventory.redUnits.includes(key)) {
    return { team: 'red', instanceId: key };
  }
  // Default to blue if can't determine (shouldn't happen)
  return { team: 'blue', instanceId: key };
}

export function updateUnitState(id, field, value, team = null) {
  // If team not provided, try to determine it
  if (!team) {
    if (state.inventory.blueUnits.includes(id)) {
      team = 'blue';
    } else if (state.inventory.redUnits.includes(id)) {
      team = 'red';
    } else {
      // Fallback: try to parse from prefixed key
      const parsed = parseUnitStateKey(id);
      team = parsed.team;
      id = parsed.instanceId;
    }
  }
  
  const key = getUnitStateKey(id, team);
  if (!state.unitStates[key]) {
    state.unitStates[key] = { hex: "", role: "", dest: "", stealth: false, detected: false, hasEnhancer: false, destroyed: false, cas: false, cap: false, strike: false, sead: false, aew: false, airAssault: false, asw: false, transport: false, tanker: false };
  }
  state.unitStates[key][field] = value;
}

// Helper function to get unit state with team awareness
export function getUnitState(instanceId, team) {
  const key = getUnitStateKey(instanceId, team);
  return state.unitStates[key] || { hex: "", role: "", dest: "", stealth: false, detected: false, hasEnhancer: false, destroyed: false, cas: false, cap: false, strike: false, sead: false, aew: false, airAssault: false, asw: false, transport: false, tanker: false };
}

export function resetIndices() {
  state.indices.phase = 0;
  state.indices.step = 0;
}

// Cleanup unit states for keys no longer in inventory to prevent memory leaks
function pruneUnitStates() {
  // Create set of all valid unit state keys (with team prefixes)
  const activeKeys = new Set();
  state.inventory.blueUnits.forEach(id => {
    activeKeys.add(getUnitStateKey(id, 'blue'));
  });
  state.inventory.redUnits.forEach(id => {
    activeKeys.add(getUnitStateKey(id, 'red'));
  });
  
  // Also handle legacy keys (without prefixes) for migration
  const legacyKeys = new Set([...state.inventory.blueUnits, ...state.inventory.redUnits]);
  
  Object.keys(state.unitStates).forEach(key => {
    // Check if it's a prefixed key
    if (key.startsWith('blue_') || key.startsWith('red_')) {
      if (!activeKeys.has(key)) {
        delete state.unitStates[key];
      }
    } else {
      // Legacy key - migrate or delete
      if (!legacyKeys.has(key)) {
        delete state.unitStates[key];
      } else {
        // Migrate legacy key to prefixed format
        let team = 'blue';
        if (state.inventory.redUnits.includes(key)) {
          team = 'red';
        }
        const newKey = getUnitStateKey(key, team);
        if (newKey !== key && state.unitStates[key]) {
          state.unitStates[newKey] = state.unitStates[key];
          delete state.unitStates[key];
        }
      }
    }
  });
}

// Logic to build sequence based on inventory
export function rebuildSequence() {
  const allAssets = new Set([...state.inventory.blue, ...state.inventory.red]);

  const phases = [];
  BASE_SEQUENCE.forEach((phase) => {
    const validSteps = (phase.steps || []).filter((s) => {
       if (!s.requires || s.requires.length === 0) return true;
       return s.requires.some(r => allAssets.has(r));
    });

    if (validSteps.length > 0) {
      phases.push({
        ...phase,
        steps: validSteps
      });
    }
  });
  
  state.sequence = phases;
  
  // Flatten steps
  const arr = [];
  state.sequence.forEach((phase, pIndex) => {
    phase.steps.forEach((step, sIndex) => {
      arr.push({
        phaseIndex: pIndex,
        stepIndex: sIndex,
        phase,
        step
      });
    });
  });
  state.flatSteps = arr;
}

export function getCurrentStep() {
  if (state.sequence.length === 0) return null;
  const phase = state.sequence[state.indices.phase];
  if (!phase) return null;
  return {
    phase,
    step: phase.steps[state.indices.step]
  };
}

export function currentFlatIndex() {
  let counter = 0;
  for (let p = 0; p < state.sequence.length; p++) {
    for (let s = 0; s < state.sequence[p].steps.length; s++) {
      if (p === state.indices.phase && s === state.indices.step) {
        return counter;
      }
      counter++;
    }
  }
  return 0;
}
