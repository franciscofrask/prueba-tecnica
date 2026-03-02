'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  SeatMap,
  Row,
  Area,
  Table,
  Seat,
  SeatStatus,
  SelectionInfo,
  ToolMode,
  Position,
} from '@/types/seatMap';

// ─── Estado ──────────────────────────────────────────────────────────────────

const INITIAL_SEAT_MAP: SeatMap = {
  id: uuidv4(),
  name: 'Nuevo Mapa',
  rows: [],
  areas: [],
  tables: [],
  version: '1.0.0',
};

interface HistoryEntry {
  seatMap: SeatMap;
}

interface State {
  seatMap: SeatMap;
  selectedItems: SelectionInfo[];
  toolMode: ToolMode;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

const INITIAL_STATE: State = {
  seatMap: INITIAL_SEAT_MAP,
  selectedItems: [],
  toolMode: 'select',
  past: [],
  future: [],
};

// ─── Acciones ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_ROW'; payload: { label: string; seatCount: number; position: Position; seatLabels?: string[]; color?: string } }
  | { type: 'DELETE_ROWS'; payload: { ids: string[] } }
  | { type: 'UPDATE_ROW'; payload: { id: string; label?: string; color?: string } }
  | { type: 'UPDATE_ROW_POSITION'; payload: { id: string; position: Position } }
  | { type: 'UPDATE_ROW_ROTATION'; payload: { id: string; rotation: number } }
  | { type: 'UPDATE_SEAT_LABEL'; payload: { rowId?: string; tableId?: string; seatId: string; label: string } }
  | { type: 'UPDATE_SEAT_STATUS'; payload: { seatId: string; status: SeatStatus; rowId?: string; tableId?: string } }
  | { type: 'UPDATE_ROW_CONFIG'; payload: { id: string; label?: string; color?: string; seatCount?: number } }
  | { type: 'DELETE_SEATS'; payload: { ids: string[] } }
  | { type: 'ADD_AREA'; payload: { label: string; position: Position; width: number; height: number; color: string; shape?: Area['shape'] } }
  | { type: 'DELETE_AREAS'; payload: { ids: string[] } }
  | { type: 'UPDATE_AREA'; payload: { id: string; label?: string; width?: number; height?: number; color?: string } }
  | { type: 'UPDATE_AREA_POSITION'; payload: { id: string; position: Position } }
  | { type: 'UPDATE_AREA_ROTATION'; payload: { id: string; rotation: number } }
  | { type: 'ADD_TABLE'; payload: { label: string; position: Position; seatCount: number; shape: Table['shape']; seatLabels?: string[]; color?: string } }
  | { type: 'DELETE_TABLES'; payload: { ids: string[] } }
  | { type: 'UPDATE_TABLE'; payload: { id: string; label?: string; shape?: Table['shape']; color?: string } }
  | { type: 'UPDATE_TABLE_POSITION'; payload: { id: string; position: Position } }
  | { type: 'UPDATE_TABLE_ROTATION'; payload: { id: string; rotation: number } }
  | { type: 'SELECT_ITEMS'; payload: SelectionInfo[] }
  | { type: 'TOGGLE_SELECT_ITEM'; payload: SelectionInfo }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_TOOL_MODE'; payload: ToolMode }
  | { type: 'RENAME_MAP'; payload: { name: string } }
  | { type: 'IMPORT_MAP'; payload: SeatMap }
  | { type: 'RESET_MAP' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function buildSeats(count: number, rowId?: string, tableId?: string, labels?: string[]): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    label: labels?.[i] ?? String(i + 1),
    position: { x: i * 40, y: 0 },
    status: 'available' as const,
    ...(rowId ? { rowId } : {}),
    ...(tableId ? { tableId } : {}),
  }));
}

function snapshot(state: State): HistoryEntry {
  return { seatMap: JSON.parse(JSON.stringify(state.seatMap)) };
}

function withHistory(state: State, nextSeatMap: SeatMap): State {
  return {
    ...state,
    past: [...state.past.slice(-49), snapshot(state)],
    future: [],
    seatMap: nextSeatMap,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ROW': {
      const id = uuidv4();
      const { label, seatCount, position, seatLabels, color } = action.payload;
      const seats = buildSeats(seatCount, id, undefined, seatLabels);
      const row: Row = { id, label, seatCount, seats, position, color };
      return withHistory(state, { ...state.seatMap, rows: [...state.seatMap.rows, row] });
    }

    case 'DELETE_ROWS': {
      const ids = new Set(action.payload.ids);
      return withHistory(state, {
        ...state.seatMap,
        rows: state.seatMap.rows.filter((r) => !ids.has(r.id)),
      });
    }

    case 'UPDATE_ROW': {
      const { id, ...updates } = action.payload;
      return withHistory(state, {
        ...state.seatMap,
        rows: state.seatMap.rows.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      });
    }

    case 'UPDATE_ROW_POSITION': {
      return {
        ...state,
        seatMap: {
          ...state.seatMap,
          rows: state.seatMap.rows.map((r) =>
            r.id === action.payload.id ? { ...r, position: action.payload.position } : r
          ),
        },
      };
    }

    case 'UPDATE_ROW_ROTATION': {
      return {
        ...state,
        seatMap: {
          ...state.seatMap,
          rows: state.seatMap.rows.map((r) =>
            r.id === action.payload.id ? { ...r, rotation: action.payload.rotation } : r
          ),
        },
      };
    }

    case 'UPDATE_SEAT_LABEL': {
      const { rowId, tableId, seatId, label } = action.payload;
      const updateSeat = (seats: Seat[]) =>
        seats.map((s) => (s.id === seatId ? { ...s, label } : s));

      if (rowId) {
        return withHistory(state, {
          ...state.seatMap,
          rows: state.seatMap.rows.map((r) =>
            r.id === rowId ? { ...r, seats: updateSeat(r.seats) } : r
          ),
        });
      }
      if (tableId) {
        return withHistory(state, {
          ...state.seatMap,
          tables: state.seatMap.tables.map((t) =>
            t.id === tableId ? { ...t, seats: updateSeat(t.seats) } : t
          ),
        });
      }
      return state;
    }

    case 'UPDATE_SEAT_STATUS': {
      const { seatId, status, rowId, tableId } = action.payload;
      const updateSeat = (seats: Seat[]) =>
        seats.map((s) => (s.id === seatId ? { ...s, status } : s));
      if (rowId) {
        return withHistory(state, {
          ...state.seatMap,
          rows: state.seatMap.rows.map((r) =>
            r.id === rowId ? { ...r, seats: updateSeat(r.seats) } : r
          ),
        });
      }
      if (tableId) {
        return withHistory(state, {
          ...state.seatMap,
          tables: state.seatMap.tables.map((t) =>
            t.id === tableId ? { ...t, seats: updateSeat(t.seats) } : t
          ),
        });
      }
      return state;
    }

    case 'UPDATE_ROW_CONFIG': {
      const { id, label, color, seatCount } = action.payload;
      return withHistory(state, {
        ...state.seatMap,
        rows: state.seatMap.rows.map((r) => {
          if (r.id !== id) return r;
          let seats = r.seats;
          if (seatCount !== undefined && seatCount !== r.seats.length) {
            if (seatCount > r.seats.length) {
              const extra = buildSeats(
                seatCount - r.seats.length,
                r.id,
                undefined,
                Array.from({ length: seatCount - r.seats.length }, (_, i) => String(r.seats.length + i + 1))
              );
              seats = [...r.seats, ...extra];
            } else {
              seats = r.seats.slice(0, seatCount);
            }
          }
          return {
            ...r,
            ...(label !== undefined ? { label } : {}),
            ...(color !== undefined ? { color } : {}),
            seats,
            seatCount: seats.length,
          };
        }),
      });
    }

    case 'DELETE_SEATS': {
      const ids = new Set(action.payload.ids);
      return withHistory(state, {
        ...state.seatMap,
        rows: state.seatMap.rows.map((r) => ({
          ...r,
          seats: r.seats.filter((s) => !ids.has(s.id)),
          seatCount: r.seats.filter((s) => !ids.has(s.id)).length,
        })),
        tables: state.seatMap.tables.map((t) => ({
          ...t,
          seats: t.seats.filter((s) => !ids.has(s.id)),
          seatCount: t.seats.filter((s) => !ids.has(s.id)).length,
        })),
      });
    }

    case 'ADD_AREA': {
      const area: Area = { id: uuidv4(), ...action.payload };
      return withHistory(state, { ...state.seatMap, areas: [...state.seatMap.areas, area] });
    }

    case 'DELETE_AREAS': {
      const ids = new Set(action.payload.ids);
      return withHistory(state, {
        ...state.seatMap,
        areas: state.seatMap.areas.filter((a) => !ids.has(a.id)),
      });
    }

    case 'UPDATE_AREA': {
      const { id, ...updates } = action.payload;
      return withHistory(state, {
        ...state.seatMap,
        areas: state.seatMap.areas.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      });
    }

    case 'UPDATE_AREA_POSITION': {
      return {
        ...state,
        seatMap: {
          ...state.seatMap,
          areas: state.seatMap.areas.map((a) =>
            a.id === action.payload.id ? { ...a, position: action.payload.position } : a
          ),
        },
      };
    }

    case 'UPDATE_AREA_ROTATION': {
      return {
        ...state,
        seatMap: {
          ...state.seatMap,
          areas: state.seatMap.areas.map((a) =>
            a.id === action.payload.id ? { ...a, rotation: action.payload.rotation } : a
          ),
        },
      };
    }

    case 'ADD_TABLE': {
      const id = uuidv4();
      const { label, position, seatCount, shape, seatLabels, color } = action.payload;
      const seats = buildSeats(seatCount, undefined, id, seatLabels);
      const table: Table = { id, label, position, seatCount, seats, shape, color };
      return withHistory(state, { ...state.seatMap, tables: [...state.seatMap.tables, table] });
    }

    case 'DELETE_TABLES': {
      const ids = new Set(action.payload.ids);
      return withHistory(state, {
        ...state.seatMap,
        tables: state.seatMap.tables.filter((t) => !ids.has(t.id)),
      });
    }

    case 'UPDATE_TABLE': {
      const { id, ...updates } = action.payload;
      return withHistory(state, {
        ...state.seatMap,
        tables: state.seatMap.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
    }

    case 'UPDATE_TABLE_POSITION': {
      return {
        ...state,
        seatMap: {
          ...state.seatMap,
          tables: state.seatMap.tables.map((t) =>
            t.id === action.payload.id ? { ...t, position: action.payload.position } : t
          ),
        },
      };
    }

    case 'UPDATE_TABLE_ROTATION': {
      return {
        ...state,
        seatMap: {
          ...state.seatMap,
          tables: state.seatMap.tables.map((t) =>
            t.id === action.payload.id ? { ...t, rotation: action.payload.rotation } : t
          ),
        },
      };
    }

    case 'SELECT_ITEMS':
      return { ...state, selectedItems: action.payload };

    case 'TOGGLE_SELECT_ITEM': {
      const { id, type } = action.payload;
      const exists = state.selectedItems.find((s) => s.id === id);
      return {
        ...state,
        selectedItems: exists
          ? state.selectedItems.filter((s) => s.id !== id)
          : [...state.selectedItems, { id, type }],
      };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedItems: [] };

    case 'SET_TOOL_MODE':
      return { ...state, toolMode: action.payload, selectedItems: [] };

    case 'RENAME_MAP':
      return withHistory(state, { ...state.seatMap, name: action.payload.name });

    case 'IMPORT_MAP':
      return {
        ...INITIAL_STATE,
        seatMap: action.payload,
      };

    case 'RESET_MAP':
      return {
        ...INITIAL_STATE,
        seatMap: { ...INITIAL_SEAT_MAP, id: uuidv4() },
      };

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future.slice(0, 49)],
        seatMap: prev.seatMap,
        selectedItems: [],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        past: [...state.past.slice(-49), snapshot(state)],
        future: state.future.slice(1),
        seatMap: next.seatMap,
        selectedItems: [],
      };
    }

    default:
      return state;
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

interface SeatMapContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  canUndo: boolean;
  canRedo: boolean;
}

const SeatMapContext = createContext<SeatMapContextValue | null>(null);

export function SeatMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const value: SeatMapContextValue = {
    state,
    dispatch,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };

  return <SeatMapContext.Provider value={value}>{children}</SeatMapContext.Provider>;
}

export function useSeatMap() {
  const ctx = useContext(SeatMapContext);
  if (!ctx) throw new Error('useSeatMap debe usarse dentro de SeatMapProvider');
  return ctx;
}
