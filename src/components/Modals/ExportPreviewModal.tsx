'use client';

import { Modal, Stack, Text, Group, Button, ScrollArea, Code } from '@mantine/core';
import { IconDownload, IconEye } from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { exportToJSON, downloadJSON } from '@/utils/export';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function ExportPreviewModal({ opened, onClose }: Props) {
  const { state } = useSeatMap();
  const json = exportToJSON(state.seatMap);

  const handleDownload = () => {
    downloadJSON(state.seatMap);
    notifications.show({
      title: 'Mapa exportado',
      message: `${state.seatMap.name}.json descargado.`,
      color: 'green',
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconEye size={20} color="#3b82f6" />
          <Text fw={700} size="lg">Preview de exportación</Text>
        </Group>
      }
      size="xl"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Este es el JSON que se va a descargar. Podés importarlo nuevamente para continuar editando.
        </Text>

        <ScrollArea h={360} type="auto">
          <Code block style={{ fontSize: 12, whiteSpace: 'pre' }}>
            {json}
          </Code>
        </ScrollArea>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cerrar</Button>
          <Button leftSection={<IconDownload size={16} />} onClick={handleDownload}>
            Descargar JSON
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
