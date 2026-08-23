import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

// Remove obsolete Statistics data from older releases.
localStorage.removeItem("farklePlayerStatisticsV1");
localStorage.removeItem("farkle-score-player-statistics");

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
