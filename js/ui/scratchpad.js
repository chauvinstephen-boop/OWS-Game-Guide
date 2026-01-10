// Scratch Pad UI Logic
import { UNIT_DATABASE } from "../data/units.js";
import { state, updateUnitState, addAssetsToInventory } from "../state.js";
import { HEX_COORDINATES } from "../data/hex-coordinates.js";

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
    
    const viewBoardBtn = document.createElement("button");
    viewBoardBtn.textContent = "📍 View Board Positions";
    viewBoardBtn.className = "primary-btn";
    viewBoardBtn.style.padding = "0.4rem 0.8rem";
    viewBoardBtn.style.fontSize = "0.9rem";
    viewBoardBtn.style.background = "#4a5568";
    viewBoardBtn.addEventListener("click", () => showBoardPositionsModal());
    
    buttonDiv.appendChild(addBlueBtn);
    buttonDiv.appendChild(addRedBtn);
    buttonDiv.appendChild(viewBoardBtn);
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
              `<label class="air-asset-check"><input type="checkbox" id="${escapeHtml(asset.field)}-${escapeHtml(instId)}" name="${escapeHtml(asset.field)}-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="${escapeHtml(asset.field)}" ${unitState[asset.field] ? 'checked' : ''} ${disabledAttr}> ${escapeHtml(asset.label)}</label>`
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
                 <input type="checkbox" id="destroyed-${escapeHtml(instId)}" name="destroyed-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="destroyed" ${unitState.destroyed ? 'checked' : ''}>
                 <span class="slider"></span>
                 <span class="label-text" style="font-size: 0.75rem;">${unitState.destroyed ? 'Destroyed' : 'Active'}</span>
               </label>
            </td>
            <td><input type="text" id="hex-${escapeHtml(instId)}" name="hex-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="hex" value="${escapeHtml(unitState.hex || '')}" placeholder="Hex..." ${disabledAttr}></td>
            <td><input type="text" id="role-${escapeHtml(instId)}" name="role-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="role" value="${escapeHtml(unitState.role || '')}" placeholder="Role..." ${disabledAttr}></td>
            <td><input type="text" id="dest-${escapeHtml(instId)}" name="dest-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="dest" value="${escapeHtml(unitState.dest || '')}" placeholder="Dest..." ${disabledAttr}></td>
            <td>
            <div class="status-checks">
                <label><input type="checkbox" id="stealth-${escapeHtml(instId)}" name="stealth-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="stealth" ${unitState.stealth ? 'checked' : ''} ${disabledAttr}> Stealth</label>
                <label><input type="checkbox" id="detected-${escapeHtml(instId)}" name="detected-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="detected" ${unitState.detected ? 'checked' : ''} ${disabledAttr}> Detected</label>
                <label><input type="checkbox" id="hasEnhancer-${escapeHtml(instId)}" name="hasEnhancer-${escapeHtml(instId)}" data-id="${escapeHtml(instId)}" data-field="hasEnhancer" ${unitState.hasEnhancer ? 'checked' : ''} ${disabledAttr}> Has Enhancer</label>
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

// Hex coordinates are imported from hex-coordinates.js
// See that file for instructions on how to populate the coordinate mapping

function showBoardPositionsModal() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
  overlay.style.zIndex = "10000";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "1rem";
  
  const modal = document.createElement("div");
  modal.style.backgroundColor = "#fff";
  modal.style.borderRadius = "8px";
  modal.style.padding = "1.5rem";
  modal.style.maxWidth = "95vw";
  modal.style.maxHeight = "95vh";
  modal.style.overflow = "auto";
  modal.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  
  const title = document.createElement("h2");
  title.textContent = "Board Positions";
  title.style.marginTop = "0";
  title.style.marginBottom = "1rem";
  modal.appendChild(title);
  
  // Create tabs for Board View and List View
  const tabContainer = document.createElement("div");
  tabContainer.style.display = "flex";
  tabContainer.style.gap = "0.5rem";
  tabContainer.style.marginBottom = "1rem";
  tabContainer.style.borderBottom = "2px solid #ddd";
  
  const boardTab = document.createElement("button");
  boardTab.textContent = "📍 Board View";
  boardTab.className = "primary-btn";
  boardTab.style.background = "#4a5568";
  boardTab.style.border = "none";
  boardTab.style.borderRadius = "4px 4px 0 0";
  boardTab.style.padding = "0.5rem 1rem";
  boardTab.style.cursor = "pointer";
  
  const listTab = document.createElement("button");
  listTab.textContent = "📋 List View";
  listTab.style.background = "transparent";
  listTab.style.border = "none";
  listTab.style.borderRadius = "4px 4px 0 0";
  listTab.style.padding = "0.5rem 1rem";
  listTab.style.cursor = "pointer";
  listTab.style.color = "#666";
  
  const contentArea = document.createElement("div");
  contentArea.style.flex = "1";
  contentArea.style.overflow = "auto";
  
  // Board View
  const boardView = document.createElement("div");
  boardView.id = "board-view-container";
  boardView.style.display = "block";
  
  const boardWrapper = document.createElement("div");
  boardWrapper.style.position = "relative";
  boardWrapper.style.width = "100%";
  boardWrapper.style.maxWidth = "1200px";
  boardWrapper.style.margin = "0 auto";
  boardWrapper.style.backgroundColor = "#f5f5f5";
  boardWrapper.style.borderRadius = "4px";
  boardWrapper.style.padding = "1rem";
  
  const gameboardImg = document.createElement("img");
  gameboardImg.src = "gameboard.png";
  gameboardImg.alt = "Gameboard";
  gameboardImg.style.width = "100%";
  gameboardImg.style.height = "auto";
  gameboardImg.style.display = "block";
  gameboardImg.style.borderRadius = "4px";
  gameboardImg.onerror = function() {
    const errorMsg = document.createElement("div");
    errorMsg.style.padding = "2rem";
    errorMsg.style.textAlign = "center";
    errorMsg.style.color = "#666";
    errorMsg.innerHTML = "<p><strong>Gameboard image not found.</strong></p><p>Please extract page 1 from 'Gameboard and Pieces.pdf' and save it as 'gameboard.png' in the root directory.</p><p style='font-size: 0.9em; margin-top: 0.5rem;'>You can use a PDF viewer to export page 1 as PNG, or use an online PDF to image converter.</p>";
    boardWrapper.innerHTML = "";
    boardWrapper.appendChild(errorMsg);
  };
  
  boardWrapper.appendChild(gameboardImg);
  
  // Create overlay container for asset markers
  const overlayContainer = document.createElement("div");
  overlayContainer.style.position = "absolute";
  overlayContainer.style.top = "0";
  overlayContainer.style.left = "0";
  overlayContainer.style.width = "100%";
  overlayContainer.style.height = "100%";
  overlayContainer.style.pointerEvents = "none";
  
  // Group assets by hex
  const hexMap = {
    blue: {},
    red: {}
  };
  
  const allUnits = [
    ...state.inventory.blueUnits.map(id => ({ id, team: 'blue' })),
    ...state.inventory.redUnits.map(id => ({ id, team: 'red' }))
  ];
  
  allUnits.forEach(({ id, team }) => {
    const unitState = state.unitStates[id] || {};
    const hex = (unitState.hex || '').trim().toUpperCase();
    
    // Skip empty hexes and unassigned (they'll show in list view)
    if (!hex || hex === '' || hex === 'UNASSIGNED') return;
    
    // Normalize hex to uppercase for consistent lookup
    const hexKey = hex.toUpperCase();
    if (!hexMap[team][hexKey]) {
      hexMap[team][hexKey] = [];
    }
    hexMap[team][hexKey].push(id);
  });
  
  // Function to create and position markers
  // Track currently open tooltip to close it when another is clicked
  let currentOpenTooltip = null;
  
  const createMarkers = function() {
    // Clear any existing markers
    overlayContainer.innerHTML = '';
    currentOpenTooltip = null;
    
    // First, collect all hexes that have assets (from either team)
    const allHexes = new Set();
    Object.keys(hexMap).forEach(team => {
      Object.keys(hexMap[team]).forEach(hex => {
        if (hexMap[team][hex].length > 0) {
          allHexes.add(hex.toUpperCase());
        }
      });
    });
    
    // Create markers for each hex
    allHexes.forEach(hexUpper => {
      const coords = HEX_COORDINATES[hexUpper];
      if (!coords) {
        // If hex not in coordinate map, skip visual marker (will show in list)
        return;
      }
      
      // Validate coordinates
      if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number' ||
          isNaN(coords.x) || isNaN(coords.y) ||
          coords.x < 0 || coords.x > 100 || coords.y < 0 || coords.y > 100) {
        console.warn(`Invalid or missing coordinates for hex ${hexUpper}:`, coords);
        return;
      }
      
      // Check which teams have assets in this hex
      const teamsInHex = [];
      if (hexMap.blue[hexUpper] && hexMap.blue[hexUpper].length > 0) {
        teamsInHex.push('blue');
      }
      if (hexMap.red[hexUpper] && hexMap.red[hexUpper].length > 0) {
        teamsInHex.push('red');
      }
      
      // Create a marker for each team in this hex
      teamsInHex.forEach((team, teamIndex) => {
        const assets = hexMap[team][hexUpper];
        
        // Calculate offset for multiple teams in same hex
        // If both teams, offset them slightly so both are visible
        let offsetX = 0;
        let offsetY = 0;
        if (teamsInHex.length > 1) {
          // Offset blue to the left, red to the right
          if (team === 'blue') {
            offsetX = -2; // 2% to the left
          } else {
            offsetX = 2; // 2% to the right
          }
        }
        
        const markerContainer = document.createElement("div");
        markerContainer.style.position = "absolute";
        markerContainer.style.left = `${coords.x + offsetX}%`;
        markerContainer.style.top = `${coords.y + offsetY}%`;
        markerContainer.style.transform = "translate(-50%, -50%)";
        markerContainer.style.pointerEvents = "auto";
        markerContainer.style.cursor = "pointer";
        markerContainer.style.zIndex = team === 'red' ? "11" : "10"; // Red slightly higher for visibility
        markerContainer.setAttribute("data-hex", hexUpper);
        markerContainer.setAttribute("data-team", team);
        
        // Create marker dot
        const marker = document.createElement("div");
        marker.style.width = "28px";
        marker.style.height = "28px";
        marker.style.borderRadius = "50%";
        marker.style.backgroundColor = team === 'blue' ? '#264b96' : '#b71c1c';
        marker.style.border = "3px solid #fff";
        marker.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        marker.style.display = "flex";
        marker.style.alignItems = "center";
        marker.style.justifyContent = "center";
        marker.style.fontWeight = "bold";
        marker.style.color = "#fff";
        marker.style.fontSize = "0.75rem";
        marker.style.minWidth = "28px";
        marker.textContent = assets.length > 9 ? "9+" : assets.length.toString();
        
        // Tooltip with asset list
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.bottom = "100%";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.marginBottom = "0.5rem";
        tooltip.style.padding = "0.5rem 0.75rem";
        tooltip.style.backgroundColor = "#333";
        tooltip.style.color = "#fff";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "0.8rem";
        tooltip.style.whiteSpace = "normal";
        tooltip.style.maxWidth = "200px";
        tooltip.style.textAlign = "left";
        tooltip.style.opacity = "0";
        tooltip.style.pointerEvents = "none";
        tooltip.style.transition = "opacity 0.2s";
        tooltip.style.zIndex = "20";
        tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        
        const tooltipTitle = document.createElement("div");
        tooltipTitle.style.fontWeight = "bold";
        tooltipTitle.style.marginBottom = "0.25rem";
        tooltipTitle.style.borderBottom = "1px solid rgba(255,255,255,0.3)";
        tooltipTitle.style.paddingBottom = "0.25rem";
        tooltipTitle.textContent = `Hex ${hexUpper}`;
        tooltip.appendChild(tooltipTitle);
        
        const assetList = document.createElement("div");
        assetList.style.maxHeight = "150px";
        assetList.style.overflowY = "auto";
        
        assets.slice(0, 8).forEach(instId => {
          const lastUnderscore = instId.lastIndexOf("_");
          const baseId = lastUnderscore >= 0 ? instId.substring(0, lastUnderscore) : instId;
          const instanceNum = lastUnderscore >= 0 ? instId.substring(lastUnderscore + 1) : "1";
          const unitDef = getUnitDef(baseId, team);
          if (unitDef) {
            const assetItem = document.createElement("div");
            assetItem.style.padding = "0.15rem 0";
            assetItem.style.fontSize = "0.75rem";
            assetItem.textContent = `• ${escapeHtml(unitDef.name)} #${escapeHtml(instanceNum)}`;
            assetList.appendChild(assetItem);
          }
        });
        
        if (assets.length > 8) {
          const moreItem = document.createElement("div");
          moreItem.textContent = `... and ${assets.length - 8} more`;
          moreItem.style.fontStyle = "italic";
          moreItem.style.marginTop = "0.25rem";
          moreItem.style.fontSize = "0.75rem";
          assetList.appendChild(moreItem);
        }
        
        tooltip.appendChild(assetList);
        
        markerContainer.appendChild(marker);
        markerContainer.appendChild(tooltip);
        
        // Show/hide tooltip on click instead of hover
        markerContainer.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent closing when clicking the marker itself
          
          // If this tooltip is already open, close it
          if (currentOpenTooltip === tooltip) {
            tooltip.style.opacity = "0";
            tooltip.style.pointerEvents = "none";
            currentOpenTooltip = null;
            return;
          }
          
          // Close any previously open tooltip
          if (currentOpenTooltip) {
            currentOpenTooltip.style.opacity = "0";
            currentOpenTooltip.style.pointerEvents = "none";
          }
          
          // Reset tooltip position first
          tooltip.style.bottom = "100%";
          tooltip.style.top = "auto";
          tooltip.style.left = "50%";
          tooltip.style.right = "auto";
          tooltip.style.transform = "translateX(-50%)";
          tooltip.style.marginTop = "0";
          tooltip.style.marginBottom = "0.5rem";
          tooltip.style.opacity = "1";
          tooltip.style.pointerEvents = "auto";
          currentOpenTooltip = tooltip;
          
          // Adjust tooltip position if it would overflow (check after showing)
          setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            const modalRect = modal.getBoundingClientRect();
            
            // If tooltip would overflow top of modal
            if (tooltipRect.top < modalRect.top + 10) {
              tooltip.style.bottom = "auto";
              tooltip.style.top = "100%";
              tooltip.style.marginTop = "0.5rem";
              tooltip.style.marginBottom = "0";
            }
            
            // If tooltip would overflow right edge
            if (tooltipRect.right > modalRect.right - 10) {
              tooltip.style.left = "auto";
              tooltip.style.right = "0";
              tooltip.style.transform = "translateX(0)";
            }
            
            // If tooltip would overflow left edge
            if (tooltipRect.left < modalRect.left + 10) {
              tooltip.style.left = "0";
              tooltip.style.right = "auto";
              tooltip.style.transform = "translateX(0)";
            }
          }, 10);
        });
        
        overlayContainer.appendChild(markerContainer);
      });
    });
    
    // Close tooltip when clicking outside (on the board or modal)
    const closeTooltipOnOutsideClick = (e) => {
      if (currentOpenTooltip && !currentOpenTooltip.contains(e.target) && 
          !e.target.closest('[data-hex]')) {
        currentOpenTooltip.style.opacity = "0";
        currentOpenTooltip.style.pointerEvents = "none";
        currentOpenTooltip = null;
      }
    };
    
    // Add click listener to modal to close tooltip when clicking outside
    modal.addEventListener("click", closeTooltipOnOutsideClick);
  };
  
  // Wait for image to load, then position markers
  // Check if image is already loaded (cached)
  if (gameboardImg.complete && gameboardImg.naturalHeight !== 0) {
    // Image already loaded
    createMarkers();
  } else {
    // Wait for image to load
    gameboardImg.onload = createMarkers;
    gameboardImg.onerror = function() {
      console.error("Failed to load gameboard image");
    };
  }
  
  boardWrapper.style.position = "relative";
  boardWrapper.appendChild(overlayContainer);
  boardView.appendChild(boardWrapper);
  
  // List View (original functionality)
  const listView = document.createElement("div");
  listView.id = "list-view-container";
  listView.style.display = "none";
  
  ['blue', 'red'].forEach(team => {
    const teamDiv = document.createElement("div");
    teamDiv.style.marginBottom = "2rem";
    
    const teamTitle = document.createElement("h3");
    teamTitle.textContent = `${state.names[team]} Forces`;
    teamTitle.style.color = team === 'blue' ? '#264b96' : '#b71c1c';
    teamTitle.style.marginBottom = "0.75rem";
    teamDiv.appendChild(teamTitle);
    
    // Include unassigned
    const allHexes = { ...hexMap[team] };
    if (allUnits.filter(u => u.team === team && !state.unitStates[u.id]?.hex).length > 0) {
      allHexes['UNASSIGNED'] = allUnits.filter(u => u.team === team && !state.unitStates[u.id]?.hex).map(u => u.id);
    }
    
    const hexes = Object.keys(allHexes).sort((a, b) => {
      if (a === 'UNASSIGNED') return 1;
      if (b === 'UNASSIGNED') return -1;
      return a.localeCompare(b);
    });
    
    if (hexes.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "No assets with hex assignments.";
      emptyMsg.style.color = "#666";
      emptyMsg.style.fontStyle = "italic";
      teamDiv.appendChild(emptyMsg);
    } else {
      hexes.forEach(hex => {
        const hexDiv = document.createElement("div");
        hexDiv.style.marginBottom = "1rem";
        hexDiv.style.padding = "0.75rem";
        hexDiv.style.backgroundColor = team === 'blue' ? '#e0e6f7' : '#ffebee';
        hexDiv.style.borderRadius = "4px";
        hexDiv.style.borderLeft = `4px solid ${team === 'blue' ? '#264b96' : '#b71c1c'}`;
        
        const hexHeader = document.createElement("div");
        hexHeader.style.fontWeight = "bold";
        hexHeader.style.marginBottom = "0.5rem";
        hexHeader.style.fontSize = "1.1rem";
        hexHeader.textContent = `Hex: ${hex}`;
        hexDiv.appendChild(hexHeader);
        
        const assetsList = document.createElement("div");
        assetsList.style.display = "flex";
        assetsList.style.flexWrap = "wrap";
        assetsList.style.gap = "0.5rem";
        
        allHexes[hex].forEach(instId => {
          const lastUnderscore = instId.lastIndexOf("_");
          const baseId = lastUnderscore >= 0 ? instId.substring(0, lastUnderscore) : instId;
          const instanceNum = lastUnderscore >= 0 ? instId.substring(lastUnderscore + 1) : "1";
          
          const unitDef = getUnitDef(baseId, team);
          if (!unitDef) return;
          
          const assetDiv = document.createElement("div");
          assetDiv.style.display = "flex";
          assetDiv.style.alignItems = "center";
          assetDiv.style.gap = "0.4rem";
          assetDiv.style.padding = "0.3rem 0.5rem";
          assetDiv.style.backgroundColor = "#fff";
          assetDiv.style.borderRadius = "4px";
          assetDiv.style.border = "1px solid #ddd";
          assetDiv.style.fontSize = "0.9rem";
          
          const img = document.createElement("img");
          img.src = `assets/${escapeHtml(baseId)}.png`;
          img.alt = "Unit";
          img.style.width = "24px";
          img.style.height = "24px";
          img.style.objectFit = "contain";
          img.style.borderRadius = "2px";
          img.onerror = () => { img.style.display = 'none'; };
          
          const nameSpan = document.createElement("span");
          const unitColor = CATEGORY_COLORS[unitDef.category] || '#333333';
          nameSpan.innerHTML = `<strong style="color: ${unitColor};">${escapeHtml(unitDef.name)}</strong> <span style="color: #666; font-size: 0.85em;">#${escapeHtml(instanceNum)}</span>`;
          
          const unitState = state.unitStates[instId] || {};
          if (unitState.role) {
            const roleSpan = document.createElement("span");
            roleSpan.textContent = `[${escapeHtml(unitState.role)}]`;
            roleSpan.style.color = "#666";
            roleSpan.style.fontSize = "0.85em";
            nameSpan.appendChild(document.createTextNode(" "));
            nameSpan.appendChild(roleSpan);
          }
          
          assetDiv.appendChild(img);
          assetDiv.appendChild(nameSpan);
          assetsList.appendChild(assetDiv);
        });
        
        hexDiv.appendChild(assetsList);
        teamDiv.appendChild(hexDiv);
      });
    }
    
    listView.appendChild(teamDiv);
  });
  
  // Tab switching
  boardTab.addEventListener("click", () => {
    boardView.style.display = "block";
    listView.style.display = "none";
    boardTab.style.background = "#4a5568";
    boardTab.style.color = "#fff";
    listTab.style.background = "transparent";
    listTab.style.color = "#666";
  });
  
  listTab.addEventListener("click", () => {
    boardView.style.display = "none";
    listView.style.display = "block";
    listTab.style.background = "#4a5568";
    listTab.style.color = "#fff";
    boardTab.style.background = "transparent";
    boardTab.style.color = "#666";
  });
  
  tabContainer.appendChild(boardTab);
  tabContainer.appendChild(listTab);
  modal.appendChild(tabContainer);
  
  contentArea.appendChild(boardView);
  contentArea.appendChild(listView);
  modal.appendChild(contentArea);
  
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.className = "primary-btn";
  closeBtn.style.marginTop = "1rem";
  closeBtn.style.width = "100%";
  closeBtn.addEventListener("click", () => overlay.remove());
  modal.appendChild(closeBtn);
  
  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  document.body.appendChild(overlay);
}
