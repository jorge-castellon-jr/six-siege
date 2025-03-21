// src/components/hidden/HiddenLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./HiddenLayout.css";

const HiddenLayout: React.FC = () => {
  return (
    <div className="hidden-layout">
      <header className="hidden-header">
        <h1>R6S Advanced Tools</h1>
        <NavLink to="/" className="back-home-link">
          ← Back to Main Application
        </NavLink>
      </header>

      <nav className="hidden-nav">
        <ul>
          <li>
            <NavLink
              to="/hidden/tournament-bans"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              Tournament Bans
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hidden/operator-database"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              Operator Database
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hidden/dice-roller"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              Dice Roller
            </NavLink>
          </li>
        </ul>
      </nav>

      <main className="hidden-content">
        <Outlet />
      </main>

      <footer className="hidden-footer">
        <p>Rainbow Six Siege Board Game Helper - Advanced Tools</p>
      </footer>
    </div>
  );
};

export default HiddenLayout;
