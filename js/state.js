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
  
  let unitStates = {}; // { unitId: { hex: "", role: "", dest: "", stealth: false, detected: false, isr: false } }
};

// State mutations
export function setInventory(newInventory) {
  state.inventory = newInventory;
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
  state.diceHistory = state.diceHistory.slice(0, 5);
}

export function updateUnitState(id, field, value) {
  if (!state.unitStates[id]) {
    state.unitStates[id] = { hex: "", role: "", dest: "", stealth: false, detected: false, isr: false };
  }
  state.unitStates[id][field] = value;
}

export function resetIndices() {
  state.indices.phase = 0;
  state.indices.step = 0;
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
