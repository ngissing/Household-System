import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import { initGoogleCalendar } from "./lib/google-calendar";

function App() {
  useEffect(() => {
    initGoogleCalendar().catch(console.error);
  }, []);
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {/* Tempo routes need to be before other routes */}
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

      <Routes>
        <Route path="/" element={<Home />} />
        {/* Add the tempo route before catch-all */}
        {import.meta.env.VITE_TEMPO === "true" && (
          <Route path="/tempobook/*" element={null} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
