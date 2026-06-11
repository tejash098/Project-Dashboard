import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";

/**
 * Root application component.
 * Composes the layout shell with the default page.
 */
const App = () => {
    return (
        <AppShell>
            <Dashboard />
        </AppShell>
    );
};

export default App;