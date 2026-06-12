import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import { Routes, Route } from "react-router-dom";

/**
 * Root application component.
 * Defines route mappings rendered inside the AppShell layout.
 */
const App = () => {
    return (
        <AppShell>
            <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings"  element={<Settings />}  />
            </Routes>
        </AppShell>
    );
};

export default App;