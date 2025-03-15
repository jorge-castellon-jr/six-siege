// src/types.ts
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

// Wall type enum for differentiating between wall types
export enum WallType {
  MAIN = "main",
  RED = "red",
  ORANGE = "orange",
  WINDOW = "window",
}

// Track broken walls
export interface BrokenWalls {
  red: number[];
  orange: number[];
  windows: number[];
}

// Smoke overlay patterns
export interface SmokePattern {
  name: string;
  width: number;
  height: number;
}

// Smoke overlay placed on the board
export interface Smoke {
  position: Position; // Top-left position
  pattern: SmokePattern;
}

export interface MapData {
  id: string;
  name: string;
  walls: Wall[]; // Main (unbreakable) walls
  redWalls?: Wall[]; // Red breakable walls
  orangeWalls?: Wall[]; // Orange breakable walls
  windows?: Wall[]; // Windows/barricades
  gridSize: GridSize;
  gridOffset: GridOffset;
  cellSize?: number;
  version: number;
}

// Checklist types
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
