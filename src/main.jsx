import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css"; // pure CSS only, as the activity requires

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
