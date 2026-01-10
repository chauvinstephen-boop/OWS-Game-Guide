// Main Entry Point

import { UNIT_DATABASE } from "./data/units.js";
import { state, setInventory, setNames, setInitiative, addDiceRoll, rebuildSequence, resetIndices, getCurrentStep, currentFlatIndex } from "./state.js";
// Cache-bust scratchpad module so mobile devices pick up UI updates promptly.
import { renderScratchPad } from "./ui/scratchpad.js?v=16";
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
  // Directly advance without assessment modal
  if (idx >= state.flatSteps.length - 1) {
      showEndTurnModal();
      return;
  }
  goToFlatIndex(idx + 1);
}

// Modals
// Removed showAssessmentModal as it is no longer used in the flow.

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
      
      // Default to checked if in inventory, BUT uncheck if marked as destroyed
      const isDestroyed = state.unitStates[unitId] && state.unitStates[unitId].destroyed;
      cb.checked = !isDestroyed; // If it's in the list passed to us (teamUnits), it exists. Check if not destroyed.
      
      if (isDestroyed) {
          l.style.textDecoration = "line-through";
          l.style.color = "red";
      }
      
      l.appendChild(cb);
      l.append(" " + name);
      return l;
  };

  const populateList = (teamKey, container, teamInstanceIds) => {
      const teamData = UNIT_DATABASE[teamKey];
      if (!teamData) return;
      
      // Group instances by category
      const instancesByCat = {};
      
      teamInstanceIds.forEach(instId => {
          const baseId = instId.substring(0, instId.lastIndexOf("_"));
          const instanceNum = instId.substring(instId.lastIndexOf("_") + 1);
          
          let unitDef = null;
          let foundCat = null;
          
          for (const cat of Object.keys(teamData)) {
              const found = teamData[cat].find(u => u.id === baseId);
              if (found) {
                  unitDef = found;
                  foundCat = cat;
                  break;
              }
          }
          
          if (unitDef && foundCat) {
              if (!instancesByCat[foundCat]) instancesByCat[foundCat] = [];
              instancesByCat[foundCat].push({
                  instanceId: instId,
                  name: `${unitDef.name} #${instanceNum}`,
                  category: foundCat
              });
          }
      });
      
      Object.keys(instancesByCat).forEach(cat => {
          const catDiv = document.createElement("div");
          catDiv.className = "inventory-category";
          const catHeader = document.createElement("h4");
          catHeader.textContent = cat.toUpperCase();
          catDiv.appendChild(catHeader);
          
          const grid = document.createElement("div");
          grid.className = "inventory-grid";
          
          instancesByCat[cat].forEach(item => {
              grid.appendChild(makeCheckbox(item.instanceId, item.name, item.category, teamInstanceIds));
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
      
      // Logic: Move Dest -> Hex and Reset Status
      Object.keys(state.unitStates).forEach(id => {
          // If unit is still in inventory (it wasn't removed)
          const inBlue = state.inventory.blueUnits.includes(id);
          const inRed = state.inventory.redUnits.includes(id);
          
          if (inBlue || inRed) {
              if (state.unitStates[id].dest) {
                  state.unitStates[id].hex = state.unitStates[id].dest;
              }
              state.unitStates[id].dest = "";
              state.unitStates[id].role = "";
              state.unitStates[id].stealth = false;
              state.unitStates[id].detected = false;
              state.unitStates[id].isr = false;
              state.unitStates[id].destroyed = false; // Reset destroyed flag if they kept it
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
        label.style.display = "flex";
        label.style.flexDirection = "column";
        label.style.alignItems = "flex-start";
        label.style.gap = "0.2rem";
        label.style.padding = "0.2rem";
        label.style.border = "1px solid #eee";
        label.style.borderRadius = "4px";

        const img = document.createElement("img");
        // Try to load specific image, fallback to placeholder logic if needed (handled via alt or css)
        img.src = `assets/${unit.id}.png`; 
        img.alt = "Unit";
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.objectFit = "contain";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "4px";
        img.onerror = () => { img.style.display = 'none'; }; // Hide if missing

        const textSpan = document.createElement("span");
        textSpan.textContent = unit.name;
        textSpan.style.fontSize = "0.85rem";
        textSpan.style.fontWeight = "500";

        const controlDiv = document.createElement("div");
        controlDiv.style.display = "flex";
        controlDiv.style.alignItems = "center";
        controlDiv.style.gap = "0.3rem";

        const btnMinus = document.createElement("button");
        btnMinus.type = "button";
        btnMinus.textContent = "-";
        btnMinus.style.padding = "0 0.4rem";
        btnMinus.style.cursor = "pointer";
        btnMinus.onclick = (e) => {
            e.preventDefault();
            const val = parseInt(qtyInput.value, 10) || 0;
            if (val > 0) qtyInput.value = val - 1;
        };

        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.min = "0";
        qtyInput.value = "0";
        qtyInput.name = `${teamKey}_units_qty`;
        qtyInput.dataset.id = unit.id;
        qtyInput.dataset.category = unit.category;
        qtyInput.style.width = "40px";
        qtyInput.style.textAlign = "center";
        qtyInput.style.padding = "0.2rem";
        
        const btnPlus = document.createElement("button");
        btnPlus.type = "button";
        btnPlus.textContent = "+";
        btnPlus.style.padding = "0 0.4rem";
        btnPlus.style.cursor = "pointer";
        btnPlus.onclick = (e) => {
            e.preventDefault();
            const val = parseInt(qtyInput.value, 10) || 0;
            qtyInput.value = val + 1;
        };

        controlDiv.appendChild(btnMinus);
        controlDiv.appendChild(qtyInput);
        controlDiv.appendChild(btnPlus);

        label.appendChild(img);
        label.appendChild(textSpan);
        label.appendChild(controlDiv);
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
  const reminderForm = document.getElementById("reminder-form");
  const reminderInput = document.getElementById("reminder-input");
  const reminderWordCount = document.getElementById("reminder-word-count");
  
  // Word count function
  function countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  // Update word count display
  if (reminderInput && reminderWordCount) {
    reminderInput.addEventListener("input", () => {
      const text = reminderInput.value || "";
      const wordCount = countWords(text);
      reminderWordCount.textContent = `${wordCount} / 250 words`;
      if (wordCount > 250) {
        reminderWordCount.style.color = "var(--danger)";
      } else {
        reminderWordCount.style.color = "var(--text-muted)";
      }
    });
  }
  
  reminderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (reminderInput.value || "").trim();
    if (!text) return;
    
    // Validate word count
    const wordCount = countWords(text);
    if (wordCount > 250) {
      alert(`Reminder exceeds 250 words. Current word count: ${wordCount}. Please shorten your reminder.`);
      return;
    }
    
    const current = getCurrentStep();
    if (!current) return;
    
    const reminders = loadReminders(current.step.id);
    if (reminders.length >= 5) return;
    reminders.push({ text, completed: false });
    saveReminders(current.step.id, reminders);
    reminderInput.value = "";
    if (reminderWordCount) {
      reminderWordCount.textContent = "0 / 250 words";
      reminderWordCount.style.color = "var(--text-muted)";
    }
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

  // Chit Draw
  const chitDrawBtn = document.getElementById("chit-draw-btn");
  if (chitDrawBtn) {
    chitDrawBtn.addEventListener("click", () => {
    const blueC2 = prompt(`Enter ${state.names.blue} Forces C2 Level (number of chits):`);
    if (blueC2 === null) return; // User cancelled
    
    const blueC2Num = parseInt(blueC2, 10);
    if (isNaN(blueC2Num) || blueC2Num < 0) {
      alert("Please enter a valid number for Blue C2 Level.");
      return;
    }

    const redC2 = prompt(`Enter ${state.names.red} Forces C2 Level (number of chits):`);
    if (redC2 === null) return; // User cancelled
    
    const redC2Num = parseInt(redC2, 10);
    if (isNaN(redC2Num) || redC2Num < 0) {
      alert("Please enter a valid number for Red C2 Level.");
      return;
    }

    if (blueC2Num === 0 && redC2Num === 0) {
      alert("Both C2 Levels cannot be zero.");
      return;
    }

    // Calculate weighted random selection
    const totalChits = blueC2Num + redC2Num;
    const random = Math.random() * totalChits;
    
    let winner;
    if (random < blueC2Num) {
      winner = state.names.blue;
    } else {
      winner = state.names.red;
    }

    // Display result
    const resultEl = document.getElementById("chit-draw-result");
    if (resultEl) {
      resultEl.style.display = "block";
      resultEl.textContent = `Chit Draw Result: ${winner} wins!`;
      resultEl.style.color = winner === state.names.blue ? "#264b96" : "#b71c1c";
      resultEl.style.background = winner === state.names.blue ? "#e0e6f7" : "#ffebee";
    }
    });
  } else {
    console.warn("Chit Draw button not found in DOM");
  }

  // Setup Form
  document.getElementById("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const bInput = document.getElementById("blue-name-input");
    const rInput = document.getElementById("red-name-input");
    const initiativeRadio = document.querySelector("input[name='initiative']:checked");

    setNames(bInput.value, rInput.value);
    setInitiative(initiativeRadio ? initiativeRadio.value : "blue");
    
    const getSelectedUnits = (teamKey) => {
        const inputs = document.querySelectorAll(`input[name='${teamKey}_units_qty']`);
        const unitInstances = []; // Array of unique instance IDs
        const categories = new Set();
        
        inputs.forEach(input => {
            const count = parseInt(input.value, 10);
            if (count > 0) {
                const baseId = input.dataset.id;
                const cat = input.dataset.category;
                categories.add(cat);
                
                for (let i = 1; i <= count; i++) {
                    // Generate unique instance ID: baseId_i
                    unitInstances.push(`${baseId}_${i}`);
                }
            }
        });
        return { ids: unitInstances, cats: Array.from(categories) };
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
  // Simple device detection for responsive UI tweaks.
  // Primary layout is still handled by CSS media queries; this adds a reliable hook.
  const mq = window.matchMedia("(max-width: 720px), (pointer: coarse)");
  const applyDeviceFlag = () => {
    document.documentElement.dataset.device = mq.matches ? "mobile" : "desktop";
  };
  applyDeviceFlag();
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", applyDeviceFlag);
  } else if (typeof mq.addListener === "function") {
    // Safari < 14
    mq.addListener(applyDeviceFlag);
  }

  setupEventListeners();
});
