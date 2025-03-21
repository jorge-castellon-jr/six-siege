// src/components/hidden/HiddenLayout.tsx
import React, { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./HiddenLayout.css";

const HiddenLayout: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(
    formatTime(new Date()),
  );

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Format time for display
  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="hidden-layout">
      <header className="hidden-header">
        <div className="header-logo">
          <div className="r6-logo">R6S</div>
          <h1>
            Advanced Tools <span className="header-time">{currentTime}</span>
          </h1>
        </div>
        <NavLink to="/" className="back-home-link">
          <span className="back-icon">←</span>
          <span>Back to Main Application</span>
        </NavLink>
      </header>

      <nav className="hidden-nav">
        <ul>
          <li>
            <NavLink
              to="/hidden/tournament-bans"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              <span className="nav-icon">🎮</span> Tournament Bans
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hidden/operator-database"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              <span className="nav-icon">👤</span> Operator Database
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hidden/dice-roller"
              className={({ isActive }) => (isActive ? "active-nav-link" : "")}
            >
              <span className="nav-icon">🎲</span> Dice Roller
            </NavLink>
          </li>
        </ul>
      </nav>

      <main className="hidden-content">
        <Outlet />
      </main>

      <footer className="hidden-footer">
        <div className="footer-content">
          <div className="footer-logo">R6S</div>
          <p>Rainbow Six Siege Board Game Helper - Advanced Tools</p>
          <div className="footer-version">v1.0</div>
        </div>
      </footer>
    </div>
  );
};

export default HiddenLayout;
