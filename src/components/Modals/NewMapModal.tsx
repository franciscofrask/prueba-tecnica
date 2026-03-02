'use client';

import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import { IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function NewMapModal({ opened, onClose }: Props) {
  const { dispatch } = useSeatMap();

  const handleConfirm = () => {
    dispatch({ type: 'RESET_MAP' });
    notifications.show({
      title: 'Mapa reiniciado',
      message: 'Sesión vacía. Podés importar un mapa o comenzar uno nuevo.',
      color: 'blue',
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconRefresh size={20} color="#f59e0b" />
          <Text fw={700} size="lg">Nuevo mapa</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md" align="center" py="sm">
        <ThemeIcon size={56} radius="xl" color="yellow" variant="light">
          <IconAlertTriangle size={28} />
        </ThemeIcon>

        <Stack gap={4} align="center">
          <Text fw={600} ta="center">¿Crear un mapa nuevo?</Text>
          <Text size="sm" c="dimmed" ta="center">
            Se perderán todos los elementos del mapa actual que no hayas exportado.
          </Text>
        </Stack>

        <Group justify="center" mt="xs">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button
            color="yellow"
            onClick={handleConfirm}
            leftSection={<IconRefresh size={16} />}
          >
            Nuevo mapa
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
