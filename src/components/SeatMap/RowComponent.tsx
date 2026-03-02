'use client';

import { Group, Rect, Text, Line } from 'react-konva';
import { Row, SelectionInfo } from '@/types/seatMap';
import { KonvaEventObject } from 'konva/lib/Node';

interface Props {
  row: Row;
  isSelected: boolean;
  selectedSeatIds: Set<string>;
  onClick: (e: KonvaEventObject<MouseEvent>, info: SelectionInfo) => void;
  onSeatClick: (e: KonvaEventObject<MouseEvent>, info: SelectionInfo) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, cx: number, cy: number, w: number, h: number) => void;
}

const SEAT_SIZE = 28;
const SEAT_GAP = 6;
const LABEL_HEIGHT = 20;
const PADDING = 8;

export default function RowComponent({
  row,
  isSelected,
  selectedSeatIds,
  onClick,
  onSeatClick,
  onDragEnd,
  onDragMove,
}: Props) {
  const baseColor = row.color ?? '#3b82f6';
  const rowWidth = row.seats.length * (SEAT_SIZE + SEAT_GAP) - SEAT_GAP + PADDING * 2;
  const rowHeight = SEAT_SIZE + LABEL_HEIGHT + PADDING * 2;

  return (
    <Group
      x={row.position.x + rowWidth / 2}
      y={row.position.y + rowHeight / 2}
      offsetX={rowWidth / 2}
      offsetY={rowHeight / 2}
      rotation={row.rotation ?? 0}
      draggable
      onDragMove={(e) => onDragMove?.(row.id, e.target.x(), e.target.y(), rowWidth, rowHeight)}
      onDragEnd={(e) => onDragEnd(row.id, e.target.x() - rowWidth / 2, e.target.y() - rowHeight / 2)}
    >
      {/* Fondo clickeable de la fila (cubre toda el área) */}
      <Rect
        x={-PADDING}
        y={-PADDING}
        width={rowWidth + PADDING}
        height={rowHeight + PADDING}
        fill="transparent"
        onClick={(e) => onClick(e, { id: row.id, type: 'row' })}
      />
      {/* Selección destacando bounding box */}
      {isSelected && (
        <Rect
          x={-6}
          y={-6}
          width={rowWidth + 12}
          height={rowHeight + 12}
          stroke="#3b82f6"
          strokeWidth={1.5}
          dash={[4, 4]}
          fill="transparent"
          cornerRadius={10}
          listening={false}
        />
      )}

      {/* Etiqueta de la fila */}
      <Text
        text={row.label}
        x={PADDING}
        y={PADDING / 2}
        fontSize={11}
        fontStyle="bold"
        fill={isSelected ? '#1d4ed8' : '#374151'}
        listening={false}
      />

      {/* Asientos */}
      {row.seats.map((seat, i) => {
        const seatX = PADDING + i * (SEAT_SIZE + SEAT_GAP);
        const seatY = LABEL_HEIGHT + PADDING;
        const isSeatSelected = selectedSeatIds.has(seat.id);
        const isDisabled = seat.status === 'disabled';

        // Colores según estado
        let seatFill: string;
        let seatStroke: string;
        let seatOpacity: number;
        if (isDisabled) {
          seatFill = '#fef2f2';      // rojo muy clarito
          seatStroke = '#ef4444';   // rojo
          seatOpacity = 1;
        } else if (isSeatSelected) {
          seatFill = baseColor;
          seatStroke = baseColor;
          seatOpacity = 1;
        } else {
          seatFill = 'white';
          seatStroke = `${baseColor}88`;
          seatOpacity = 1;
        }
        const textColor = isSeatSelected ? 'white' : '#374151';
        const PAD_X = 5;

        return (
          <Group
            key={seat.id}
            x={seatX}
            y={seatY}
            name="seat"
            onClick={(e) => onSeatClick(e, { id: seat.id, type: 'seat' })}
          >
            <Rect
              width={SEAT_SIZE}
              height={SEAT_SIZE}
              fill={seatFill}
              stroke={seatStroke}
              strokeWidth={isDisabled ? 2 : 1.5}
              cornerRadius={[4, 4, 10, 10]}
              opacity={seatOpacity}
              name="seat"
            />
            {isDisabled ? (
              <>
                {/* X roja gruesa sobre fondo */}
                <Line
                  points={[PAD_X, PAD_X, SEAT_SIZE - PAD_X, SEAT_SIZE - PAD_X]}
                  stroke="#ef4444"
                  strokeWidth={2}
                  listening={false}
                />
                <Line
                  points={[SEAT_SIZE - PAD_X, PAD_X, PAD_X, SEAT_SIZE - PAD_X]}
                  stroke="#ef4444"
                  strokeWidth={2}
                  listening={false}
                />
              </>
            ) : (
              <Text
                text={seat.label.length > 3 ? seat.label.slice(0, 3) : seat.label}
                align="center"
                verticalAlign="middle"
                fontSize={7}
                fill={textColor}
                x={0}
                y={0}
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
