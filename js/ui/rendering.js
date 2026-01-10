// Main UI Rendering Logic
import { state, currentFlatIndex, getCurrentStep } from "../state.js";
import { loadReminders, saveReminders } from "../utils.js";

// Tooltip text for "Simultaneous"
const SIMULTANEOUS_TOOLTIP = `"Simultaneous" means that even if a unit is destroyed by an enemy attack, it still gets to complete its own attack before being removed. In game terms: Dead units pull triggers.

Example: How to Play It Out:
1. Declare: Both players declare which units are attacking which targets within the current step (e.g., Stand-Off Air-to-Air).
2. Roll: Player A rolls and scores a hit that would destroy Player B's fighter.
3. Return Fire: Player B still rolls their attack against Player A, even though their unit is technically "destroyed."
4. Resolve: After both sides have rolled for that specific step, then you apply the damage and remove the destroyed units from the board.

Key Distinction: This applies within each step. You must resolve all "Stand-Off" attacks simultaneously before moving to the next step ("In-Hex"). A unit destroyed in the "Stand-Off" step is removed before it can participate in the "In-Hex" step.`;

// Helper function to escape HTML special characters
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Helper function to add tooltips to "simultaneous" text
// Note: Input text should already be HTML-escaped before calling this function
function addSimultaneousTooltips(text) {
  // Escape the tooltip text properly for HTML attribute
  const escapedTooltip = escapeHtml(SIMULTANEOUS_TOOLTIP).replace(/"/g, '&quot;');
  
  // Replace "simultaneously" (case-insensitive) with tooltip version
  // The match is already escaped (part of the escaped text), so use it directly
  return text.replace(/\b(simultaneously|simultaneous)\b/gi, (match) => {
    return `<span class="simultaneous-tooltip" title="${escapedTooltip}">${match}</span>`;
  });
}

function whoActsSentence(step) {
  const initiativeName = state.initiative === "blue" ? state.names.blue : state.names.red;
  const nonInitName = state.initiative === "blue" ? state.names.red : state.names.blue;

  switch (step.actor) {
    case "initiative":
      return `${initiativeName} (initiative) acts in this step.`;
    case "non-initiative":
      return `${nonInitName} (non-initiative) acts in this step.`;
    case "alt":
      return `${initiativeName} acts first, then ${nonInitName}.`;
    case "both":
    default:
      return `${state.names.blue} and ${state.names.red} act in this step, as described below.`;
  }
}

export function renderPhaseList() {
  const list = document.getElementById("phase-list");
  if (!list) return;
  list.innerHTML = "";

  state.sequence.forEach((phase, index) => {
    const li = document.createElement("li");
    li.className = "phase-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "phase-button";
    btn.dataset.phaseIndex = index.toString();

    if (index === state.indices.phase) {
      btn.classList.add("active");
    }

    const label = document.createElement("span");
    label.className = "phase-label";
    label.textContent = `Phase ${phase.number}`;

    const name = document.createElement("span");
    name.className = "phase-name";
    name.textContent = phase.name;

    btn.appendChild(label);
    btn.appendChild(name);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

export function renderJumpSelect() {
  const select = document.getElementById("step-jump-select");
  if (!select) return;
  const flatIdx = currentFlatIndex();
  select.innerHTML = "";

  state.flatSteps.forEach((entry, idx) => {
    const opt = document.createElement("option");
    const p = entry.phase;
    const s = entry.step;
    opt.value = String(idx);
    opt.textContent = `P${p.number} ${p.name} – ${s.code} ${s.title}`;
    if (idx === flatIdx) opt.selected = true;
    select.appendChild(opt);
  });
}

export function renderReminders(stepId) {
  const reminderList = document.getElementById("reminder-list");
  const input = document.getElementById("reminder-input");
  const formButton = document.querySelector("#reminder-form button[type='submit']");
  if (!reminderList) return;

  const reminders = loadReminders(stepId);
  reminderList.innerHTML = "";

  reminders.forEach((rem, index) => {
    const li = document.createElement("li");
    li.className = "reminder-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!rem.completed;

    checkbox.addEventListener("change", () => {
      const updated = loadReminders(stepId);
      if (updated[index]) {
        updated[index].completed = checkbox.checked;
        saveReminders(stepId, updated);
        renderReminders(stepId);
      }
    });

    const span = document.createElement("span");
    span.className = "reminder-text";
    if (rem.completed) span.classList.add("completed");
    span.textContent = rem.text || "";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "reminder-delete";
    del.textContent = "✕";
    del.title = "Delete reminder";
    del.addEventListener("click", () => {
      const updated = loadReminders(stepId);
      updated.splice(index, 1);
      saveReminders(stepId, updated);
      renderReminders(stepId);
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);
    reminderList.appendChild(li);
  });

  if (reminders.length >= 3) {
    input.disabled = true;
    input.placeholder = "Maximum of 3 reminders reached.";
    formButton.disabled = true;
  } else {
    input.disabled = false;
    input.placeholder = "Add a reminder for this step…";
    formButton.disabled = false;
  }
}

export function renderStep() {
  const current = getCurrentStep();
  if (!current) return;
  const { phase, step } = current;

  document.getElementById("breadcrumbs").textContent =
    `Phase ${phase.number}: ${phase.name} • Step ${step.code}`;
  document.getElementById("step-title").textContent = step.title;
  
  // Add tooltips for "simultaneous" in description
  const descriptionEl = document.getElementById("step-description");
  const escapedDescription = escapeHtml(step.description);
  const processedDescription = addSimultaneousTooltips(escapedDescription);
  descriptionEl.innerHTML = processedDescription;

  document.getElementById("who-acts-line").textContent = whoActsSentence(step);

  const actionList = document.getElementById("action-list");
  actionList.innerHTML = "";
  
  const modeActions = (step.actions && step.actions["full"]) || [];
  modeActions.forEach((line) => {
    const li = document.createElement("li");
    const initiativeName = state.initiative === "blue" ? state.names.blue : state.names.red;
    const nonInitName = state.initiative === "blue" ? state.names.red : state.names.blue;
    
    // Escape player names before replacement to prevent XSS
    const escapedInitiativeName = escapeHtml(initiativeName);
    const escapedNonInitName = escapeHtml(nonInitName);
    
    // First escape the entire line, then replace player names, then add tooltips
    let processedLine = escapeHtml(line)
      .replace(/\bInitiative player\b/g, escapedInitiativeName)
      .replace(/\bNon-initiative player\b/g, escapedNonInitName);
    
    // Add tooltips for "simultaneous" (this adds HTML, so it must be after escaping)
    processedLine = addSimultaneousTooltips(processedLine);
    
    li.innerHTML = processedLine;
    actionList.appendChild(li);
  });

  const rulesList = document.getElementById("rules-ref-list");
  rulesList.innerHTML = "";
  (step.rulesRef || []).forEach((line) => {
    const li = document.createElement("li");
    // Escape the line first, then add tooltips for "simultaneous"
    const escapedLine = escapeHtml(line);
    const processedLine = addSimultaneousTooltips(escapedLine);
    li.innerHTML = processedLine;
    rulesList.appendChild(li);
  });

  renderReminders(step.id);
  renderPhaseList();
  renderJumpSelect();
}

export function renderModeHeader() {
  const chip = document.getElementById("mode-chip");
  if (chip) {
    const blueCount = state.inventory.blue.length;
    const redCount = state.inventory.red.length;
    chip.textContent = `Blue Assets: ${blueCount}, Red Assets: ${redCount}`;
  }

  const initLabel = document.getElementById("initiative-label");
  const nonInitLabel = document.getElementById("non-initiative-label");

  if (initLabel && nonInitLabel) {
    if (state.initiative === "blue") {
      initLabel.textContent = state.names.blue;
      nonInitLabel.textContent = state.names.red;
    } else {
      initLabel.textContent = state.names.red;
      nonInitLabel.textContent = state.names.blue;
    }
  }
}

export function renderDice() {
  const lastRollEl = document.getElementById("last-roll");
  if (state.diceHistory.length === 0) {
    lastRollEl.textContent = "—";
  } else {
    const last = state.diceHistory[0];
    lastRollEl.textContent = `${last.die} → ${last.value}`;
  }

  const list = document.getElementById("dice-history-list");
  list.innerHTML = "";
  state.diceHistory.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${r.die}: ${r.value}`;
    list.appendChild(li);
  });
}
