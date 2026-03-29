// src/App.tsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { MapData, AppPage } from "./types";
import AdminPage from "./components/AdminPage";
import HiddenLayout from "./components/hidden/HiddenLayout";
import TournamentBans from "./components/hidden/TournamentBans";
import OperatorDatabase from "./components/hidden/OperatorDatabase";
import DiceRoller from "./components/hidden/DiceRoller";
import LineOfSight from "./components/hidden/LineOfSight";
import R6SStyles from "./components/hidden/R6SStyles";
import "./App.css";

import { DEFAULT_MAPS } from "./data/defaultMaps";

/** Old bookmarks under /hidden/* continue to work. */
function LegacyHiddenRedirect() {
  const { pathname } = useLocation();
  const rest = pathname.replace(/^\/hidden\/?/, "");
  const target = rest ? `/${rest}` : "/los";
  return <Navigate to={target} replace />;
}

function AdminPageRoute({
  maps,
  onUpdateMap,
}: {
  maps: MapData[];
  onUpdateMap: (updatedMap: MapData) => void;
}) {
  const navigate = useNavigate();
  return (
    <AdminPage
      maps={maps}
      onUpdateMap={onUpdateMap}
      onNavigate={(page: AppPage) => {
        if (page === "home") navigate("/los");
      }}
    />
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

const AppContent: React.FC = () => {
  const [maps, setMaps] = useState<MapData[]>(DEFAULT_MAPS);

  const handleUpdateMap = (updatedMap: MapData) => {
    setMaps((prev) =>
      prev.map((map) => (map.id === updatedMap.id ? updatedMap : map)),
    );
  };

  return (
    <div className="app">
      <R6SStyles>
        <Routes>
          <Route path="/hidden/*" element={<LegacyHiddenRedirect />} />
          <Route
            path="/admin"
            element={
              <AdminPageRoute maps={maps} onUpdateMap={handleUpdateMap} />
            }
          />
          <Route path="/" element={<HiddenLayout />}>
            <Route index element={<Navigate to="/los" replace />} />
            <Route path="los" element={<LineOfSight maps={maps} />} />
            <Route path="tournament-bans" element={<TournamentBans />} />
            <Route path="operator-database" element={<OperatorDatabase />} />
            <Route path="dice-roller" element={<DiceRoller />} />
          </Route>
        </Routes>
      </R6SStyles>
    </div>
  );
};

export default App;
