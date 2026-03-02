'use client';

import { Modal, Stack, Text, Group, Button, ThemeIcon } from '@mantine/core';
import { IconTrash, IconAlertTriangle } from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  elementLabel?: string;
}

export default function DeleteConfirmModal({ opened, onClose, onConfirm, count, elementLabel }: Props) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconTrash size={20} color="#ef4444" />
          <Text fw={700} size="lg">Confirmar eliminación</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md" align="center" py="sm">
        <ThemeIcon size={56} radius="xl" color="red" variant="light">
          <IconAlertTriangle size={28} />
        </ThemeIcon>

        <Stack gap={4} align="center">
          <Text fw={600} ta="center">
            {elementLabel
              ? `¿Eliminar "${elementLabel}"?`
              : `¿Eliminar ${count} elemento(s) seleccionados?`}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Esta acción no se puede deshacer.
          </Text>
        </Stack>

        <Group justify="center" mt="xs">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button color="red" onClick={handleConfirm} leftSection={<IconTrash size={16} />}>
            Eliminar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
