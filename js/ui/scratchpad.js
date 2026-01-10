// Scratch Pad UI Logic
import { UNIT_DATABASE } from "../data/units.js";
import { state, updateUnitState, addAssetsToInventory } from "../state.js";

// Helper function to escape HTML special characters
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Optimization: Pre-compute unit map for faster lookups
let unitMap = null;
function getUnitDef(baseId, team) {
    if (!unitMap) {
        unitMap = {};
        for (const t of ['blue', 'red']) {
            if (!UNIT_DATABASE[t]) continue;
            for (const cat of Object.keys(UNIT_DATABASE[t])) {
                UNIT_DATABASE[t][cat].forEach(u => {
                    unitMap[u.id] = u;
                });
            }
        }
    }
    return unitMap[baseId];
}

// Sort state for each team (independent sorting)
const sortState = {
    blue: { column: null, direction: 'asc' },
    red: { column: null, direction: 'asc' }
};

// Color coding map (optimized - defined once)
const CATEGORY_COLORS = {
    air: '#4169E1',      // Royal Blue
    naval: '#000080',    // Navy Blue
    ground: '#4B5320',   // Army Green
    cyber: '#9370DB',    // Light Purple
    sam: '#FF8C00',      // Dark Orange
    sof: '#696969'       // Dim Gray
};

// Air asset types
const AIR_ASSETS = [
    { field: 'cas', label: 'CAS' },
    { field: 'cap', label: 'CAP' },
    { field: 'strike', label: 'STRIKE' },
    { field: 'aew', label: 'AEW' },
    { field: 'airAssault', label: 'AIR ASSAULT' },
    { field: 'asw', label: 'ASW' },
    { field: 'transport', label: 'TRANSPORT' },
    { field: 'tanker', label: 'TANKER' }
];

function sortTableRows(team, columnIndex, direction) {
    const table = document.querySelector(".scratch-pad-table");
    if (!table) return;
    
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    
    // Find the separator row for this team
    let teamStartIndex = -1;
    let teamEndIndex = rows.length;
    let foundTargetTeam = false;
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.classList.contains("team-separator")) {
            const teamName = row.textContent.trim();
            const isBlueTeam = teamName.includes(state.names.blue);
            const isRedTeam = teamName.includes(state.names.red);
            
            if ((team === 'blue' && isBlueTeam) || (team === 'red' && isRedTeam)) {
                teamStartIndex = i + 1;
                foundTargetTeam = true;
            } else if (foundTargetTeam && (isBlueTeam || isRedTeam)) {
                // Found the next team's separator, so this is the end
                teamEndIndex = i;
                break;
            }
        }
    }
    
    if (teamStartIndex === -1) return;
    
    // Extract team rows (excluding separator)
    const separatorRow = rows[teamStartIndex - 1];
    const teamRows = rows.slice(teamStartIndex, teamEndIndex);
    const beforeRows = rows.slice(0, teamStartIndex - 1);
    const afterRows = rows.slice(teamEndIndex);
    
    // Sort team rows
    teamRows.sort((a, b) => {
        let aVal, bVal;
        
        switch(columnIndex) {
            case 0: // Unit name
                aVal = a.querySelector('strong')?.textContent || '';
                bVal = b.querySelector('strong')?.textContent || '';
                break;
            case 1: // State (destroyed/active)
                aVal = a.querySelector('input[data-field="destroyed"]')?.checked ? 1 : 0;
                bVal = b.querySelector('input[data-field="destroyed"]')?.checked ? 1 : 0;
                break;
            case 2: // Current Hex
                aVal = a.querySelector('input[data-field="hex"]')?.value || '';
                bVal = b.querySelector('input[data-field="hex"]')?.value || '';
                break;
            case 3: // Role
                aVal = a.querySelector('input[data-field="role"]')?.value || '';
                bVal = b.querySelector('input[data-field="role"]')?.value || '';
                break;
            case 4: // Dest Hex
                aVal = a.querySelector('input[data-field="dest"]')?.value || '';
                bVal = b.querySelector('input[data-field="dest"]')?.value || '';
                break;
            case 5: // Attributes (checkboxes)
                // Sort by number of checked attributes
                aVal = a.querySelectorAll('input[type="checkbox"]:checked').length;
                bVal = b.querySelectorAll('input[type="checkbox"]:checked').length;
                break;
            default:
                return 0;
        }
        
        // Compare values
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return direction === 'asc' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        } else {
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
    });
    
    // Rebuild tbody maintaining order: before rows, separator, sorted team rows, after rows
    tbody.innerHTML = '';
    beforeRows.forEach(row => tbody.appendChild(row));
    tbody.appendChild(separatorRow);
    teamRows.forEach(row => tbody.appendChild(row));
    afterRows.forEach(row => tbody.appendChild(row));
}

function handleHeaderClick(columnIndex, team) {
    // Update sort state for the team
    if (sortState[team].column === columnIndex) {
        // Toggle direction
        sortState[team].direction = sortState[team].direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState[team].column = columnIndex;
        sortState[team].direction = 'asc';
    }
    
    sortTableRows(team, columnIndex, sortState[team].direction);
    updateSortIndicators();
}

function updateSortIndicators() {
    const headers = document.querySelectorAll(".scratch-pad-table th.sortable");
    headers.forEach((header) => {
        const team = header.dataset.team;
        const columnIndex = parseInt(header.dataset.column);
        if (!team) return;
        
        header.classList.remove('sort-asc', 'sort-desc');
        if (sortState[team].column === columnIndex) {
            header.classList.add(sortState[team].direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

export function renderScratchPad() {
  const container = document.getElementById("scratch-pad-container");
  if (!container) return;

  // Ensure the scratch pad table scrolls horizontally within its own area (not the page).
  let scrollWrap = container.querySelector(".scratch-pad-scroll");
  let table = container.querySelector(".scratch-pad-table");
  if (table && !scrollWrap) {
    scrollWrap = document.createElement("div");
    scrollWrap.className = "scratch-pad-scroll";
    table.parentNode.insertBefore(scrollWrap, table);
    scrollWrap.appendChild(table);
  }
  
  // Upgrade check: if table exists but column count mismatches (we added columns), destroy it
  // New column count: Unit, Ops, Hex, Role, Dest, Attributes, Mission Flags = 7
  if (table && table.querySelectorAll("thead th").length !== 7) {
      table.remove();
      table = null;
  }

  // Ensure header with buttons exists (create it first, before table logic)
  let header = container.querySelector(".scratch-pad-header");
  if (!header) {
    header = document.createElement("div");
    header.className = "scratch-pad-header";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "0.5rem";
    header.style.flexWrap = "wrap";
    header.style.gap = "0.5rem";
    
    const titleDiv = document.createElement("div");
    titleDiv.innerHTML = "<h3>Unit Scratch Pad</h3><p>Track position and orders for all assets in play.</p>";
    
    const buttonDiv = document.createElement("div");
    buttonDiv.style.display = "flex";
    buttonDiv.style.gap = "0.5rem";
    buttonDiv.style.flexWrap = "wrap";
    
    const addBlueBtn = document.createElement("button");
    addBlueBtn.textContent = "+ Add Blue Assets";
    addBlueBtn.className = "primary-btn";
    addBlueBtn.style.padding = "0.4rem 0.8rem";
    addBlueBtn.style.fontSize = "0.9rem";
    addBlueBtn.addEventListener("click", () => showAddAssetsModal("blue"));
    
    const addRedBtn = document.createElement("button");
    addRedBtn.textContent = "+ Add Red Assets";
    addRedBtn.className = "primary-btn";
    addRedBtn.style.padding = "0.4rem 0.8rem";
    addRedBtn.style.fontSize = "0.9rem";
    addRedBtn.style.background = "#b71c1c";
    addRedBtn.addEventListener("click", () => showAddAssetsModal("red"));
    
    buttonDiv.appendChild(addBlueBtn);
    buttonDiv.appendChild(addRedBtn);
    header.appendChild(titleDiv);
    header.appendChild(buttonDiv);
    
    // Insert header at the beginning of container
    if (container.firstChild) {
      container.insertBefore(header, container.firstChild);
    } else {
      container.appendChild(header);
    }
  }

  if (!table) {
    scrollWrap = document.createElement("div");
    scrollWrap.className = "scratch-pad-scroll";
    table = document.createElement("table");
    table.className = "scratch-pad-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="sortable" data-team="blue" data-column="0" style="width: 18%;">Unit</th>
          <th class="sortable" data-team="blue" data-column="1" style="width: 8%;">State</th>
          <th class="sortable" data-team="blue" data-column="2" style="width: 12%;">Current Hex</th>
          <th class="sortable" data-team="blue" data-column="3" style="width: 15%;">Role / Status</th>
          <th class="sortable" data-team="blue" data-column="4" style="width: 12%;">Dest. Hex</th>
          <th class="sortable" data-team="blue" data-column="5" style="width: 15%;">Attributes</th>
          <th style="width: 20%;">Mission Flags</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    scrollWrap.appendChild(table);
    container.appendChild(scrollWrap);
    
    // Add click handlers for sortable headers
    // Click to sort blue, Shift+Click to sort red
    const headers = table.querySelectorAll("th.sortable");
    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.title = 'Click to sort Blue | Shift+Click to sort Red';
        header.addEventListener('click', (e) => {
            const columnIndex = parseInt(header.dataset.column);
            const targetTeam = e.shiftKey ? 'red' : 'blue';
            handleHeaderClick(columnIndex, targetTeam);
        });
    });
    
    // Event listeners
    container.addEventListener("input", (e) => {
      const id = e.target.dataset.id;
      const field = e.target.dataset.field;
      if (id && field) {
        if (e.target.type === "checkbox") {
           const checked = e.target.checked;
           updateUnitState(id, field, checked);
           
           // If "destroyed" was toggled, update row style
           if (field === "destroyed") {
             const row = e.target.closest("tr");
             if (row) {
                 if (checked) {
                     row.classList.add("unit-destroyed");
                     row.querySelectorAll("input:not([data-field='destroyed'])").forEach(inp => inp.disabled = true);
                 } else {
                     row.classList.remove("unit-destroyed");
                     row.querySelectorAll("input:not([data-field='destroyed'])").forEach(inp => inp.disabled = false);
                 }
             }
           }
        } else {
           updateUnitState(id, field, e.target.value);
        }
      }
    });
  }
  
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  
  const addUnitRows = (unitIds, team) => {
      if (unitIds.length === 0) return;
      
      // Add Separator
      const sepRow = document.createElement("tr");
      sepRow.className = "team-separator";
      sepRow.innerHTML = `<td colspan="7" style="background: #eef2ff; font-weight: bold; text-align: center; color: var(--accent);">${escapeHtml(team === 'blue' ? state.names.blue : state.names.red)} Forces</td>`;
      tbody.appendChild(sepRow);
      
      // Update headers for this team's sort state
      const headers = table.querySelectorAll("th.sortable");
      headers.forEach(header => {
          if (header.dataset.team === team) {
              header.dataset.team = team;
          }
      });
      
      unitIds.forEach(instId => {
          // Parse base ID with edge case handling
          const lastUnderscore = instId.lastIndexOf("_");
          if (lastUnderscore === -1) {
              console.warn(`Invalid instance ID format: ${instId}`);
              return;
          }
          const baseId = instId.substring(0, lastUnderscore);
          const instanceNum = instId.substring(lastUnderscore + 1);
          
          let unitDef = getUnitDef(baseId, team);
          if (!unitDef) {
              console.warn(`Unit definition not found for: ${baseId} (team: ${team})`);
              return;
          }
          
          const defaultState = { 
              hex: "", role: "", dest: "", 
              stealth: false, detected: false, hasEnhancer: false, destroyed: false,
              cas: false, cap: false, strike: false, aew: false, 
              airAssault: false, asw: false, transport: false, tanker: false 
          };
          const unitState = state.unitStates[instId] || defaultState;
          
          // Color coding based on category (using pre-defined map)
          const unitColor = CATEGORY_COLORS[unitDef.category] || '#333333';
          
          const row = document.createElement("tr");
          row.dataset.unitId = instId;
          row.dataset.team = team;
          if (unitState.destroyed) row.className = "unit-destroyed";
          
          const disabledAttr = unitState.destroyed ? "disabled" : "";
          
          // Build air assets checkboxes
          const airAssetsHTML = AIR_ASSETS.map(asset => 
              `<label class="air-asset-check"><input type="checkbox" data-id="${escapeHtml(instId)}" data-field="${escapeHtml(asset.field)}" ${unitState[asset.field] ? 'checked' : ''} ${disabledAttr}> ${escapeHtml(asset.label)}</label>`
          ).join('');
          
          row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="assets/${escapeHtml(unitDef.id)}.png" alt="Img" style="width: 24px; height: 24px; object-fit: contain; border-radius: 2px; border: 1px solid #ddd;" onerror="this.style.display='none'">
                    <div>
                        <strong style="color: ${unitColor};">${escapeHtml(unitDef.name)}</strong> 
                        <span style="font-size:0.8em; color:#666">#${escapeHtml(instanceNum)}</span>
                    </div>
                </div>
            </td>
            <td style="text-align: center;">
               <label class="toggle-switch">
                 <input type="checkbox" data-id="${escapeHtml(instId)}" data-field="destroyed" ${unitState.destroyed ? 'checked' : ''}>
                 <span class="slider"></span>
                 <span class="label-text" style="font-size: 0.75rem;">${unitState.destroyed ? 'Destroyed' : 'Active'}</span>
               </label>
            </td>
            <td><input type="text" data-id="${escapeHtml(instId)}" data-field="hex" value="${escapeHtml(unitState.hex || '')}" placeholder="Hex..." ${disabledAttr}></td>
            <td><input type="text" data-id="${escapeHtml(instId)}" data-field="role" value="${escapeHtml(unitState.role || '')}" placeholder="Role..." ${disabledAttr}></td>
            <td><input type="text" data-id="${escapeHtml(instId)}" data-field="dest" value="${escapeHtml(unitState.dest || '')}" placeholder="Dest..." ${disabledAttr}></td>
            <td>
            <div class="status-checks">
                <label><input type="checkbox" data-id="${escapeHtml(instId)}" data-field="stealth" ${unitState.stealth ? 'checked' : ''} ${disabledAttr}> Stealth</label>
                <label><input type="checkbox" data-id="${escapeHtml(instId)}" data-field="detected" ${unitState.detected ? 'checked' : ''} ${disabledAttr}> Detected</label>
                <label><input type="checkbox" data-id="${escapeHtml(instId)}" data-field="hasEnhancer" ${unitState.hasEnhancer ? 'checked' : ''} ${disabledAttr}> Has Enhancer</label>
            </div>
            </td>
            <td>
            <div class="air-assets-checks">
                ${airAssetsHTML}
            </div>
            </td>
          `;
          tbody.appendChild(row);
      });
      
      // Apply sorting if active for this team
      if (sortState[team].column !== null) {
          sortTableRows(team, sortState[team].column, sortState[team].direction);
      }
  };
  
  addUnitRows(state.inventory.blueUnits, "blue");
  addUnitRows(state.inventory.redUnits, "red");
  
  // Update sort indicators after rendering
  updateSortIndicators();
}

function showAddAssetsModal(team) {
  const overlay = document.createElement("div");
  overlay.className = "setup-overlay";
  
  const card = document.createElement("div");
  card.className = "setup-card";
  
  const teamName = team === 'blue' ? state.names.blue : state.names.red;
  card.innerHTML = `
    <h2>Add ${teamName} Assets</h2>
    <p>Select additional assets to add to the scratch pad.</p>
    <div class="setup-row">
        <h3>${teamName} Team Assets</h3>
        <div id="add-assets-inventory-container" class="inventory-container">
            <!-- Populated by renderInventorySelection -->
        </div>
    </div>
    <div class="setup-row" style="margin-top: 1rem; flex-direction: row; gap: 1rem;">
       <button id="add-assets-cancel-btn" class="primary-btn" style="background: #666;">Cancel</button>
       <button id="add-assets-confirm-btn" class="primary-btn">Add Assets</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  
  // Render inventory selection
  const container = document.getElementById("add-assets-inventory-container");
  container.innerHTML = "";
  
  const teamData = UNIT_DATABASE[team];
  if (!teamData) {
    overlay.remove();
    alert(`No unit data found for ${team} team.`);
    return;
  }
  
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
      img.src = `assets/${unit.id}.png`;
      img.alt = "Unit";
      img.style.width = "40px";
      img.style.height = "40px";
      img.style.objectFit = "contain";
      img.style.border = "1px solid #ccc";
      img.style.borderRadius = "4px";
      img.onerror = () => { img.style.display = 'none'; };
      
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
      qtyInput.name = `${team}_add_units_qty`;
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
  
  // Cancel button
  document.getElementById("add-assets-cancel-btn").addEventListener("click", () => {
    overlay.remove();
  });
  
  // Confirm button
  document.getElementById("add-assets-confirm-btn").addEventListener("click", () => {
    const getSelectedUnits = () => {
      const inputs = container.querySelectorAll(`input[name='${team}_add_units_qty']`);
      const unitInstances = [];
      const categories = new Set();
      
      inputs.forEach(input => {
        const count = parseInt(input.value, 10);
        if (count > 0) {
          const baseId = input.dataset.id;
          const cat = input.dataset.category;
          categories.add(cat);
          
          // Find max instance number for this base unit
          const existingUnits = team === 'blue' ? state.inventory.blueUnits : state.inventory.redUnits;
          let maxInstance = 0;
          existingUnits.forEach(id => {
            if (id.startsWith(baseId + '_')) {
              const num = parseInt(id.split('_').pop(), 10);
              if (!isNaN(num) && num > maxInstance) maxInstance = num;
            }
          });
          
          // Generate new instances starting from maxInstance + 1
          for (let i = 1; i <= count; i++) {
            unitInstances.push(`${baseId}_${maxInstance + i}`);
          }
        }
      });
      return { ids: unitInstances, cats: Array.from(categories) };
    };
    
    const selectedData = getSelectedUnits();
    
    if (selectedData.ids.length === 0) {
      alert("Please select at least one asset to add.");
      return;
    }
    
    // Add assets to inventory
    const newInventory = {
      blue: team === 'blue' ? selectedData.cats : [],
      blueUnits: team === 'blue' ? selectedData.ids : [],
      red: team === 'red' ? selectedData.cats : [],
      redUnits: team === 'red' ? selectedData.ids : []
    };
    
    addAssetsToInventory(newInventory);
    
    overlay.remove();
    
    // Re-render scratch pad to show new assets
    renderScratchPad();
  });
}
