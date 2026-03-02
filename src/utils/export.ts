import { SeatMap } from '@/types/seatMap';

export function exportToJSON(seatMap: SeatMap): string {
  return JSON.stringify(seatMap, null, 2);
}

export function downloadJSON(seatMap: SeatMap, filename?: string): void {
  const json = exportToJSON(seatMap);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `${seatMap.name.replace(/\s+/g, '_')}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
