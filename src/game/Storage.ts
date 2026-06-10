import { GameSave, PlayerState, VehicleState, WeatherState, Order, IncomeRecord, MapData } from './types';
import { STORAGE_KEY, SAVE_VERSION } from './constants';

export function saveGame(
  player: PlayerState,
  vehicle: VehicleState,
  weather: WeatherState,
  orders: Order[],
  incomeRecords: IncomeRecord[],
  gameTime: number,
  map: MapData
): boolean {
  try {
    const save: GameSave = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      player,
      vehicle,
      weather,
      orders: orders.filter((o) => o.status !== 'completed' && o.status !== 'failed'),
      incomeRecords,
      gameTime,
      map,
    };

    const json = JSON.stringify(save, null, 2);
    localStorage.setItem(STORAGE_KEY, json);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

export function loadGame(): GameSave | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const save = JSON.parse(json) as GameSave;

    if (save.version !== SAVE_VERSION) {
      console.warn('Save version mismatch, may cause issues');
    }

    return save;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function deleteSave(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
}

export function exportSaveToFile(save: GameSave): void {
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `delivery-save-${new Date(save.savedAt).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importSaveFromFile(file: File): Promise<GameSave> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const save = JSON.parse(e.target?.result as string) as GameSave;
        resolve(save);
      } catch (error) {
        reject(new Error('Invalid save file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function getSaveInfo(): { savedAt: number; completedOrders: number; money: number } | null {
  const save = loadGame();
  if (!save) return null;
  return {
    savedAt: save.savedAt,
    completedOrders: save.player.completedOrders,
    money: save.player.money,
  };
}
