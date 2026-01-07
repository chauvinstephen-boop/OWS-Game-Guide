// Scratch Pad UI Logic
import { UNIT_DATABASE } from "../data/units.js";
import { state, updateUnitState } from "../state.js";

export function renderScratchPad() {
  const container = document.getElementById("scratch-pad-container");
  if (!container) return;

  let table = container.querySelector(".scratch-pad-table");
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
  
  const allUnits = [];
  const addUnit = (id, team) => allUnits.push({id, team});
  state.inventory.blueUnits.forEach(id => addUnit(id, "blue"));
  state.inventory.redUnits.forEach(id => addUnit(id, "red"));
  
  const existingRows = Array.from(tbody.querySelectorAll("tr"));
  existingRows.forEach(row => {
    if (!allUnits.find(u => u.id === row.dataset.unitId)) {
      row.remove();
    }
  });
  
  allUnits.forEach(u => {
    let row = tbody.querySelector(`tr[data-unit-id="${u.id}"]`);
    
    let unitDef = null;
    const teamData = UNIT_DATABASE[u.team];
    if (teamData) {
      for (const cat of Object.keys(teamData)) {
        const found = teamData[cat].find(x => x.id === u.id);
        if (found) {
          unitDef = found;
          break;
        }
      }
    }
    if (!unitDef) return;

    const unitState = state.unitStates[u.id] || { hex: "", role: "", dest: "", stealth: false, detected: false, isr: false };

    if (!row) {
      row = document.createElement("tr");
      row.dataset.unitId = u.id;
      row.innerHTML = `
        <td><strong>${unitDef.name}</strong> <span style="font-size:0.8em; color:#666">(${u.team})</span></td>
        <td><input type="text" data-id="${u.id}" data-field="hex" placeholder="Hex..."></td>
        <td><input type="text" data-id="${u.id}" data-field="role" placeholder="Role..."></td>
        <td><input type="text" data-id="${u.id}" data-field="dest" placeholder="Dest..."></td>
        <td>
          <div class="status-checks">
            <label><input type="checkbox" data-id="${u.id}" data-field="stealth"> Stealth</label>
            <label><input type="checkbox" data-id="${u.id}" data-field="detected"> Detected</label>
            <label><input type="checkbox" data-id="${u.id}" data-field="isr"> ISR</label>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    }
    
    const updateInput = (field, val) => {
      const input = row.querySelector(`input[data-field="${field}"]`);
      if (input && document.activeElement !== input) {
        input.value = val || "";
      }
    };
    
    const updateCheck = (field, val) => {
      const input = row.querySelector(`input[data-field="${field}"]`);
      if (input) input.checked = !!val;
    };
    
    updateInput("hex", unitState.hex);
    updateInput("role", unitState.role);
    updateInput("dest", unitState.dest);
    
    updateCheck("stealth", unitState.stealth);
    updateCheck("detected", unitState.detected);
    updateCheck("isr", unitState.isr);
  });
}
