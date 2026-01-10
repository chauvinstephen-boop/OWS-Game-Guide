// Helper functions

export function storageKeyForStep(stepId) {
  return `ows_step_reminders_dynamic_${stepId}`;
}

export function loadReminders(stepId) {
  try {
    const raw = window.localStorage.getItem(storageKeyForStep(stepId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReminders(stepId, reminders) {
  try {
    window.localStorage.setItem(
      storageKeyForStep(stepId),
      JSON.stringify(reminders.slice(0, 5))
    );
  } catch {
    // ignore
  }
}

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}
