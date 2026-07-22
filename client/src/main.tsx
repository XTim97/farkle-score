import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "@fontsource-variable/sora";
import "@fontsource-variable/nunito";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
