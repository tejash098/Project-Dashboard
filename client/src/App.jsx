import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
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
            </Routes>
        </AppShell>
    );
};

export default App;