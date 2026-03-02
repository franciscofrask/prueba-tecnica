'use client';

import { Group, Rect, Text, Ellipse, RegularPolygon, Line } from 'react-konva';
import { Area, SelectionInfo } from '@/types/seatMap';
import { KonvaEventObject } from 'konva/lib/Node';

interface Props {
  area: Area;
  isSelected: boolean;
  onClick: (e: KonvaEventObject<MouseEvent>, info: SelectionInfo) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, cx: number, cy: number, w: number, h: number) => void;
}

function diamondPoints(w: number, h: number): number[] {
  return [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2];
}

export default function AreaComponent({ area, isSelected, onClick, onDragEnd, onDragMove }: Props) {
  const baseColor = area.color ?? '#8b5cf640';
  const solidColor = baseColor.length === 9 ? baseColor.slice(0, 7) : baseColor;
  const shape = area.shape ?? 'rectangle';
  const cx = area.width / 2;
  const cy = area.height / 2;
  const rx = area.width / 2;
  const ry = area.height / 2;
  const hexR = Math.min(rx, ry);

  const commonFill = { fill: baseColor, stroke: isSelected ? '#3b82f6' : solidColor, strokeWidth: isSelected ? 2 : 1.5 };
  const selDash = [4, 4];

  const shapeNode = () => {
    if (shape === 'ellipse') {
      return (
        <>
          <Ellipse x={cx} y={cy} radiusX={rx} radiusY={ry} {...commonFill} />
          {isSelected && <Ellipse x={cx} y={cy} radiusX={rx + 4} radiusY={ry + 4} stroke="#3b82f6" strokeWidth={1.5} dash={selDash} fill="transparent" listening={false} />}
        </>
      );
    }
    if (shape === 'hexagon') {
      return (
        <>
          <RegularPolygon x={cx} y={cy} sides={6} radius={hexR} {...commonFill} />
          {isSelected && <RegularPolygon x={cx} y={cy} sides={6} radius={hexR + 4} stroke="#3b82f6" strokeWidth={1.5} dash={selDash} fill="transparent" listening={false} />}
        </>
      );
    }
    if (shape === 'diamond') {
      return (
        <>
          <Line points={diamondPoints(area.width, area.height)} closed {...commonFill} />
          {isSelected && <Rect x={-4} y={-4} width={area.width + 8} height={area.height + 8} stroke="#3b82f6" strokeWidth={1.5} dash={selDash} fill="transparent" cornerRadius={4} listening={false} />}
        </>
      );
    }
    // rectangle (default)
    return (
      <>
        <Rect width={area.width} height={area.height} cornerRadius={8} {...commonFill} dash={isSelected ? undefined : [6, 4]} />
        {isSelected && <Rect x={-4} y={-4} width={area.width + 8} height={area.height + 8} stroke="#3b82f6" strokeWidth={1.5} dash={selDash} fill="transparent" cornerRadius={10} listening={false} />}
      </>
    );
  };

  return (
    <Group
      x={area.position.x + area.width / 2}
      y={area.position.y + area.height / 2}
      offsetX={area.width / 2}
      offsetY={area.height / 2}
      rotation={area.rotation ?? 0}
      draggable
      onClick={(e) => onClick(e, { id: area.id, type: 'area' })}
      onDragMove={(e) => onDragMove?.(area.id, e.target.x(), e.target.y(), area.width, area.height)}
      onDragEnd={(e) => onDragEnd(area.id, e.target.x() - area.width / 2, e.target.y() - area.height / 2)}
    >
      {shapeNode()}
      <Text
        text={area.label}
        x={shape === 'rectangle' ? 8 : cx - 40}
        y={shape === 'rectangle' ? 8 : cy - 8}
        width={shape === 'rectangle' ? undefined : 80}
        align={shape === 'rectangle' ? 'left' : 'center'}
        fontSize={12}
        fontStyle="bold"
        fill={solidColor}
        listening={false}
      />
    </Group>
  );
}
