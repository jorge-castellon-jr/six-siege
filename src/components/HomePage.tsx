// src/components/HomePage.tsx
import React, { useState, useEffect } from "react";
import { MapData, AppPage, ChecklistItem } from "../types";
import ImprovementChecklist from "./ImprovementChecklist";
import "./ImprovementChecklist.css";
import checklistData from "../data/checklist.json";
import { isAdmin } from "../utils/admin";

interface HomePageProps {
  maps: MapData[];
  onSelectMap: (mapId: string) => void;
  onNavigate: (page: AppPage) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  maps,
  onSelectMap,
  onNavigate,
}) => {
  const [showChecklist, setShowChecklist] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    completed: 0,
    total: 0,
  });

  // Load completion stats from json
  useEffect(() => {
    const checklist = checklistData as ChecklistItem[];
    const completed = checklist.filter((item) => item.completed).length;
    const total = checklist.length;
    setCompletionStats({ completed, total });
  }, []);

  // Recalculate stats when checklist is closed (to reflect any changes)
  const handleCloseChecklist = () => {
    setShowChecklist(false);

    const checklist = checklistData as ChecklistItem[];
    const completed = checklist.filter((item) => item.completed).length;
    const total = checklist.length;
    setCompletionStats({ completed, total });
  };

  const completionPercentage =
    Math.round((completionStats.completed / completionStats.total) * 100) || 0;

  return (
    <div className="home-page">
      <h1>Rainbow Six: Siege Line of Sight Calculator</h1>

      <div className="page-actions">
        {isAdmin() && (
          <button onClick={() => onNavigate("admin")} className="admin-button">
            Admin Mode
          </button>
        )}

        <button
          onClick={() => setShowChecklist(true)}
          className="improvement-button"
        >
          <div className="progress-indicator">{completionPercentage}%</div>
          Project Checklist
        </button>
      </div>

      <div className="map-selection">
        <h2>Select a Map</h2>
        <div className="map-grid">
          {maps.map((map) => (
            <div
              key={map.id}
              className="map-card"
              onClick={() => onSelectMap(map.id)}
            >
              <div className="map-thumbnail">
                <img
                  src={`/assets/${map.id}${map.version > 1 ? ".png" : ".jpg"}`}
                  alt={map.name}
                />
              </div>
              <div className="map-name">{map.name}</div>
            </div>
          ))}
        </div>
      </div>

      {showChecklist && <ImprovementChecklist onClose={handleCloseChecklist} />}
    </div>
  );
};

export default HomePage;
