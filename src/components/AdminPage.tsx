// src/components/AdminPage.tsx
import React, { useState } from "react";
import { MapData, Position, Wall, AppPage, WallType } from "../types";
import AdminPanel from "./AdminPanel";
import GameCanvas from "./GameCanvas";

interface AdminPageProps {
  maps: MapData[];
  onUpdateMap: (updatedMap: MapData) => void;
  onNavigate: (page: AppPage) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({
  maps,
  onUpdateMap,
  onNavigate,
}) => {
  // State for the active map
  const [activeMapIndex, setActiveMapIndex] = useState<number>(0);

  // Get active map data
  const mapData = maps[activeMapIndex];

  const [imageDimensions, setImageDimensions] = useState({
    width: 800,
    height: 600,
  });

  // State for wall drawing
  const [wallStart, setWallStart] = useState<Position | null>(null);

  // State for current wall properties
  const [currentWallProps, setCurrentWallProps] = useState({
    thickness: 0.18,
    offset: 0,
    startExtension: 0,
    endExtension: 0,
    type: WallType.MAIN,
  });

  // State for selected wall (for editing)
  const [selectedWallIndex, setSelectedWallIndex] = useState<number | null>(
    null,
  );
  const [selectedWallType, setSelectedWallType] = useState<WallType | null>(
    null,
  );

  // State for zoom (now passed to GameCanvas)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Initialize the map data with empty arrays for new wall types if they don't exist
  const ensureWallArraysExist = (map: MapData): MapData => {
    return {
      ...map,
      redWalls: map.redWalls || [],
      orangeWalls: map.orangeWalls || [],
      windows: map.windows || [],
    };
  };

  // Handle canvas click - this is passed to GameCanvas
  const handleCanvasClick = (
    event: React.MouseEvent<HTMLCanvasElement> & {
      gridIntersection?: Position;
      gridPosition?: Position;
    },
  ) => {
    if (event.gridIntersection) {
      const intersectionPos = event.gridIntersection;

      if (wallStart === null) {
        // Start new wall at the grid intersection
        setWallStart(intersectionPos);
      } else {
        // Complete wall between intersections
        const newWall: Wall = {
          start: wallStart,
          end: intersectionPos,
          thickness: currentWallProps.thickness,
          offset: currentWallProps.offset,
          startExtension: currentWallProps.startExtension,
          endExtension: currentWallProps.endExtension,
        };

        // Don't add walls with same start and end
        if (
          wallStart.x !== intersectionPos.x ||
          wallStart.y !== intersectionPos.y
        ) {
          // Ensure the map has all wall arrays
          const updatedMap = ensureWallArraysExist({ ...mapData });

          // Add the wall to the appropriate array based on the selected type
          switch (currentWallProps.type) {
            case WallType.MAIN:
              updatedMap.walls = [...updatedMap.walls, newWall];
              // Select the newly created wall
              setSelectedWallIndex(updatedMap.walls.length - 1);
              setSelectedWallType(WallType.MAIN);
              break;

            case WallType.RED:
              updatedMap.redWalls = [...updatedMap.redWalls!, newWall];
              // Select the newly created wall
              setSelectedWallIndex(updatedMap.redWalls!.length - 1);
              setSelectedWallType(WallType.RED);
              break;

            case WallType.ORANGE:
              updatedMap.orangeWalls = [...updatedMap.orangeWalls!, newWall];
              // Select the newly created wall
              setSelectedWallIndex(updatedMap.orangeWalls!.length - 1);
              setSelectedWallType(WallType.ORANGE);
              break;

            case WallType.WINDOW:
              updatedMap.windows = [...updatedMap.windows!, newWall];
              // Select the newly created wall
              setSelectedWallIndex(updatedMap.windows!.length - 1);
              setSelectedWallType(WallType.WINDOW);
              break;
          }

          onUpdateMap(updatedMap);
        }

        setWallStart(null);
      }
    }
  };

  // Update a wall's properties
  const updateWall = (index: number, type: WallType, props: Partial<Wall>) => {
    if (index < 0) return;

    // Create a deep copy of mapData
    const updatedMap = ensureWallArraysExist({ ...mapData });

    // Get the appropriate wall array
    let wallArray: Wall[] = [];
    switch (type) {
      case WallType.MAIN:
        wallArray = updatedMap.walls;
        break;
      case WallType.RED:
        wallArray = updatedMap.redWalls!;
        break;
      case WallType.ORANGE:
        wallArray = updatedMap.orangeWalls!;
        break;
      case WallType.WINDOW:
        wallArray = updatedMap.windows!;
        break;
    }

    // Check if the index is valid
    if (index >= wallArray.length) return;

    // Update the wall properties
    const updatedWall = { ...wallArray[index], ...props };

    // Update the array
    switch (type) {
      case WallType.MAIN:
        updatedMap.walls[index] = updatedWall;
        break;
      case WallType.RED:
        updatedMap.redWalls![index] = updatedWall;
        break;
      case WallType.ORANGE:
        updatedMap.orangeWalls![index] = updatedWall;
        break;
      case WallType.WINDOW:
        updatedMap.windows![index] = updatedWall;
        break;
    }

    onUpdateMap(updatedMap);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <button onClick={() => onNavigate("home")} className="back-button">
          ← Back to Home
        </button>
        <h1>Admin Mode: {mapData.name}</h1>
      </div>

      <div className="map-selector">
        <select
          value={activeMapIndex}
          onChange={(e) => setActiveMapIndex(parseInt(e.target.value))}
        >
          {maps.map((map, index) => (
            <option key={`option-${map.id}`} value={index}>
              {map.name}
            </option>
          ))}
        </select>
      </div>

      <GameCanvas
        mapData={ensureWallArraysExist(mapData)}
        bluePlayer={null}
        orangePlayer={null}
        hasLos={null}
        isAdminMode={true}
        wallStart={wallStart}
        onCanvasClick={handleCanvasClick}
        setImageDimensions={setImageDimensions}
        selectedWallIndex={selectedWallIndex}
        selectedWallType={selectedWallType}
        setSelectedWallIndex={setSelectedWallIndex}
        setSelectedWallType={setSelectedWallType}
        currentWallType={currentWallProps.type}
      />
      <div className="admin-spacer" />

      <div className="controls">
        <AdminPanel
          mapData={ensureWallArraysExist(mapData)}
          setMapData={onUpdateMap}
          wallStart={wallStart}
          imageDimensions={imageDimensions}
          currentWallProps={currentWallProps}
          setCurrentWallProps={setCurrentWallProps}
          selectedWallIndex={selectedWallIndex}
          selectedWallType={selectedWallType}
          setSelectedWallIndex={setSelectedWallIndex}
          setSelectedWallType={setSelectedWallType}
          updateWall={updateWall}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
        />
      </div>
    </div>
  );
};

export default AdminPage;
