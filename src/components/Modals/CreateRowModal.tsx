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
  Divider,
  Badge,
  Switch,
  SegmentedControl,
  Paper,
} from '@mantine/core';
import {
  IconRowInsertTop,
  IconStack2,
} from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { generateLabels, previewLabels } from '@/utils/labelGenerator';
import { validateLabel } from '@/lib/validations';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

const ROW_SPACING = 70;

export default function CreateRowModal({ opened, onClose }: Props) {
  const { dispatch } = useSeatMap();
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [seatCount, setSeatCount] = useState<number | string>(10);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [label, setLabel] = useState('');
  const [labelError, setLabelError] = useState('');
  const [useBatchLabels, setUseBatchLabels] = useState(false);
  const [seatPattern, setSeatPattern] = useState('{1}');
  const [rowCount, setRowCount] = useState<number | string>(5);
  const [rowPattern, setRowPattern] = useState('Fila {A-Z}');
  const [useSharedSeatLabels, setUseSharedSeatLabels] = useState(false);
  const [sharedSeatPattern, setSharedSeatPattern] = useState('{1}');

  const count = typeof seatCount === 'number' ? seatCount : 10;
  const rows = typeof rowCount === 'number' ? rowCount : 5;
  const seatPreview = useBatchLabels ? previewLabels(seatPattern, count) : [];
  const rowLabelsPreview = generateLabels(rowPattern, Math.min(rows, 8));
  const sharedSeatPreview = useSharedSeatLabels ? previewLabels(sharedSeatPattern, count) : [];

  const handleClose = () => {
    setMode('single');
    setLabel('');
    setSeatCount(10);
    setColor(PRESET_COLORS[0]);
    setUseBatchLabels(false);
    setSeatPattern('{1}');
    setLabelError('');
    setRowCount(5);
    setRowPattern('Fila {A-Z}');
    setUseSharedSeatLabels(false);
    setSharedSeatPattern('{1}');
    onClose();
  };

  const handleSubmit = () => {
    if (mode === 'single') {
      const err = validateLabel(label);
      if (err) { setLabelError(err); return; }
      const seatLabels = useBatchLabels ? generateLabels(seatPattern, count) : undefined;
      dispatch({
        type: 'ADD_ROW',
        payload: { label: label.trim(), seatCount: count, position: { x: 80, y: 80 + Math.random() * 200 }, seatLabels, color },
      });
      notifications.show({ title: 'Fila creada', message: `"${label}" con ${count} asientos`, color: 'green' });
    } else {
      if (rows < 1) return;
      const rowLabels = generateLabels(rowPattern, rows);
      for (let i = 0; i < rows; i++) {
        const seatLabels = useSharedSeatLabels ? generateLabels(sharedSeatPattern, count) : undefined;
        dispatch({
          type: 'ADD_ROW',
          payload: { label: rowLabels[i] ?? `Fila ${i + 1}`, seatCount: count, position: { x: 80, y: 80 + i * ROW_SPACING }, seatLabels, color },
        });
      }
      notifications.show({ title: `${rows} filas creadas`, message: `${rowLabels[0]} → ${rowLabels[rows - 1]}, ${count} asientos c/u`, color: 'green' });
    }
    handleClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose}
      title={<Group gap="xs"><IconRowInsertTop size={20} color="#3b82f6" /><Text fw={700} size="lg">Nueva fila</Text></Group>}
      size="md"
    >
      <Stack gap="md">
        <SegmentedControl fullWidth value={mode} onChange={(v) => setMode(v as 'single' | 'multiple')}
          data={[{ label: 'Fila única', value: 'single' }, { label: 'Múltiples filas', value: 'multiple' }]}
        />

        {mode === 'single' && (
          <>
            <TextInput label="Etiqueta de la fila" placeholder="ej. Fila A, VIP, Platea"
              value={label} onChange={(e) => { setLabel(e.currentTarget.value); setLabelError(''); }}
              error={labelError} required autoFocus
            />
            <NumberInput label="Asientos" value={seatCount} onChange={setSeatCount} min={1} max={200} required />
            <Divider />
            <Switch label="Etiquetar asientos por lote" checked={useBatchLabels}
              onChange={(e) => setUseBatchLabels(e.currentTarget.checked)}
            />
            {useBatchLabels && (
              <Stack gap="sm">
                <TextInput label="Patrón de asientos" placeholder="ej. A{1}, {1-20}, {A-Z}"
                  value={seatPattern} onChange={(e) => setSeatPattern(e.currentTarget.value)}
                  description="Usa {1} para autoincremental, {1-10} para rango numérico."
                />
                {seatPreview.length > 0 && (
                  <Group gap={4}>
                    {seatPreview.map((lbl, i) => <Badge key={i} variant="light" color="blue" size="sm">{lbl}</Badge>)}
                    {count > 8 && <Badge variant="light" color="gray" size="sm">+{count - 8} más</Badge>}
                  </Group>
                )}
              </Stack>
            )}
          </>
        )}

        {mode === 'multiple' && (
          <>
            <Group grow>
              <NumberInput label="Cantidad de filas" value={rowCount} onChange={setRowCount} min={2} max={100} required />
              <NumberInput label="Asientos por fila" value={seatCount} onChange={setSeatCount} min={1} max={200} required />
            </Group>
            <TextInput label="Patrón de nombre de fila" placeholder="ej. Fila {A-Z}, Sector {1-10}"
              value={rowPattern} onChange={(e) => setRowPattern(e.currentTarget.value)}
              description="Usa {A-Z} para letras, {1} para números autoincrementales."
            />
            {rowLabelsPreview.length > 0 && (
              <Paper p="xs" withBorder radius="sm" style={{ background: '#f8fafc' }}>
                <Text size="xs" c="dimmed" fw={500} mb={6}>Filas que se crearán ({rows}):</Text>
                <Group gap={4}>
                  {rowLabelsPreview.map((lbl, i) => <Badge key={i} variant="light" color="indigo" size="sm">{lbl}</Badge>)}
                    {rows > 8 && <Badge variant="light" color="gray" size="sm">+{rows - 8} más</Badge>}
                </Group>
              </Paper>
            )}
            <Divider />
            <Switch label="Etiquetar asientos de cada fila" checked={useSharedSeatLabels}
              onChange={(e) => setUseSharedSeatLabels(e.currentTarget.checked)}
            />
            {useSharedSeatLabels && (
              <Stack gap="sm">
                <TextInput label="Patrón de asientos" placeholder="ej. {1}, A{1-20}"
                  value={sharedSeatPattern} onChange={(e) => setSharedSeatPattern(e.currentTarget.value)}
                  description="Se aplica igual a cada fila."
                />
                {sharedSeatPreview.length > 0 && (
                  <Group gap={4}>
                    {sharedSeatPreview.map((lbl, i) => <Badge key={i} variant="light" color="blue" size="sm">{lbl}</Badge>)}
                    {count > 8 && <Badge variant="light" color="gray" size="sm">+{count - 8} más</Badge>}
                  </Group>
                )}
              </Stack>
            )}
          </>
        )}

        <Divider />
        <Stack gap={6}>
          <Text size="sm" fw={500}>Color</Text>
          <Group gap="xs">
            {PRESET_COLORS.map((c) => (
              <ColorSwatch key={c} color={c} size={28}
                style={{ cursor: 'pointer', outline: c === color ? '2px solid #1d4ed8' : 'none', outlineOffset: 2 }}
                onClick={() => setColor(c)}
              />
            ))}
          </Group>
        </Stack>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit}
            leftSection={mode === 'multiple' ? <IconStack2 size={16} /> : <IconRowInsertTop size={16} />}
          >
            {mode === 'multiple' ? `Crear ${rows || 0} filas` : 'Crear fila'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}