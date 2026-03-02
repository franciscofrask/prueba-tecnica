# Mapa de Asientos

Editor visual interactivo para crear y gestionar mapas de asientos en eventos. Permite diseñar el layout de una sala con filas, áreas decorativas y mesas, asignando etiquetas y estados a cada asiento, con persistencia local y exportación/importación JSON.

---

## Setup

### Requisitos

- Node.js 18+
- npm 9+

### Instalación y ejecución

```bash
# Clonar el repositorio
git clone <repo-url>
cd prueba-tecnica

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build
npm start
```

La aplicación queda disponible en [http://localhost:3000](http://localhost:3000).

---

## Stack tecnológico

| Librería | Versión | Rol |
|---|---|---|
| **Next.js** | 16.1.6 | Framework (App Router, SSR+CSR) |
| **React** | 19.2.3 | UI |
| **TypeScript** | 5.x | Tipado estático |
| **Mantine v8** | 8.3.15 | Componentes UI, Drawer, Notifications, Modals |
| **@mantine/hooks** | 8.3.15 | `useMediaQuery` para responsive |
| **react-konva / konva** | 19.x / 10.x | Canvas 2D interactivo |
| **uuid** | 13.x | Generación de IDs únicos |
| **@tabler/icons-react** | 3.x | Iconografía |

---

## Arquitectura

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fuente Inter, suppressHydrationWarning
│   ├── page.tsx            # Layout principal responsive (AppLayout)
│   ├── providers.tsx       # MantineProvider + Notifications
│   └── globals.css
├── components/
│   ├── Modals/             # CreateRowModal, CreateAreaModal, CreateTableModal,
│   │                       # EditRowModal, EditSeatModal, ExportPreviewModal,
│   │                       # ImportModal, DeleteConfirmModal, NewMapModal,
│   │                       # LabelModal, SavedMapsModal
│   ├── Panel/
│   │   └── PropertiesPanel.tsx   # Panel de propiedades del elemento seleccionado
│   ├── SeatMap/
│   │   ├── SeatMapCanvas.tsx     # Stage Konva, pan, zoom, marquee, rotación
│   │   ├── RowComponent.tsx      # Renderiza fila con asientos
│   │   ├── AreaComponent.tsx     # Renderiza área decorativa
│   │   └── TableComponent.tsx    # Renderiza mesa con asientos
│   ├── Toolbar/
│   │   └── Toolbar.tsx           # Herramientas (select/pan/fila/área/mesa/undo/redo)
│   └── Topbar/
│       └── Topbar.tsx            # Barra superior con stats, acciones y nombre
├── context/
│   └── SeatMapContext.tsx        # Estado global: useReducer + Context
├── lib/
│   └── validations.ts            # Validación de etiquetas
├── types/
│   └── seatMap.ts                # Tipos TypeScript del dominio
└── utils/
    ├── export.ts                 # Serialización a JSON
    ├── import.ts                 # Parseo e importación de JSON
    └── labelGenerator.ts         # Motor de patrones de etiquetado
```

### Gestión del estado

Se usa `useReducer` + React Context (`SeatMapContext`).

**Acciones del reducer:**

| Categoría | Acciones |
|---|---|
| Filas | `ADD_ROW`, `DELETE_ROWS`, `UPDATE_ROW`, `UPDATE_ROW_POSITION`, `UPDATE_ROW_ROTATION`, `UPDATE_ROW_CONFIG` |
| Áreas | `ADD_AREA`, `DELETE_AREAS`, `UPDATE_AREA`, `UPDATE_AREA_POSITION`, `UPDATE_AREA_ROTATION` |
| Mesas | `ADD_TABLE`, `DELETE_TABLES`, `UPDATE_TABLE`, `UPDATE_TABLE_POSITION`, `UPDATE_TABLE_ROTATION` |
| Asientos | `UPDATE_SEAT_LABEL`, `UPDATE_SEAT_STATUS`, `DELETE_SEATS` |
| Selección | `SELECT_ITEMS`, `TOGGLE_SELECT_ITEM`, `CLEAR_SELECTION` |
| Mapa | `IMPORT_MAP`, `RENAME_MAP`, `UNDO`, `REDO` |

---

## Esquema de datos

### Tipos principales

```typescript
interface SeatMap {
  id: string;
  name: string;         
  rows: Row[];
  areas: Area[];
  tables: Table[];
}

interface Row {
  id: string;
  label: string;             // "Fila A", "VIP"
  seatCount: number;
  seats: Seat[];
  position: { x: number; y: number };
  color?: string;            // Hex, default "#3b82f6"
  rotation?: number;         // Grados, default 0
}

interface Seat {
  id: string;
  label: string;             // "A1", "VIP-5"
  position: { x: number; y: number }; // Relativa al padre (no usada en render directo)
  status: 'available' | 'selected' | 'disabled';
  rowId?: string;
  tableId?: string;
}

interface Area {
  id: string;
  label: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  color: string;
  shape?: 'rectangle' | 'ellipse' | 'hexagon' | 'diamond';
  rotation?: number;
}

interface Table {
  id: string;
  label: string;
  position: { x: number; y: number }; // Centro de la mesa
  seatCount: number;
  seats: Seat[];
  shape: 'circle' | 'square' | 'rectangle';
  color?: string;
  rotation?: number;
}
```

### Persistencia en localStorage

```typescript
// Clave: "seatmap_library"
// Estructura:
type Library = Record<string, SavedMapEntry>;

interface SavedMapEntry {
  map: SeatMap;
  savedAt: string;  
}
```

El guardado es **manual** (botón "Guardar"). Al cargar la app, se restaura la librería desde localStorage en un `useEffect` 

### Formato de exportación JSON

El archivo exportado es el objeto `SeatMap` serializado directamente, con nombre de archivo `<nombre-del-mapa>.json`.

---

## Funcionalidades principales

- **Canvas interactivo**: pan (herramienta mano o rueda), zoom (scroll/pinch), selección individual y por marquee, rotación con handle
- **Filas**: creación individual o múltiple (con patrón de nombres `Fila {A-Z}`, `Sector {1-10}`, etc.), edición de etiqueta y color, redimensionado de asientos
- **Áreas decorativas**: 4 formas (rectángulo, elipse, hexágono, rombo), redimensionables y rotables
- **Mesas**: 3 formas (circular, cuadrada, rectangular). Los asientos se distribuyen perimetralmente según la forma
- **Asientos**: edición de etiqueta individual, toggle de estado (disponible/deshabilitado), eliminación
- **etiquetado**: patrones `{1}`, `{1-10}`, `{A-Z}`, `{a-z}` con preview en tiempo real
- **Librería de mapas**: guardar/cargar/eliminar múltiples mapas en localStorage
- **Exportar/Importar**: JSON con validación de estructura
- **Undo/Redo**: historial de acciones (Ctrl+Z / Ctrl+Y)
- **Responsive**: layout adaptado para móvil (Toolbar horizontal inferior, PropertiesPanel en Drawer), tablet y desktop. Touch: pan con 1 dedo, pinch-zoom con 2 dedos

---

## Decisiones técnicas

### Canvas con react-konva
React Konva es una librería que permite dibujar y manipular gráficos 2D en el navegador usando React, apoyándose internamente en HTML5 Canvas.


### Posicionamiento de asientos en mesas
- **Mesas circulares**
- **Mesas rect/cuadradas**: los asientos se dividen proporcionalmente entre los 4 lados según la longitud de cada lado, y se centran dentro del lado. Esto da una apariencia realista de mesa rectangular con asientos en las cabeceras y laterales.

### Modelo centrado para mesas
Las mesas usan `position` como el **centro geométrico** (a diferencia de filas y áreas que usan la esquina superior izquierda). Esto simplifica las rotaciones alrededor del propio eje y el cálculo de posiciones de asientos perimetrales.


## Supuestos asumidos

1. **Un mapa activo a la vez**: el editor trabaja sobre un único `SeatMap` en memoria. La librería permite guardar y cargar distintos mapas, pero no editar varios simultáneamente.
2. **IDs autogenerados**: todos los elementos usan `uuid v4`. No existe un sistema de IDs legibles por humanos (eso es responsabilidad de las etiquetas).
3. **Estado `selected` de asientos es visual**: el campo `status: 'selected'` está definido en el tipo pero no se expone en la UI de producción; la selección interactiva se maneja en el estado del editor (`selectedItems`), no en el modelo de datos. Se consideró parte del dominio para exportaciones que incluyan estado de reservas.
4. **Sin autenticación ni backend**: toda la persistencia es local. El formato de exportación JSON está diseñado para ser consumido por un backend eventual.
5. **Rotación en grados**: se almacena en el modelo y se aplica directamente a Konva. Sin cuantización (a menos que el usuario mantenga Shift durante la rotación, que cuantiza a 15°).
6. **Sin soporte multi-select para edición masiva de propiedades**: seleccionar múltiples elementos permite eliminarlos en grupo, pero la edición de propiedades aplica solo a selecciones de elemento único.
7. **Capacidad máxima orientativa**: los inputs limitan a 200 asientos por fila, 100 filas en modo múltiple y 20 asientos por mesa. Fuera de esos rangos el canvas puede degradar performance en dispositivos de baja gama.

