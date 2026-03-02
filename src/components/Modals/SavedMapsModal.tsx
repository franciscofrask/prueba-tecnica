'use client';

import { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  ThemeIcon,
  Divider,
  Center,
} from '@mantine/core';
import {
  IconFolderOpen,
  IconTrash,
  IconMapPin,
  IconClock,
  IconChairDirector,
  IconTable,
  IconLayoutRows,
  IconInbox,
} from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function SavedMapsModal({ opened, onClose }: Props) {
  const { savedMaps, loadSavedMap, deleteSavedMap, state } = useSeatMap();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const entries = Object.entries(savedMaps).sort(
    (a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime()
  );

  const handleLoad = (id: string) => {
    loadSavedMap(id);
    notifications.show({
      title: 'Mapa cargado',
      message: `"${savedMaps[id].map.name}" cargado correctamente.`,
      color: 'teal',
    });
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      const name = savedMaps[id]?.map.name ?? '';
      deleteSavedMap(id);
      setConfirmDelete(null);
      notifications.show({
        title: 'Mapa eliminado',
        message: `"${name}" fue eliminado del almacenamiento local.`,
        color: 'red',
      });
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="blue" variant="light" size="sm">
            <IconFolderOpen size={14} />
          </ThemeIcon>
          <Text fw={600} size="sm">Mapas guardados</Text>
          <Badge size="xs" variant="light" color="gray">{entries.length}</Badge>
        </Group>
      }
      size="lg"
    >
      {entries.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <ThemeIcon size="xl" variant="light" color="gray">
              <IconInbox size={24} />
            </ThemeIcon>
            <Text size="sm" c="dimmed" ta="center">
              No hay mapas guardados todavía.<br />
              Usa el botón <strong>Guardar</strong> para guardar el mapa actual.
            </Text>
          </Stack>
        </Center>
      ) : (
        <ScrollArea.Autosize mah={460}>
          <Stack gap="sm">
            {entries.map(([id, entry]) => {
              const { map, savedAt } = entry;
              const totalSeats =
                map.rows.reduce((a, r) => a + r.seats.length, 0) +
                map.tables.reduce((a, t) => a + t.seats.length, 0);
              const isCurrent = map.id === state.seatMap.id;
              const isConfirming = confirmDelete === id;

              return (
                <Paper key={id} withBorder p="sm" radius="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs">
                        <ThemeIcon size="xs" variant="light" color="blue">
                          <IconMapPin size={10} />
                        </ThemeIcon>
                        <Text fw={600} size="sm" style={{ wordBreak: 'break-word' }}>
                          {map.name}
                        </Text>
                        {isCurrent && (
                          <Badge size="xs" color="teal" variant="light">Activo</Badge>
                        )}
                      </Group>

                      <Group gap="xs">
                        <Group gap={4}>
                          <IconLayoutRows size={11} color="var(--mantine-color-blue-5)" />
                          <Text size="xs" c="dimmed">{map.rows.length} filas</Text>
                        </Group>
                        <Divider orientation="vertical" />
                        <Group gap={4}>
                          <IconTable size={11} color="var(--mantine-color-violet-5)" />
                          <Text size="xs" c="dimmed">{map.tables.length} mesas</Text>
                        </Group>
                        <Divider orientation="vertical" />
                        <Group gap={4}>
                          <IconChairDirector size={11} color="var(--mantine-color-orange-5)" />
                          <Text size="xs" c="dimmed">{totalSeats} asientos</Text>
                        </Group>
                      </Group>

                      <Group gap={4}>
                        <IconClock size={11} color="var(--mantine-color-gray-5)" />
                        <Text size="xs" c="dimmed">
                          {new Date(savedAt).toLocaleString('es', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Group>
                    </Stack>

                    <Group gap="xs" style={{ flexShrink: 0 }}>
                      <Button
                        size="xs"
                        variant="light"
                        color="teal"
                        leftSection={<IconFolderOpen size={13} />}
                        onClick={() => handleLoad(id)}
                        disabled={isCurrent}
                      >
                        Cargar
                      </Button>
                      <Tooltip
                        label={isConfirming ? '¿Confirmar eliminación?' : 'Eliminar'}
                        withArrow
                      >
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color={isConfirming ? 'red' : 'gray'}
                          onClick={() => handleDelete(id)}
                        >
                          <IconTrash size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
}
