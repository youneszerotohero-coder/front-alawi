import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./index.css";
import App from "./App.jsx";

// Note: React StrictMode intentionally double-invokes effects in development
// to help detect side effects. This is normal and won't happen in production.
// This means API calls may appear twice in development, but only once in production.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
