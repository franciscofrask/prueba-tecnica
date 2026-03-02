import { SeatMap } from '@/types/seatMap';

export interface ImportResult {
  success: boolean;
  data?: SeatMap;
  error?: string;
}

function isValidSeatMap(obj: unknown): obj is SeatMap {
  if (typeof obj !== 'object' || obj === null) return false;
  const map = obj as Record<string, unknown>;
  return (
    typeof map.id === 'string' &&
    typeof map.name === 'string' &&
    Array.isArray(map.rows) &&
    Array.isArray(map.areas) &&
    Array.isArray(map.tables) &&
    typeof map.version === 'string'
  );
}

export function importFromJSON(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString);
    if (!isValidSeatMap(parsed)) {
      return { success: false, error: 'El JSON no tiene el formato de un mapa de asientos válido.' };
    }
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: 'El JSON no es válido. Verificá el formato del archivo.' };
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}
