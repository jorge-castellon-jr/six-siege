// src/components/AdminPanel.tsx - fixed update loop
import React, { useState, useEffect } from "react";
import { MapData, Position, Wall, WallType } from "../types";

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
    type: WallType; // Added wall type
  };
  setCurrentWallProps: React.Dispatch<
    React.SetStateAction<{
      thickness: number;
      offset: number;
      startExtension: number;
      endExtension: number;
      type: WallType; // Added wall type
    }>
  >;
  selectedWallIndex: number | null;
  selectedWallType: WallType | null;
  setSelectedWallIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedWallType: React.Dispatch<React.SetStateAction<WallType | null>>;
  updateWall: (index: number, type: WallType, props: Partial<Wall>) => void;
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
  selectedWallType,
  setSelectedWallIndex,
  setSelectedWallType,
  updateWall,
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
  // FIX: Added proper dependency array and condition to prevent infinite updates
  useEffect(() => {
    if (selectedWallIndex !== null && selectedWallType !== null) {
      let selectedWall: Wall | undefined;

      switch (selectedWallType) {
        case WallType.MAIN:
          selectedWall = mapData.walls[selectedWallIndex];
          break;
        case WallType.RED:
          selectedWall = mapData.redWalls?.[selectedWallIndex];
          break;
        case WallType.ORANGE:
          selectedWall = mapData.orangeWalls?.[selectedWallIndex];
          break;
        case WallType.WINDOW:
          selectedWall = mapData.windows?.[selectedWallIndex];
          break;
      }

      if (
        selectedWall &&
        (selectedWall.thickness !== currentWallProps.thickness ||
          selectedWall.offset !== currentWallProps.offset ||
          selectedWall.startExtension !== currentWallProps.startExtension ||
          selectedWall.endExtension !== currentWallProps.endExtension ||
          selectedWallType !== currentWallProps.type)
      ) {
        setCurrentWallProps({
          thickness: selectedWall.thickness,
          offset: selectedWall.offset,
          startExtension: selectedWall.startExtension,
          endExtension: selectedWall.endExtension,
          type: selectedWallType,
        });
      }
    }
  }, [
    selectedWallIndex,
    selectedWallType,
    mapData.walls,
    mapData.redWalls,
    mapData.orangeWalls,
    mapData.windows,
  ]);

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

  // Rest of the AdminPanel component remains the same...
  // ... (continuing with the rest of the code)

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
    property:
      | "thickness"
      | "offset"
      | "startExtension"
      | "endExtension"
      | "type",
    value: number | WallType,
  ) => {
    setCurrentWallProps((prev) => ({
      ...prev,
      [property]: value,
    }));

    // If a wall is selected, also update its properties
    if (selectedWallIndex !== null && selectedWallType !== null) {
      if (property !== "type") {
        // Don't change the type of an existing wall
        updateWall(selectedWallIndex, selectedWallType, {
          [property]: value,
        } as Partial<Wall>);
      }
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

  // Remove the last wall of the current type
  const removeLastWall = () => {
    const wallType = currentWallProps.type;
    let wallArray: Wall[] = [];

    switch (wallType) {
      case WallType.MAIN:
        wallArray = mapData.walls;
        break;
      case WallType.RED:
        wallArray = mapData.redWalls || [];
        break;
      case WallType.ORANGE:
        wallArray = mapData.orangeWalls || [];
        break;
      case WallType.WINDOW:
        wallArray = mapData.windows || [];
        break;
    }

    if (wallArray.length === 0) return;

    // Create a deep copy of mapData
    const updatedMapData = { ...mapData };

    // Update the appropriate wall array
    switch (wallType) {
      case WallType.MAIN:
        updatedMapData.walls = wallArray.slice(0, -1);
        if (
          selectedWallIndex === wallArray.length - 1 &&
          selectedWallType === WallType.MAIN
        ) {
          setSelectedWallIndex(null);
          setSelectedWallType(null);
        }
        break;
      case WallType.RED:
        updatedMapData.redWalls = wallArray.slice(0, -1);
        if (
          selectedWallIndex === wallArray.length - 1 &&
          selectedWallType === WallType.RED
        ) {
          setSelectedWallIndex(null);
          setSelectedWallType(null);
        }
        break;
      case WallType.ORANGE:
        updatedMapData.orangeWalls = wallArray.slice(0, -1);
        if (
          selectedWallIndex === wallArray.length - 1 &&
          selectedWallType === WallType.ORANGE
        ) {
          setSelectedWallIndex(null);
          setSelectedWallType(null);
        }
        break;
      case WallType.WINDOW:
        updatedMapData.windows = wallArray.slice(0, -1);
        if (
          selectedWallIndex === wallArray.length - 1 &&
          selectedWallType === WallType.WINDOW
        ) {
          setSelectedWallIndex(null);
          setSelectedWallType(null);
        }
        break;
    }

    setMapData(updatedMapData);
  };

  // Remove selected wall
  const removeSelectedWall = () => {
    if (selectedWallIndex === null || selectedWallType === null) return;

    // Create a deep copy of mapData
    const updatedMapData = { ...mapData };

    // Remove the wall from the appropriate array
    switch (selectedWallType) {
      case WallType.MAIN:
        const updatedMainWalls = [...mapData.walls];
        updatedMainWalls.splice(selectedWallIndex, 1);
        updatedMapData.walls = updatedMainWalls;
        break;
      case WallType.RED:
        if (mapData.redWalls) {
          const updatedRedWalls = [...mapData.redWalls];
          updatedRedWalls.splice(selectedWallIndex, 1);
          updatedMapData.redWalls = updatedRedWalls;
        }
        break;
      case WallType.ORANGE:
        if (mapData.orangeWalls) {
          const updatedOrangeWalls = [...mapData.orangeWalls];
          updatedOrangeWalls.splice(selectedWallIndex, 1);
          updatedMapData.orangeWalls = updatedOrangeWalls;
        }
        break;
      case WallType.WINDOW:
        if (mapData.windows) {
          const updatedWindows = [...mapData.windows];
          updatedWindows.splice(selectedWallIndex, 1);
          updatedMapData.windows = updatedWindows;
        }
        break;
    }

    setMapData(updatedMapData);
    setSelectedWallIndex(null);
    setSelectedWallType(null);
  };

  // Get the color class for a wall type button
  const getWallTypeButtonClass = (type: WallType) => {
    if (type === currentWallProps.type) {
      switch (type) {
        case WallType.MAIN:
          return "selected-walltype main-wall-btn";
        case WallType.RED:
          return "selected-walltype red-wall-btn";
        case WallType.ORANGE:
          return "selected-walltype orange-wall-btn";
        case WallType.WINDOW:
          return "selected-walltype window-wall-btn";
      }
    }

    switch (type) {
      case WallType.MAIN:
        return "main-wall-btn";
      case WallType.RED:
        return "red-wall-btn";
      case WallType.ORANGE:
        return "orange-wall-btn";
      case WallType.WINDOW:
        return "window-wall-btn";
    }
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
        <h3>Wall Type</h3>
        <div className="wall-type-selection">
          <button
            className={getWallTypeButtonClass(WallType.MAIN)}
            onClick={() => handleWallPropChange("type", WallType.MAIN)}
          >
            Main Wall
          </button>
          <button
            className={getWallTypeButtonClass(WallType.RED)}
            onClick={() => handleWallPropChange("type", WallType.RED)}
          >
            Red Wall
          </button>
          <button
            className={getWallTypeButtonClass(WallType.ORANGE)}
            onClick={() => handleWallPropChange("type", WallType.ORANGE)}
          >
            Orange Wall
          </button>
          <button
            className={getWallTypeButtonClass(WallType.WINDOW)}
            onClick={() => handleWallPropChange("type", WallType.WINDOW)}
          >
            Window
          </button>
        </div>
      </div>

      <div className="control-group">
        <h3>Wall Properties</h3>

        {selectedWallIndex !== null && selectedWallType !== null && (
          <div
            className={`selected-wall-info ${selectedWallType.toLowerCase()}-wall-selected`}
          >
            <div className="selected-wall-header">
              <h4>
                Editing {selectedWallType} Wall #{selectedWallIndex + 1}
              </h4>
              <button
                onClick={() => {
                  setSelectedWallIndex(null);
                  setSelectedWallType(null);
                }}
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
          {selectedWallIndex !== null && selectedWallType !== null ? (
            <strong>
              Editing {selectedWallType} Wall #{selectedWallIndex + 1} - Use the
              sliders to adjust properties
            </strong>
          ) : wallStart ? (
            `Click to place the end point of the ${currentWallProps.type} wall`
          ) : (
            `Click to place the start point of a ${currentWallProps.type} wall or click an existing wall to edit it`
          )}
        </div>
      </div>

      <div className="control-group">
        <h3>Wall Actions</h3>
        <div className="action-buttons">
          <button onClick={saveMapData} id="copy-button">
            Save Map Data
          </button>
          <button onClick={removeLastWall}>Undo Last Wall</button>
          {selectedWallIndex !== null && selectedWallType !== null && (
            <button onClick={removeSelectedWall} className="delete-button">
              Delete Selected Wall
            </button>
          )}
          <button
            onClick={() => {
              const updatedMapData = { ...mapData };
              switch (currentWallProps.type) {
                case WallType.MAIN:
                  updatedMapData.walls = [];
                  break;
                case WallType.RED:
                  updatedMapData.redWalls = [];
                  break;
                case WallType.ORANGE:
                  updatedMapData.orangeWalls = [];
                  break;
                case WallType.WINDOW:
                  updatedMapData.windows = [];
                  break;
              }
              setMapData(updatedMapData);
              setSelectedWallIndex(null);
              setSelectedWallType(null);
            }}
          >
            Clear {currentWallProps.type} Walls
          </button>
        </div>

        {/* Wall lists */}
        {currentWallProps.type === WallType.MAIN &&
          mapData.walls.length > 0 && (
            <div className="wall-list">
              <h4>Main Walls:</h4>
              <div className="wall-buttons">
                {mapData.walls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedWallIndex(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.MAIN
                          ? null
                          : index,
                      );
                      setSelectedWallType(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.MAIN
                          ? null
                          : WallType.MAIN,
                      );
                    }}
                    className={`wall-button ${index === selectedWallIndex && selectedWallType === WallType.MAIN ? "selected-wall" : ""}`}
                  >
                    Wall #{index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

        {currentWallProps.type === WallType.RED &&
          mapData.redWalls &&
          mapData.redWalls.length > 0 && (
            <div className="wall-list">
              <h4>Red Walls:</h4>
              <div className="wall-buttons">
                {mapData.redWalls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedWallIndex(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.RED
                          ? null
                          : index,
                      );
                      setSelectedWallType(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.RED
                          ? null
                          : WallType.RED,
                      );
                    }}
                    className={`wall-button ${index === selectedWallIndex && selectedWallType === WallType.RED ? "selected-wall" : ""}`}
                  >
                    Wall #{index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

        {currentWallProps.type === WallType.ORANGE &&
          mapData.orangeWalls &&
          mapData.orangeWalls.length > 0 && (
            <div className="wall-list">
              <h4>Orange Walls:</h4>
              <div className="wall-buttons">
                {mapData.orangeWalls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedWallIndex(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.ORANGE
                          ? null
                          : index,
                      );
                      setSelectedWallType(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.ORANGE
                          ? null
                          : WallType.ORANGE,
                      );
                    }}
                    className={`wall-button ${index === selectedWallIndex && selectedWallType === WallType.ORANGE ? "selected-wall" : ""}`}
                  >
                    Wall #{index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

        {currentWallProps.type === WallType.WINDOW &&
          mapData.windows &&
          mapData.windows.length > 0 && (
            <div className="wall-list">
              <h4>Windows:</h4>
              <div className="wall-buttons">
                {mapData.windows.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedWallIndex(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.WINDOW
                          ? null
                          : index,
                      );
                      setSelectedWallType(
                        index === selectedWallIndex &&
                          selectedWallType === WallType.WINDOW
                          ? null
                          : WallType.WINDOW,
                      );
                    }}
                    className={`wall-button ${index === selectedWallIndex && selectedWallType === WallType.WINDOW ? "selected-wall" : ""}`}
                  >
                    Window #{index + 1}
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
          <div>
            Use the wall type selector to switch between different wall types.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
