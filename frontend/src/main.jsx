import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./theme.css";
import { getStoredTheme } from "./ThemePicker.jsx";

// Apply the saved accent color before the first render so pages never flash the default theme.
document.documentElement.dataset.accent = getStoredTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
