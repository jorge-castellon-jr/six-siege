// src/types.ts
// Existing types
export type AppPage = "home" | "calculator" | "admin";

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
  thickness: number;
  offset: number;
  startExtension: number;
  endExtension: number;
}

export interface Player {
  position: Position;
  team: "blue" | "orange";
}

export interface MapData {
  id: string;
  name: string;
  walls: Wall[];
  gridSize: GridSize;
  gridOffset: GridOffset;
 cellSize?: number;
  version: number;
}

// New types for the improvement checklist
export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  category: ChecklistCategory;
}

export type ChecklistCategory =
  | "core"
  | "admin"
  | "player"
  | "maps"
  | "interface";
