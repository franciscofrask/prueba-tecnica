'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  ColorInput,
  Button,
  Group,
  Text,
  Divider,
} from '@mantine/core';
import { useSeatMap } from '@/context/SeatMapContext';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
  rowId: string;
}

const PRESET_COLORS = [
  '#4dabf7', '#74c0fc', '#a9e34b', '#69db7c', '#ffa94d',
  '#ff6b6b', '#cc5de8', '#f783ac', '#20c997', '#868e96',
];

export default function EditRowModal({ opened, onClose, rowId }: Props) {
  const { state, dispatch } = useSeatMap();
  const row = state.seatMap.rows.find((r) => r.id === rowId);

  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#4dabf7');
  const [seatCount, setSeatCount] = useState<number>(1);

  useEffect(() => {
    if (row && opened) {
      setLabel(row.label);
      setColor(row.color ?? '#4dabf7');
      setSeatCount(row.seats.length);
    }
  }, [row, opened]);

  if (!row) return null;

  const seatDiff = seatCount - row.seats.length;

  const handleSave = () => {
    if (!label.trim()) return;
    dispatch({
      type: 'UPDATE_ROW_CONFIG',
      payload: { id: rowId, label: label.trim(), color, seatCount },
    });
    notifications.show({
      title: 'Fila actualizada',
      message: `"${label.trim()}" guardada correctamente`,
      color: 'blue',
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Editar fila" centered size="sm">
      <Stack gap="md">
        <TextInput
          label="Etiqueta de la fila"
          placeholder="Ej: Fila A"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />

        <NumberInput
          label="Cantidad de asientos"
          value={seatCount}
          onChange={(v) => setSeatCount(Math.max(1, Number(v) || 1))}
          min={1}
          max={100}
          description={
            seatDiff > 0
              ? `Se agregarán ${seatDiff} asiento(s) al final`
              : seatDiff < 0
              ? `Se eliminarán ${Math.abs(seatDiff)} asiento(s) del final`
              : undefined
          }
        />

        <ColorInput
          label="Color de los asientos"
          value={color}
          onChange={setColor}
          format="hex"
          swatches={PRESET_COLORS}
          swatchesPerRow={10}
        />

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            Guardar cambios
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
