// src/components/GameCanvas.tsx
import React, { useState, useEffect, useRef } from "react";
import { Position, Player, MapData, Wall } from "../types";
import { Intersection } from "../utils/lineOfSight";

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
  setSelectedWallIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setBluePlayer?: React.Dispatch<React.SetStateAction<Player | null>>;
  setOrangePlayer?: React.Dispatch<React.SetStateAction<Player | null>>;
  setHasLos?: React.Dispatch<React.SetStateAction<boolean | null>>;
  intersections?: Intersection[]; // New prop for intersection points
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
  setSelectedWallIndex,
  setBluePlayer,
  setOrangePlayer,
  setHasLos,
  intersections,
}) => {
  // State for panning
  const [mousePosition, setMousePosition] = useState<Position | null>(null);
  const [hoveredWallIndex, setHoveredWallIndex] = useState<number | null>(null);

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

  // Ref for the canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    img.src = `./assets/${mapData.id}.jpg`;

    img.onload = () => {
      setMapImage(img);
      const dimensions = { width: img.width, height: img.height };
      setLocalImageDimensions(dimensions);

      // Notify parent component of image dimensions if callback provided
      if (setImageDimensions) {
        setImageDimensions(dimensions);
      }
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${mapData.id}`);
    };
  }, [mapData.id, setImageDimensions]);

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
    mousePosition,
    draggingPlayer,
    dragPosition,
    hoveredWallIndex,
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
    isSelected: boolean = false,
    isHovered: boolean = false,
  ) => {
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

    // Draw the wall as a filled polygon
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();

    // Fill with color
    ctx.fillStyle = isSelected ? "#ff9800" : isHovered ? "#ffcc80" : "#ff5252";
    ctx.fill();

    // Add outline
    ctx.strokeStyle = isSelected
      ? "#ffc107"
      : isHovered
        ? "#ffb74d"
        : "#b71c1c";
    ctx.lineWidth = 1;
    ctx.stroke();

    // If selected, draw the endpoints as circles
    if (isSelected) {
      // Draw start point
      ctx.beginPath();
      ctx.arc(x1, y1, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#4CAF50";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label start point
      ctx.fillStyle = "white";
      ctx.fillText("S", x1, y1 + 3);

      // Draw end point
      ctx.beginPath();
      ctx.arc(x2, y2, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#2196F3";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label end point
      ctx.fillStyle = "white";
      ctx.fillText("E", x2, y2 + 3);

      // Draw midpoint for offset adjustment
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      // Add offset position indicator
      const direction = getNormalizedDirection(
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      );
      const perpendicular = getPerpendicularVector(direction);
      const offsetX = perpendicular.x * wall.offset * cellSize;
      const offsetY = perpendicular.y * wall.offset * cellSize;

      ctx.beginPath();
      ctx.arc(midX + offsetX, midY + offsetY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#9C27B0";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label offset point
      ctx.fillStyle = "white";
      ctx.fillText("O", midX + offsetX, midY + offsetY + 3);
    }
  };

  // Check if mouse is over a wall for hover effect
  const handleMouseMoveOverWalls = (clientX: number, clientY: number) => {
    const index = getWallIndexAtPoint(clientX, clientY);
    setHoveredWallIndex(index);
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

    // Draw walls with new properties
    mapData.walls.forEach((wall, index) => {
      drawWall(
        ctx,
        wall,
        startX,
        startY,
        cellSize,
        index === selectedWallIndex,
        index === hoveredWallIndex,
      );
    });

    // Draw temporary wall being created (also at grid intersection)
    if (isAdminMode && wallStart) {
      const mouseX = startX + wallStart.x * cellSize;
      const mouseY = startY + wallStart.y * cellSize;

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffeb3b";
      ctx.fill();
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

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = hasLos
        ? "rgba(105, 240, 174, 0.9)"
        : "rgba(255, 82, 82, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Draw intersection points if available
    if (intersections && intersections.length > 0) {
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

  // Check if a mouse click hits a wall
  const getWallIndexAtPoint = (
    clientX: number,
    clientY: number,
  ): number | null => {
    if (!canvasRef.current || !isAdminMode) return null;

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

    // Check each wall from last to first (for correct layering/selection)
    for (let i = mapData.walls.length - 1; i >= 0; i--) {
      if (
        isPointInWall(
          { x: transformedX, y: transformedY },
          mapData.walls[i],
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

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Update mouse position for temporary wall preview
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Check for wall hover effect
    if (isAdminMode) {
      handleMouseMoveOverWalls(event.clientX, event.clientY);
    }
    // Handle player dragging in calculator mode
    else if (draggingPlayer) {
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
  };

  // Handle canvas click but check if we're dragging first
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Skip if we were dragging (prevents accidental clicks after drag)
    if (draggingPlayer) return;

    // If in admin mode, handle wall placement or selection
    if (isAdminMode) {
      // Check if we clicked on an existing wall
      const clickedWallIndex = getWallIndexAtPoint(
        event.clientX,
        event.clientY,
      );

      if (clickedWallIndex !== null && wallStart === null) {
        // Select the wall
        setSelectedWallIndex(
          clickedWallIndex === selectedWallIndex ? null : clickedWallIndex,
        );
        return;
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
      }

      onCanvasClick({
        ...event,
        gridIntersection: intersectionPos,
      });
    } else {
      // If in player mode, handle player placement
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
    <div className="canvas-container">
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
            ? "crosshair"
            : draggingPlayer
              ? "grabbing"
              : "pointer",
        }}
      />
    </div>
  );
};

export default GameCanvas;
