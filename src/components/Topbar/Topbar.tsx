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
        py={8}
      >
        {/* Grid de 3 columnas: izquierda | centro | derecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>

          {/* ── IZQUIERDA: Logo + nombre del mapa ── */}
          <Group gap="sm" style={{ minWidth: 0 }}>
            <Group gap={4} style={{ flexShrink: 0 }}>
              <Text fw={800} size="sm" c="blue" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
                Mapa de
              </Text>
              <Text fw={800} size="sm" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
                Asientos
              </Text>
            </Group>
            <Box visibleFrom="sm" style={{ minWidth: 0, overflow: 'hidden' }}>
              <Group gap="xs" style={{ flexWrap: 'nowrap' }}>
                <Divider orientation="vertical" style={{ height: 16 }} />
                {editingName ? (
                  <Group gap={4} style={{ flexWrap: 'nowrap' }}>
                    <TextInput
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.currentTarget.value)}
                      size="xs"
                      w={140}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    />
                    <ActionIcon size="sm" color="green" variant="light" onClick={saveName}><IconCheck size={12} /></ActionIcon>
                    <ActionIcon size="sm" color="gray" variant="light" onClick={() => setEditingName(false)}><IconX size={12} /></ActionIcon>
                  </Group>
                ) : (
                  <Group gap={4} style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                    <Text fw={600} size="xs" truncate style={{ maxWidth: 160 }}>{state.seatMap.name}</Text>
                    <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>v{state.seatMap.version}</Badge>
                    <Tooltip label="Renombrar" withArrow>
                      <ActionIcon size="xs" variant="subtle" color="gray" onClick={startEditName} style={{ flexShrink: 0 }}>
                        <IconPencil size={11} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )}
              </Group>
            </Box>
          </Group>

          {/* ── CENTRO: Stats ── */}
          <Box visibleFrom="md">
            <Group gap={6} style={{ flexWrap: 'nowrap' }}>
              <Badge variant="light" color="blue" size="sm">{state.seatMap.rows.length} filas</Badge>
              <Badge variant="light" color="violet" size="sm">{state.seatMap.areas.length} áreas</Badge>
              <Badge variant="light" color="green" size="sm">{state.seatMap.tables.length} mesas</Badge>
              <Badge variant="light" color="orange" size="sm">{totalSeats} asientos</Badge>
            </Group>
          </Box>

          {/* ── DERECHA: Botones de acción ── */}
          <Group gap={6} justify="flex-end" style={{ flexWrap: 'nowrap' }}>
            {/* Guardar */}
            <Tooltip label={lastSaved ? `Último guardado: ${lastSaved.toLocaleTimeString()}` : 'Guardar'} withArrow>
              {isMobile ? (
                <ActionIcon variant={justSaved ? 'filled' : 'light'} color={justSaved ? 'green' : 'teal'}
                  size="md" radius="md" onClick={handleSave}>
                  {justSaved ? <IconCheck size={14} /> : <IconDeviceFloppy size={14} />}
                </ActionIcon>
              ) : (
                <Button variant={justSaved ? 'filled' : 'light'} color={justSaved ? 'green' : 'teal'}
                  size="xs" leftSection={justSaved ? <IconCheck size={13} /> : <IconDeviceFloppy size={13} />}
                  onClick={handleSave}>
                  <Box visibleFrom="lg">{justSaved ? '¡Guardado!' : 'Guardar'}</Box>
                  <Box hiddenFrom="lg" style={{ width: 0, overflow: 'hidden' }} />
                </Button>
              )}
            </Tooltip>

            {/* Mis mapas */}
            <Tooltip label="Mapas guardados" withArrow>
              {isMobile ? (
                <ActionIcon variant="light" color="blue" size="md" radius="md" onClick={() => setSavedMapsOpen(true)} style={{ position: 'relative' }}>
                  <IconFolderOpen size={14} />
                  {savedCount > 0 && <Badge size="xs" color="blue" circle style={{ position: 'absolute', top: -4, right: -4, minWidth: 16 }}>{savedCount}</Badge>}
                </ActionIcon>
              ) : (
                <Button variant="light" color="blue" size="xs" leftSection={<IconFolderOpen size={13} />}
                  onClick={() => setSavedMapsOpen(true)}
                  rightSection={savedCount > 0 ? <Badge size="xs" color="blue" circle>{savedCount}</Badge> : undefined}>
                  <Box visibleFrom="lg">Mis mapas</Box>
                  <Box hiddenFrom="lg" style={{ width: 0, overflow: 'hidden' }} />
                </Button>
              )}
            </Tooltip>

            {/* Nuevo */}
            <Tooltip label="Nuevo mapa" withArrow>
              {isMobile ? (
                <ActionIcon variant="subtle" color="gray" size="md" radius="md" onClick={() => setNewMapOpen(true)}>
                  <IconRefresh size={14} />
                </ActionIcon>
              ) : (
                <Button variant="subtle" color="gray" size="xs" leftSection={<IconRefresh size={13} />}
                  onClick={() => setNewMapOpen(true)}>
                  <Box visibleFrom="lg">Nuevo</Box>
                  <Box hiddenFrom="lg" style={{ width: 0, overflow: 'hidden' }} />
                </Button>
              )}
            </Tooltip>

            {/* Importar */}
            <Tooltip label="Importar JSON" withArrow>
              {isMobile ? (
                <ActionIcon variant="light" color="blue" size="md" radius="md" onClick={() => setImportOpen(true)}>
                  <IconUpload size={14} />
                </ActionIcon>
              ) : (
                <Button variant="light" color="blue" size="xs" leftSection={<IconUpload size={13} />}
                  onClick={() => setImportOpen(true)}>
                  <Box visibleFrom="lg">Importar</Box>
                  <Box hiddenFrom="lg" style={{ width: 0, overflow: 'hidden' }} />
                </Button>
              )}
            </Tooltip>

            {/* Exportar */}
            <Tooltip label="Exportar JSON" withArrow>
              {isMobile ? (
                <ActionIcon variant="filled" color="blue" size="md" radius="md" onClick={() => setExportOpen(true)}>
                  <IconDownload size={14} />
                </ActionIcon>
              ) : (
                <Button size="xs" leftSection={<IconDownload size={13} />} onClick={() => setExportOpen(true)}>
                  <Box visibleFrom="lg">Exportar</Box>
                  <Box hiddenFrom="lg" style={{ width: 0, overflow: 'hidden' }} />
                </Button>
              )}
            </Tooltip>
          </Group>

        </div>
      </Paper>

      <ImportModal opened={importOpen} onClose={() => setImportOpen(false)} />
      <ExportPreviewModal opened={exportOpen} onClose={() => setExportOpen(false)} />
      <NewMapModal opened={newMapOpen} onClose={() => setNewMapOpen(false)} />
      <SavedMapsModal opened={savedMapsOpen} onClose={() => setSavedMapsOpen(false)} />
    </>
  );
}
