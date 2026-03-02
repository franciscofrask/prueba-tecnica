'use client';

import { useEffect } from 'react';
import { Stack, Group } from '@mantine/core';
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
  return (
    <Stack gap={0} style={{ height: '100vh', overflow: 'hidden' }}>
      <Topbar />
      <Group gap={0} style={{ flex: 1, overflow: 'hidden', alignItems: 'stretch' }}>
        <Toolbar />
        <SeatMapCanvas />
        <PropertiesPanel />
      </Group>
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
