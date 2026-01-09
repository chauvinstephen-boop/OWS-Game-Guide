// Scratch Pad UI Logic
import { UNIT_DATABASE } from "../data/units.js";
import { state, updateUnitState } from "../state.js";

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
  // New column count: Unit, Ops, Hex, Role, Dest, Attributes, Air Assets = 7
  if (table && table.querySelectorAll("thead th").length !== 7) {
      table.remove();
      table = null;
  }

  if (!table) {
    container.innerHTML = "<h3>Unit Scratch Pad</h3><p>Track position and orders for all assets in play.</p>";
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
          <th style="width: 20%;">Air Assets</th>
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
      sepRow.innerHTML = `<td colspan="7" style="background: #eef2ff; font-weight: bold; text-align: center; color: var(--accent);">${team === 'blue' ? state.names.blue : state.names.red} Forces</td>`;
      tbody.appendChild(sepRow);
      
      // Update headers for this team's sort state
      const headers = table.querySelectorAll("th.sortable");
      headers.forEach(header => {
          if (header.dataset.team === team) {
              header.dataset.team = team;
          }
      });
      
      unitIds.forEach(instId => {
          // Parse base ID
          const baseId = instId.substring(0, instId.lastIndexOf("_"));
          const instanceNum = instId.substring(instId.lastIndexOf("_") + 1);
          
          let unitDef = getUnitDef(baseId, team);
          if (!unitDef) return;
          
          const defaultState = { 
              hex: "", role: "", dest: "", 
              stealth: false, detected: false, isr: false, destroyed: false,
              cas: false, cap: false, strike: false, aew: false, 
              airAssault: false, asw: false, transport: false, tanker: false 
          };
          const unitState = state.unitStates[instId] || defaultState;
          
          const row = document.createElement("tr");
          row.dataset.unitId = instId;
          row.dataset.team = team;
          if (unitState.destroyed) row.className = "unit-destroyed";
          
          const disabledAttr = unitState.destroyed ? "disabled" : "";
          
          // Build air assets checkboxes
          const airAssetsHTML = AIR_ASSETS.map(asset => 
              `<label class="air-asset-check"><input type="checkbox" data-id="${instId}" data-field="${asset.field}" ${unitState[asset.field] ? 'checked' : ''} ${disabledAttr}> ${asset.label}</label>`
          ).join('');
          
          row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="assets/${unitDef.id}.png" alt="Img" style="width: 24px; height: 24px; object-fit: contain; border-radius: 2px; border: 1px solid #ddd;" onerror="this.style.display='none'">
                    <div>
                        <strong>${unitDef.name}</strong> 
                        <span style="font-size:0.8em; color:#666">#${instanceNum}</span>
                    </div>
                </div>
            </td>
            <td style="text-align: center;">
               <label class="toggle-switch">
                 <input type="checkbox" data-id="${instId}" data-field="destroyed" ${unitState.destroyed ? 'checked' : ''}>
                 <span class="slider"></span>
                 <span class="label-text" style="font-size: 0.75rem;">${unitState.destroyed ? 'Destroyed' : 'Active'}</span>
               </label>
            </td>
            <td><input type="text" data-id="${instId}" data-field="hex" value="${unitState.hex || ''}" placeholder="Hex..." ${disabledAttr}></td>
            <td><input type="text" data-id="${instId}" data-field="role" value="${unitState.role || ''}" placeholder="Role..." ${disabledAttr}></td>
            <td><input type="text" data-id="${instId}" data-field="dest" value="${unitState.dest || ''}" placeholder="Dest..." ${disabledAttr}></td>
            <td>
            <div class="status-checks">
                <label><input type="checkbox" data-id="${instId}" data-field="stealth" ${unitState.stealth ? 'checked' : ''} ${disabledAttr}> Stealth</label>
                <label><input type="checkbox" data-id="${instId}" data-field="detected" ${unitState.detected ? 'checked' : ''} ${disabledAttr}> Detected</label>
                <label><input type="checkbox" data-id="${instId}" data-field="isr" ${unitState.isr ? 'checked' : ''} ${disabledAttr}> ISR</label>
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
