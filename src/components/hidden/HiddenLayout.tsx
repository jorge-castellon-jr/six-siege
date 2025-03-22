// src/components/hidden/HiddenLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./HiddenLayout.css";

const HiddenLayout: React.FC = () => {
  return (
    <div className="hidden-layout">
      <header className="hidden-header">
        <div className="header-logo">
          <div className="r6-logo">6S</div>
          <h1>Advanced Tools</h1>
        </div>
      </header>

      <nav className="hidden-nav">
        <ul>
          <li>
            <NavLink
              to="/hidden/los"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              Line of Sight
            </NavLink>
          </li>
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
        <div className="footer-content">
          <div className="footer-logo">6S</div>
          <p>Six Siege The Board Game - Advanced Tools</p>
          <div className="footer-version">v1.0</div>
        </div>
      </footer>
    </div>
  );
};

export default HiddenLayout;
