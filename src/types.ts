// src/types.ts
export interface Position {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface GridOffset {
  x: number;
  y: number;
  right: number;
  bottom: number;
}

export interface Wall {
  start: Position;
  end: Position;
  thickness: number; // Wall thickness in grid units
  offset: number; // Offset from center line (positive = right/down, negative = left/up)
  startExtension: number; // Extension beyond start point
  endExtension: number; // Extension beyond end point
}

export interface Player {
  position: Position;
  team: "blue" | "orange";
}

export interface MapData {
  name: string;
  imagePath: string;
  walls: Wall[];
  gridSize: GridSize;
  gridOffset: GridOffset;
  cellSize?: number;
}
