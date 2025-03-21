// src/App.tsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { MapData, AppPage } from "./types";
import HomePage from "./components/HomePage";
import CalculatorPage from "./components/CalculatorPage";
import AdminPage from "./components/AdminPage";
import HiddenLayout from "./components/hidden/HiddenLayout";
import TournamentBans from "./components/hidden/TournamentBans";
import OperatorDatabase from "./components/hidden/OperatorDatabase";
import DiceRoller from "./components/hidden/DiceRoller";
import "./App.css";

import consulateData from "./data/consulate.json";
import clubhouseData from "./data/clubhouse.json";
// import clubhouseData2 from "./data/clubhouse2.json";
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
  // clubhouseData2,
  bankData,
  kafeData,
  chaletData,
  oregonData,
  coastlineData,
  borderData,
];

// The original App component wrapped with BrowserRouter
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

// The main application content with routing
const AppContent: React.FC = () => {
  const location = useLocation();
  const isHiddenRoute = location.pathname.startsWith("/hidden");

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

  // For hidden routes, use React Router
  if (isHiddenRoute) {
    return (
      <div className="app">
        <Routes>
          <Route path="/hidden" element={<HiddenLayout />}>
            <Route index element={<Navigate to="tournament-bans" replace />} />
            <Route path="tournament-bans" element={<TournamentBans />} />
            <Route path="operator-database" element={<OperatorDatabase />} />
            <Route path="dice-roller" element={<DiceRoller />} />
          </Route>
        </Routes>
      </div>
    );
  }

  // For existing routes, use the current state-based routing
  return (
    <div className="app">
      {currentPage === "home" && (
        <HomePage
          maps={maps}
          onSelectMap={handleSelectMap}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === "calculator" && (
        <CalculatorPage mapData={selectedMap} onNavigate={handleNavigate} />
      )}
      {currentPage === "admin" && (
        <AdminPage
          maps={maps}
          onUpdateMap={handleUpdateMap}
          onNavigate={handleNavigate}
        />
      )}
      <a
        href="/hidden"
        className="text-zinc-900 hover:text-white transition duration-300"
      >
        {"I'm Hidden"}
      </a>
    </div>
  );
};

export default App;
