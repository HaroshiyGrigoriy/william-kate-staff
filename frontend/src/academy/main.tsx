import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AcademyModule } from "./AcademyModule.tsx";
import "./module.css";
createRoot(document.getElementById("academy-root")!).render(
  <StrictMode>
    <AcademyModule />
  </StrictMode>,
);
