import { createNeonHarborApp } from "./neonHarborApp";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Neon Harbor requires an #app root element.");
}

createNeonHarborApp(root);
