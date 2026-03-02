'use client';

import { useEffect, useState } from 'react';
import { Stack, Group, Drawer, ActionIcon, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconLayoutSidebarRightExpand } from '@tabler/icons-react';
import { SeatMapProvider, useSeatMap } from '@/context/SeatMapContext';
import Topbar from '@/components/Topbar/Topbar';
import Toolbar from '@/components/Toolbar/Toolbar';
import SeatMapCanvas from '@/components/SeatMap/SeatMapCanvas';
import PropertiesPanel from '@/components/Panel/PropertiesPanel';
import { notifications } from '@mantine/notifications';

function KeyboardShortcuts() {
  const { state, dispatch, canUndo, canRedo } = useSeatMap();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (isInput) return;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) dispatch({ type: 'UNDO' });
        return;
      }
      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo) dispatch({ type: 'REDO' });
        return;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' });
        dispatch({ type: 'SET_TOOL_MODE', payload: 'select' });
        return;
      }
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        const all = [
          ...state.seatMap.rows.map((r) => ({ id: r.id, type: 'row' as const })),
          ...state.seatMap.areas.map((a) => ({ id: a.id, type: 'area' as const })),
          ...state.seatMap.tables.map((t) => ({ id: t.id, type: 'table' as const })),
        ];
        dispatch({ type: 'SELECT_ITEMS', payload: all });
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedItems.length > 0) {
        const rowIds = state.selectedItems.filter((s) => s.type === 'row').map((s) => s.id);
        const areaIds = state.selectedItems.filter((s) => s.type === 'area').map((s) => s.id);
        const tableIds = state.selectedItems.filter((s) => s.type === 'table').map((s) => s.id);
        const seatIds = state.selectedItems.filter((s) => s.type === 'seat').map((s) => s.id);
        if (rowIds.length) dispatch({ type: 'DELETE_ROWS', payload: { ids: rowIds } });
        if (areaIds.length) dispatch({ type: 'DELETE_AREAS', payload: { ids: areaIds } });
        if (tableIds.length) dispatch({ type: 'DELETE_TABLES', payload: { ids: tableIds } });
        if (seatIds.length) dispatch({ type: 'DELETE_SEATS', payload: { ids: seatIds } });
        dispatch({ type: 'CLEAR_SELECTION' });
        notifications.show({ title: 'Eliminado', message: 'Elementos eliminados', color: 'red' });
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        dispatch({ type: 'SET_TOOL_MODE', payload: 'select' });
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        dispatch({ type: 'SET_TOOL_MODE', payload: 'pan' });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, dispatch, canUndo, canRedo]);

  return null;
}

function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [panelOpen, setPanelOpen] = useState(false);
  const { state } = useSeatMap();

  // Abrir panel automáticamente cuando se selecciona algo en móvil
  useEffect(() => {
    if (isMobile && state.selectedItems.length > 0) {
      setPanelOpen(true);
    }
  }, [state.selectedItems, isMobile]);

  return (
    <Stack gap={0} style={{ height: '100dvh', overflow: 'hidden' }}>
      <Topbar />
      <Group gap={0} style={{ flex: 1, overflow: 'hidden', alignItems: 'stretch' }}>
        {!isMobile && <Toolbar />}
        <SeatMapCanvas />
        {!isMobile && <PropertiesPanel />}
      </Group>

      {/* Toolbar horizontal fija en la parte inferior en móvil */}
      {isMobile && <Toolbar horizontal />}

      {/* Panel de propiedades como Drawer en móvil */}
      {isMobile && (
        <Drawer
          opened={panelOpen}
          onClose={() => setPanelOpen(false)}
          position="right"
          size="88%"
          title="Propiedades"
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)', overflow: 'auto' } }}
        >
          <PropertiesPanel inDrawer />
        </Drawer>
      )}

      {/* Botón flotante para abrir el panel en móvil */}
      {isMobile && !panelOpen && (
        <Tooltip label="Ver propiedades" withArrow position="left">
          <ActionIcon
            style={{ position: 'fixed', bottom: 68, right: 12, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            size="lg"
            radius="xl"
            color="blue"
            variant="filled"
            onClick={() => setPanelOpen(true)}
          >
            <IconLayoutSidebarRightExpand size={18} />
          </ActionIcon>
        </Tooltip>
      )}

      <KeyboardShortcuts />
    </Stack>
  );
}

export default function HomePage() {
  return (
    <SeatMapProvider>
      <AppLayout />
    </SeatMapProvider>
  );
}
