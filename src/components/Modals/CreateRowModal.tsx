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
  Textarea,
} from '@mantine/core';
import {
  IconRowInsertTop,
  IconPalette,
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

export default function CreateRowModal({ opened, onClose }: Props) {
  const { dispatch } = useSeatMap();
  const [label, setLabel] = useState('');
  const [seatCount, setSeatCount] = useState<number | string>(10);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [useBatchLabels, setUseBatchLabels] = useState(false);
  const [seatPattern, setSeatPattern] = useState('{1}');
  const [labelError, setLabelError] = useState('');

  const count = typeof seatCount === 'number' ? seatCount : 10;
  const seatPreview = useBatchLabels ? previewLabels(seatPattern, count) : [];

  const handleClose = () => {
    setLabel('');
    setSeatCount(10);
    setColor(PRESET_COLORS[0]);
    setUseBatchLabels(false);
    setSeatPattern('{1}');
    setLabelError('');
    onClose();
  };

  const handleSubmit = () => {
    const err = validateLabel(label);
    if (err) { setLabelError(err); return; }

    const seatLabels = useBatchLabels ? generateLabels(seatPattern, count) : undefined;

    dispatch({
      type: 'ADD_ROW',
      payload: {
        label: label.trim(),
        seatCount: count,
        position: { x: 80, y: 80 + Math.random() * 200 },
        seatLabels,
        color,
      },
    });

    notifications.show({
      title: 'Fila creada',
      message: `"${label}" con ${count} asientos`,
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
          <IconRowInsertTop size={20} color="#3b82f6" />
          <Text fw={700} size="lg">Nueva fila</Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Etiqueta de la fila"
          placeholder="ej. Fila A, VIP, Platea"
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
          max={200}
          required
        />

        <Stack gap={6}>
          <Text size="sm" fw={500}>Color de la fila</Text>
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
              placeholder="ej. A{1}, Fila-{1-20}, {A-Z}"
              value={seatPattern}
              onChange={(e) => setSeatPattern(e.currentTarget.value)}
              description="Usá {1} para números autoincrementales, {1-10} para rango numérico, {A-Z} para rango alfabético."
            />

            {seatPreview.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={500}>Preview ({Math.min(count, 8)} de {count})</Text>
                <Group gap={4}>
                  {seatPreview.map((lbl, i) => (
                    <Badge key={i} variant="light" color="blue" size="sm">{lbl}</Badge>
                  ))}
                  {count > 8 && <Badge variant="light" color="gray" size="sm">+{count - 8} más</Badge>}
                </Group>
              </Stack>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} leftSection={<IconRowInsertTop size={16} />}>
            Crear fila
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
