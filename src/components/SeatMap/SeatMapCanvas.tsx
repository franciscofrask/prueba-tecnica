'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useSeatMap } from '@/context/SeatMapContext';
import { SelectionInfo } from '@/types/seatMap';
import RowComponent from './RowComponent';
import AreaComponent from './AreaComponent';
import TableComponent from './TableComponent';
import { ActionIcon, Group, Text, Tooltip, Paper } from '@mantine/core';
import {
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
} from '@tabler/icons-react';

export default function SeatMapCanvas() {
  const { state, dispatch } = useSeatMap();
  const { seatMap, selectedItems } = state;

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const didPan = useRef(false);
  // Touch: distancia entre dos dedos para pinch-zoom
  const lastDist = useRef<number | null>(null);

  // Marquee selection
  const [selBox, setSelBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const isSelectingRef = useRef(false);
  const selStartRef = useRef({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);

  // Rotation handle
  const isRotating = useRef(false);
  const rotatingRef = useRef<{ id: string; type: string; cx: number; cy: number } | null>(null);

  // Ángulo de rotación en vivo
  const [rotAngle, setRotAngle] = useState<number | null>(null);

  // Posición en vivo del elemento que se está arrastrando (para mover el handle de rotación)
  const [dragPos, setDragPos] = useState<{ id: string; cx: number; cy: number } | null>(null);

  // Medir el contenedor
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Convierte posición de pantalla (relativa al canvas) a coordenadas mundo
  const toWorld = (sx: number, sy: number) => ({
    x: (sx - stagePos.x) / scale,
    y: (sy - stagePos.y) / scale,
  });

  // Verifica si dos rectángulos se solapan
  const rectsOverlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  // Calcula el centro y rotación actual de un elemento seleccionado
  const getElementCenter = (info: SelectionInfo) => {
    const S = 28, GAP = 6, LH = 20, PAD = 8;
    if (info.type === 'row') {
      const row = seatMap.rows.find((r) => r.id === info.id);
      if (!row) return null;
      const rw = row.seats.length * (S + GAP) - GAP + PAD * 2;
      const rh = S + LH + PAD * 2;
      return { cx: row.position.x + rw / 2, cy: row.position.y + rh / 2, rotation: row.rotation ?? 0 };
    }
    if (info.type === 'area') {
      const area = seatMap.areas.find((a) => a.id === info.id);
      if (!area) return null;
      return { cx: area.position.x + area.width / 2, cy: area.position.y + area.height / 2, rotation: area.rotation ?? 0 };
    }
    if (info.type === 'table') {
      const table = seatMap.tables.find((t) => t.id === info.id);
      if (!table) return null;
      return { cx: table.position.x, cy: table.position.y, rotation: table.rotation ?? 0 };
    }
    return null;
  };

  // Actualizar posición en vivo del elemento arrastrado (para el handle de rotación)
  const handleDragMove = useCallback((dragId: string, cx: number, cy: number, _w: number, _h: number) => {
    setDragPos({ id: dragId, cx, cy });
  }, []);

  // Click en fondo
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
    if (didPan.current) { didPan.current = false; return; }
    if (state.toolMode === 'select' && e.target === e.target.getStage()) {
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();

    if (state.toolMode === 'pan') {
      isPanning.current = true;
      didPan.current = false;
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    // Iniciar marquee solo si el clic fue sobre el fondo vacío
    if (state.toolMode === 'select' && e.target === stage) {
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      const w = toWorld(pos.x, pos.y);
      isSelectingRef.current = true;
      suppressClickRef.current = false;
      selStartRef.current = w;
      setSelBox({ x: w.x, y: w.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    // Rotación
    if (isRotating.current && rotatingRef.current) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      const w = toWorld(pos.x, pos.y);
      const { id, type, cx, cy } = rotatingRef.current;
      let angle = Math.atan2(w.x - cx, -(w.y - cy)) * (180 / Math.PI);
      if (e.evt.shiftKey) angle = Math.round(angle / 15) * 15;
      setRotAngle(angle);
      if (type === 'row') dispatch({ type: 'UPDATE_ROW_ROTATION', payload: { id, rotation: angle } });
      else if (type === 'area') dispatch({ type: 'UPDATE_AREA_ROTATION', payload: { id, rotation: angle } });
      else if (type === 'table') dispatch({ type: 'UPDATE_TABLE_ROTATION', payload: { id, rotation: angle } });
      return;
    }

    if (isPanning.current) {
      const dx = e.evt.clientX - lastPos.current.x;
      const dy = e.evt.clientY - lastPos.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didPan.current = true;
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (isSelectingRef.current) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      const w = toWorld(pos.x, pos.y);
      const x = Math.min(w.x, selStartRef.current.x);
      const y = Math.min(w.y, selStartRef.current.y);
      const width = Math.abs(w.x - selStartRef.current.x);
      const height = Math.abs(w.y - selStartRef.current.y);
      setSelBox({ x, y, width, height });
      if (width > 5 || height > 5) suppressClickRef.current = true;
    }
  };

  const handleMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    // Fin de rotación
    if (isRotating.current) {
      isRotating.current = false;
      rotatingRef.current = null;
      setRotAngle(null);
      return;
    }

    isPanning.current = false;

    if (isSelectingRef.current) {
      isSelectingRef.current = false;

      if (selBox && (selBox.width > 5 || selBox.height > 5)) {
        const { x: bx, y: by, width: bw, height: bh } = selBox;
        const SEAT_SIZE = 28, SEAT_GAP = 6, LABEL_HEIGHT = 20, PADDING = 8;
        const selected: SelectionInfo[] = [];

        for (const row of seatMap.rows) {
          const rw = row.seats.length * (SEAT_SIZE + SEAT_GAP) - SEAT_GAP + PADDING * 2;
          const rh = SEAT_SIZE + LABEL_HEIGHT + PADDING * 2;
          if (rectsOverlap(bx, by, bw, bh, row.position.x, row.position.y, rw, rh))
            selected.push({ id: row.id, type: 'row' });
        }

        for (const area of seatMap.areas) {
          if (rectsOverlap(bx, by, bw, bh, area.position.x, area.position.y, area.width, area.height))
            selected.push({ id: area.id, type: 'area' });
        }

        for (const table of seatMap.tables) {
          const tSize = 130;
          if (rectsOverlap(bx, by, bw, bh, table.position.x - tSize / 2, table.position.y - tSize / 2, tSize, tSize))
            selected.push({ id: table.id, type: 'table' });
        }

        if (e.evt.shiftKey && selectedItems.length > 0) {
          const existingIds = new Set(selectedItems.map((s) => s.id));
          dispatch({ type: 'SELECT_ITEMS', payload: [...selectedItems, ...selected.filter((s) => !existingIds.has(s.id))] });
        } else {
          dispatch({ type: 'SELECT_ITEMS', payload: selected });
        }
      }

      setSelBox(null);
    }
  };

  const handleElementClick = useCallback(
    (e: KonvaEventObject<MouseEvent>, info: SelectionInfo) => {
      e.cancelBubble = true;
      if (e.evt.shiftKey) {
        dispatch({ type: 'TOGGLE_SELECT_ITEM', payload: info });
      } else {
        dispatch({ type: 'SELECT_ITEMS', payload: [info] });
      }
    },
    [dispatch]
  );

  const handleSeatClick = useCallback(
    (e: KonvaEventObject<MouseEvent>, info: SelectionInfo) => {
      e.cancelBubble = true;
      if (e.evt.shiftKey) {
        dispatch({ type: 'TOGGLE_SELECT_ITEM', payload: info });
      } else {
        dispatch({ type: 'SELECT_ITEMS', payload: [info] });
      }
    },
    [dispatch]
  );

  const handleRowDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setDragPos(null);
      dispatch({ type: 'UPDATE_ROW_POSITION', payload: { id, position: { x, y } } });
    },
    [dispatch]
  );

  const handleAreaDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setDragPos(null);
      dispatch({ type: 'UPDATE_AREA_POSITION', payload: { id, position: { x, y } } });
    },
    [dispatch]
  );

  const handleTableDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setDragPos(null);
      dispatch({ type: 'UPDATE_TABLE_POSITION', payload: { id, position: { x, y } } });
    },
    [dispatch]
  );

  // Zoom con rueda
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.07;
    const stage = e.target.getStage();
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.2, Math.min(5, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));
    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const zoomIn = () => setScale((s) => Math.min(5, +(s * 1.2).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.2, +(s / 1.2).toFixed(2)));
  const resetView = () => { setScale(1); setStagePos({ x: 0, y: 0 }); };

  // ── Touch handlers (móvil) ──────────────────────────────────────────────
  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 1) {
      // Un dedo: pan
      isPanning.current = true;
      didPan.current = false;
      lastPos.current = { x: touches[0].clientX, y: touches[0].clientY };
      lastDist.current = null;
    } else if (touches.length === 2) {
      // Dos dedos: inicio de pinch
      isPanning.current = false;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      lastDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touches = e.evt.touches;

    if (touches.length === 1 && isPanning.current) {
      const dx = touches[0].clientX - lastPos.current.x;
      const dy = touches[0].clientY - lastPos.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) didPan.current = true;
      lastPos.current = { x: touches[0].clientX, y: touches[0].clientY };
      setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (touches.length === 2 && lastDist.current !== null) {
      // Pinch zoom
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = newDist / lastDist.current;
      lastDist.current = newDist;
      // Centro del pinch en el canvas
      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;
      const stage = e.target.getStage();
      if (!stage) return;
      const rect = stage.container().getBoundingClientRect();
      const px = midX - rect.left;
      const py = midY - rect.top;
      setScale((prev) => {
        const newScale = Math.max(0.2, Math.min(5, prev * ratio));
        setStagePos((sp) => ({
          x: px - (px - sp.x) * (newScale / prev),
          y: py - (py - sp.y) * (newScale / prev),
        }));
        return newScale;
      });
    }
  };

  const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length === 0) {
      isPanning.current = false;
      lastDist.current = null;
      // Si no hubo movimiento significativo, tratar como tap (deseleccionar)
      if (!didPan.current && e.target === e.target.getStage()) {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
      didPan.current = false;
    } else if (e.evt.touches.length === 1) {
      // Pasamos de 2 dedos a 1: reiniciar pan
      lastDist.current = null;
      isPanning.current = true;
      lastPos.current = { x: e.evt.touches[0].clientX, y: e.evt.touches[0].clientY };
    }
  };

  const selectedIds = new Set(selectedItems.map((s) => s.id));
  const selectedSeatIds = new Set(
    selectedItems.filter((s) => s.type === 'seat').map((s) => s.id)
  );
  // Handle de rotación: solo aparece cuando hay 1 elemento no-asiento seleccionado
  const singleInfo = selectedItems.length === 1 && selectedItems[0].type !== 'seat' ? selectedItems[0] : null;
  const singleCenterBase = singleInfo ? getElementCenter(singleInfo) : null;
  // Si el elemento está siendo arrastrado, usar la posición en vivo
  const liveDragPos = dragPos && singleInfo && dragPos.id === singleInfo.id ? dragPos : null;
  const singleCenter = singleCenterBase
    ? liveDragPos
      ? { ...singleCenterBase, cx: liveDragPos.cx, cy: liveDragPos.cy }
      : singleCenterBase
    : null;

  const isEmpty = seatMap.rows.length === 0 && seatMap.areas.length === 0 && seatMap.tables.length === 0;

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8fafc', touchAction: 'none' }}
      className="canvas-dotted-bg"
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: state.toolMode === 'pan' ? (isPanning.current ? 'grabbing' : 'grab') : state.toolMode === 'select' ? 'default' : 'crosshair' }}
      >
        {/* Áreas (fondo) */}
        <Layer>
          {seatMap.areas.map((area) => (
            <AreaComponent
              key={area.id}
              area={area}
              isSelected={selectedIds.has(area.id)}
              onClick={handleElementClick}
              onDragEnd={handleAreaDragEnd}
              onDragMove={handleDragMove}
            />
          ))}
        </Layer>

        {/* Filas */}
        <Layer>
          {seatMap.rows.map((row) => (
            <RowComponent
              key={row.id}
              row={row}
              isSelected={selectedIds.has(row.id)}
              selectedSeatIds={selectedSeatIds}
              onClick={handleElementClick}
              onSeatClick={handleSeatClick}
              onDragEnd={handleRowDragEnd}
              onDragMove={handleDragMove}
            />
          ))}
        </Layer>

        {/* Mesas */}
        <Layer>
          {seatMap.tables.map((table) => (
            <TableComponent
              key={table.id}
              table={table}
              isSelected={selectedIds.has(table.id)}
              onClick={handleElementClick}
              onDragEnd={handleTableDragEnd}
              onDragMove={handleDragMove}
            />
          ))}
        </Layer>

        {/* Handle de rotación */}
        {singleCenter && singleInfo && (() => {
          const { cx, cy, rotation: rot } = singleCenter;
          const rotRad = (rot * Math.PI) / 180;
          const DIST = 70;
          const hx = cx + DIST * Math.sin(rotRad);
          const hy = cy - DIST * Math.cos(rotRad);
          return (
            <Layer key="rot-handle">
              <Line
                points={[cx, cy, hx, hy]}
                stroke="#3b82f6"
                strokeWidth={1.5 / scale}
                dash={[5 / scale, 3 / scale]}
                listening={false}
              />
              <Circle
                x={hx}
                y={hy}
                radius={8 / scale}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={2 / scale}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  isRotating.current = true;
                  rotatingRef.current = { id: singleInfo.id, type: singleInfo.type, cx, cy };
                }}
              />
            </Layer>
          );
        })()}

        {/* Marquee de selección */}
        <Layer listening={false}>
          {selBox && selBox.width > 2 && selBox.height > 2 && (
            <Rect
              x={selBox.x}
              y={selBox.y}
              width={selBox.width}
              height={selBox.height}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#3b82f6"
              strokeWidth={1 / scale}
              dash={[6 / scale, 3 / scale]}
            />
          )}
        </Layer>

      </Stage>

      {/* Badge de ángulo de rotación */}
      {rotAngle !== null && singleCenter && (
        <div
          style={{
            position: 'absolute',
            left: singleCenter.cx * scale + stagePos.x + 14,
            top: singleCenter.cy * scale + stagePos.y - 14,
            background: '#1e293b',
            color: 'white',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 20,
            whiteSpace: 'nowrap',
          }}
        >
          {Math.round(rotAngle)}°
        </div>
      )}

      {/* Canvas vacío */}
      {isEmpty && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Paper p="xl" radius="xl" withBorder style={{ textAlign: 'center', maxWidth: 320, opacity: 0.85 }}>
            <Text fw={700} size="lg" mb={4}>Mapa vacío</Text>
            <Text size="sm" c="dimmed">
              Usá la barra de herramientas para agregar filas, áreas o mesas. También podés importar un JSON.
            </Text>
          </Paper>
        </div>
      )}

      {/* Controles de zoom */}
      <Paper
        style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10 }}
        p={4}
        radius="md"
        withBorder
        shadow="sm"
      >
        <Group gap={2}>
          <Tooltip label="Acercar" withArrow>
            <ActionIcon variant="subtle" color="gray" size="md" onClick={zoomIn}>
              <IconZoomIn size={18} />
            </ActionIcon>
          </Tooltip>
          <Text size="xs" w={40} ta="center" fw={600} style={{ lineHeight: '32px' }}>
            {Math.round(scale * 100)}%
          </Text>
          <Tooltip label="Alejar" withArrow>
            <ActionIcon variant="subtle" color="gray" size="md" onClick={zoomOut}>
              <IconZoomOut size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Restablecer vista" withArrow>
            <ActionIcon variant="subtle" color="gray" size="md" onClick={resetView}>
              <IconFocusCentered size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>

      {/* Hint de selección */}
      {selectedItems.length > 0 && (
        <Paper
          style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10 }}
          px="sm"
          py={6}
          radius="md"
          withBorder
          shadow="sm"
        >
          <Text size="xs" c="dimmed">
            {selectedItems.length} elemento(s) seleccionado(s) · Shift+Click para multi-selección
          </Text>
        </Paper>
      )}
    </div>
  );
}
