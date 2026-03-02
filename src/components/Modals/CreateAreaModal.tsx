'use client';

import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  ColorSwatch,
  Group,
  Button,
  Text,
  SegmentedControl,
} from '@mantine/core';
import { IconBorderCorners, IconSquare, IconCircle, IconHexagon, IconDiamond } from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { validateLabel } from '@/lib/validations';
import { notifications } from '@mantine/notifications';
import { AreaShape } from '@/types/seatMap';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#8b5cf640', '#3b82f640', '#10b98140', '#f59e0b40',
  '#ef444440', '#ec489940', '#06b6d440', '#84cc1640',
];

const SOLID_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export default function CreateAreaModal({ opened, onClose }: Props) {
  const { dispatch } = useSeatMap();
  const [label, setLabel] = useState('');
  const [width, setWidth] = useState<number | string>(200);
  const [height, setHeight] = useState<number | string>(150);
  const [colorIdx, setColorIdx] = useState(0);
  const [labelError, setLabelError] = useState('');
  const [shape, setShape] = useState<AreaShape>('rectangle');

  const handleClose = () => {
    setLabel('');
    setWidth(200);
    setHeight(150);
    setColorIdx(0);
    setLabelError('');
    setShape('rectangle');
    onClose();
  };

  const handleSubmit = () => {
    const err = validateLabel(label);
    if (err) { setLabelError(err); return; }

    dispatch({
      type: 'ADD_AREA',
      payload: {
        label: label.trim(),
        position: { x: 60, y: 60 },
        width: typeof width === 'number' ? width : 200,
        height: typeof height === 'number' ? height : 150,
        color: PRESET_COLORS[colorIdx],
        shape,
      },
    });

    notifications.show({
      title: 'Área creada',
      message: `"${label}"`,
      color: 'green',
    });
    handleClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconBorderCorners size={20} color="#8b5cf6" />
          <Text fw={700} size="lg">Nueva área</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label="Etiqueta del área"
          placeholder="ej. VIP Lounge, Palco, Fosa"
          value={label}
          onChange={(e) => { setLabel(e.currentTarget.value); setLabelError(''); }}
          error={labelError}
          required
          autoFocus
        />

        <Group grow>
          <NumberInput
            label="Ancho (px)"
            value={width}
            onChange={setWidth}
            min={50}
            max={1000}
          />
          <NumberInput
            label="Alto (px)"
            value={height}
            onChange={setHeight}
            min={50}
            max={800}
          />
        </Group>

        <Stack gap={6}>
          <Text size="sm" fw={500}>Forma del área</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={shape}
            onChange={(v) => setShape(v as AreaShape)}
            data={[
              { value: 'rectangle', label: <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconSquare size={14} /><span>Rect</span></div> },
              { value: 'ellipse',   label: <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconCircle size={14} /><span>Elipse</span></div> },
              { value: 'hexagon',   label: <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconHexagon size={14} /><span>Hex</span></div> },
              { value: 'diamond',   label: <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconDiamond size={14} /><span>Rombo</span></div> },
            ]}
          />

          {/* Preview SVG */}
          {(() => {
            const fill = PRESET_COLORS[colorIdx];
            const solid = SOLID_COLORS[colorIdx];
            const W = 240, H = 100;
            const pad = 16;
            const w = W - pad * 2, h = H - pad * 2;
            const cx = W / 2, cy = H / 2;
            const hexPts = Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI / 3) * i - Math.PI / 6;
              return `${cx + (w / 2) * Math.cos(a)},${cy + (h / 2) * Math.sin(a)}`;
            }).join(' ');
            const commonProps = { fill, stroke: solid, strokeWidth: 1.5, strokeDasharray: '5 3' };
            return (
              <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
                  {shape === 'rectangle' && <rect x={pad} y={pad} width={w} height={h} rx={6} {...commonProps} />}
                  {shape === 'ellipse'   && <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} {...commonProps} />}
                  {shape === 'hexagon'   && <polygon points={hexPts} {...commonProps} />}
                  {shape === 'diamond'   && <polygon points={`${cx},${pad} ${W - pad},${cy} ${cx},${H - pad} ${pad},${cy}`} {...commonProps} />}
                  <text x={cx} y={cy + 5} textAnchor="middle" fontSize={12} fontWeight={600} fill={solid}>
                    {label || 'Área'}
                  </text>
                </svg>
              </div>
            );
          })()}
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={500}>Color del área</Text>
          <Group gap="xs">
            {SOLID_COLORS.map((c, i) => (
              <ColorSwatch
                key={c}
                color={c}
                size={28}
                style={{
                  cursor: 'pointer',
                  outline: i === colorIdx ? '2px solid #1d4ed8' : 'none',
                  outlineOffset: 2,
                }}
                onClick={() => setColorIdx(i)}
              />
            ))}
          </Group>
        </Stack>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} color="violet" leftSection={<IconBorderCorners size={16} />}>
            Crear área
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
