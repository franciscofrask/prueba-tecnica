'use client';

import { useRef, useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Paper,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import { IconUpload, IconFiles, IconAlertCircle } from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { importFromJSON, readFileAsText } from '@/utils/import';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function ImportModal({ opened, onClose }: Props) {
  const { dispatch } = useSeatMap();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setError('');
    setLoading(false);
    onClose();
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('El archivo debe ser un JSON (.json).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const text = await readFileAsText(file);
      const result = importFromJSON(text);
      if (!result.success || !result.data) {
        setError(result.error ?? 'Error al importar.');
        return;
      }
      dispatch({ type: 'IMPORT_MAP', payload: result.data });
      notifications.show({
        title: 'Mapa importado',
        message: `"${result.data.name}" cargado correctamente.`,
        color: 'green',
      });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) handleFile(file);
    e.currentTarget.value = '';
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconUpload size={20} color="#3b82f6" />
          <Text fw={700} size="lg">Importar mapa</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Seleccioná o arrastrá un archivo JSON previamente exportado desde SeatMapBuilder.
        </Text>

        <Paper
          p="xl"
          radius="md"
          withBorder
          style={{ borderStyle: 'dashed', cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Stack align="center" gap="sm">
            <ThemeIcon size={48} radius="xl" color="blue" variant="light">
              <IconFiles size={24} />
            </ThemeIcon>
            <Stack gap={2} align="center">
              <Text fw={600} size="sm">Clic para seleccionar archivo</Text>
              <Text size="xs" c="dimmed">o arrastrá el JSON aquí</Text>
            </Stack>
          </Stack>
        </Paper>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>Cancelar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
