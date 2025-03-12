// src/components/GameCanvas.tsx
import React, { useState, useEffect, useRef } from "react";
import { Position, Player, MapData } from "../types";

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
}) => {
  // State for zoom level
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  // State for image
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageDimensions, setLocalImageDimensions] = useState({
    width: 800,
    height: 600,
  });

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
    // If cellSize is defined in mapData, use that
    if (mapData.cellSize) {
      return mapData.cellSize;
    }

    // Otherwise calculate it based on grid dimensions
    return calculateCellSize();
  };

  // Load or update the map image when the path changes
  useEffect(() => {
    if (!mapData.imagePath) {
      setImageLoaded(true);
      return;
    }

    const img = new Image();
    img.src = mapData.imagePath;

    img.onload = () => {
      setMapImage(img);
      const dimensions = { width: img.width, height: img.height };
      setLocalImageDimensions(dimensions);

      // Notify parent component of image dimensions if callback provided
      if (setImageDimensions) {
        setImageDimensions(dimensions);
      }

      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${mapData.imagePath}`);
      setImageLoaded(true);
    };
  }, [mapData.imagePath, setImageDimensions]);

  // Update canvas dimensions based on container
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateCanvasDimensions = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas dimensions based on image or default
      if (mapImage) {
        canvas.width = mapImage.width;
        canvas.height = mapImage.height;
        setLocalImageDimensions({
          width: mapImage.width,
          height: mapImage.height,
        });
      } else {
        canvas.width = imageDimensions.width;
        canvas.height = imageDimensions.height;
      }

      // Draw the canvas content
      renderCanvas();
    };

    updateCanvasDimensions();

    // Update canvas when window resizes
    window.addEventListener("resize", updateCanvasDimensions);
    return () => window.removeEventListener("resize", updateCanvasDimensions);
  }, [mapImage, imageLoaded, imageDimensions]);

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
    zoomLevel,
    panOffset,
    mapImage,
  ]);

  // Render the canvas content
  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformation
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw background image if available
    if (mapImage) {
      ctx.drawImage(
        mapImage,
        0,
        0,
        canvas.width / zoomLevel,
        canvas.height / zoomLevel,
      );
    } else {
      // Black background if no image
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width / zoomLevel, canvas.height / zoomLevel);
    }

    const { gridSize, gridOffset } = mapData;
    const cellSize = getCellSize();

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 / zoomLevel; // Adjust line width for zoom

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

    // Draw walls between grid intersections
    ctx.strokeStyle = "#ff5252";
    ctx.lineWidth = 3 / zoomLevel; // Adjust line width for zoom

    for (const wall of mapData.walls) {
      const x1 = startX + wall.start.x * cellSize;
      const y1 = startY + wall.start.y * cellSize;
      const x2 = startX + wall.end.x * cellSize;
      const y2 = startY + wall.end.y * cellSize;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw temporary wall being created (also at grid intersection)
    if (isAdminMode && wallStart) {
      const mouseX = startX + wallStart.x * cellSize;
      const mouseY = startY + wallStart.y * cellSize;

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 5 / zoomLevel, 0, Math.PI * 2);
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
      ctx.lineWidth = 2 / zoomLevel;
      ctx.stroke();
    }

    if (orangePlayer) {
      const x = startX + orangePlayer.position.x * cellSize + cellSize / 2;
      const y = startY + orangePlayer.position.y * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ff7f50";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2 / zoomLevel;
      ctx.stroke();
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
      ctx.lineWidth = 2 / zoomLevel;
      ctx.stroke();
    }

    // Add grid coordinates when zoomed in for precise placement
    if (zoomLevel >= 2) {
      ctx.font = `${12 / zoomLevel}px Arial`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "center";

      for (let x = 0; x <= gridSize.width; x++) {
        for (let y = 0; y <= gridSize.height; y++) {
          const posX = startX + x * cellSize;
          const posY = startY + y * cellSize;
          ctx.fillText(`${x},${y}`, posX, posY - 5 / zoomLevel);
        }
      }
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

    // Apply zoom and pan transformation
    const transformedX = (canvasX - panOffset.x) / zoomLevel;
    const transformedY = (canvasY - panOffset.y) / zoomLevel;

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
    const transformedX = (canvasX - panOffset.x) / zoomLevel;
    const transformedY = (canvasY - panOffset.y) / zoomLevel;

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

  // Handle canvas mouse events for panning
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      // Middle button or Alt+Left click for panning
      setIsDragging(true);
      setDragStart({
        x: event.clientX,
        y: event.clientY,
      });
      event.preventDefault();
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;

      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      setDragStart({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle zoom in/out
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5)); // Max zoom 5x
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5)); // Min zoom 0.5x
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle canvas click but check if we're dragging first
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    // If in admin mode, handle wall placement
    if (isAdminMode) {
      const intersectionPos = getGridIntersectionFromMouse(
        event.clientX,
        event.clientY,
      );

      if (wallStart === null) {
        // Start new wall at the grid intersection
        onCanvasClick({
          ...event,
          gridIntersection: intersectionPos,
        });
      } else {
        // Complete wall between intersections
        onCanvasClick({
          ...event,
          gridIntersection: intersectionPos,
        });
      }
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
      <div className="zoom-controls">
        <button onClick={zoomIn} title="Zoom In">
          +
        </button>
        <button onClick={resetZoom} title="Reset Zoom">
          {Math.round(zoomLevel * 100)}%
        </button>
        <button onClick={zoomOut} title="Zoom Out">
          -
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={imageDimensions.width}
        height={imageDimensions.height}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isDragging
            ? "grabbing"
            : isAdminMode
              ? "crosshair"
              : "pointer",
        }}
      />
    </div>
  );
};

export default GameCanvas;
