// src/components/AdminPanel.tsx
import React, { useState, useEffect } from "react";
import { MapData, Position, Wall } from "../types";

interface AdminPanelProps {
  mapData: MapData;
  setMapData: (data: MapData) => void;
  wallStart: Position | null;
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
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  mapData,
  setMapData,
  wallStart,
  imageDimensions,
  currentWallProps,
  setCurrentWallProps,
  selectedWallIndex,
  setSelectedWallIndex,
  updateWall,
  zoomLevel,
  setZoomLevel,
}) => {
  const [calculatedCellSize, setCalculatedCellSize] = useState<{
    width: number;
    height: number;
  }>({ width: 40, height: 40 });

  // Calculate cell size whenever relevant parameters change
  useEffect(() => {
    calculateCellSize();
  }, [mapData.gridSize, mapData.gridOffset, imageDimensions]);

  // Update current wall properties when a wall is selected
  useEffect(() => {
    if (selectedWallIndex !== null && mapData.walls[selectedWallIndex]) {
      const selectedWall = mapData.walls[selectedWallIndex];
      setCurrentWallProps({
        thickness: selectedWall.thickness,
        offset: selectedWall.offset,
        startExtension: selectedWall.startExtension,
        endExtension: selectedWall.endExtension,
      });
    }
  }, [selectedWallIndex, mapData.walls, setCurrentWallProps]);

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
    copyMapDataToClipboard();
  };

  // Copy map data to clipboard
  const copyMapDataToClipboard = () => {
    const dataStr = JSON.stringify(mapData, null, 2);

    // Use the Clipboard API to copy the data
    navigator.clipboard
      .writeText(dataStr)
      .then(() => {
        // Show temporary success message
        const button = document.getElementById("copy-button");
        if (button) {
          const originalText = button.textContent;
          button.textContent = "Copied! ✓";
          button.style.backgroundColor = "var(--accent-green)";

          // Reset button after 2 seconds
          setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = "";
          }, 2000);
        }
      })
      .catch((err) => {
        console.error("Failed to copy map data: ", err);
        alert("Failed to copy map data to clipboard.");
      });
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
          value={`src/assets/${mapData.id}.jpg`}
          placeholder="Image Path (src/assets/image.jpg)"
          className="text-input"
          disabled
        />
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
      </div>

      <div className="control-group">
        <h3>Zoom Controls</h3>
        <div className="grid-controls">
          <div className="input-group">
            <label>Zoom:</label>
            <input
              type="number"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value) || 100)}
              min="100"
              max="1000"
              step="10"
            />
            <span>%</span>
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="control-group">
        <h3>Wall Properties</h3>

        {selectedWallIndex !== null && (
          <div className="selected-wall-info">
            <div className="selected-wall-header">
              <h4>Editing Wall #{selectedWallIndex + 1}</h4>
              <button
                onClick={() => setSelectedWallIndex(null)}
                className="small-button"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

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
              step="0.01"
            />
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.01"
              value={currentWallProps.thickness}
              onChange={(e) =>
                handleWallPropChange("thickness", parseFloat(e.target.value))
              }
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
              step="0.01"
            />
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={currentWallProps.offset}
              onChange={(e) =>
                handleWallPropChange("offset", parseFloat(e.target.value))
              }
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
              min="-1"
              max="1"
              step="0.01"
            />
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={currentWallProps.startExtension}
              onChange={(e) =>
                handleWallPropChange(
                  "startExtension",
                  parseFloat(e.target.value),
                )
              }
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
              min="-1"
              max="1"
              step="0.01"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentWallProps.endExtension}
              onChange={(e) =>
                handleWallPropChange("endExtension", parseFloat(e.target.value))
              }
            />
          </div>
        </div>

        <div className="instructions">
          {selectedWallIndex !== null ? (
            <strong>
              Editing Wall #{selectedWallIndex + 1} - Use the sliders to adjust
              properties
            </strong>
          ) : wallStart ? (
            "Click to place the end point of the wall"
          ) : (
            "Click to place the start point of a wall or click an existing wall to edit it"
          )}
        </div>
      </div>

      <div className="control-group">
        <h3>Wall Actions</h3>
        <div className="action-buttons">
          <button onClick={saveMapData}>Save Map Data</button>
          <button onClick={removeLastWall}>Undo Last Wall</button>
          {selectedWallIndex !== null && (
            <button onClick={removeSelectedWall} className="delete-button">
              Delete Selected Wall
            </button>
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

        {mapData.walls.length > 0 && (
          <div className="wall-list">
            <h4>Wall List:</h4>
            <div className="wall-buttons">
              {mapData.walls.map((_, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setSelectedWallIndex(
                      index === selectedWallIndex ? null : index,
                    )
                  }
                  className={`wall-button ${index === selectedWallIndex ? "selected-wall" : ""}`}
                >
                  Wall #{index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="instructions">
          <div>Click two points to create a wall between them.</div>
          <div>
            Click on an existing wall to select and edit its properties.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
