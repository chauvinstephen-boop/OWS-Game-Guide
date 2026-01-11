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

// Preset management functions
const PRESETS_STORAGE_KEY = 'ows_game_presets';

export function savePreset(name, presetData) {
  try {
    const presets = loadAllPresets();
    presets[name] = {
      ...presetData,
      savedAt: new Date().toISOString()
    };
    window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    return true;
  } catch (error) {
    console.error('Failed to save preset:', error);
    return false;
  }
}

export function loadPreset(name) {
  try {
    const presets = loadAllPresets();
    return presets[name] || null;
  } catch (error) {
    console.error('Failed to load preset:', error);
    return null;
  }
}

export function loadAllPresets() {
  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load presets:', error);
    return {};
  }
}

export function deletePreset(name) {
  try {
    const presets = loadAllPresets();
    delete presets[name];
    window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    return true;
  } catch (error) {
    console.error('Failed to delete preset:', error);
    return false;
  }
}
