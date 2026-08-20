const MEMORY_CATEGORY = 'ekum.batch.lastCategory';
const MEMORY_UNIT = 'ekum.batch.lastUnit';

export function readCatalogFieldMemory() {
  if (typeof localStorage === 'undefined') return { category: '', unit: '' };
  try {
    return {
      category: localStorage.getItem(MEMORY_CATEGORY) ?? '',
      unit: localStorage.getItem(MEMORY_UNIT) ?? '',
    };
  } catch {
    return { category: '', unit: '' };
  }
}

export function writeCatalogFieldMemory(category: string, unit: string) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_CATEGORY, category);
    localStorage.setItem(MEMORY_UNIT, unit);
  } catch {
    // ignore quota / private mode
  }
}
