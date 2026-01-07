// Main UI Rendering Logic
import { state, currentFlatIndex, getCurrentStep } from "../state.js";
import { loadReminders, saveReminders } from "../utils.js";

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
  document.getElementById("step-description").textContent = step.description;

  document.getElementById("who-acts-line").textContent = whoActsSentence(step);

  const actionList = document.getElementById("action-list");
  actionList.innerHTML = "";
  
  const modeActions = (step.actions && step.actions["full"]) || [];
  modeActions.forEach((line) => {
    const li = document.createElement("li");
    const initiativeName = state.initiative === "blue" ? state.names.blue : state.names.red;
    const nonInitName = state.initiative === "blue" ? state.names.red : state.names.blue;
    
    li.textContent = line
      .replace(/\bInitiative player\b/g, initiativeName)
      .replace(/\bNon-initiative player\b/g, nonInitName);
    actionList.appendChild(li);
  });

  const rulesList = document.getElementById("rules-ref-list");
  rulesList.innerHTML = "";
  (step.rulesRef || []).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
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
