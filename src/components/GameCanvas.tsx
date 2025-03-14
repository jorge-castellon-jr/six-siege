// src/components/GameCanvas.tsx - updated for admin mode with breakable walls
import React, { useState, useEffect, useRef } from "react";
import {
  Position,
  Player,
  MapData,
  Wall,
  WallType,
  BrokenWalls,
} from "../types";
import { DEFAULT_LINE_THICKNESS, Intersection } from "../utils/lineOfSight";
import { isAdmin } from "../utils/admin";

interface GameCanvasProps {
  mapData: MapData;
  bluePlayer: Player | null;
  orangePlayer: Player | null;
  hasLos: boolean | null;
  isAdminMode: boolean;
  wallStart: Position | null;
  onCanvasClick: (
    event: React.MouseEvent<HTMLCanvasElement> & {
      gridIntersection?: Position;
      gridPosition?: Position;
    },
  ) => void;
  setImageDimensions?: (dimensions: { width: number; height: number }) => void;
  selectedWallIndex: number | null;
  selectedWallType?: WallType | null;
  setSelectedWallIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedWallType?: React.Dispatch<React.SetStateAction<WallType | null>>;
  setBluePlayer?: React.Dispatch<React.SetStateAction<Player | null>>;
  setOrangePlayer?: React.Dispatch<React.SetStateAction<Player | null>>;
  setHasLos?: React.Dispatch<React.SetStateAction<boolean | null>>;
  intersections?: Intersection[]; // For line of sight intersections
  brokenWalls?: BrokenWalls; // For broken walls
  onBrokenWallsUpdate?: (brokenWalls: BrokenWalls) => void; // For updating broken walls
  currentWallType?: WallType; // Current wall type being placed
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  mapData,
  bluePlayer,
  orangePlayer,
  hasLos,
  isAdminMode,
  wallStart,
  onCanvasClick,
  setImageDimensions,
  selectedWallIndex,
  selectedWallType = null,
  setSelectedWallIndex,
  setSelectedWallType = () => { },
  setBluePlayer,
  setOrangePlayer,
  setHasLos,
  intersections = [],
  brokenWalls = { red: [], orange: [], windows: [] },
  onBrokenWallsUpdate = () => { },
  currentWallType = WallType.MAIN,
}) => {
  // State for panning
  const [mousePosition, setMousePosition] = useState<Position | null>(null);
  const [hoveredWallIndex, setHoveredWallIndex] = useState<number | null>(null);
  const [hoveredWallType, setHoveredWallType] = useState<WallType | null>(null);

  // State for image
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setLocalImageDimensions] = useState({
    width: 800,
    height: 600,
  });

  // State for dragging
  const [draggingPlayer, setDraggingPlayer] = useState<
    "blue" | "orange" | null
  >(null);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);

  // Local zoom state for when parent doesn't provide it
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Get the actual zoom level to use
  const updateZoomLevel = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  // Ref for the canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom in function
  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel + 100, 1000);
    updateZoomLevel(newZoom);
  };

  // Zoom out function
  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel - 100, 50);
    updateZoomLevel(newZoom);
  };

  // Reset zoom function
  const resetZoom = () => {
    updateZoomLevel(100);
  };

  // Calculate cell size based on grid dimensions and image size
  const calculateCellSize = (): number => {
    const { gridSize, gridOffset } = mapData;

    // Get canvas or use ref if available
    const canvas = canvasRef.current;

    // Available width is image width minus left and right offsets
    const availableWidth = mapImage
      ? mapImage.width - gridOffset.x - gridOffset.right
      : (canvas?.width || 800) - gridOffset.x - gridOffset.right;

    // Available height is image height minus top and bottom offsets
    const availableHeight = mapImage
      ? mapImage.height - gridOffset.y - gridOffset.bottom
      : (canvas?.height || 600) - gridOffset.y - gridOffset.bottom;

    // Calculate cell sizes based on grid dimensions
    const cellWidth = gridSize.width > 0 ? availableWidth / gridSize.width : 40;
    const cellHeight =
      gridSize.height > 0 ? availableHeight / gridSize.height : 40;

    // Return the smaller value to ensure cells fit within bounds
    return Math.min(cellWidth, cellHeight);
  };

  // Get cell size: either from MapData if provided, or calculate it
  const getCellSize = (): number => {
    // Otherwise calculate it based on grid dimensions
    return calculateCellSize();
  };

  // Utility function to calculate a normalized direction vector
  const getNormalizedDirection = (start: Position, end: Position): Position => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x: 0, y: 0 };

    return {
      x: dx / length,
      y: dy / length,
    };
  };

  // Utility function to calculate a perpendicular vector
  const getPerpendicularVector = (direction: Position): Position => {
    return {
      x: -direction.y,
      y: direction.x,
    };
  };

  // Load or update the map image when the path changes
  useEffect(() => {
    const img = new Image();
    img.src =
      mapData.version > 1
        ? `src/assets/${mapData.id}.png`
        : `./assets/${mapData.id}.jpg`;

    img.onload = () => {
      setMapImage(img);
      const dimensions = { width: img.width, height: img.height };
      setLocalImageDimensions(dimensions);

      // Notify parent component of image dimensions if callback provided
      if (setImageDimensions) {
        setImageDimensions(dimensions);
      }
    };

    img.onerror = (error) => {
      console.error(`Failed to load image: ${mapData.id}`);
      console.error(error);
    };
  }, [mapData.id, setImageDimensions, mapData.version]);

  // Execute the render function when relevant state changes
  useEffect(() => {
    renderCanvas();
  }, [
    mapData,
    wallStart,
    bluePlayer,
    orangePlayer,
    hasLos,
    isAdminMode,
    mapImage,
    selectedWallIndex,
    selectedWallType,
    mousePosition,
    draggingPlayer,
    dragPosition,
    hoveredWallIndex,
    hoveredWallType,
    brokenWalls,
    intersections,
    currentWallType,
  ]);

  // New function: check if a point is inside a player token
  const isPointInPlayer = (
    point: Position,
    player: Player | null,
    startX: number,
    startY: number,
    cellSize: number,
  ): boolean => {
    if (!player) return false;

    const playerX = startX + player.position.x * cellSize + cellSize / 2;
    const playerY = startY + player.position.y * cellSize + cellSize / 2;
    const radius = cellSize / 3;

    const distance = Math.sqrt(
      Math.pow(point.x - playerX, 2) + Math.pow(point.y - playerY, 2),
    );

    return distance <= radius;
  };

  // Draw a wall with thickness, offset and extensions
  const drawWall = (
    ctx: CanvasRenderingContext2D,
    wall: Wall,
    startX: number,
    startY: number,
    cellSize: number,
    type: WallType = WallType.MAIN,
    index: number,
    isSelected: boolean = false,
    isHovered: boolean = false,
    isBroken: boolean = false,
  ) => {
    // Skip drawing broken walls if it's marked as broken and not in admin mode
    if (isBroken && !isAdminMode) return;

    // Get wall endpoints in canvas coordinates
    const x1 = startX + wall.start.x * cellSize;
    const y1 = startY + wall.start.y * cellSize;
    const x2 = startX + wall.end.x * cellSize;
    const y2 = startY + wall.end.y * cellSize;

    // Calculate direction vector
    const direction = getNormalizedDirection(
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    );

    // Calculate perpendicular vector for offset and thickness
    const perpendicular = getPerpendicularVector(direction);

    // Apply wall extensions
    const extendedStart = {
      x: x1 - direction.x * wall.startExtension * cellSize,
      y: y1 - direction.y * wall.startExtension * cellSize,
    };

    const extendedEnd = {
      x: x2 + direction.x * wall.endExtension * cellSize,
      y: y2 + direction.y * wall.endExtension * cellSize,
    };

    // Apply wall offset
    const offsetX = perpendicular.x * wall.offset * cellSize;
    const offsetY = perpendicular.y * wall.offset * cellSize;

    // Calculate half thickness for the wall edges
    const halfThickness = (wall.thickness * cellSize) / 2;

    // Calculate the four corners of the wall
    const topLeft = {
      x: extendedStart.x + offsetX - perpendicular.x * halfThickness,
      y: extendedStart.y + offsetY - perpendicular.y * halfThickness,
    };

    const topRight = {
      x: extendedEnd.x + offsetX - perpendicular.x * halfThickness,
      y: extendedEnd.y + offsetY - perpendicular.y * halfThickness,
    };

    const bottomRight = {
      x: extendedEnd.x + offsetX + perpendicular.x * halfThickness,
      y: extendedEnd.y + offsetY + perpendicular.y * halfThickness,
    };

    const bottomLeft = {
      x: extendedStart.x + offsetX + perpendicular.x * halfThickness,
      y: extendedStart.y + offsetY + perpendicular.y * halfThickness,
    };

    const dotSize = 3;

    // Draw the wall as a filled polygon
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();

    // Determine wall color based on type
    let fillColor;

    if (isSelected) {
      // Selected wall colors (brighter versions of the regular colors)
      switch (type) {
        case WallType.MAIN:
          fillColor = "#b71c1c"; // Bright red for selected main walls
          break;
        case WallType.RED:
          fillColor = "#f44336"; // Bright red for selected red walls
          break;
        case WallType.ORANGE:
          fillColor = "#ff9800"; // Bright orange for selected orange walls
          break;
        case WallType.WINDOW:
          fillColor = "#0288d1"; // Bright blue for selected windows
          break;
        default:
          fillColor = "#b71c1c";
      }
    } else if (isHovered) {
      // Hovered wall colors (lighter versions of the regular colors)
      switch (type) {
        case WallType.MAIN:
          fillColor = "#ef5350"; // Light red for hovered main walls
          break;
        case WallType.RED:
          fillColor = "#ef5350"; // Light red for hovered red walls
          break;
        case WallType.ORANGE:
          fillColor = "#ffb74d"; // Light orange for hovered orange walls
          break;
        case WallType.WINDOW:
          fillColor = "#81d4fa"; // Light blue for hovered windows
          break;
        default:
          fillColor = "#ef5350";
      }
    } else {
      // Default colors based on wall type
      switch (type) {
        case WallType.MAIN:
          fillColor = "#ff5252"; // Regular main wall color
          break;
        case WallType.RED:
          fillColor = "#d32f2f"; // Deep red for red walls
          break;
        case WallType.ORANGE:
          fillColor = "#f57c00"; // Deep orange for orange walls
          break;
        case WallType.WINDOW:
          fillColor = "#0288d1"; // Deep blue for windows/barricades
          break;
        default:
          fillColor = "#ff5252";
      }
    }

    // Add striped pattern for broken walls in admin mode
    if (isBroken && isAdminMode) {
      // Create striped pattern for broken walls
      const patternCanvas = document.createElement("canvas");
      const patternContext = patternCanvas.getContext("2d");

      if (patternContext) {
        const patternSize = 10;
        patternCanvas.width = patternSize;
        patternCanvas.height = patternSize;

        // Draw background
        patternContext.fillStyle = fillColor;
        patternContext.fillRect(0, 0, patternSize, patternSize);

        // Draw stripes
        patternContext.beginPath();
        patternContext.strokeStyle = "rgba(0, 0, 0, 0.5)";
        patternContext.lineWidth = 2;
        patternContext.moveTo(0, 0);
        patternContext.lineTo(patternSize, patternSize);
        patternContext.stroke();

        // Create pattern
        const pattern = ctx.createPattern(patternCanvas, "repeat");
        if (pattern) {
          fillColor = pattern;
        }
      }
    }

    // Fill with color
    ctx.fillStyle = fillColor;
    ctx.fill();

    // If selected, draw the endpoints as circles
    if (isSelected) {
      // Add offset position indicator
      const direction = getNormalizedDirection(
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      );
      const perpendicular = getPerpendicularVector(direction);
      const offsetX = perpendicular.x * wall.offset * cellSize;
      const offsetY = perpendicular.y * wall.offset * cellSize;

      // Draw start point
      ctx.beginPath();
      ctx.arc(x1 + offsetX, y1 + offsetY, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = "#4CAF50";
      ctx.fill();

      // Draw end point
      ctx.beginPath();
      ctx.arc(x2 + offsetX, y2 + offsetY, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = "#2196F3";
      ctx.fill();

      // Draw midpoint for offset adjustment
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      ctx.beginPath();
      ctx.arc(midX + offsetX, midY + offsetY, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = "yellow";
      ctx.fill();
    }
  };

  // Check if mouse is over a wall for hover effect
  const handleMouseMoveOverWalls = (clientX: number, clientY: number) => {
    if (isAdminMode) {
      // Admin mode: Check all wall types for hovering
      // Check main walls first
      const mainWallIndex = getWallIndexAtPoint(
        clientX,
        clientY,
        WallType.MAIN,
      );
      if (mainWallIndex !== null) {
        setHoveredWallIndex(mainWallIndex);
        setHoveredWallType(WallType.MAIN);
        return;
      }

      // Check red walls
      const redWallIndex = getWallIndexAtPoint(clientX, clientY, WallType.RED);
      if (redWallIndex !== null) {
        setHoveredWallIndex(redWallIndex);
        setHoveredWallType(WallType.RED);
        return;
      }

      // Check orange walls
      const orangeWallIndex = getWallIndexAtPoint(
        clientX,
        clientY,
        WallType.ORANGE,
      );
      if (orangeWallIndex !== null) {
        setHoveredWallIndex(orangeWallIndex);
        setHoveredWallType(WallType.ORANGE);
        return;
      }

      // Check windows
      const windowWallIndex = getWallIndexAtPoint(
        clientX,
        clientY,
        WallType.WINDOW,
      );
      if (windowWallIndex !== null) {
        setHoveredWallIndex(windowWallIndex);
        setHoveredWallType(WallType.WINDOW);
        return;
      }

      // Reset if not hovering over any wall
      setHoveredWallIndex(null);
      setHoveredWallType(null);
    } else {
      // Player mode: Check breakable walls for hover
      // Check red walls first
      const redWallIndex = getWallIndexAtPoint(clientX, clientY, WallType.RED);
      if (redWallIndex !== null) {
        setHoveredWallIndex(redWallIndex);
        setHoveredWallType(WallType.RED);
        return;
      }

      // Check orange walls
      const orangeWallIndex = getWallIndexAtPoint(
        clientX,
        clientY,
        WallType.ORANGE,
      );
      if (orangeWallIndex !== null) {
        setHoveredWallIndex(orangeWallIndex);
        setHoveredWallType(WallType.ORANGE);
        return;
      }

      // Check windows
      const windowWallIndex = getWallIndexAtPoint(
        clientX,
        clientY,
        WallType.WINDOW,
      );
      if (windowWallIndex !== null) {
        setHoveredWallIndex(windowWallIndex);
        setHoveredWallType(WallType.WINDOW);
        return;
      }

      // Reset if not hovering over any breakable wall
      setHoveredWallIndex(null);
      setHoveredWallType(null);
    }
  };

  // Toggle a breakable wall's state (broken or not)
  const toggleBreakableWall = (type: WallType, index: number) => {
    if (type === WallType.MAIN || isAdminMode) return; // Main walls can't be toggled, and no toggling in admin mode

    const newBrokenWalls = { ...brokenWalls };

    switch (type) {
      case WallType.RED:
        if (newBrokenWalls.red.includes(index)) {
          // Remove from broken walls
          newBrokenWalls.red = newBrokenWalls.red.filter((i) => i !== index);
        } else {
          // Add to broken walls
          newBrokenWalls.red.push(index);
        }
        break;
      case WallType.ORANGE:
        if (newBrokenWalls.orange.includes(index)) {
          // Remove from broken walls
          newBrokenWalls.orange = newBrokenWalls.orange.filter(
            (i) => i !== index,
          );
        } else {
          // Add to broken walls
          newBrokenWalls.orange.push(index);
        }
        break;
      case WallType.WINDOW:
        if (newBrokenWalls.windows.includes(index)) {
          // Remove from broken walls
          newBrokenWalls.windows = newBrokenWalls.windows.filter(
            (i) => i !== index,
          );
        } else {
          // Add to broken walls
          newBrokenWalls.windows.push(index);
        }
        break;
    }

    // Update broken walls state
    if (onBrokenWallsUpdate) {
      onBrokenWallsUpdate(newBrokenWalls);
    }

    // Reset line of sight
    if (setHasLos) {
      setHasLos(null);
    }
  };

  // Check if a point is inside a wall (for selection)
  const isPointInWall = (
    point: Position,
    wall: Wall,
    startX: number,
    startY: number,
    cellSize: number,
  ): boolean => {
    // Get wall endpoints in canvas coordinates
    const x1 = startX + wall.start.x * cellSize;
    const y1 = startY + wall.start.y * cellSize;
    const x2 = startX + wall.end.x * cellSize;
    const y2 = startY + wall.end.y * cellSize;

    // Calculate direction vector
    const direction = getNormalizedDirection(
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    );

    // Calculate perpendicular vector for offset and thickness
    const perpendicular = getPerpendicularVector(direction);

    // Apply wall extensions
    const extendedStart = {
      x: x1 - direction.x * wall.startExtension * cellSize,
      y: y1 - direction.y * wall.startExtension * cellSize,
    };

    const extendedEnd = {
      x: x2 + direction.x * wall.endExtension * cellSize,
      y: y2 + direction.y * wall.endExtension * cellSize,
    };

    // Apply wall offset
    const offsetX = perpendicular.x * wall.offset * cellSize;
    const offsetY = perpendicular.y * wall.offset * cellSize;

    // Calculate half thickness for the wall edges
    const halfThickness = (wall.thickness * cellSize) / 2;

    // Calculate the four corners of the wall
    const topLeft = {
      x: extendedStart.x + offsetX - perpendicular.x * halfThickness,
      y: extendedStart.y + offsetY - perpendicular.y * halfThickness,
    };

    const topRight = {
      x: extendedEnd.x + offsetX - perpendicular.x * halfThickness,
      y: extendedEnd.y + offsetY - perpendicular.y * halfThickness,
    };

    const bottomRight = {
      x: extendedEnd.x + offsetX + perpendicular.x * halfThickness,
      y: extendedEnd.y + offsetY + perpendicular.y * halfThickness,
    };

    const bottomLeft = {
      x: extendedStart.x + offsetX + perpendicular.x * halfThickness,
      y: extendedStart.y + offsetY + perpendicular.y * halfThickness,
    };

    // Function to check if a point is inside a triangle
    const isPointInTriangle = (
      p: Position,
      a: Position,
      b: Position,
      c: Position,
    ): boolean => {
      const area =
        0.5 *
        Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));

      const area1 =
        0.5 *
        Math.abs(p.x * (b.y - c.y) + b.x * (c.y - p.y) + c.x * (p.y - b.y));

      const area2 =
        0.5 *
        Math.abs(a.x * (p.y - c.y) + p.x * (c.y - a.y) + c.x * (a.y - p.y));

      const area3 =
        0.5 *
        Math.abs(a.x * (b.y - p.y) + b.x * (p.y - a.y) + p.x * (a.y - b.y));

      return Math.abs(area - (area1 + area2 + area3)) < 0.01;
    };

    // Check if the point is inside either of the two triangles that make up the wall
    return (
      isPointInTriangle(point, topLeft, topRight, bottomRight) ||
      isPointInTriangle(point, topLeft, bottomRight, bottomLeft)
    );
  };

  // Check if a mouse click hits a wall of a specific type
  const getWallIndexAtPoint = (
    clientX: number,
    clientY: number,
    wallType: WallType = WallType.MAIN,
  ): number | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate actual position considering zoom and pan
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (mouseX / rect.width) * canvas.width;
    const canvasY = (mouseY / rect.height) * canvas.height;

    // Apply pan transformation
    const transformedX = canvasX;
    const transformedY = canvasY;

    const { gridOffset } = mapData;
    const cellSize = getCellSize();
    const startX = gridOffset.x;
    const startY = gridOffset.y;

    // Determine which wall array to check based on type
    let wallArray: Wall[] = [];
    switch (wallType) {
      case WallType.RED:
        wallArray = mapData.redWalls || [];
        break;
      case WallType.ORANGE:
        wallArray = mapData.orangeWalls || [];
        break;
      case WallType.WINDOW:
        wallArray = mapData.windows || [];
        break;
      default:
        wallArray = mapData.walls;
    }

    // Check each wall from last to first (for correct layering/selection)
    for (let i = wallArray.length - 1; i >= 0; i--) {
      if (
        isPointInWall(
          { x: transformedX, y: transformedY },
          wallArray[i],
          startX,
          startY,
          cellSize,
        )
      ) {
        return i;
      }
    }

    return null;
  };

  // Render the canvas content
  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan transformation
    ctx.save();

    // Draw background image if available
    if (mapImage) {
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Black background if no image
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const { gridSize, gridOffset } = mapData;
    const cellSize = getCellSize();

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;

    // Calculate grid boundaries based on offset and cell size
    const startX = gridOffset.x;
    const startY = gridOffset.y;
    const endX = startX + gridSize.width * cellSize;
    const endY = startY + gridSize.height * cellSize;

    // Draw vertical lines
    for (let x = 0; x <= gridSize.width; x++) {
      const posX = startX + x * cellSize;
      ctx.beginPath();
      ctx.moveTo(posX, startY);
      ctx.lineTo(posX, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= gridSize.height; y++) {
      const posY = startY + y * cellSize;
      ctx.beginPath();
      ctx.moveTo(startX, posY);
      ctx.lineTo(endX, posY);
      ctx.stroke();
    }

    // Draw breakable walls first (they should be underneath main walls)

    // Draw red walls
    if (mapData.redWalls) {
      mapData.redWalls.forEach((wall, index) => {
        const isBroken = brokenWalls.red.includes(index);
        const isHovered =
          hoveredWallType === WallType.RED && hoveredWallIndex === index;
        const isSelected =
          selectedWallType === WallType.RED && selectedWallIndex === index;
        drawWall(
          ctx,
          wall,
          startX,
          startY,
          cellSize,
          WallType.RED,
          index,
          isSelected,
          isHovered,
          isBroken,
        );
      });
    }

    // Draw orange walls
    if (mapData.orangeWalls) {
      mapData.orangeWalls.forEach((wall, index) => {
        const isBroken = brokenWalls.orange.includes(index);
        const isHovered =
          hoveredWallType === WallType.ORANGE && hoveredWallIndex === index;
        const isSelected =
          selectedWallType === WallType.ORANGE && selectedWallIndex === index;
        drawWall(
          ctx,
          wall,
          startX,
          startY,
          cellSize,
          WallType.ORANGE,
          index,
          isSelected,
          isHovered,
          isBroken,
        );
      });
    }

    // Draw windows/barricades
    if (mapData.windows) {
      mapData.windows.forEach((wall, index) => {
        const isBroken = brokenWalls.windows.includes(index);
        const isHovered =
          hoveredWallType === WallType.WINDOW && hoveredWallIndex === index;
        const isSelected =
          selectedWallType === WallType.WINDOW && selectedWallIndex === index;
        drawWall(
          ctx,
          wall,
          startX,
          startY,
          cellSize,
          WallType.WINDOW,
          index,
          isSelected,
          isHovered,
          isBroken,
        );
      });
    }

    // Draw main walls (these are always on top)
    mapData.walls.forEach((wall, index) => {
      const isHovered =
        hoveredWallType === WallType.MAIN && hoveredWallIndex === index;
      const isSelected =
        selectedWallType === WallType.MAIN && selectedWallIndex === index;
      drawWall(
        ctx,
        wall,
        startX,
        startY,
        cellSize,
        WallType.MAIN,
        index,
        isSelected,
        isHovered,
        false, // Main walls can't be broken
      );
    });

    // Draw temporary wall being created (also at grid intersection)
    if (isAdminMode && wallStart) {
      const mouseX = startX + wallStart.x * cellSize;
      const mouseY = startY + wallStart.y * cellSize;

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);

      // Color the start point based on the current wall type
      switch (currentWallType) {
        case WallType.MAIN:
          ctx.fillStyle = "#ff5252";
          break;
        case WallType.RED:
          ctx.fillStyle = "#f44336";
          break;
        case WallType.ORANGE:
          ctx.fillStyle = "#ff9800";
          break;
        case WallType.WINDOW:
          ctx.fillStyle = "#29b6f6";
          break;
        default:
          ctx.fillStyle = "#ffeb3b";
      }

      ctx.fill();

      // If we also have a mouse position, draw a preview line
      if (mousePosition) {
        const mousePos = getGridIntersectionFromMouse(
          mousePosition.x,
          mousePosition.y,
        );
        const previewX = startX + mousePos.x * cellSize;
        const previewY = startY + mousePos.y * cellSize;

        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(previewX, previewY);
        ctx.strokeStyle = "#ffeb3b";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw players
    if (bluePlayer) {
      const x = startX + bluePlayer.position.x * cellSize + cellSize / 2;
      const y = startY + bluePlayer.position.y * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
      ctx.fillStyle = "#4f8bff";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add highlight effect if this player can be dragged
      if (!isAdminMode) {
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 3 + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Add stronger highlight effect if dragging
      if (draggingPlayer === "blue") {
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 3 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (orangePlayer) {
      const x = startX + orangePlayer.position.x * cellSize + cellSize / 2;
      const y = startY + orangePlayer.position.y * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ff7f50";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add highlight effect if this player can be dragged
      if (!isAdminMode) {
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 3 + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Add stronger highlight effect if dragging
      if (draggingPlayer === "orange") {
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 3 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw drag preview if dragging a player
    if (draggingPlayer && dragPosition) {
      const x = startX + dragPosition.x * cellSize + cellSize / 2;
      const y = startY + dragPosition.y * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
      ctx.fillStyle =
        draggingPlayer === "blue"
          ? "rgba(79, 139, 255, 0.5)"
          : "rgba(255, 127, 80, 0.5)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw line of sight if both players are placed
    if (bluePlayer && orangePlayer && hasLos !== null) {
      const startX =
        gridOffset.x + bluePlayer.position.x * cellSize + cellSize / 2;
      const startY =
        gridOffset.y + bluePlayer.position.y * cellSize + cellSize / 2;
      const endX =
        gridOffset.x + orangePlayer.position.x * cellSize + cellSize / 2;
      const endY =
        gridOffset.y + orangePlayer.position.y * cellSize + cellSize / 2;

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = hasLos
        ? "rgba(105, 240, 174, 0.9)"
        : "rgba(255, 255, 0, 0.9)";

      // Use the lineThickness to determine stroke width
      // Scale by cellSize to make it relative to the grid
      const lineThickness = DEFAULT_LINE_THICKNESS;
      ctx.lineWidth = lineThickness * cellSize;
      ctx.stroke();

      // Optional: Draw a thinner, more visible center line
      if (lineThickness > 0.1) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = hasLos
          ? "rgba(105, 240, 174, 1.0)"
          : "rgba(255, 82, 82, 1.0)";
        ctx.lineWidth = Math.min(2, lineThickness * cellSize * 0.5);
        ctx.stroke();
      }
    }

    // Draw intersection points if available
    if (isAdmin() && intersections && intersections.length > 0) {
      const { gridOffset } = mapData;
      const cellSize = getCellSize();

      // Group intersections by wall for color coding
      const wallIntersections = new Map<number, Intersection[]>();

      intersections.forEach((intersection) => {
        if (!wallIntersections.has(intersection.wallIndex)) {
          wallIntersections.set(intersection.wallIndex, []);
        }
        wallIntersections.get(intersection.wallIndex)?.push(intersection);
      });

      // Generate distinct colors for each wall
      const generateColor = (index: number) => {
        const hue = (index * 137) % 360; // Golden angle to spread colors
        return `hsl(${hue}, 100%, 70%)`;
      };

      // Draw all intersection points
      Array.from(wallIntersections.entries()).forEach(
        ([wallIndex, points], colorIndex) => {
          const fillColor = generateColor(colorIndex);
          const strokeColor = `hsl(${parseInt(fillColor.match(/\d+/)![0])}, 100%, 30%)`;

          points.forEach((intersection, i) => {
            const x = intersection.point.x * cellSize + gridOffset.x;
            const y = intersection.point.y * cellSize + gridOffset.y;

            // Draw point
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw point number
            ctx.fillStyle = "black";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((i + 1).toString(), x, y);

            // Draw wall number
            ctx.fillStyle = "white";
            ctx.font = "bold 8px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const wallText = `W${wallIndex + 1}`;
            ctx.fillText(wallText, x, y + 15);
          });
        },
      );
    }

    ctx.restore();
  };

  // Public methods for coordinate conversions
  const getGridIntersectionFromMouse = (
    clientX: number,
    clientY: number,
  ): Position => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate actual position considering zoom and pan
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (mouseX / rect.width) * canvas.width;
    const canvasY = (mouseY / rect.height) * canvas.height;

    // Apply pan transformation
    const transformedX = canvasX;
    const transformedY = canvasY;

    const { gridOffset } = mapData;
    const cellSize = getCellSize();

    // Calculate the nearest grid intersection point
    const gridX = Math.round((transformedX - gridOffset.x) / cellSize);
    const gridY = Math.round((transformedY - gridOffset.y) / cellSize);

    return { x: gridX, y: gridY };
  };

  const getGridPositionFromMouse = (
    clientX: number,
    clientY: number,
  ): Position | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate actual position considering zoom and pan
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (mouseX / rect.width) * canvas.width;
    const canvasY = (mouseY / rect.height) * canvas.height;

    // Apply zoom and pan transformation
    const transformedX = canvasX;
    const transformedY = canvasY;

    const { gridOffset } = mapData;
    const cellSize = getCellSize();

    // Check if click is within the grid
    if (
      transformedX < gridOffset.x ||
      transformedY < gridOffset.y ||
      transformedX > gridOffset.x + mapData.gridSize.width * cellSize ||
      transformedY > gridOffset.y + mapData.gridSize.height * cellSize ||
      transformedX > canvas.width - gridOffset.right ||
      transformedY > canvas.height - gridOffset.bottom
    ) {
      return null;
    }

    const gridX = Math.floor((transformedX - gridOffset.x) / cellSize);
    const gridY = Math.floor((transformedY - gridOffset.y) / cellSize);

    return { x: gridX, y: gridY };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Update mouse position for temporary wall preview
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Check for wall hover effect
    handleMouseMoveOverWalls(event.clientX, event.clientY);

    // Handle player dragging in calculator mode
    if (!isAdminMode && draggingPlayer) {
      const gridPosition = getGridPositionFromMouse(
        event.clientX,
        event.clientY,
      );
      if (gridPosition) {
        setDragPosition(gridPosition);
      }
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAdminMode) return; // No dragging in admin mode

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (mouseX / rect.width) * canvas.width;
    const canvasY = (mouseY / rect.height) * canvas.height;

    const { gridOffset } = mapData;
    const cellSize = getCellSize();
    const startX = gridOffset.x;
    const startY = gridOffset.y;

    // Check if clicked on orange player first (orange appears on top)
    if (
      orangePlayer &&
      isPointInPlayer(
        { x: canvasX, y: canvasY },
        orangePlayer,
        startX,
        startY,
        cellSize,
      )
    ) {
      setDraggingPlayer("orange");
      setDragPosition(orangePlayer.position);
      event.preventDefault();
      return;
    }

    // Then check if clicked on blue player
    if (
      bluePlayer &&
      isPointInPlayer(
        { x: canvasX, y: canvasY },
        bluePlayer,
        startX,
        startY,
        cellSize,
      )
    ) {
      setDraggingPlayer("blue");
      setDragPosition(bluePlayer.position);
      event.preventDefault();
      return;
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // If we were dragging a player
    if (draggingPlayer && dragPosition && !isAdminMode) {
      if (draggingPlayer === "blue" && setBluePlayer) {
        setBluePlayer({
          position: dragPosition,
          team: "blue",
        });

        // Reset line of sight result
        if (setHasLos) setHasLos(null);
      } else if (draggingPlayer === "orange" && setOrangePlayer) {
        setOrangePlayer({
          position: dragPosition,
          team: "orange",
        });

        // Reset line of sight result
        if (setHasLos) setHasLos(null);
      }

      setDraggingPlayer(null);
      setDragPosition(null);
    } else {
      // Handle normal click if we weren't dragging
      handleCanvasClick(event);
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setDraggingPlayer(null);
    setDragPosition(null);
    setHoveredWallIndex(null);
    setHoveredWallType(null);
  };

  // Handle canvas click but check if we're dragging first
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Skip if we were dragging (prevents accidental clicks after drag)
    if (draggingPlayer) return;

    // If in admin mode, handle wall placement or selection
    if (isAdminMode) {
      // FIX: Don't re-select the wall if it's already selected - prevents update loop
      // Check if we clicked on an existing wall
      if (wallStart === null) {
        // Check main walls first
        const mainWallIndex = getWallIndexAtPoint(
          event.clientX,
          event.clientY,
          WallType.MAIN,
        );

        if (mainWallIndex !== null) {
          // Select the main wall only if it's not already selected or deselect if clicking the same wall
          if (
            mainWallIndex === selectedWallIndex &&
            selectedWallType === WallType.MAIN
          ) {
            setSelectedWallIndex(null);
            setSelectedWallType(null);
          } else {
            setSelectedWallIndex(mainWallIndex);
            setSelectedWallType(WallType.MAIN);
          }
          return;
        }

        // Check red walls
        const redWallIndex = getWallIndexAtPoint(
          event.clientX,
          event.clientY,
          WallType.RED,
        );

        if (redWallIndex !== null) {
          // Select the red wall only if it's not already selected or deselect if clicking the same wall
          if (
            redWallIndex === selectedWallIndex &&
            selectedWallType === WallType.RED
          ) {
            setSelectedWallIndex(null);
            setSelectedWallType(null);
          } else {
            setSelectedWallIndex(redWallIndex);
            setSelectedWallType(WallType.RED);
          }
          return;
        }

        // Check orange walls
        const orangeWallIndex = getWallIndexAtPoint(
          event.clientX,
          event.clientY,
          WallType.ORANGE,
        );

        if (orangeWallIndex !== null) {
          // Select the orange wall only if it's not already selected or deselect if clicking the same wall
          if (
            orangeWallIndex === selectedWallIndex &&
            selectedWallType === WallType.ORANGE
          ) {
            setSelectedWallIndex(null);
            setSelectedWallType(null);
          } else {
            setSelectedWallIndex(orangeWallIndex);
            setSelectedWallType(WallType.ORANGE);
          }
          return;
        }

        // Check windows
        const windowIndex = getWallIndexAtPoint(
          event.clientX,
          event.clientY,
          WallType.WINDOW,
        );

        if (windowIndex !== null) {
          // Select the window only if it's not already selected or deselect if clicking the same wall
          if (
            windowIndex === selectedWallIndex &&
            selectedWallType === WallType.WINDOW
          ) {
            setSelectedWallIndex(null);
            setSelectedWallType(null);
          } else {
            setSelectedWallIndex(windowIndex);
            setSelectedWallType(WallType.WINDOW);
          }
          return;
        }
      }

      // If we didn't click on a wall, or if we're in the middle of creating a wall,
      // proceed with wall creation
      const intersectionPos = getGridIntersectionFromMouse(
        event.clientX,
        event.clientY,
      );

      // Deselect any selected wall when starting a new wall
      if (wallStart === null) {
        setSelectedWallIndex(null);
        setSelectedWallType(null);
      }

      onCanvasClick({
        ...event,
        gridIntersection: intersectionPos,
      });
    } else {
      // If in player mode

      // First check if we clicked on a breakable wall
      if (hoveredWallType && hoveredWallIndex !== null) {
        // Toggle the breakable wall on/off
        toggleBreakableWall(hoveredWallType, hoveredWallIndex);
        return;
      }

      // If not clicking a breakable wall, handle player placement
      const gridPosition = getGridPositionFromMouse(
        event.clientX,
        event.clientY,
      );
      if (gridPosition) {
        onCanvasClick({
          ...event,
          gridPosition,
        });
      }
    }
  };

  return (
    <div className="canvas-wrapper">
      <div
        className="canvas-container"
        style={{
          width: `${zoomLevel}%`,
          transformOrigin: "top left",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          width={imageDimensions.width}
          height={imageDimensions.height}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: isAdminMode
              ? wallStart
                ? "crosshair"
                : "pointer"
              : hoveredWallType !== null
                ? "pointer"
                : draggingPlayer
                  ? "grabbing"
                  : "pointer",
          }}
        />
        <div className="drag-tooltip">
          {isAdminMode
            ? wallStart
              ? "Click to place the end point of the wall"
              : `Click to place walls (${currentWallType}) or select an existing wall to edit`
            : "Click breakable walls to toggle them, or drag players to move them"}
        </div>
      </div>

      <div className="zoom-controls">
        <button onClick={zoomOut} title="Zoom Out">
          <span>−</span>
        </button>
        <button onClick={resetZoom} title="Reset Zoom">
          {zoomLevel}%
        </button>
        <button onClick={zoomIn} title="Zoom In">
          <span>+</span>
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;
