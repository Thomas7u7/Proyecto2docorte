import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App";
import History from "./History";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <HashRouter>
    <nav>
      <Link to="/">Inicio</Link> | <Link to="/history">Historial</Link>
    </nav>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/history" element={<History />} />
    </Routes>
  </HashRouter>
);