/**
 * Genera etiquetas a partir de un patrón.
 * 
 * Patrones soportados:
 *  - "Platea {1-50}"    → Platea 1, Platea 2, ..., Platea 50
 *  - "Fila {A-Z}"       → Fila A, Fila B, ..., Fila Z
 *  - "A{1-10}"          → A1, A2, ..., A10
 *  - "Silla {1}"        → Silla 1, Silla 2, ... (sin rango, autoincremental)
 *  - "{1-5}"            → 1, 2, 3, 4, 5
 */
export function generateLabels(pattern: string, count: number): string[] {
  const numRangeRegex = /\{(\d+)-(\d+)\}/;
  const alphaRangeRegex = /\{([A-Za-z])-([A-Za-z])\}/;
  const singleNumRegex = /\{(\d+)\}/;
  const noRangeRegex = /\{[nN]\}/;

  const numMatch = pattern.match(numRangeRegex);
  const alphaMatch = pattern.match(alphaRangeRegex);
  const singleMatch = pattern.match(singleNumRegex);
  const noRange = noRangeRegex.test(pattern);

  if (numMatch) {
    const start = parseInt(numMatch[1], 10);
    const end = parseInt(numMatch[2], 10);
    const labels: string[] = [];
    for (let i = start; i <= end && labels.length < count; i++) {
      labels.push(pattern.replace(numRangeRegex, String(i)));
    }
    return labels.slice(0, count);
  }

  if (alphaMatch) {
    const startCode = alphaMatch[1].toUpperCase().charCodeAt(0);
    const endCode = alphaMatch[2].toUpperCase().charCodeAt(0);
    const labels: string[] = [];
    for (let i = startCode; i <= endCode && labels.length < count; i++) {
      labels.push(pattern.replace(alphaRangeRegex, String.fromCharCode(i)));
    }
    return labels.slice(0, count);
  }

  if (singleMatch) {
    const start = parseInt(singleMatch[1], 10);
    return Array.from({ length: count }, (_, i) =>
      pattern.replace(singleNumRegex, String(start + i))
    );
  }

  if (noRange) {
    return Array.from({ length: count }, (_, i) =>
      pattern.replace(noRangeRegex, String(i + 1))
    );
  }

  // Sin patrón especial: repetir el texto base con número
  if (pattern.trim()) {
    return Array.from({ length: count }, (_, i) => `${pattern} ${i + 1}`);
  }

  return Array.from({ length: count }, (_, i) => String(i + 1));
}

/** Devuelve un preview de etiquetas (máximo 8) */
export function previewLabels(pattern: string, count: number): string[] {
  return generateLabels(pattern, Math.min(count, 8));
}

/** Valida si un patrón producirá suficientes etiquetas */
export function validatePattern(pattern: string, count: number): string | null {
  const labels = generateLabels(pattern, count);
  if (labels.length < count) {
    return `El patrón sólo genera ${labels.length} etiqueta(s) pero se necesitan ${count}.`;
  }
  return null;
}
