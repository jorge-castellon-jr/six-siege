// src/types.ts
export interface Position {
  x: number;
  y: number;
}

export interface Wall {
  start: Position;
  end: Position;
}

export interface Player {
  position: Position;
  team: "blue" | "orange";
}

export interface MapData {
  name: string;
  imagePath: string;
  walls: Wall[];
  gridSize: {
    width: number; // Number of columns
    height: number; // Number of rows
  };
  gridOffset: {
    x: number; // Left offset
    y: number; // Top offset
    right: number; // Right offset
    bottom: number; // Bottom offset
  };
  cellSize?: number; // Optional - will be calculated based on grid dimensions
}
