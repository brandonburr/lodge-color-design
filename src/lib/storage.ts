import { SavedCombination, ColorSelection } from "./colors";

const STORAGE_KEY = "mcbi-saved-combinations";

export function getSavedCombinations(): SavedCombination[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCombination(
  name: string,
  colors: ColorSelection
): SavedCombination {
  const combos = getSavedCombinations();
  const newCombo: SavedCombination = {
    id: crypto.randomUUID(),
    name,
    colors,
    createdAt: Date.now(),
  };
  combos.push(newCombo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(combos));
  return newCombo;
}

export function deleteCombination(id: string): void {
  const combos = getSavedCombinations().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(combos));
}
