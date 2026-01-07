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

export function renderScratchPad() {
  const container = document.getElementById("scratch-pad-container");
  if (!container) return;

  let table = container.querySelector(".scratch-pad-table");
  
  // Upgrade check: if table exists but column count mismatches (we added a column), destroy it
  // New column count: Unit, Ops, Hex, Role, Dest, Status = 6
  if (table && table.querySelectorAll("thead th").length !== 6) {
      table.remove();
      table = null;
  }

  if (!table) {
    container.innerHTML = "<h3>Unit Scratch Pad</h3><p>Track position and orders for all assets in play.</p>";
    table = document.createElement("table");
    table.className = "scratch-pad-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width: 20%;">Unit</th>
          <th style="width: 10%;">State</th>
          <th style="width: 15%;">Current Hex</th>
          <th style="width: 20%;">Role / Status</th>
          <th style="width: 15%;">Dest. Hex</th>
          <th style="width: 20%;">Attributes</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    container.appendChild(table);
    
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
      sepRow.innerHTML = `<td colspan="6" style="background: #eef2ff; font-weight: bold; text-align: center; color: var(--accent);">${team === 'blue' ? state.names.blue : state.names.red} Forces</td>`;
      tbody.appendChild(sepRow);
      
      unitIds.forEach(instId => {
          // Parse base ID
          const baseId = instId.substring(0, instId.lastIndexOf("_"));
          const instanceNum = instId.substring(instId.lastIndexOf("_") + 1);
          
          let unitDef = getUnitDef(baseId, team);
          if (!unitDef) return;
          
          const unitState = state.unitStates[instId] || { hex: "", role: "", dest: "", stealth: false, detected: false, isr: false, destroyed: false };
          
          const row = document.createElement("tr");
          row.dataset.unitId = instId;
          if (unitState.destroyed) row.className = "unit-destroyed";
          
          const disabledAttr = unitState.destroyed ? "disabled" : "";
          
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
          `;
          tbody.appendChild(row);
      });
  };
  
  addUnitRows(state.inventory.blueUnits, "blue");
  addUnitRows(state.inventory.redUnits, "red");
}
