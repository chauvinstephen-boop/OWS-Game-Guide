// Main Entry Point

import { UNIT_DATABASE } from "./data/units.js";
import { state, setInventory, setNames, setInitiative, addDiceRoll, rebuildSequence, resetIndices, getCurrentStep, currentFlatIndex } from "./state.js";
import { renderScratchPad } from "./ui/scratchpad.js";
import { renderStep, renderDice, renderModeHeader, renderReminders } from "./ui/rendering.js";
import { loadReminders, saveReminders, rollDie } from "./utils.js";

// Navigation Logic
function goToFlatIndex(flatIndex) {
  if (flatIndex < 0 || flatIndex >= state.flatSteps.length) return;
  const entry = state.flatSteps[flatIndex];
  state.indices.phase = entry.phaseIndex;
  state.indices.step = entry.stepIndex;
  renderStep();
}

function goToPhase(phaseIndex) {
  if (phaseIndex < 0 || phaseIndex >= state.sequence.length) return;
  state.indices.phase = phaseIndex;
  state.indices.step = 0;
  renderStep();
}

function goPrev() {
  const idx = currentFlatIndex();
  if (idx <= 0) return;
  goToFlatIndex(idx - 1);
}

function goNext() {
  const idx = currentFlatIndex();
  showAssessmentModal(() => {
     if (idx >= state.flatSteps.length - 1) {
         showEndTurnModal();
         return;
     }
     goToFlatIndex(idx + 1);
  });
}

// Modals
function showAssessmentModal(onConfirm) {
  const existingOverlay = document.getElementById("assessment-overlay");
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.id = "assessment-overlay";
  overlay.className = "setup-overlay";
  
  const card = document.createElement("div");
  card.className = "setup-card";
  
  card.innerHTML = `
    <h2>Step Complete</h2>
    <p>Did any assets get destroyed or removed from play in this step?</p>
    <div class="setup-row">
        <h3>Blue Inventory</h3>
        <div class="inventory-grid" id="assess-blue-inventory"></div>
    </div>
    <div class="setup-row">
        <h3>Red Inventory</h3>
        <div class="inventory-grid" id="assess-red-inventory"></div>
    </div>
    <div class="setup-row" style="flex-direction: row; justify-content: flex-end; gap: 1rem;">
       <button id="assess-confirm-btn" class="primary-btn">Continue</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const blueDiv = card.querySelector("#assess-blue-inventory");
  const redDiv = card.querySelector("#assess-red-inventory");
  
  const makeCheckbox = (unitId, name, category, teamUnits) => {
      const l = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = unitId;
      cb.dataset.category = category;
      cb.checked = teamUnits.includes(unitId);
      l.appendChild(cb);
      l.append(" " + name);
      return l;
  };

  const populateList = (teamKey, container, teamUnits) => {
      const teamData = UNIT_DATABASE[teamKey];
      if (!teamData) return;
      
      Object.keys(teamData).forEach(cat => {
          (teamData[cat] || []).forEach(unit => {
              if (teamUnits.includes(unit.id)) {
                  container.appendChild(makeCheckbox(unit.id, unit.name, unit.category, teamUnits));
              }
          });
      });
  };

  populateList("blue", blueDiv, state.inventory.blueUnits);
  populateList("red", redDiv, state.inventory.redUnits);

  document.getElementById("assess-confirm-btn").addEventListener("click", () => {
      const processUpdates = (container) => {
          const ids = [];
          const cats = new Set();
          container.querySelectorAll("input:checked").forEach(cb => {
              ids.push(cb.value);
              cats.add(cb.dataset.category);
          });
          return { ids, cats: Array.from(cats) };
      };
      
      const blueUp = processUpdates(blueDiv);
      const redUp = processUpdates(redDiv);
      
      state.inventory.blue = blueUp.cats;
      state.inventory.blueUnits = blueUp.ids;
      state.inventory.red = redUp.cats;
      state.inventory.redUnits = redUp.ids;
      
      // Update inventory without resetting sequence entirely? 
      // Actually we should rebuild because missing assets might skip steps.
      rebuildSequence();
      
      // Also update scratch pad
      renderScratchPad();
      
      overlay.remove();
      onConfirm();
  });
}

function showEndTurnModal() {
  const overlay = document.createElement("div");
  overlay.className = "setup-overlay";
  
  const card = document.createElement("div");
  card.className = "setup-card";
  
  card.innerHTML = `
    <h2>Turn Complete</h2>
    <p>Are we still playing?</p>
    <div class="setup-row" style="flex-direction: row; gap: 1rem; margin-top: 1rem;">
       <button id="end-game-btn" class="primary-btn" style="background: #b71c1c;">No, End Game</button>
       <button id="next-turn-btn" class="primary-btn">Yes, Next Turn</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  document.getElementById("end-game-btn").addEventListener("click", () => {
      overlay.remove();
      alert("Game Over. Thanks for playing!");
      location.reload(); 
  });

  document.getElementById("next-turn-btn").addEventListener("click", () => {
      overlay.remove();
      showRegenerationModal();
  });
}

function showRegenerationModal() {
  const overlay = document.createElement("div");
  overlay.className = "setup-overlay";
  
  const card = document.createElement("div");
  card.className = "setup-card";
  
  card.innerHTML = `
    <h2>Regeneration Phase</h2>
    <p>Confirm assets currently in play or add regenerated assets.</p>
    <div class="setup-row">
        <h3>Blue Inventory</h3>
        <div class="inventory-grid" id="regen-blue-inventory"></div>
    </div>
    <div class="setup-row">
        <h3>Red Inventory</h3>
        <div class="inventory-grid" id="regen-red-inventory"></div>
    </div>
    <div class="setup-row" style="margin-top: 1rem;">
       <button id="regen-confirm-btn" class="primary-btn">Start Next Turn</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const blueDiv = card.querySelector("#regen-blue-inventory");
  const redDiv = card.querySelector("#regen-red-inventory");
  
  const makeCheckbox = (unitId, name, category, teamUnits) => {
      const l = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = unitId;
      cb.dataset.category = category;
      cb.checked = teamUnits.includes(unitId);
      l.appendChild(cb);
      l.append(" " + name);
      return l;
  };

  const populateList = (teamKey, container, teamUnits) => {
      const teamData = UNIT_DATABASE[teamKey];
      if (!teamData) return;
      
      Object.keys(teamData).forEach(cat => {
        const catDiv = document.createElement("div");
        catDiv.className = "inventory-category";
        const catHeader = document.createElement("h4");
        catHeader.textContent = cat.toUpperCase();
        catDiv.appendChild(catHeader);
        
        const grid = document.createElement("div");
        grid.className = "inventory-grid";

        (teamData[cat] || []).forEach(unit => {
            grid.appendChild(makeCheckbox(unit.id, unit.name, unit.category, teamUnits));
        });
        
        catDiv.appendChild(grid);
        container.appendChild(catDiv);
      });
  };

  populateList("blue", blueDiv, state.inventory.blueUnits);
  populateList("red", redDiv, state.inventory.redUnits);

  document.getElementById("regen-confirm-btn").addEventListener("click", () => {
      const processUpdates = (container) => {
          const ids = [];
          const cats = new Set();
          container.querySelectorAll("input:checked").forEach(cb => {
              ids.push(cb.value);
              cats.add(cb.dataset.category);
          });
          return { ids, cats: Array.from(cats) };
      };
      
      const blueUp = processUpdates(blueDiv);
      const redUp = processUpdates(redDiv);
      
      const newInventory = {
         blue: blueUp.cats,
         blueUnits: blueUp.ids,
         red: redUp.cats,
         redUnits: redUp.ids
      };
      
      setInventory(newInventory);
      resetIndices();
      
      overlay.remove();
      renderModeHeader();
      renderStep();
      
      // Update persistent scratchpad
      renderScratchPad();
      
      // Logic: Move Dest -> Hex
      Object.keys(state.unitStates).forEach(id => {
          if (state.unitStates[id].dest) {
              state.unitStates[id].hex = state.unitStates[id].dest;
              state.unitStates[id].dest = "";
              state.unitStates[id].role = "";
          }
      });
      // Re-render scratchpad to show updated hexes
      renderScratchPad();
  });
}

function renderInventorySelection() {
  const renderTeam = (teamKey, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const teamData = UNIT_DATABASE[teamKey];
    if (!teamData) return;

    const categoryLabels = {
      naval: "Naval Forces",
      air: "Air Forces",
      ground: "Ground / Rocket Forces",
      sam: "Air Defense (SAM)",
      sof: "Special Forces",
      cyber: "Cyber / Space"
    };

    Object.keys(teamData).forEach((catKey) => {
      const units = teamData[catKey];
      if (!units || units.length === 0) return;

      const catDiv = document.createElement("div");
      catDiv.className = "inventory-category";
      
      const catHeader = document.createElement("h4");
      catHeader.textContent = categoryLabels[catKey] || catKey.toUpperCase();
      catDiv.appendChild(catHeader);

      const grid = document.createElement("div");
      grid.className = "inventory-grid";

      units.forEach((unit) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `${teamKey}_units`;
        input.value = unit.id;
        input.dataset.category = unit.category;
        
        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + unit.name));
        grid.appendChild(label);
      });

      catDiv.appendChild(grid);
      container.appendChild(catDiv);
    });
  };

  renderTeam("blue", "blue-inventory-container");
  renderTeam("red", "red-inventory-container");
}

function setupEventListeners() {
  try {
    renderInventorySelection();
  } catch (e) {
    console.error("Failed to render inventory:", e);
    alert("Error loading unit database. Please check console.");
  }

  // Nav clicks
  document.getElementById("phase-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button.phase-button");
    if (!btn) return;
    const index = parseInt(btn.dataset.phaseIndex, 10);
    if (!isNaN(index)) goToPhase(index);
  });

  document.getElementById("prev-step-btn").addEventListener("click", goPrev);
  document.getElementById("next-step-btn").addEventListener("click", goNext);

  document.getElementById("step-jump-select").addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!isNaN(idx)) goToFlatIndex(idx);
  });

  // Reminders
  document.getElementById("reminder-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("reminder-input");
    const text = (input.value || "").trim();
    if (!text) return;
    const current = getCurrentStep();
    if (!current) return;
    
    const reminders = loadReminders(current.step.id);
    if (reminders.length >= 3) return;
    reminders.push({ text, completed: false });
    saveReminders(current.step.id, reminders);
    input.value = "";
    renderReminders(current.step.id);
  });

  // Dice
  document.querySelectorAll(".dice-buttons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sides = parseInt(btn.dataset.die, 10);
      if (!isNaN(sides)) {
        const val = rollDie(sides);
        addDiceRoll(sides, val);
        renderDice();
      }
    });
  });

  // Setup Form
  document.getElementById("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const bInput = document.getElementById("blue-name-input");
    const rInput = document.getElementById("red-name-input");
    const initiativeRadio = document.querySelector("input[name='initiative']:checked");

    setNames(bInput.value, rInput.value);
    setInitiative(initiativeRadio ? initiativeRadio.value : "blue");
    
    const getSelectedUnits = (teamKey) => {
        const inputs = document.querySelectorAll(`input[name='${teamKey}_units']:checked`);
        const unitIds = [];
        const categories = new Set();
        inputs.forEach(input => {
            unitIds.push(input.value);
            if (input.dataset.category) categories.add(input.dataset.category);
        });
        return { ids: unitIds, cats: Array.from(categories) };
    };

    const blueData = getSelectedUnits("blue");
    const redData = getSelectedUnits("red");

    setInventory({
      blue: blueData.cats,
      blueUnits: blueData.ids,
      red: redData.cats,
      redUnits: redData.ids
    });

    resetIndices();

    document.getElementById("setup-overlay").style.display = "none";
    document.getElementById("app-root").hidden = false;

    renderModeHeader();
    renderStep();
    renderDice();
    renderScratchPad(); // Initial render of persistent scratchpad
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});
