'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  SegmentedControl,
  Button,
  Group,
  Text,
  Divider,
  Badge,
} from '@mantine/core';
import { useSeatMap } from '@/context/SeatMapContext';
import { SeatStatus } from '@/types/seatMap';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
  seatId: string;
}

export default function EditSeatModal({ opened, onClose, seatId }: Props) {
  const { state, dispatch } = useSeatMap();

  // Buscar el asiento en filas y mesas
  let parentLabel = '';
  let rowId: string | undefined;
  let tableId: string | undefined;
  let initialLabel = '';
  let initialStatus: SeatStatus = 'available';

  for (const r of state.seatMap.rows) {
    const s = r.seats.find((s) => s.id === seatId);
    if (s) {
      parentLabel = `Fila ${r.label}`;
      rowId = r.id;
      initialLabel = s.label;
      initialStatus = s.status;
      break;
    }
  }
  if (!rowId) {
    for (const t of state.seatMap.tables) {
      const s = t.seats.find((s) => s.id === seatId);
      if (s) {
        parentLabel = `Mesa ${t.label}`;
        tableId = t.id;
        initialLabel = s.label;
        initialStatus = s.status;
        break;
      }
    }
  }

  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<SeatStatus>('available');

  useEffect(() => {
    if (opened) {
      setLabel(initialLabel);
      setStatus(initialStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, seatId]);

  const found = !!rowId || !!tableId;
  if (!found) return null;

  const handleSave = () => {
    if (!label.trim()) return;

    dispatch({
      type: 'UPDATE_SEAT_LABEL',
      payload: { rowId, tableId, seatId, label: label.trim() },
    });
    dispatch({
      type: 'UPDATE_SEAT_STATUS',
      payload: { seatId, status, rowId, tableId },
    });

    notifications.show({
      title: 'Asiento actualizado',
      message: `Asiento "${label.trim()}" — ${status === 'disabled' ? 'Deshabilitado' : 'Disponible'}`,
      color: status === 'disabled' ? 'red' : 'green',
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>Editar asiento</Text>
          {parentLabel && (
            <Badge size="sm" variant="light" color="gray">
              {parentLabel}
            </Badge>
          )}
        </Group>
      }
      centered
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label="Etiqueta del asiento"
          placeholder="Ej: A1"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />

        <div>
          <Text size="sm" fw={500} mb={6}>Estado</Text>
          <SegmentedControl
            value={status}
            onChange={(v) => setStatus(v as SeatStatus)}
            data={[
              { value: 'available', label: 'Disponible' },
              { value: 'disabled', label: 'Deshabilitado' },
            ]}
            fullWidth
          />
        </div>

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!label.trim()} color="orange">
            Guardar cambios
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
