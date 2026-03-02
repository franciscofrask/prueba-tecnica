'use client';

import { useState } from 'react';
import {
  Stack,
  Tooltip,
  ActionIcon,
  Divider,
  Text,
  Group,
} from '@mantine/core';
import {
  IconPointer,
  IconHandGrab,
  IconRowInsertTop,
  IconBorderCorners,
  IconArmchair,
  IconArrowBackUp,
  IconArrowForwardUp,
} from '@tabler/icons-react';
import { useSeatMap } from '@/context/SeatMapContext';
import { ToolMode } from '@/types/seatMap';
import CreateRowModal from '@/components/Modals/CreateRowModal';
import CreateAreaModal from '@/components/Modals/CreateAreaModal';
import CreateTableModal from '@/components/Modals/CreateTableModal';

const TOOLS: { mode: ToolMode; label: string; icon: React.ReactNode; color: string }[] = [
  { mode: 'select', label: 'Seleccionar (V)', icon: <IconPointer size={20} />, color: 'blue' },
  { mode: 'pan', label: 'Mover canvas (H)', icon: <IconHandGrab size={20} />, color: 'gray' },
  { mode: 'row', label: 'Agregar Fila (R)', icon: <IconRowInsertTop size={20} />, color: 'blue' },
  { mode: 'area', label: 'Agregar Área (A)', icon: <IconBorderCorners size={20} />, color: 'violet' },
  { mode: 'table', label: 'Agregar Mesa (T)', icon: <IconArmchair size={20} />, color: 'green' },
];

export default function Toolbar({ horizontal = false }: { horizontal?: boolean }) {
  const { state, dispatch, canUndo, canRedo } = useSeatMap();
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);

  const handleToolClick = (mode: ToolMode) => {
    dispatch({ type: 'SET_TOOL_MODE', payload: mode });
    if (mode === 'row') setRowModalOpen(true);
    else if (mode === 'area') setAreaModalOpen(true);
    else if (mode === 'table') setTableModalOpen(true);
  };


  const handleModalClose = () => {
    setRowModalOpen(false);
    setAreaModalOpen(false);
    setTableModalOpen(false);
    dispatch({ type: 'SET_TOOL_MODE', payload: 'select' });
  };

  return (
    <>
      {horizontal ? (
        /* ── Barra inferior horizontal (móvil) ── */
        <Group
          justify="space-between"
          align="center"
          px="sm"
          gap={4}
          style={{
            width: '100%',
            height: 56,
            borderTop: '1px solid var(--mantine-color-gray-3)',
            background: 'white',
            flexShrink: 0,
          }}
        >
          <Group gap={4}>
            {TOOLS.map((tool) => {
              const isActive = state.toolMode === tool.mode;
              return (
                <Tooltip key={tool.mode} label={tool.label} position="top" withArrow>
                  <ActionIcon
                    variant={isActive ? 'filled' : 'subtle'}
                    color={isActive ? tool.color : 'gray'}
                    size="lg"
                    radius="md"
                    onClick={() => handleToolClick(tool.mode)}
                  >
                    {tool.icon}
                  </ActionIcon>
                </Tooltip>
              );
            })}
          </Group>

          <Group gap={4}>
            <Tooltip label="Deshacer (Ctrl+Z)" position="top" withArrow>
              <ActionIcon variant="subtle" color="gray" size="lg" radius="md"
                disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })}>
                <IconArrowBackUp size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Rehacer (Ctrl+Y)" position="top" withArrow>
              <ActionIcon variant="subtle" color="gray" size="lg" radius="md"
                disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })}>
                <IconArrowForwardUp size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      ) : (
        /* ── Barra lateral vertical (desktop) ── */
        <Stack
          align="center"
          gap={4}
          py="sm"
          px={4}
          style={{
            width: 56,
            height: '100%',
            borderRight: '1px solid var(--mantine-color-gray-3)',
            background: 'white',
            flexShrink: 0,
          }}
        >
          <Stack align="center" gap={4} style={{ width: '100%' }}>
            {TOOLS.map((tool) => {
              const isActive = state.toolMode === tool.mode;
              return (
                <Tooltip key={tool.mode} label={tool.label} position="right" withArrow>
                  <ActionIcon
                    variant={isActive ? 'filled' : 'subtle'}
                    color={isActive ? tool.color : 'gray'}
                    size="lg"
                    radius="md"
                    onClick={() => handleToolClick(tool.mode)}
                  >
                    {tool.icon}
                  </ActionIcon>
                </Tooltip>
              );
            })}
          </Stack>

          <Divider style={{ width: '75%' }} />

          <Tooltip label="Deshacer (Ctrl+Z)" position="right" withArrow>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="md"
              disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })}>
              <IconArrowBackUp size={20} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Rehacer (Ctrl+Y)" position="right" withArrow>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="md"
              disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })}>
              <IconArrowForwardUp size={20} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      )}

      <CreateRowModal opened={rowModalOpen} onClose={handleModalClose} />
      <CreateAreaModal opened={areaModalOpen} onClose={handleModalClose} />
      <CreateTableModal opened={tableModalOpen} onClose={handleModalClose} />
    </>
  );
}
