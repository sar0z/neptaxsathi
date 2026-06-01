import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Theme } from "@radix-ui/themes";
import { LanguageProvider } from "./i18n/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <Theme
        accentColor="indigo"
        grayColor="slate"
        radius="medium"
        scaling="100%"
      >
        <App />
      </Theme>
    </LanguageProvider>
  </StrictMode>
);
