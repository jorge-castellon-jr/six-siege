// src/components/hidden/R6SStyles.tsx
import React from "react";
import "./HiddenLayout.css";
import "./TacticalButtons.css";
import "./TacticalPanel.css";
import "./TacticalData.css";
import "./TacticalHeader.css";

/**
 * R6SStyles is a component that imports all Rainbow Six Siege styled CSS components
 * Use this as a wrapper in your app to ensure all tactical styles are loaded
 */
const R6SStyles: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default R6SStyles;
