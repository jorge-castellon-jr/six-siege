// src/components/ImprovementChecklist.tsx
import React, { useState, useEffect } from "react";
import checklistData from "../data/checklist.json";

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
  const checklist = getDefaultChecklist();

  // Filter state to show different categories
  const [activeCategory, setActiveCategory] = useState<string>("all");

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
const getDefaultChecklist = (): ChecklistItem[] =>
  checklistData as ChecklistItem[];

export default ImprovementChecklist;
