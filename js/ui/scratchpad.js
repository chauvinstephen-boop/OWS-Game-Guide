// Scratch Pad UI Logic
import { UNIT_DATABASE } from "../data/units.js";
import { state, updateUnitState } from "../state.js";

export function renderScratchPad() {
  const container = document.getElementById("scratch-pad-container");
  if (!container) return;

  let table = container.querySelector(".scratch-pad-table");
  
  // Upgrade check: if table exists but doesn't have the Status column (5 columns), destroy it to rebuild
  if (table && table.querySelectorAll("th").length < 5) {
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
          <th style="width: 15%;">Current Hex</th>
          <th style="width: 20%;">Role / Status</th>
          <th style="width: 15%;">Dest. Hex</th>
          <th style="width: 30%;">Status</th>
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
           updateUnitState(id, field, e.target.checked);
        } else {
           updateUnitState(id, field, e.target.value);
        }
      }
    });
  }
  
  const tbody = table.querySelector("tbody");
  
  // Rebuild rows to support ordering and separators
  // Clear existing rows to ensure correct order and separators
  tbody.innerHTML = "";
  
  const addUnitRows = (unitIds, team) => {
      if (unitIds.length === 0) return;
      
      // Add Separator
      const sepRow = document.createElement("tr");
      sepRow.className = "team-separator";
      sepRow.innerHTML = `<td colspan="5" style="background: #eef2ff; font-weight: bold; text-align: center; color: var(--accent);">${team === 'blue' ? state.names.blue : state.names.red} Forces</td>`;
      tbody.appendChild(sepRow);
      
      unitIds.forEach(instId => {
          // Parse base ID
          const baseId = instId.substring(0, instId.lastIndexOf("_"));
          const instanceNum = instId.substring(instId.lastIndexOf("_") + 1);
          
          let unitDef = null;
          const teamData = UNIT_DATABASE[team];
          if (teamData) {
            for (const cat of Object.keys(teamData)) {
                const found = teamData[cat].find(x => x.id === baseId);
                if (found) {
                unitDef = found;
                break;
                }
            }
          }
          if (!unitDef) return;
          
          const unitState = state.unitStates[instId] || { hex: "", role: "", dest: "", stealth: false, detected: false, isr: false };
          
          const row = document.createElement("tr");
          row.dataset.unitId = instId;
          row.innerHTML = `
            <td><strong>${unitDef.name}</strong> <span style="font-size:0.8em; color:#666">#${instanceNum}</span></td>
            <td><input type="text" data-id="${instId}" data-field="hex" value="${unitState.hex || ''}" placeholder="Hex..."></td>
            <td><input type="text" data-id="${instId}" data-field="role" value="${unitState.role || ''}" placeholder="Role..."></td>
            <td><input type="text" data-id="${instId}" data-field="dest" value="${unitState.dest || ''}" placeholder="Dest..."></td>
            <td>
            <div class="status-checks">
                <label><input type="checkbox" data-id="${instId}" data-field="stealth" ${unitState.stealth ? 'checked' : ''}> Stealth</label>
                <label><input type="checkbox" data-id="${instId}" data-field="detected" ${unitState.detected ? 'checked' : ''}> Detected</label>
                <label><input type="checkbox" data-id="${instId}" data-field="isr" ${unitState.isr ? 'checked' : ''}> ISR</label>
            </div>
            </td>
          `;
          tbody.appendChild(row);
      });
  };
  
  addUnitRows(state.inventory.blueUnits, "blue");
  addUnitRows(state.inventory.redUnits, "red");
}
