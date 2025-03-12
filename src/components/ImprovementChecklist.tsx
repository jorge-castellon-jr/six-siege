// src/components/ImprovementChecklist.tsx
import React, { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  category: "core" | "admin" | "player" | "maps" | "interface";
}

interface ImprovementChecklistProps {
  onClose: () => void;
}

const ImprovementChecklist: React.FC<ImprovementChecklistProps> = ({
  onClose,
}) => {
  // Load checklist from localStorage, or use default list if none exists
  const checklist = getDefaultChecklist();

  // Filter state to show different categories
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Save checklist to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "r6s-improvement-checklist",
      JSON.stringify(checklist),
    );
  }, [checklist]);

  // Filter checklist by category
  const filteredChecklist =
    activeCategory === "all"
      ? [
        ...checklist.filter((check) => !check.completed),
        ...checklist.filter((check) => check.completed),
      ]
      : [
        ...checklist.filter(
          (item) => item.category === activeCategory && !item.completed,
        ),
        ...checklist.filter(
          (item) => item.category === activeCategory && item.completed,
        ),
      ];

  // Calculate completion stats
  const totalItems = checklist.length;
  const completedItems = checklist.filter((item) => item.completed).length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="checklist-overlay">
      <div className="checklist-modal">
        <div className="checklist-header">
          <h2>Project Improvement Checklist</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="checklist-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {completedItems} of {totalItems} completed ({completionPercentage}%)
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={activeCategory === "all" ? "active-tab" : ""}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          <button
            className={activeCategory === "core" ? "active-tab" : ""}
            onClick={() => setActiveCategory("core")}
          >
            Core Features
          </button>
          <button
            className={activeCategory === "player" ? "active-tab" : ""}
            onClick={() => setActiveCategory("player")}
          >
            Player Mode
          </button>
          <button
            className={activeCategory === "maps" ? "active-tab" : ""}
            onClick={() => setActiveCategory("maps")}
          >
            Maps
          </button>
          <button
            className={activeCategory === "interface" ? "active-tab" : ""}
            onClick={() => setActiveCategory("interface")}
          >
            Interface
          </button>
        </div>

        <div className="checklist-items">
          {filteredChecklist.map((item) => (
            <div
              key={item.id}
              className={`checklist-item ${item.completed ? "completed" : ""}`}
            >
              <input
                type="checkbox"
                checked={item.completed}
                id={`checkbox-${item.id}`}
                readOnly
              />
              <label htmlFor={`checkbox-${item.id}`}>{item.description}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Default checklist items
const getDefaultChecklist = (): ChecklistItem[] => [
  // Core Features - Already Implemented
  {
    id: "core-1",
    description: "Map image loading with grid overlay",
    completed: true,
    category: "core",
  },
  {
    id: "core-4",
    description: "Line of sight calculation between operators",
    completed: true,
    category: "core",
  },

  // Player Mode - Already Implemented
  {
    id: "player-1",
    description: "Blue and orange player placement",
    completed: true,
    category: "player",
  },
  {
    id: "player-2",
    description: "Line of sight visualization",
    completed: true,
    category: "player",
  },

  // Player Mode - Future Improvements
  {
    id: "player-3",
    description: "Multiple operators per team",
    completed: false,
    category: "player",
  },
  {
    id: "player-6",
    description: "Distance measurement between operators",
    completed: false,
    category: "player",
  },
  {
    id: "player-7",
    description: "Toggle destructible wall sections",
    completed: false,
    category: "player",
  },
  {
    id: "player-8",
    description: "Smoke placement and visualization",
    completed: false,
    category: "player",
  },

  // Maps - Already Implemented
  {
    id: "maps-1",
    description: "Load presets for official maps",
    completed: true,
    category: "maps",
  },
  {
    id: "maps-2",
    description: "Bank map with walls",
    completed: true,
    category: "maps",
  },

  // Maps - Future Improvements
  {
    id: "maps-7",
    description: "Chalet map with walls",
    completed: false,
    category: "maps",
  },
  {
    id: "maps-8",
    description: "Clubhouse map with walls",
    completed: false,
    category: "maps",
  },
  {
    id: "maps-9",
    description: "Coastline map with walls",
    completed: false,
    category: "maps",
  },
  {
    id: "maps-10",
    description: "Consulate map with walls",
    completed: false,
    category: "maps",
  },
  {
    id: "maps-11",
    description: "Kafe map with walls",
    completed: false,
    category: "maps",
  },
  {
    id: "maps-12",
    description: "Oregon map with walls",
    completed: false,
    category: "maps",
  },
  {
    id: "maps-13",
    description: "Border map with walls",
    completed: false,
    category: "maps",
  },

  // Interface - Already Implemented
  {
    id: "interface-2",
    description: "Map selection screen",
    completed: true,
    category: "interface",
  },

  // Interface - Future Improvements
  {
    id: "interface-3",
    description: "Mobile-responsive design",
    completed: false,
    category: "interface",
  },
];

export default ImprovementChecklist;
