'use client';

import { useState } from 'react';
import {
  Stack,
  Text,
  Paper,
  Group,
  Button,
  Divider,
  Badge,
  ScrollArea,
  TextInput,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Accordion,
  NumberInput,
} from '@mantine/core';
import {
  IconTag,
  IconTrash,
  IconChevronRight,
  IconRowInsertTop,
  IconBorderCorners,
  IconArmchair,
  IconArmchair2,
  IconPencil,
  IconCheck,
  IconX,
  IconSettings,
} from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { SelectionInfo } from '@/types/seatMap';
import LabelModal from '@/components/Modals/LabelModal';
import DeleteConfirmModal from '@/components/Modals/DeleteConfirmModal';
import EditRowModal from '@/components/Modals/EditRowModal';
import EditSeatModal from '@/components/Modals/EditSeatModal';
import { validateLabel } from '@/lib/validations';
import { notifications } from '@mantine/notifications';

function typeIcon(type: string) {
  switch (type) {
    case 'row': return <IconRowInsertTop size={14} />;
    case 'area': return <IconBorderCorners size={14} />;
    case 'table': return <IconArmchair size={14} />;
    case 'seat': return <IconArmchair2 size={14} />;
    default: return null;
  }
}

function typeColor(type: string) {
  switch (type) {
    case 'row': return 'blue';
    case 'area': return 'violet';
    case 'table': return 'green';
    case 'seat': return 'orange';
    default: return 'gray';
  }
}

/** Etiqueta de display (con prefijo del padre para asientos) */
function getLabel(state: ReturnType<typeof useSeatMap>['state'], info: SelectionInfo): string {
  const { seatMap } = state;
  if (info.type === 'row') return seatMap.rows.find((r) => r.id === info.id)?.label ?? '—';
  if (info.type === 'area') return seatMap.areas.find((a) => a.id === info.id)?.label ?? '—';
  if (info.type === 'table') return seatMap.tables.find((t) => t.id === info.id)?.label ?? '—';
  if (info.type === 'seat') {
    for (const r of seatMap.rows) {
      const s = r.seats.find((s) => s.id === info.id);
      if (s) return `${r.label} · ${s.label}`;
    }
    for (const t of seatMap.tables) {
      const s = t.seats.find((s) => s.id === info.id);
      if (s) return `${t.label} · ${s.label}`;
    }
  }
  return '—';
}

/** Etiqueta editable (solo la propia label, sin prefijo del padre) */
function getEditLabel(state: ReturnType<typeof useSeatMap>['state'], info: SelectionInfo): string {
  const { seatMap } = state;
  if (info.type === 'seat') {
    for (const r of seatMap.rows) {
      const s = r.seats.find((s) => s.id === info.id);
      if (s) return s.label;
    }
    for (const t of seatMap.tables) {
      const s = t.seats.find((s) => s.id === info.id);
      if (s) return s.label;
    }
  }
  return getLabel(state, info);
}

interface InlineEditProps {
  value: string;
  onSave: (v: string) => void;
}

function InlineEdit({ value, onSave }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');

  const save = () => {
    const err = validateLabel(draft);
    if (err) { setError(err); return; }
    onSave(draft.trim());
    setEditing(false);
    setError('');
  };

  if (!editing) {
    return (
      <Group gap={4}>
        <Text size="sm" fw={500}>{value}</Text>
        <Tooltip label="Renombrar" withArrow>
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => { setDraft(value); setEditing(true); }}>
            <IconPencil size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  return (
    <Group gap={4} align="flex-start">
      <TextInput
        value={draft}
        onChange={(e) => { setDraft(e.currentTarget.value); setError(''); }}
        error={error}
        size="xs"
        style={{ flex: 1 }}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
      />
      <ActionIcon size="sm" color="green" variant="light" onClick={save}><IconCheck size={12} /></ActionIcon>
      <ActionIcon size="sm" color="gray" variant="light" onClick={() => setEditing(false)}><IconX size={12} /></ActionIcon>
    </Group>
  );
}

export default function PropertiesPanel() {
  const { state, dispatch } = useSeatMap();
  const { selectedItems, seatMap } = state;
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editSeatId, setEditSeatId] = useState<string | null>(null);

  if (selectedItems.length === 0) {
    // Mostrar resumen del mapa
    return (
      <Stack
        p="md"
        gap="md"
        style={{
          width: 260,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          background: 'white',
          height: '100%',
        }}
      >
        <Text fw={700} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          Resumen del mapa
        </Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Filas</Text>
            <Badge variant="light" color="blue">{seatMap.rows.length}</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Asientos en filas</Text>
            <Badge variant="light" color="blue">
              {seatMap.rows.reduce((acc, r) => acc + r.seats.length, 0)}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Áreas</Text>
            <Badge variant="light" color="violet">{seatMap.areas.length}</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Mesas</Text>
            <Badge variant="light" color="green">{seatMap.tables.length}</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Asientos en mesas</Text>
            <Badge variant="light" color="green">
              {seatMap.tables.reduce((acc, t) => acc + t.seats.length, 0)}
            </Badge>
          </Group>
        </Stack>

        <Divider />
        <Text size="xs" c="dimmed" ta="center">
          Hacé clic en un elemento del mapa para ver sus propiedades.
        </Text>
      </Stack>
    );
  }

  const handleDelete = () => {
    const rowIds = selectedItems.filter((s) => s.type === 'row').map((s) => s.id);
    const areaIds = selectedItems.filter((s) => s.type === 'area').map((s) => s.id);
    const tableIds = selectedItems.filter((s) => s.type === 'table').map((s) => s.id);
    const seatIds = selectedItems.filter((s) => s.type === 'seat').map((s) => s.id);
    if (rowIds.length) dispatch({ type: 'DELETE_ROWS', payload: { ids: rowIds } });
    if (areaIds.length) dispatch({ type: 'DELETE_AREAS', payload: { ids: areaIds } });
    if (tableIds.length) dispatch({ type: 'DELETE_TABLES', payload: { ids: tableIds } });
    if (seatIds.length) dispatch({ type: 'DELETE_SEATS', payload: { ids: seatIds } });
    dispatch({ type: 'CLEAR_SELECTION' });
    notifications.show({ title: 'Elementos eliminados', message: `${selectedItems.length} elemento(s) borrado(s)`, color: 'red' });
  };

  const handleUpdateLabel = (info: SelectionInfo) => (newLabel: string) => {
    if (info.type === 'row') dispatch({ type: 'UPDATE_ROW', payload: { id: info.id, label: newLabel } });
    else if (info.type === 'area') dispatch({ type: 'UPDATE_AREA', payload: { id: info.id, label: newLabel } });
    else if (info.type === 'table') dispatch({ type: 'UPDATE_TABLE', payload: { id: info.id, label: newLabel } });
    else if (info.type === 'seat') {
      const row = seatMap.rows.find((r) => r.seats.some((s) => s.id === info.id));
      if (row) dispatch({ type: 'UPDATE_SEAT_LABEL', payload: { rowId: row.id, seatId: info.id, label: newLabel } });
      else {
        const table = seatMap.tables.find((t) => t.seats.some((s) => s.id === info.id));
        if (table) dispatch({ type: 'UPDATE_SEAT_LABEL', payload: { tableId: table.id, seatId: info.id, label: newLabel } });
      }
    }
  };

  return (
    <>
      <Stack
        p="md"
        gap="md"
        style={{
          width: 260,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          background: 'white',
          height: '100%',
          flexShrink: 0,
        }}
      >
        <Group justify="space-between">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            Propiedades
          </Text>
          <Badge variant="light" color="gray">{selectedItems.length}</Badge>
        </Group>

        <ScrollArea flex={1} type="auto">
          <Stack gap="xs">
            {selectedItems.map((info) => (
              <Paper key={info.id} p="sm" radius="md" withBorder>
                <Stack gap={6}>
                  <Group gap={6} justify="space-between">
                    <Group gap={4}>
                      <ThemeIcon size="xs" color={typeColor(info.type)} variant="light">
                        {typeIcon(info.type)}
                      </ThemeIcon>
                      <Badge size="xs" color={typeColor(info.type)} variant="light">
                        {info.type}
                      </Badge>
                    </Group>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => dispatch({ type: 'TOGGLE_SELECT_ITEM', payload: info })}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  </Group>
                  {info.type === 'seat' && (
                    <Text size="xs" c="dimmed">{getLabel(state, info)}</Text>
                  )}
                  <InlineEdit
                    value={getEditLabel(state, info)}
                    onSave={handleUpdateLabel(info)}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>

        <Divider />

        <Stack gap="xs">
          {selectedItems.length === 1 && selectedItems[0].type === 'row' && (
            <Button
              variant="light"
              color="blue"
              size="xs"
              leftSection={<IconSettings size={14} />}
              onClick={() => setEditRowId(selectedItems[0].id)}
              fullWidth
            >
              Editar fila
            </Button>
          )}
          {selectedItems.length === 1 && selectedItems[0].type === 'seat' && (
            <Button
              variant="light"
              color="orange"
              size="xs"
              leftSection={<IconSettings size={14} />}
              onClick={() => setEditSeatId(selectedItems[0].id)}
              fullWidth
            >
              Editar asiento
            </Button>
          )}
          {selectedItems.some((s) => s.type !== 'seat') && (
            <Button
              variant="light"
              color="blue"
              size="xs"
              leftSection={<IconTag size={14} />}
              onClick={() => setLabelModalOpen(true)}
              fullWidth
            >
              Etiquetar selección
            </Button>
          )}
          <Button
            variant="light"
            color="red"
            size="xs"
            leftSection={<IconTrash size={14} />}
            onClick={() => setDeleteModalOpen(true)}
            fullWidth
          >
            Eliminar selección
          </Button>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
            fullWidth
          >
            Deseleccionar
          </Button>
        </Stack>
      </Stack>

      <LabelModal
        opened={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        targets={selectedItems}
      />
      <DeleteConfirmModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        count={selectedItems.length}
      />
      {editRowId && (
        <EditRowModal
          opened={!!editRowId}
          onClose={() => setEditRowId(null)}
          rowId={editRowId}
        />
      )}
      {editSeatId && (
        <EditSeatModal
          opened={!!editSeatId}
          onClose={() => setEditSeatId(null)}
          seatId={editSeatId}
        />
      )}
    </>
  );
}
