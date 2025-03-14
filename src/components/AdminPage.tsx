// src/components/AdminPage.tsx
import React, { useState } from "react";
import { MapData, Position, Wall, AppPage } from "../types";
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
  });

  // State for selected wall (for editing)
  const [selectedWallIndex, setSelectedWallIndex] = useState<number | null>(
    null,
  );

  // State for zoom (now passed to GameCanvas)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
          const updatedMap = {
            ...mapData,
            walls: [...mapData.walls, newWall],
          };

          onUpdateMap(updatedMap);

          // Select the newly created wall
          setSelectedWallIndex(updatedMap.walls.length - 1);
        }

        setWallStart(null);
      }
    }
  };

  // Update a wall's properties
  const updateWall = (index: number, props: Partial<Wall>) => {
    if (index < 0 || index >= mapData.walls.length) return;

    const updatedWalls = [...mapData.walls];
    updatedWalls[index] = { ...updatedWalls[index], ...props };

    onUpdateMap({
      ...mapData,
      walls: updatedWalls,
    });
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
        mapData={mapData}
        bluePlayer={null}
        orangePlayer={null}
        hasLos={null}
        isAdminMode={true}
        wallStart={wallStart}
        onCanvasClick={handleCanvasClick}
        setImageDimensions={setImageDimensions}
        selectedWallIndex={selectedWallIndex}
        setSelectedWallIndex={setSelectedWallIndex}
      />
      <div className="admin-spacer" />

      <div className="controls">
        <AdminPanel
          mapData={mapData}
          setMapData={onUpdateMap}
          wallStart={wallStart}
          imageDimensions={imageDimensions}
          currentWallProps={currentWallProps}
          setCurrentWallProps={setCurrentWallProps}
          selectedWallIndex={selectedWallIndex}
          setSelectedWallIndex={setSelectedWallIndex}
          updateWall={updateWall}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
        />
      </div>
    </div>
  );
};

export default AdminPage;
