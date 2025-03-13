// src/App.tsx
import React, { useState } from "react";
import { MapData, AppPage } from "./types";
import HomePage from "./components/HomePage";
import CalculatorPage from "./components/CalculatorPage";
import AdminPage from "./components/AdminPage";
import "./App.css";

import consulateData from "./data/consulate.json";
import clubhouseData from "./data/clubhouse.json";
import bankData from "./data/bank.json";
import kafeData from "./data/kafe.json";
import chaletData from "./data/chalet.json";
import oregonData from "./data/oregon.json";
import coastlineData from "./data/coastline.json";
import borderData from "./data/border.json";

// Default maps data
const DEFAULT_MAPS: MapData[] = [
  consulateData,
  clubhouseData,
  bankData,
  kafeData,
  chaletData,
  oregonData,
  coastlineData,
  borderData,
];

const App: React.FC = () => {
  // State for navigation
  const [currentPage, setCurrentPage] = useState<AppPage>("home");

  // State for maps data
  const [maps, setMaps] = useState<MapData[]>(DEFAULT_MAPS);

  // State for selected map
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

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
