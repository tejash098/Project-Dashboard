import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Docs from "./pages/Docs";
import Contact from "./pages/Contact";
import Report from "./pages/Report";
import ReportDetail from "./pages/ReportDetail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";

/**
 * Root application component.
 * Defines route mappings rendered inside the AppShell layout.
 */
const App = () => {
    return (
        <AppShell>
            <Routes>
                <Route path="/"             element={<Dashboard />} />
                <Route path="/projects"     element={<Projects />} />
                <Route path="/projects/:slug" element={<ProjectDetail />} />
                <Route path="/docs"         element={<Docs />} />
                <Route path="/contact"      element={<Contact />} />
                {/* Admin-only feedback report (list + detail). */}
                <Route
                    path="/report"
                    element={
                        <ProtectedRoute>
                            <Report />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/report/:fId"
                    element={
                        <ProtectedRoute>
                            <ReportDetail />
                        </ProtectedRoute>
                    }
                />
                {/* Catch-all — must stay last so specific routes win first. */}
                <Route path="*"             element={<NotFound />} />
            </Routes>
        </AppShell>
    );
};

export default App;