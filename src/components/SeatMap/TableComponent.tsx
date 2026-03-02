'use client';

import { Group, Circle, Text, Rect, Line } from 'react-konva';
import { Table, SelectionInfo } from '@/types/seatMap';
import { KonvaEventObject } from 'konva/lib/Node';

interface Props {
  table: Table;
  isSelected: boolean;
  onClick: (e: KonvaEventObject<MouseEvent>, info: SelectionInfo) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, cx: number, cy: number, w: number, h: number) => void;
}

const SEAT_SIZE = 16;
// Distancia del borde de la mesa al centro del asiento
const SEAT_OFFSET = 15;

/** Distribución circular para mesas redondas */
function circularSeatPos(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

/**
 * Pre-calcula las posiciones de todos los asientos alrededor de un rectángulo.
 * Reparte asientos proporcionales a cada lado (top/bottom reciben más en mesas rectangulares)
 * y los centra dentro de cada lado.
 */
function rectSeatPositions(
  total: number,
  tableW: number,
  tableH: number
): { x: number; y: number }[] {
  const halfW = tableW / 2;
  const halfH = tableH / 2;
  const perimeter = 2 * (tableW + tableH);

  // Distribute seats proportionally to side lengths
  let top    = Math.round(total * tableW / perimeter);
  let right  = Math.round(total * tableH / perimeter);
  let bottom = Math.round(total * tableW / perimeter);
  let left   = total - top - right - bottom;
  // Fix negative left (from rounding) taking from the longest side
  if (left < 0) { bottom += left; left = 0; }

  const positions: { x: number; y: number }[] = [];

  const place = (count: number, fn: (t: number) => { x: number; y: number }) => {
    for (let i = 0; i < count; i++) {
      // t va de 0 a 1, centrado: (i + 0.5) / count
      positions.push(fn((i + 0.5) / count));
    }
  };

  // Top (izquierda → derecha)
  place(top,    (t) => ({ x: -halfW + t * tableW,  y: -halfH - SEAT_OFFSET }));
  // Right (arriba → abajo)
  place(right,  (t) => ({ x: halfW + SEAT_OFFSET,  y: -halfH + t * tableH  }));
  // Bottom (derecha → izquierda, para sentido horario)
  place(bottom, (t) => ({ x: halfW - t * tableW,   y: halfH  + SEAT_OFFSET }));
  // Left (abajo → arriba)
  place(left,   (t) => ({ x: -halfW - SEAT_OFFSET, y: halfH  - t * tableH  }));

  return positions;
}

export default function TableComponent({ table, isSelected, onClick, onDragEnd, onDragMove }: Props) {
  const baseColor = table.color ?? '#3b82f6';
  const fill = isSelected ? `${baseColor}33` : `${baseColor}22`;
  const stroke = isSelected ? baseColor : `${baseColor}88`;

  const isCircle = table.shape === 'circle';
  const isSquare = table.shape === 'square';
  const tableW = isCircle ? 80 : isSquare ? 80 : 120;
  const tableH = isCircle ? 80 : isSquare ? 80 : 60;
  const tableRadius = isCircle ? 40 : isSquare ? 8 : 6;
  // Radio para asientos circulares = radio de círculo + offset
  const circleRadius = 40 + SEAT_OFFSET;
  // Dimensiones totales del bounding box (mesa + asientos) para drag
  const boundW = tableW + SEAT_OFFSET * 2 + SEAT_SIZE;
  const boundH = tableH + SEAT_OFFSET * 2 + SEAT_SIZE;

  // Pre-calcular posiciones de todos los asientos
  const seatPositions = isCircle
    ? table.seats.map((_, i) => circularSeatPos(i, table.seats.length, circleRadius))
    : rectSeatPositions(table.seats.length, tableW, tableH);

  return (
    <Group
      x={table.position.x}
      y={table.position.y}
      rotation={table.rotation ?? 0}
      draggable
      onClick={(e) => onClick(e, { id: table.id, type: 'table' })}
      onDragMove={(e) => onDragMove?.(table.id, e.target.x(), e.target.y(), boundW, boundH)}
      onDragEnd={(e) => onDragEnd(table.id, e.target.x(), e.target.y())}
    >
      {/* Selección */}
      {isSelected && (
        <Rect
          x={-boundW / 2}
          y={-boundH / 2}
          width={boundW}
          height={boundH}
          stroke="#3b82f6"
          strokeWidth={1.5}
          dash={[4, 4]}
          fill="transparent"
          cornerRadius={12}
          listening={false}
        />
      )}

      {/* Mesa (cuerpo) */}
      {isCircle ? (
        <Circle
          radius={40}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
      ) : (
        <Rect
          x={-tableW / 2}
          y={-tableH / 2}
          width={tableW}
          height={tableH}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          cornerRadius={tableRadius}
        />
      )}

      {/* Etiqueta de la mesa */}
      <Text
        text={table.label}
        align="center"
        verticalAlign="middle"
        fontSize={11}
        fontStyle="bold"
        fill={baseColor}
        x={-40}
        y={-8}
        width={80}
        height={16}
        listening={false}
      />

      {/* Asientos alrededor */}
      {table.seats.map((seat, i) => {
        const pos = seatPositions[i];
        const isDisabled = seat.status === 'disabled';
        const seatFill = isDisabled ? '#e5e7eb' : 'white';
        const seatStroke = isDisabled ? '#9ca3af' : baseColor;
        const PAD_X = 3;
        return (
          <Group key={seat.id} x={pos.x} y={pos.y}>
            <Rect
              x={-SEAT_SIZE / 2}
              y={-SEAT_SIZE / 2}
              width={SEAT_SIZE}
              height={SEAT_SIZE}
              fill={seatFill}
              stroke={seatStroke}
              strokeWidth={1.5}
              cornerRadius={3}
            />
            {isDisabled ? (
              <>
                <Line
                  points={[-SEAT_SIZE / 2 + PAD_X, -SEAT_SIZE / 2 + PAD_X, SEAT_SIZE / 2 - PAD_X, SEAT_SIZE / 2 - PAD_X]}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  listening={false}
                />
                <Line
                  points={[SEAT_SIZE / 2 - PAD_X, -SEAT_SIZE / 2 + PAD_X, -SEAT_SIZE / 2 + PAD_X, SEAT_SIZE / 2 - PAD_X]}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  listening={false}
                />
              </>
            ) : (
              <Text
                text={seat.label}
                align="center"
                verticalAlign="middle"
                fontSize={7}
                fill="#374151"
                x={-SEAT_SIZE / 2}
                y={-SEAT_SIZE / 2}
                width={SEAT_SIZE}
                height={SEAT_SIZE}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
