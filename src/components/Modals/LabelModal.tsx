'use client';

import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Group,
  Button,
  Text,
  Badge,
  Switch,
  Divider,
  Radio,
} from '@mantine/core';
import { IconTag } from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { SelectionInfo } from '@/types/seatMap';
import { generateLabels, previewLabels } from '@/utils/labelGenerator';
import { validateLabel } from '@/lib/validations';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
  targets: SelectionInfo[];
}

export default function LabelModal({ opened, onClose, targets }: Props) {
  const { state, dispatch } = useSeatMap();
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [singleLabel, setSingleLabel] = useState('');
  const [batchPattern, setBatchPattern] = useState('{1}');
  const [labelError, setLabelError] = useState('');

  const count = targets.length;
  const seatPreview = mode === 'batch' ? previewLabels(batchPattern, count) : [];

  const handleClose = () => {
    setSingleLabel('');
    setBatchPattern('{1}');
    setLabelError('');
    setMode('single');
    onClose();
  };

  const handleSubmit = () => {
    if (mode === 'single') {
      const err = validateLabel(singleLabel);
      if (err) { setLabelError(err); return; }
    }

    const labels = mode === 'batch'
      ? generateLabels(batchPattern, count)
      : targets.map(() => singleLabel.trim());

    let updated = 0;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const newLabel = labels[i] ?? labels[labels.length - 1];

      if (target.type === 'row') {
        dispatch({ type: 'UPDATE_ROW', payload: { id: target.id, label: newLabel } });
        updated++;
      } else if (target.type === 'area') {
        dispatch({ type: 'UPDATE_AREA', payload: { id: target.id, label: newLabel } });
        updated++;
      } else if (target.type === 'table') {
        dispatch({ type: 'UPDATE_TABLE', payload: { id: target.id, label: newLabel } });
        updated++;
      } else if (target.type === 'seat') {
        // Buscar a qué fila o mesa pertenece este asiento
        const row = state.seatMap.rows.find((r) => r.seats.some((s) => s.id === target.id));
        if (row) {
          dispatch({ type: 'UPDATE_SEAT_LABEL', payload: { rowId: row.id, seatId: target.id, label: newLabel } });
          updated++;
        } else {
          const table = state.seatMap.tables.find((t) => t.seats.some((s) => s.id === target.id));
          if (table) {
            dispatch({ type: 'UPDATE_SEAT_LABEL', payload: { tableId: table.id, seatId: target.id, label: newLabel } });
            updated++;
          }
        }
      }
    }

    notifications.show({
      title: 'Etiquetas actualizadas',
      message: `${updated} elemento(s) etiquetado(s)`,
      color: 'blue',
    });
    handleClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconTag size={20} color="#3b82f6" />
          <Text fw={700} size="lg">
            Etiquetar {count} elemento(s)
          </Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <Radio.Group value={mode} onChange={(v) => setMode(v as 'single' | 'batch')}>
          <Stack gap="xs">
            <Radio
              value="single"
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={600}>Etiqueta única</Text>
                  <Text size="xs" c="dimmed">Aplicar la misma etiqueta a todos los elementos</Text>
                </Stack>
              }
            />
            <Radio
              value="batch"
              label={
                <Stack gap={0}>
                  <Text size="sm" fw={600}>Etiquetado por lote</Text>
                  <Text size="xs" c="dimmed">Generar etiquetas únicas con un patrón</Text>
                </Stack>
              }
            />
          </Stack>
        </Radio.Group>

        <Divider />

        {mode === 'single' ? (
          <TextInput
            label="Etiqueta"
            placeholder="ej. VIP, Platea, A"
            value={singleLabel}
            onChange={(e) => { setSingleLabel(e.currentTarget.value); setLabelError(''); }}
            error={labelError}
            autoFocus
            required
          />
        ) : (
          <Stack gap="sm">
            <TextInput
              label="Patrón"
              placeholder="ej. Platea {1-50}, Fila {A-Z}"
              value={batchPattern}
              onChange={(e) => setBatchPattern(e.currentTarget.value)}
              description="Usá {1} para autoincremental, {1-10} para rango numérico, {A-Z} para alfabético."
              autoFocus
            />
            {seatPreview.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed" fw={500}>
                  Preview ({Math.min(count, 8)} de {count})
                </Text>
                <Group gap={4}>
                  {seatPreview.map((lbl, i) => (
                    <Badge key={i} variant="light" color="blue" size="sm">{lbl}</Badge>
                  ))}
                  {count > 8 && (
                    <Badge variant="light" color="gray" size="sm">+{count - 8} más</Badge>
                  )}
                </Group>
              </Stack>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} leftSection={<IconTag size={16} />}>
            Aplicar etiquetas
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
