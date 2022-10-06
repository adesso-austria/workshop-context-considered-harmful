import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { StateProvider } from "./state";

const container = document.getElementById("root");

if (container == null) {
  throw new Error("can't start app without root container");
}

const root = createRoot(container);

root.render(
  <div style={{ height: "100vh", width: "100vw" }}>
    <StateProvider>
      <App />
    </StateProvider>
  </div>
);
