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

function seatPosition(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export default function TableComponent({ table, isSelected, onClick, onDragEnd, onDragMove }: Props) {
  const baseColor = table.color ?? '#3b82f6';
  const fill = isSelected ? `${baseColor}33` : `${baseColor}22`;
  const stroke = isSelected ? baseColor : `${baseColor}88`;

  const isCircle = table.shape === 'circle';
  const tableW = table.shape === 'rectangle' ? 120 : 80;
  const tableH = table.shape === 'rectangle' ? 60 : 80;
  const tableRadius = isCircle ? 40 : table.shape === 'square' ? 8 : 6;
  const seatRadius = isCircle ? 50 : 48;

  return (
    <Group
      x={table.position.x}
      y={table.position.y}
      rotation={table.rotation ?? 0}
      draggable
      onClick={(e) => onClick(e, { id: table.id, type: 'table' })}
      onDragMove={(e) => onDragMove?.(table.id, e.target.x(), e.target.y(), 130, 130)}
      onDragEnd={(e) => onDragEnd(table.id, e.target.x(), e.target.y())}
    >
      {/* Selección */}
      {isSelected && (
        <Rect
          x={-(tableW / 2) - 20}
          y={-(tableH / 2) - 20}
          width={tableW + 40}
          height={tableH + 40}
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
        const pos = seatPosition(i, table.seats.length, seatRadius);
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
