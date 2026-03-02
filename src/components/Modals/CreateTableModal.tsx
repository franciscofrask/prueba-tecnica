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
  Badge,
  Switch,
  Divider,
} from '@mantine/core';
import { IconArmchair } from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { validateLabel } from '@/lib/validations';
import { generateLabels, previewLabels } from '@/utils/labelGenerator';
import { notifications } from '@mantine/notifications';
import { TableShape } from '@/types/seatMap';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export default function CreateTableModal({ opened, onClose }: Props) {
  const { dispatch } = useSeatMap();
  const [label, setLabel] = useState('');
  const [seatCount, setSeatCount] = useState<number | string>(6);
  const [shape, setShape] = useState<TableShape>('circle');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [useBatchLabels, setUseBatchLabels] = useState(false);
  const [seatPattern, setSeatPattern] = useState('Silla {1}');
  const [labelError, setLabelError] = useState('');

  const count = typeof seatCount === 'number' ? seatCount : 6;
  const seatPreview = useBatchLabels ? previewLabels(seatPattern, count) : [];

  const handleClose = () => {
    setLabel('');
    setSeatCount(6);
    setShape('circle');
    setColor(PRESET_COLORS[0]);
    setUseBatchLabels(false);
    setSeatPattern('Silla {1}');
    setLabelError('');
    onClose();
  };

  const handleSubmit = () => {
    const err = validateLabel(label);
    if (err) { setLabelError(err); return; }

    const seatLabels = useBatchLabels ? generateLabels(seatPattern, count) : undefined;

    dispatch({
      type: 'ADD_TABLE',
      payload: {
        label: label.trim(),
        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
        seatCount: count,
        shape,
        seatLabels,
        color,
      },
    });

    notifications.show({
      title: 'Mesa creada',
      message: `"${label}" con ${count} asientos (${shape})`,
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
          <IconArmchair size={20} color="#10b981" />
          <Text fw={700} size="lg">Nueva mesa</Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Etiqueta de la mesa"
          placeholder="ej. Mesa 1, VIP-T1"
          value={label}
          onChange={(e) => { setLabel(e.currentTarget.value); setLabelError(''); }}
          error={labelError}
          required
          autoFocus
        />

        <NumberInput
          label="Cantidad de asientos"
          value={seatCount}
          onChange={setSeatCount}
          min={1}
          max={20}
          required
        />

        <Stack gap={6}>
          <Text size="sm" fw={500}>Forma de la mesa</Text>
          <SegmentedControl
            value={shape}
            onChange={(v) => setShape(v as TableShape)}
            data={[
              { label: 'Circular', value: 'circle' },
              { label: 'Cuadrada', value: 'square' },
              { label: 'Rectangular', value: 'rectangle' },
            ]}
          />

          {/* Preview SVG */}
          {(() => {
            const W = 260, H = 160;
            const cx = W / 2, cy = H / 2;
            const isCircle  = shape === 'circle';
            const isSquare  = shape === 'square';
            const tableW = isCircle ? 64 : isSquare ? 70 : 110;
            const tableH = isCircle ? 64 : isSquare ? 70 :  54;
            const seatSz = 14;
            const seatOff = 14;
            const n = Math.min(count, 16);

            // Posiciones de asientos
            const seats: { x: number; y: number }[] = [];
            if (isCircle) {
              const r = tableW / 2 + seatOff;
              for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                seats.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
              }
            } else {
              // Distribuir proporcional a cada lado
              const perimeter = 2 * (tableW + tableH);
              let top    = Math.round(n * tableW / perimeter);
              let right  = Math.round(n * tableH / perimeter);
              let bottom = Math.round(n * tableW / perimeter);
              let left   = n - top - right - bottom;
              if (left < 0) { bottom += left; left = 0; }

              const place = (cnt: number, fn: (t: number) => { x: number; y: number }) => {
                for (let i = 0; i < cnt; i++) seats.push(fn((i + 0.5) / cnt));
              };
              const hw = tableW / 2, hh = tableH / 2;
              place(top,    (t) => ({ x: cx - hw + t * tableW,   y: cy - hh - seatOff }));
              place(right,  (t) => ({ x: cx + hw + seatOff,      y: cy - hh + t * tableH }));
              place(bottom, (t) => ({ x: cx + hw - t * tableW,   y: cy + hh + seatOff }));
              place(left,   (t) => ({ x: cx - hw - seatOff,      y: cy + hh - t * tableH }));
            }

            return (
              <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
                  {/* Asientos */}
                  {seats.map((s, i) => (
                    <rect
                      key={i}
                      x={s.x - seatSz / 2} y={s.y - seatSz / 2}
                      width={seatSz} height={seatSz}
                      rx={isCircle ? seatSz / 2 : 3}
                      fill="white" stroke={color} strokeWidth={1.5}
                    />
                  ))}
                  {/* Mesa */}
                  {isCircle ? (
                    <circle cx={cx} cy={cy} r={tableW / 2} fill={color} stroke={color} strokeWidth={1.5} />
                  ) : (
                    <rect
                      x={cx - tableW / 2} y={cy - tableH / 2}
                      width={tableW} height={tableH}
                      rx={isSquare ? 7 : 5}
                      fill={color} stroke={color} strokeWidth={1.5}
                    />
                  )}
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="white">
                    {label || 'Mesa'}
                  </text>
                </svg>
              </div>
            );
          })()}
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={500}>Color</Text>
          <Group gap="xs">
            {PRESET_COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                size={28}
                style={{ cursor: 'pointer', outline: c === color ? '2px solid #1d4ed8' : 'none', outlineOffset: 2 }}
                onClick={() => setColor(c)}
              />
            ))}
          </Group>
        </Stack>

        <Divider />

        <Switch
          label="Etiquetar asientos por lote"
          checked={useBatchLabels}
          onChange={(e) => setUseBatchLabels(e.currentTarget.checked)}
        />

        {useBatchLabels && (
          <Stack gap="sm">
            <TextInput
              label="Patrón de etiquetado"
              placeholder="ej. Silla {1}, {A-Z}, Puesto {1-6}"
              value={seatPattern}
              onChange={(e) => setSeatPattern(e.currentTarget.value)}
              description="Usá {1} para autoincremental, {1-10} para rango numérico."
            />
            {seatPreview.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={500}>Preview</Text>
                <Group gap={4}>
                  {seatPreview.map((lbl, i) => (
                    <Badge key={i} variant="light" color="green" size="sm">{lbl}</Badge>
                  ))}
                  {count > 8 && <Badge variant="light" color="gray" size="sm">+{count - 8} más</Badge>}
                </Group>
              </Stack>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
          <Button color="green" onClick={handleSubmit} leftSection={<IconArmchair size={16} />}>
            Crear mesa
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
