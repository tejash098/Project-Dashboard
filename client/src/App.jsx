import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Docs from "./pages/Docs";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
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
                {/* Catch-all — must stay last so specific routes win first. */}
                <Route path="*"             element={<NotFound />} />
            </Routes>
        </AppShell>
    );
};

export default App;