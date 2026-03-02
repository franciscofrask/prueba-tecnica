'use client';

import { useState } from 'react';
import {
  Group,
  Text,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  TextInput,
  Paper,
  Divider,
  Box,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconUpload,
  IconDownload,
  IconRefresh,
  IconPencil,
  IconCheck,
  IconX,
  IconDeviceFloppy,
  IconFolderOpen,
} from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import ImportModal from '@/components/Modals/ImportModal';
import ExportPreviewModal from '@/components/Modals/ExportPreviewModal';
import NewMapModal from '@/components/Modals/NewMapModal';
import SavedMapsModal from '@/components/Modals/SavedMapsModal';

export default function Topbar() {
  const { state, dispatch, savedMaps, saveToLocalStorage, lastSaved } = useSeatMap();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [newMapOpen, setNewMapOpen] = useState(false);
  const [savedMapsOpen, setSavedMapsOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    saveToLocalStorage();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const startEditName = () => {
    setNameDraft(state.seatMap.name);
    setEditingName(true);
  };

  const saveName = () => {
    if (nameDraft.trim()) {
      dispatch({ type: 'RENAME_MAP', payload: { name: nameDraft.trim() } });
    }
    setEditingName(false);
  };

  const totalSeats =
    state.seatMap.rows.reduce((acc, r) => acc + r.seats.length, 0) +
    state.seatMap.tables.reduce((acc, t) => acc + t.seats.length, 0);

  const savedCount = Object.keys(savedMaps).length;

  return (
    <>
      <Paper
        radius={0}
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          background: 'white',
          flexShrink: 0,
          zIndex: 20,
        }}
        px="md"
        py={10}
      >
        <Group justify="space-between" align="center">
          {/* Left: Logo + Project name */}
          <Group gap="sm">
            <Group gap={6}>
              <Text fw={800} size="lg" c="blue" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>
                {isMobile ? 'Mapa' : 'Mapa de'}
              </Text>
              <Text fw={800} size="lg" style={{ letterSpacing: '-0.03em' }}>
                {isMobile ? 'Asientos' : 'Asientos'}
              </Text>
            </Group>

            <Box hiddenFrom="sm">
              {/* espacio vacío en móvil, no se muestra nombre del mapa */}
            </Box>
            <Box visibleFrom="sm">
              <Group gap="sm">
                <Divider orientation="vertical" />
                {editingName ? (
                  <Group gap={4}>
                    <TextInput
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.currentTarget.value)}
                      size="xs"
                      w={180}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    />
                    <ActionIcon size="sm" color="green" variant="light" onClick={saveName}><IconCheck size={12} /></ActionIcon>
                    <ActionIcon size="sm" color="gray" variant="light" onClick={() => setEditingName(false)}><IconX size={12} /></ActionIcon>
                  </Group>
                ) : (
                  <Group gap={4}>
                    <Text fw={600} size="sm">{state.seatMap.name}</Text>
                    <Badge size="xs" variant="light" color="gray">v{state.seatMap.version}</Badge>
                    <Tooltip label="Renombrar" withArrow>
                      <ActionIcon size="xs" variant="subtle" color="gray" onClick={startEditName}>
                        <IconPencil size={12} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )}
              </Group>
            </Box>
          </Group>

          {/* Center: Stats - oculto en móvil */}
          <Group hiddenFrom="sm" gap={0} />
          <Group visibleFrom="sm" gap="sm" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <Badge variant="light" color="blue" size="sm">{state.seatMap.rows.length} filas</Badge>
            <Badge variant="light" color="violet" size="sm">{state.seatMap.areas.length} áreas</Badge>
            <Badge variant="light" color="green" size="sm">{state.seatMap.tables.length} mesas</Badge>
            <Badge variant="light" color="orange" size="sm">{totalSeats} asientos</Badge>
          </Group>

          {/* Right: Actions */}
          <Group gap="xs">
            {isMobile ? (
              /* Botones compactos (solo ícono) en móvil */
              <>
                <Tooltip label={lastSaved ? `Último guardado: ${lastSaved.toLocaleTimeString()}` : 'Guardar'} withArrow>
                  <ActionIcon variant={justSaved ? 'filled' : 'light'} color={justSaved ? 'green' : 'teal'}
                    size="lg" radius="md" onClick={handleSave}>
                    {justSaved ? <IconCheck size={16} /> : <IconDeviceFloppy size={16} />}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Mis mapas guardados" withArrow>
                  <ActionIcon variant="light" color="blue" size="lg" radius="md" onClick={() => setSavedMapsOpen(true)}>
                    <IconFolderOpen size={16} />
                    {savedCount > 0 && <Badge size="xs" color="blue" circle style={{ position: 'absolute', top: -4, right: -4 }}>{savedCount}</Badge>}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Nuevo mapa" withArrow>
                  <ActionIcon variant="subtle" color="gray" size="lg" radius="md" onClick={() => setNewMapOpen(true)}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Importar JSON" withArrow>
                  <ActionIcon variant="light" color="blue" size="lg" radius="md" onClick={() => setImportOpen(true)}>
                    <IconUpload size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Exportar JSON" withArrow>
                  <ActionIcon variant="filled" color="blue" size="lg" radius="md" onClick={() => setExportOpen(true)}>
                    <IconDownload size={16} />
                  </ActionIcon>
                </Tooltip>
              </>
            ) : (
              /* Botones completos en desktop */
              <>
                <Tooltip
                  label={lastSaved ? `Último guardado: ${lastSaved.toLocaleTimeString()}` : 'Guardar mapa en local storage'}
                  withArrow
                >
                  <Button
                    variant={justSaved ? 'filled' : 'light'}
                    color={justSaved ? 'green' : 'teal'}
                    size="xs"
                    leftSection={justSaved ? <IconCheck size={14} /> : <IconDeviceFloppy size={14} />}
                    onClick={handleSave}
                  >
                    {justSaved ? '¡Guardado!' : 'Guardar'}
                  </Button>
                </Tooltip>

                <Tooltip label="Ver mapas guardados" withArrow>
                  <Button
                    variant="light"
                    color="blue"
                    size="xs"
                    leftSection={<IconFolderOpen size={14} />}
                    onClick={() => setSavedMapsOpen(true)}
                    rightSection={
                      savedCount > 0
                        ? <Badge size="xs" color="blue" circle>{savedCount}</Badge>
                        : undefined
                    }
                  >
                    Mis mapas
                  </Button>
                </Tooltip>

                <Tooltip label="Nuevo mapa (Ctrl+N)" withArrow>
                  <Button variant="subtle" color="gray" size="xs" leftSection={<IconRefresh size={14} />}
                    onClick={() => setNewMapOpen(true)}>
                    Nuevo
                  </Button>
                </Tooltip>
                <Tooltip label="Importar JSON" withArrow>
                  <Button variant="light" color="blue" size="xs" leftSection={<IconUpload size={14} />}
                    onClick={() => setImportOpen(true)}>
                    Importar
                  </Button>
                </Tooltip>
                <Button size="xs" leftSection={<IconDownload size={14} />} onClick={() => setExportOpen(true)}>
                  Exportar
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Paper>

      <ImportModal opened={importOpen} onClose={() => setImportOpen(false)} />
      <ExportPreviewModal opened={exportOpen} onClose={() => setExportOpen(false)} />
      <NewMapModal opened={newMapOpen} onClose={() => setNewMapOpen(false)} />
      <SavedMapsModal opened={savedMapsOpen} onClose={() => setSavedMapsOpen(false)} />
    </>
  );
}
