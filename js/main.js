// Main Entry Point

import { UNIT_DATABASE } from "./data/units.js";
import { state, setInventory, setNames, setInitiative, addDiceRoll, rebuildSequence, resetIndices, getCurrentStep, currentFlatIndex, getUnitState, updateUnitState } from "./state.js";
// Cache-bust scratchpad module so mobile devices pick up UI updates promptly.
import { renderScratchPad } from "./ui/scratchpad.js?v=18";
import { renderStep, renderDice, renderModeHeader, renderReminders } from "./ui/rendering.js";
import { loadReminders, saveReminders, rollDie, savePreset, loadPreset, loadAllPresets, deletePreset } from "./utils.js";

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
      // Determine team for unitId
      let team = 'blue';
      if (state.inventory.redUnits.includes(unitId)) {
        team = 'red';
      }
      const unitState = getUnitState(unitId, team);
      const isDestroyed = unitState && unitState.destroyed;
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

  const regenConfirmBtn = document.getElementById("regen-confirm-btn");
  if (!regenConfirmBtn) {
    console.error("Regeneration confirm button not found");
    return;
  }
  regenConfirmBtn.addEventListener("click", () => {
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
      // Process all units from both teams
      [...state.inventory.blueUnits, ...state.inventory.redUnits].forEach(id => {
          const team = state.inventory.blueUnits.includes(id) ? 'blue' : 'red';
          const unitState = getUnitState(id, team);
          
          if (unitState.dest) {
              updateUnitState(id, 'hex', unitState.dest, team);
          }
          updateUnitState(id, 'dest', "", team);
          updateUnitState(id, 'role', "", team);
          updateUnitState(id, 'stealth', false, team);
          updateUnitState(id, 'detected', false, team);
          updateUnitState(id, 'destroyed', false, team); // Reset destroyed flag if they kept it
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
        img.onerror = () => { 
          img.style.display = 'none'; // Hide if missing
          // Suppress 404 console errors for missing assets (expected until images are added)
        };

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

// Store custom assets added during setup
let customAssets = {
  blue: [],
  red: []
};

// Generate a unique base ID from a custom asset name
function generateCustomBaseId(name, team) {
  // Sanitize name: lowercase, replace spaces/special chars with underscores
  let baseId = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Ensure it starts with a letter
  if (!/^[a-z]/.test(baseId)) {
    baseId = 'custom_' + baseId;
  }
  
  // Add team prefix to ensure uniqueness
  baseId = `custom_${team}_${baseId}`;
  
  // Ensure uniqueness by appending number if needed
  let finalId = baseId;
  let counter = 1;
  while (customAssets[team].some(a => a.id === finalId)) {
    finalId = `${baseId}_${counter}`;
    counter++;
  }
  
  return finalId;
}

function setupCustomAssetHandlers() {
  // Blue team custom asset handler
  const blueAddBtn = document.getElementById("blue-add-custom-btn");
  const blueNameInput = document.getElementById("blue-custom-name");
  const blueCategorySelect = document.getElementById("blue-custom-category");
  const blueQtyInput = document.getElementById("blue-custom-qty");
  const blueListDiv = document.getElementById("blue-custom-assets-list");
  
  if (blueAddBtn) {
    blueAddBtn.addEventListener("click", () => {
      const name = blueNameInput.value.trim();
      const category = blueCategorySelect.value;
      const qty = parseInt(blueQtyInput.value, 10) || 1;
      
      if (!name) {
        alert("Please enter an asset name.");
        return;
      }
      
      const baseId = generateCustomBaseId(name, 'blue');
      const customAsset = {
        id: baseId,
        name: name,
        category: category
      };
      
      // Add to custom assets list
      for (let i = 0; i < qty; i++) {
        customAssets.blue.push({ ...customAsset, instance: i + 1 });
      }
      
      // Update display
      updateCustomAssetsList('blue', blueListDiv);
      
      // Clear inputs
      blueNameInput.value = "";
      blueQtyInput.value = "1";
    });
    
    // Allow Enter key to add
    blueNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        blueAddBtn.click();
      }
    });
  }
  
  // Red team custom asset handler
  const redAddBtn = document.getElementById("red-add-custom-btn");
  const redNameInput = document.getElementById("red-custom-name");
  const redCategorySelect = document.getElementById("red-custom-category");
  const redQtyInput = document.getElementById("red-custom-qty");
  const redListDiv = document.getElementById("red-custom-assets-list");
  
  if (redAddBtn) {
    redAddBtn.addEventListener("click", () => {
      const name = redNameInput.value.trim();
      const category = redCategorySelect.value;
      const qty = parseInt(redQtyInput.value, 10) || 1;
      
      if (!name) {
        alert("Please enter an asset name.");
        return;
      }
      
      const baseId = generateCustomBaseId(name, 'red');
      const customAsset = {
        id: baseId,
        name: name,
        category: category
      };
      
      // Add to custom assets list
      for (let i = 0; i < qty; i++) {
        customAssets.red.push({ ...customAsset, instance: i + 1 });
      }
      
      // Update display
      updateCustomAssetsList('red', redListDiv);
      
      // Clear inputs
      redNameInput.value = "";
      redQtyInput.value = "1";
    });
    
    // Allow Enter key to add
    redNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        redAddBtn.click();
      }
    });
  }
}

function updateCustomAssetsList(team, container) {
  if (!container) return;
  
  const assets = customAssets[team];
  if (assets.length === 0) {
    container.innerHTML = "";
    return;
  }
  
  // Group by base ID
  const grouped = {};
  assets.forEach(asset => {
    if (!grouped[asset.id]) {
      grouped[asset.id] = [];
    }
    grouped[asset.id].push(asset);
  });
  
  let html = "<div style='display: flex; flex-direction: column; gap: 0.3rem;'>";
  Object.keys(grouped).forEach(baseId => {
    const instances = grouped[baseId];
    const asset = instances[0];
    const count = instances.length;
    html += `<div style='display: flex; justify-content: space-between; align-items: center; padding: 0.3rem; background: #f5f5f5; border-radius: 4px;'>`;
    html += `<span><strong>${escapeHtml(asset.name)}</strong> (${asset.category}) × ${count}</span>`;
    html += `<button type='button' class='remove-custom-btn' data-team='${team}' data-baseid='${baseId}' style='padding: 0.2rem 0.5rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;'>Remove</button>`;
    html += `</div>`;
  });
  html += "</div>";
  
  container.innerHTML = html;
  
  // Add remove button handlers
  container.querySelectorAll('.remove-custom-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      const team = btn.dataset.team;
      const baseId = btn.dataset.baseid;
      customAssets[team] = customAssets[team].filter(a => a.id !== baseId);
      updateCustomAssetsList(team, container);
    });
  });
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function setupEventListeners() {
  try {
    renderInventorySelection();
    setupCustomAssetHandlers();
  } catch (e) {
    console.error("Failed to render inventory:", e);
    alert("Error loading unit database. Please check console.");
  }

  // Nav clicks
  const phaseList = document.getElementById("phase-list");
  if (phaseList) {
    phaseList.addEventListener("click", (e) => {
      const btn = e.target.closest("button.phase-button");
      if (!btn) return;
      const index = parseInt(btn.dataset.phaseIndex, 10);
      if (!isNaN(index)) goToPhase(index);
    });
  }

  const prevStepBtn = document.getElementById("prev-step-btn");
  if (prevStepBtn) {
    prevStepBtn.addEventListener("click", goPrev);
  }

  const nextStepBtn = document.getElementById("next-step-btn");
  if (nextStepBtn) {
    nextStepBtn.addEventListener("click", goNext);
  }

  const stepJumpSelect = document.getElementById("step-jump-select");
  if (stepJumpSelect) {
    stepJumpSelect.addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!isNaN(idx)) goToFlatIndex(idx);
    });
  }

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
  
  if (reminderForm) {
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
  }

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

  // Load Presets button (setup screen)
  const loadPresetsBtn = document.getElementById("load-presets-btn");
  if (loadPresetsBtn) {
    loadPresetsBtn.addEventListener("click", showLoadPresetsModal);
  }

  // Save Presets button (main game screen)
  const savePresetsBtn = document.getElementById("save-presets-btn");
  if (savePresetsBtn) {
    savePresetsBtn.addEventListener("click", showSavePresetModal);
  }

  // Setup Form
  const setupForm = document.getElementById("setup-form");
  if (!setupForm) {
    console.error("Setup form not found in DOM");
    return;
  }
  setupForm.addEventListener("submit", (e) => {
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
        
        // Add custom assets
        const customAssetsForTeam = customAssets[teamKey];
        if (customAssetsForTeam && customAssetsForTeam.length > 0) {
            // Group by base ID
            const grouped = {};
            customAssetsForTeam.forEach(asset => {
                if (!grouped[asset.id]) {
                    grouped[asset.id] = [];
                }
                grouped[asset.id].push(asset);
            });
            
            Object.keys(grouped).forEach(baseId => {
                const instances = grouped[baseId];
                const asset = instances[0];
                categories.add(asset.category);
                
                instances.forEach((inst) => {
                    unitInstances.push(`${baseId}_${inst.instance}`);
                });
            });
        }
        
        return { ids: unitInstances, cats: Array.from(categories) };
    };

    const blueData = getSelectedUnits("blue");
    const redData = getSelectedUnits("red");

    // Check if we're loading from a preset
    let presetToLoad = window.pendingPresetLoad;
    if (presetToLoad) {
      // Use preset data instead of form data
      setInventory({
        blue: presetToLoad.inventory.blue,
        blueUnits: presetToLoad.inventory.blueUnits,
        red: presetToLoad.inventory.red,
        redUnits: presetToLoad.inventory.redUnits
      });
      
      // Restore unit states
      if (presetToLoad.unitStates) {
        state.unitStates = JSON.parse(JSON.stringify(presetToLoad.unitStates));
      }
      
      // Restore custom asset definitions
      if (presetToLoad.customAssets) {
        window.customAssetDefinitions = JSON.parse(JSON.stringify(presetToLoad.customAssets));
      }
      
      // Clear pending preset
      window.pendingPresetLoad = null;
    } else {
      setInventory({
        blue: blueData.cats,
        blueUnits: blueData.ids,
        red: redData.cats,
        redUnits: redData.ids
      });

      // Store custom asset definitions for later lookup
      // We'll store them in a way that getUnitDef can access them
      window.customAssetDefinitions = {};
      Object.keys(customAssets).forEach(team => {
        if (!window.customAssetDefinitions[team]) {
          window.customAssetDefinitions[team] = {};
        }
        customAssets[team].forEach(asset => {
          if (!window.customAssetDefinitions[team][asset.id]) {
            window.customAssetDefinitions[team][asset.id] = {
              id: asset.id,
              name: asset.name,
              category: asset.category
            };
          }
        });
      });
    }

    // Reset custom assets for next game
    customAssets = { blue: [], red: [] };

    resetIndices();

    document.getElementById("setup-overlay").style.display = "none";
    document.getElementById("app-root").hidden = false;

    renderModeHeader();
    renderStep();
    renderDice();
    renderScratchPad(); // Initial render of persistent scratchpad
  });
}

function showLoadPresetsModal() {
  const overlay = document.createElement("div");
  overlay.className = "setup-overlay";
  overlay.style.zIndex = "10000";
  
  const modal = document.createElement("div");
  modal.className = "setup-card";
  modal.style.maxWidth = "600px";
  
  const presets = loadAllPresets();
  const presetNames = Object.keys(presets).sort();
  
  let html = `
    <h2>Load Preset</h2>
    <p style="margin-bottom: 1rem; color: #666;">Select a preset to load, or cancel to continue with current setup.</p>
  `;
  
  if (presetNames.length === 0) {
    html += `
      <p style="text-align: center; padding: 2rem; color: #999;">No presets saved yet.</p>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button id="load-presets-cancel-btn" class="primary-btn" style="flex: 1; background: #666;">Cancel</button>
      </div>
    `;
  } else {
    html += `
      <div style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem;">
    `;
    
    presetNames.forEach(name => {
      const preset = presets[name];
      const savedDate = preset.savedAt ? new Date(preset.savedAt).toLocaleString() : 'Unknown date';
      html += `
        <div class="preset-item" style="padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; cursor: pointer; transition: background 0.2s;" data-preset-name="${escapeHtml(name)}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 1.1rem;">${escapeHtml(name)}</strong>
              <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                Saved: ${escapeHtml(savedDate)}
              </div>
            </div>
            <button class="delete-preset-btn" data-preset-name="${escapeHtml(name)}" style="padding: 0.3rem 0.6rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; margin-left: 0.5rem;" onclick="event.stopPropagation();">Delete</button>
          </div>
        </div>
      `;
    });
    
    html += `
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="load-presets-cancel-btn" class="primary-btn" style="flex: 1; background: #666;">Cancel</button>
      </div>
    `;
  }
  
  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Cancel button
  document.getElementById("load-presets-cancel-btn").addEventListener("click", () => {
    overlay.remove();
  });
  
  // Load preset on item click
  modal.querySelectorAll(".preset-item").forEach(item => {
    item.addEventListener("click", () => {
      const presetName = item.dataset.presetName;
      loadPresetIntoSetup(presetName);
      overlay.remove();
    });
  });
  
  // Delete preset buttons
  modal.querySelectorAll(".delete-preset-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const presetName = btn.dataset.presetName;
      if (confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
        deletePreset(presetName);
        overlay.remove();
        showLoadPresetsModal(); // Refresh the modal
      }
    });
  });
}

function loadPresetIntoSetup(presetName) {
  const preset = loadPreset(presetName);
  if (!preset) {
    alert(`Preset "${presetName}" not found.`);
    return;
  }
  
  // Load player names
  const blueNameInput = document.getElementById("blue-name-input");
  const redNameInput = document.getElementById("red-name-input");
  if (blueNameInput && preset.names) {
    blueNameInput.value = preset.names.blue || "Blue";
  }
  if (redNameInput && preset.names) {
    redNameInput.value = preset.names.red || "Red";
  }
  
  // Load initiative
  if (preset.initiative) {
    const initiativeRadio = document.querySelector(`input[name='initiative'][value='${preset.initiative}']`);
    if (initiativeRadio) {
      initiativeRadio.checked = true;
    }
  }
  
  // Load inventory (this will require re-rendering the inventory selection)
  // We'll need to store the preset data and apply it when the form is submitted
  window.pendingPresetLoad = preset;
  
  // Restore custom assets
  if (preset.customAssets && typeof preset.customAssets === 'object') {
    try {
      // Need to convert customAssets format from saved format to working format
      const blueCustom = [];
      const redCustom = [];
      Object.keys(preset.customAssets).forEach(team => {
        if (preset.customAssets[team] && typeof preset.customAssets[team] === 'object') {
          Object.keys(preset.customAssets[team]).forEach(baseId => {
            const asset = preset.customAssets[team][baseId];
            if (asset && asset.name && asset.category) {
              const teamArray = team === 'blue' ? blueCustom : redCustom;
              // Find all instances of this asset
              const teamUnits = team === 'blue' ? preset.inventory.blueUnits : preset.inventory.redUnits;
              if (Array.isArray(teamUnits)) {
                const instances = teamUnits.filter(id => {
                  if (typeof id !== 'string') return false;
                  const lastUnderscore = id.lastIndexOf("_");
                  const unitBaseId = lastUnderscore >= 0 ? id.substring(0, lastUnderscore) : id;
                  return unitBaseId === baseId;
                });
                instances.forEach((id, idx) => {
                  teamArray.push({
                    id: baseId,
                    name: asset.name,
                    category: asset.category,
                    instance: idx + 1
                  });
                });
              }
            }
          });
        }
      });
      customAssets.blue = blueCustom;
      customAssets.red = redCustom;
      const blueListDiv = document.getElementById("blue-custom-assets-list");
      const redListDiv = document.getElementById("red-custom-assets-list");
      if (blueListDiv) updateCustomAssetsList('blue', blueListDiv);
      if (redListDiv) updateCustomAssetsList('red', redListDiv);
    } catch (error) {
      console.error('Error restoring custom assets:', error);
      // Continue without custom assets if there's an error
    }
  }
  
  // Restore inventory quantities
  if (preset.inventory) {
    // Parse instance IDs to get base IDs and quantities
    const blueQuantities = {};
    const redQuantities = {};
    
    preset.inventory.blueUnits.forEach(id => {
      const lastUnderscore = id.lastIndexOf("_");
      const baseId = lastUnderscore >= 0 ? id.substring(0, lastUnderscore) : id;
      blueQuantities[baseId] = (blueQuantities[baseId] || 0) + 1;
    });
    
    preset.inventory.redUnits.forEach(id => {
      const lastUnderscore = id.lastIndexOf("_");
      const baseId = lastUnderscore >= 0 ? id.substring(0, lastUnderscore) : id;
      redQuantities[baseId] = (redQuantities[baseId] || 0) + 1;
    });
    
    // Set quantities in the form
    Object.keys(blueQuantities).forEach(baseId => {
      const input = document.querySelector(`input[name='blue_units_qty'][data-id='${baseId}']`);
      if (input) {
        input.value = blueQuantities[baseId];
      }
    });
    
    Object.keys(redQuantities).forEach(baseId => {
      const input = document.querySelector(`input[name='red_units_qty'][data-id='${baseId}']`);
      if (input) {
        input.value = redQuantities[baseId];
      }
    });
  }
  
  alert(`Preset "${presetName}" loaded! Review your selections and click "Start turn" when ready.`);
}

function showSavePresetModal() {
  const overlay = document.createElement("div");
  overlay.className = "setup-overlay";
  overlay.style.zIndex = "10000";
  
  const modal = document.createElement("div");
  modal.className = "setup-card";
  modal.style.maxWidth = "500px";
  
  modal.innerHTML = `
    <h2>Save Preset</h2>
    <p style="margin-bottom: 1rem; color: #666;">Save your current game configuration (assets, custom assets, player names, initiative, and unit states) as a preset.</p>
    <div style="margin-bottom: 1rem;">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Preset Name:</label>
      <input type="text" id="preset-name-input" placeholder="Enter preset name..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;" maxlength="50">
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <button id="save-preset-cancel-btn" class="primary-btn" style="flex: 1; background: #666;">Cancel</button>
      <button id="save-preset-confirm-btn" class="primary-btn" style="flex: 1;">Save</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus on input
  const nameInput = document.getElementById("preset-name-input");
  if (nameInput) {
    nameInput.focus();
  }
  
  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Cancel button
  document.getElementById("save-preset-cancel-btn").addEventListener("click", () => {
    overlay.remove();
  });
  
  // Save button
  document.getElementById("save-preset-confirm-btn").addEventListener("click", () => {
    const presetName = nameInput.value.trim();
    if (!presetName) {
      alert("Please enter a preset name.");
      return;
    }
    
    // Check if preset already exists
    const existingPresets = loadAllPresets();
    if (existingPresets[presetName]) {
      if (!confirm(`Preset "${presetName}" already exists. Overwrite it?`)) {
        return;
      }
    }
    
    // Collect current game state
    const presetData = {
      inventory: {
        blue: [...state.inventory.blue],
        red: [...state.inventory.red],
        blueUnits: [...state.inventory.blueUnits],
        redUnits: [...state.inventory.redUnits]
      },
      names: {
        blue: state.names.blue,
        red: state.names.red
      },
      initiative: state.initiative,
      unitStates: JSON.parse(JSON.stringify(state.unitStates)), // Deep copy
      customAssets: window.customAssetDefinitions ? JSON.parse(JSON.stringify(window.customAssetDefinitions)) : {}
    };
    
    if (savePreset(presetName, presetData)) {
      alert(`Preset "${presetName}" saved successfully!`);
      overlay.remove();
    } else {
      alert("Failed to save preset. Please try again.");
    }
  });
  
  // Allow Enter key to save
  nameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("save-preset-confirm-btn").click();
    }
  });
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
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
