import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppShowcase } from "./components/showcase.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShowcase />
  </StrictMode>,
);
