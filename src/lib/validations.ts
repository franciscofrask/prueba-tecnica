import { Row, Area, Table, Seat, SeatMap } from '@/types/seatMap';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLabel(label: string): string | null {
  if (!label || label.trim() === '') return 'La etiqueta no puede estar vacía.';
  if (label.trim().length > 50) return 'La etiqueta no puede superar los 50 caracteres.';
  return null;
}

export function findDuplicateLabels(items: Array<{ label: string; id: string }>): string[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = item.label.toLowerCase().trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([label]) => label);
}

export function validateSeatMap(seatMap: SeatMap): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar nombre del mapa
  if (!seatMap.name || seatMap.name.trim() === '') {
    errors.push('El mapa debe tener un nombre.');
  }

  // Validar filas
  for (const row of seatMap.rows) {
    if (!row.label || row.label.trim() === '') {
      errors.push(`Fila sin etiqueta (id: ${row.id}).`);
    }
    for (const seat of row.seats) {
      if (!seat.label || seat.label.trim() === '') {
        errors.push(`Asiento en fila "${row.label}" sin etiqueta (id: ${seat.id}).`);
      }
    }
  }

  // Validar áreas
  for (const area of seatMap.areas) {
    if (!area.label || area.label.trim() === '') {
      errors.push(`Área sin etiqueta (id: ${area.id}).`);
    }
  }

  // Validar mesas
  for (const table of seatMap.tables) {
    if (!table.label || table.label.trim() === '') {
      errors.push(`Mesa sin etiqueta (id: ${table.id}).`);
    }
    for (const seat of table.seats) {
      if (!seat.label || seat.label.trim() === '') {
        errors.push(`Asiento en mesa "${table.label}" sin etiqueta (id: ${seat.id}).`);
      }
    }
  }

  // Advertencias por etiquetas duplicadas en filas
  const rowLabels = seatMap.rows.map((r) => ({ label: r.label, id: r.id }));
  const dupRows = findDuplicateLabels(rowLabels);
  if (dupRows.length > 0) {
    warnings.push(`Filas con etiqueta duplicada: ${dupRows.join(', ')}`);
  }

  // Advertencias por etiquetas duplicadas en áreas
  const areaLabels = seatMap.areas.map((a) => ({ label: a.label, id: a.id }));
  const dupAreas = findDuplicateLabels(areaLabels);
  if (dupAreas.length > 0) {
    warnings.push(`Áreas con etiqueta duplicada: ${dupAreas.join(', ')}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
