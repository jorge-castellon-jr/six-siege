// src/App.tsx
import React, { useState, useEffect } from "react";
import { MapData, AppPage } from "./types";
import HomePage from "./components/HomePage";
import CalculatorPage from "./components/CalculatorPage";
import AdminPage from "./components/AdminPage";
import "./App.css";

import bankData from "./data/bank.json";

// Default maps data
const DEFAULT_MAPS: MapData[] = [
  bankData,
  {
    id: "oregon",
    name: "Oregon",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
  {
    id: "consulate",
    name: "Consulate",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
  {
    id: "chalet",
    name: "Chalet",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
  {
    id: "coastline",
    name: "Coastline",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
  {
    id: "clubhouse",
    name: "Clubhouse",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
  {
    id: "kafe",
    name: "Kafe Dostoyevsky",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
  {
    id: "border",
    name: "Border",
    walls: [],
    gridSize: { width: 20, height: 20 },
    gridOffset: { x: 0, y: 0, right: 0, bottom: 0 },
  },
];

const App: React.FC = () => {
  // State for navigation
  const [currentPage, setCurrentPage] = useState<AppPage>("home");

  // State for maps data
  const [maps, setMaps] = useState<MapData[]>(DEFAULT_MAPS);

  // State for selected map
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  // Load saved maps from localStorage on initial load
  useEffect(() => {
    const savedMaps = localStorage.getItem("r6s-maps");
    if (savedMaps) {
      try {
        setMaps(JSON.parse(savedMaps));
      } catch (error) {
        console.error("Error loading saved maps:", error);
      }
    }
  }, []);

  // Save maps to localStorage when they change
  useEffect(() => {
    localStorage.setItem("r6s-maps", JSON.stringify(maps));
  }, [maps]);

  // Handle navigation
  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  // Handle map selection
  const handleSelectMap = (mapId: string) => {
    setSelectedMapId(mapId);
    setCurrentPage("calculator");
  };

  // Update an existing map
  const handleUpdateMap = (updatedMap: MapData) => {
    const updatedMaps = maps.map((map) =>
      map.id === updatedMap.id ? updatedMap : map,
    );
    setMaps(updatedMaps);
  };

  // Get selected map data
  const selectedMap = maps.find((map) => map.id === selectedMapId) || maps[0];

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            maps={maps}
            onSelectMap={handleSelectMap}
            onNavigate={handleNavigate}
          />
        );
      case "calculator":
        return (
          <CalculatorPage mapData={selectedMap} onNavigate={handleNavigate} />
        );
      case "admin":
        return (
          <AdminPage
            maps={maps}
            onUpdateMap={handleUpdateMap}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return <div className="app">{renderCurrentPage()}</div>;
};

export default App;
