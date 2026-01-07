// Scratch Pad UI Logic
import { UNIT_DATABASE } from "../data/units.js";
import { state, updateUnitState } from "../state.js";

export function renderScratchPad() {
  const container = document.getElementById("scratch-pad-container");
  if (!container) return;

  // If already rendered, just update? No, simple re-render for now is fine, 
  // but we want to preserve input focus if possible.
  // Actually, since this is permanent now, we render ONCE and then just update values if inventory changes.
  
  // Check if table exists
  let table = container.querySelector(".scratch-pad-table");
  if (!table) {
    container.innerHTML = "<h3>Unit Scratch Pad</h3><p>Track position and orders for all assets in play.</p>";
    table = document.createElement("table");
    table.className = "scratch-pad-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Unit</th>
          <th>Current Hex</th>
          <th>Role / Status</th>
          <th>Dest. Hex</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    container.appendChild(table);
    
    // Event listeners for inputs (delegated)
    container.addEventListener("input", (e) => {
      if (e.target.tagName === "INPUT") {
        const id = e.target.dataset.id;
        const field = e.target.dataset.field;
        if (id && field) {
          updateUnitState(id, field, e.target.value);
        }
      }
    });
  }
  
  const tbody = table.querySelector("tbody");
  // We need to sync rows with inventory. 
  // Naive approach: clear and rebuild. This loses focus.
  // Better approach: Update existing rows, add new ones, remove old ones.
  
  // Get all current unit IDs in order
  const allUnits = [];
  const addUnit = (id, team) => allUnits.push({id, team});
  state.inventory.blueUnits.forEach(id => addUnit(id, "blue"));
  state.inventory.redUnits.forEach(id => addUnit(id, "red"));
  
  // Existing rows
  const existingRows = Array.from(tbody.querySelectorAll("tr"));
  const existingIds = existingRows.map(r => r.dataset.unitId);
  
  // Remove rows not in inventory
  existingRows.forEach(row => {
    if (!allUnits.find(u => u.id === row.dataset.unitId)) {
      row.remove();
    }
  });
  
  // Add/Update rows
  allUnits.forEach(u => {
    let row = tbody.querySelector(`tr[data-unit-id="${u.id}"]`);
    
    // Get unit def
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

    const unitState = state.unitStates[u.id] || { hex: "", role: "", dest: "" };

    if (!row) {
      row = document.createElement("tr");
      row.dataset.unitId = u.id;
      row.innerHTML = `
        <td><strong>${unitDef.name}</strong> <span style="font-size:0.8em; color:#666">(${u.team})</span></td>
        <td><input type="text" data-id="${u.id}" data-field="hex" placeholder="Hex..."></td>
        <td><input type="text" data-id="${u.id}" data-field="role" placeholder="Role..."></td>
        <td><input type="text" data-id="${u.id}" data-field="dest" placeholder="Dest..."></td>
      `;
      tbody.appendChild(row);
    }
    
    // Update values if strictly needed (e.g. initial load or external change), 
    // but don't overwrite if user is typing (active element).
    const updateInput = (field, val) => {
      const input = row.querySelector(`input[data-field="${field}"]`);
      if (input && document.activeElement !== input) {
        input.value = val || "";
      }
    };
    
    updateInput("hex", unitState.hex);
    updateInput("role", unitState.role);
    updateInput("dest", unitState.dest);
  });
}
