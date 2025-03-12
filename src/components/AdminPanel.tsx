// src/components/AdminPanel.tsx
import React, { useRef, useState, useEffect } from "react";
import { MapData, Position, Wall } from "../types";

interface AdminPanelProps {
  mapData: MapData;
  setMapData: React.Dispatch<React.SetStateAction<MapData>>;
  wallStart: Position | null;
  setWallStart: React.Dispatch<React.SetStateAction<Position | null>>;
  imageDimensions: { width: number; height: number };
  currentWallProps: {
    thickness: number;
    offset: number;
    startExtension: number;
    endExtension: number;
  };
  setCurrentWallProps: React.Dispatch<
    React.SetStateAction<{
      thickness: number;
      offset: number;
      startExtension: number;
      endExtension: number;
    }>
  >;
  selectedWallIndex: number | null;
  setSelectedWallIndex: React.Dispatch<React.SetStateAction<number | null>>;
  updateWall: (index: number, props: Partial<Wall>) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  mapData,
  setMapData,
  wallStart,
  setWallStart,
  imageDimensions,
  currentWallProps,
  setCurrentWallProps,
  selectedWallIndex,
  setSelectedWallIndex,
  updateWall,
}) => {
  const mapImageInputRef = useRef<HTMLInputElement>(null);
  const mapDataInputRef = useRef<HTMLInputElement>(null);
  const [calculatedCellSize, setCalculatedCellSize] = useState<{
    width: number;
    height: number;
  }>({ width: 40, height: 40 });

  // Calculate cell size whenever relevant parameters change
  useEffect(() => {
    calculateCellSize();
  }, [mapData.gridSize, mapData.gridOffset, imageDimensions]);

  // Calculate cell size based on image dimensions, grid dimensions, and offset
  const calculateCellSize = () => {
    // Available width is the image width minus left and right offsets
    const availableWidth =
      imageDimensions.width - mapData.gridOffset.x - mapData.gridOffset.right;

    // Available height is the image height minus top and bottom offsets
    const availableHeight =
      imageDimensions.height - mapData.gridOffset.y - mapData.gridOffset.bottom;

    const cellWidth =
      mapData.gridSize.width > 0 ? availableWidth / mapData.gridSize.width : 40;

    const cellHeight =
      mapData.gridSize.height > 0
        ? availableHeight / mapData.gridSize.height
        : 40;

    setCalculatedCellSize({ width: cellWidth, height: cellHeight });
  };

  // Function to load a custom map image
  const loadMapImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name;

    // Set the path for the image
    const imagePath = `src/assets/${fileName}`;

    // Update the map data with the new image path
    setMapData((prevData) => ({
      ...prevData,
      imagePath,
    }));

    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  // Handle grid size change
  const handleGridSizeChange = (
    dimension: "width" | "height",
    value: number,
  ) => {
    setMapData({
      ...mapData,
      gridSize: {
        ...mapData.gridSize,
        [dimension]: value,
      },
    });
  };

  // Handle grid offset change
  const handleGridOffsetChange = (
    side: "x" | "y" | "right" | "bottom",
    value: number,
  ) => {
    setMapData({
      ...mapData,
      gridOffset: {
        ...mapData.gridOffset,
        [side]: value,
      },
    });
  };

  // Handle wall property changes for new walls
  const handleWallPropChange = (
    property: "thickness" | "offset" | "startExtension" | "endExtension",
    value: number,
  ) => {
    setCurrentWallProps((prev) => ({
      ...prev,
      [property]: value,
    }));

    // If a wall is selected, also update its properties
    if (selectedWallIndex !== null) {
      updateWall(selectedWallIndex, {
        [property]: value,
      } as Partial<Wall>);
    }
  };

  // Save map data to JSON
  const saveMapData = () => {
    // Create a copy of mapData that includes the calculated cell size
    const dataToSave = {
      ...mapData,
      // We'll save the average of width and height if they differ
      cellSize: (calculatedCellSize.width + calculatedCellSize.height) / 2,
    };

    const dataStr = JSON.stringify(dataToSave, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${mapData.name.toLowerCase().replace(/\s+/g, "-")}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Load map data from JSON
  const loadMapData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;

    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (e) => {
      if (!e.target?.result) return;

      try {
        const data = JSON.parse(e.target.result as string) as MapData;

        // Ensure we have an imagePath property
        if (!data.imagePath) {
          data.imagePath = "";
        }

        // Ensure all walls have the new properties
        const updatedWalls = data.walls.map((wall) => ({
          start: wall.start,
          end: wall.end,
          thickness: wall.thickness ?? 0.2,
          offset: wall.offset ?? 0,
          startExtension: wall.startExtension ?? 0,
          endExtension: wall.endExtension ?? 0,
        }));

        setMapData({
          ...data,
          walls: updatedWalls,
        });
        setWallStart(null);
        setSelectedWallIndex(null);
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("Failed to load map data. Invalid JSON format.");
      }
    };

    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  // Remove the last wall (undo in admin mode)
  const removeLastWall = () => {
    if (mapData.walls.length === 0) return;

    setMapData({
      ...mapData,
      walls: mapData.walls.slice(0, -1),
    });

    if (selectedWallIndex === mapData.walls.length - 1) {
      setSelectedWallIndex(null);
    }
  };

  // Remove selected wall
  const removeSelectedWall = () => {
    if (selectedWallIndex === null) return;

    const updatedWalls = [...mapData.walls];
    updatedWalls.splice(selectedWallIndex, 1);

    setMapData({
      ...mapData,
      walls: updatedWalls,
    });

    setSelectedWallIndex(null);
  };

  return (
    <div className="admin-controls">
      <div className="control-group">
        <h3>Map Settings</h3>
        <input
          type="text"
          value={mapData.name}
          onChange={(e) => setMapData({ ...mapData, name: e.target.value })}
          placeholder="Map Name"
          className="text-input"
        />

        <input
          type="text"
          value={mapData.imagePath}
          onChange={(e) =>
            setMapData({ ...mapData, imagePath: e.target.value })
          }
          placeholder="Image Path (src/assets/image.jpg)"
          className="text-input"
        />

        <label className="file-input">
          Load Map Image
          <input
            type="file"
            accept="image/*"
            onChange={loadMapImage}
            ref={mapImageInputRef}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div className="control-group">
        <h3>Grid Settings</h3>

        <div className="grid-info">
          <span>
            Calculated Cell Size:
            {calculatedCellSize.width.toFixed(1)} ×{" "}
            {calculatedCellSize.height.toFixed(1)} pixels
          </span>
        </div>

        <div className="grid-controls">
          <div className="input-group">
            <label>Columns:</label>
            <input
              type="number"
              value={mapData.gridSize.width}
              onChange={(e) =>
                handleGridSizeChange("width", parseInt(e.target.value) || 20)
              }
              min="2"
            />
          </div>

          <div className="input-group">
            <label>Rows:</label>
            <input
              type="number"
              value={mapData.gridSize.height}
              onChange={(e) =>
                handleGridSizeChange("height", parseInt(e.target.value) || 20)
              }
              min="2"
            />
          </div>
        </div>

        <div className="grid-controls">
          <div className="input-group">
            <label>Left Offset:</label>
            <input
              type="number"
              value={mapData.gridOffset.x}
              onChange={(e) =>
                handleGridOffsetChange("x", parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div className="input-group">
            <label>Right Offset:</label>
            <input
              type="number"
              value={mapData.gridOffset.right}
              onChange={(e) =>
                handleGridOffsetChange("right", parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>
        </div>

        <div className="grid-controls">
          <div className="input-group">
            <label>Top Offset:</label>
            <input
              type="number"
              value={mapData.gridOffset.y}
              onChange={(e) =>
                handleGridOffsetChange("y", parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div className="input-group">
            <label>Bottom Offset:</label>
            <input
              type="number"
              value={mapData.gridOffset.bottom}
              onChange={(e) =>
                handleGridOffsetChange("bottom", parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="control-group">
        <h3>Wall Properties</h3>
        <div className="grid-controls">
          <div className="input-group">
            <label>Thickness:</label>
            <input
              type="number"
              value={currentWallProps.thickness}
              onChange={(e) =>
                handleWallPropChange(
                  "thickness",
                  parseFloat(e.target.value) || 0.2,
                )
              }
              min="0.05"
              max="1"
              step="0.05"
            />
          </div>

          <div className="input-group">
            <label>Offset:</label>
            <input
              type="number"
              value={currentWallProps.offset}
              onChange={(e) =>
                handleWallPropChange("offset", parseFloat(e.target.value) || 0)
              }
              min="-1"
              max="1"
              step="0.1"
            />
          </div>
        </div>

        <div className="grid-controls">
          <div className="input-group">
            <label>Start Extension:</label>
            <input
              type="number"
              value={currentWallProps.startExtension}
              onChange={(e) =>
                handleWallPropChange(
                  "startExtension",
                  parseFloat(e.target.value) || 0,
                )
              }
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          <div className="input-group">
            <label>End Extension:</label>
            <input
              type="number"
              value={currentWallProps.endExtension}
              onChange={(e) =>
                handleWallPropChange(
                  "endExtension",
                  parseFloat(e.target.value) || 0,
                )
              }
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        </div>

        <div className="instructions">
          {selectedWallIndex !== null
            ? `Editing Wall #${selectedWallIndex + 1} - Click elsewhere to deselect`
            : wallStart
              ? "Click to place the end point of the wall"
              : "Click to place the start point of a wall"}
        </div>
      </div>

      <div className="control-group">
        <h3>Wall Actions</h3>
        <div className="action-buttons">
          <button onClick={saveMapData}>Save Map Data</button>
          <label className="file-input">
            Load Map Data
            <input
              type="file"
              accept=".json"
              onChange={loadMapData}
              ref={mapDataInputRef}
              style={{ display: "none" }}
            />
          </label>
          <button onClick={removeLastWall}>Undo Last Wall</button>
          {selectedWallIndex !== null && (
            <button onClick={removeSelectedWall}>Delete Selected Wall</button>
          )}
          <button
            onClick={() => {
              setMapData({ ...mapData, walls: [] });
              setSelectedWallIndex(null);
            }}
          >
            Clear All Walls
          </button>
        </div>
        <div className="instructions">
          <div>Click two points to create a wall between them.</div>
          <div>
            Click on an existing wall to select and edit its properties.
          </div>
          <div className="zoom-info">
            Pan: <kbd>Middle-click</kbd> or <kbd>Alt + Left-click</kbd> and drag
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
