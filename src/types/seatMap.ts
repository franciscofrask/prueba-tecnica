export interface Position {
  x: number;
  y: number;
}

export type SeatStatus = 'available' | 'selected' | 'disabled';

export interface Seat {
  id: string;
  label: string;
  position: Position;
  status: SeatStatus;
  rowId?: string;
  tableId?: string;
}

export interface Row {
  id: string;
  label: string;
  seatCount: number;
  seats: Seat[];
  position: Position;
  color?: string;
  rotation?: number;
}

export type AreaShape = 'rectangle' | 'ellipse' | 'hexagon' | 'diamond';

export interface Area {
  id: string;
  label: string;
  position: Position;
  width: number;
  height: number;
  color: string;
  shape?: AreaShape;
  rotation?: number;
}

export type TableShape = 'circle' | 'square' | 'rectangle';

export interface Table {
  id: string;
  label: string;
  position: Position;
  seatCount: number;
  seats: Seat[];
  shape: TableShape;
  color?: string;
  rotation?: number;
}

export interface SeatMap {
  id: string;
  name: string;
  rows: Row[];
  areas: Area[];
  tables: Table[];
  version: string;
}

export type ToolMode = 'select' | 'pan' | 'row' | 'area' | 'table';

export type ElementType = 'row' | 'area' | 'table' | 'seat';

export interface SelectionInfo {
  id: string;
  type: ElementType;
}

export interface ValidationError {
  field: string;
  message: string;
}
