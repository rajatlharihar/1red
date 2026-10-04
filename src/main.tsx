  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  /* Stale page chunks after a deploy are handled by the root route's
     ErrorBoundary (components/RouteError.tsx): the router has already moved
     to the page you asked for, so one reload lands you on its new build. */
  createRoot(document.getElementById("root")!).render(<App />);
