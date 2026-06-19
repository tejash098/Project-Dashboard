import { useTheme } from "../../hooks/useTheme";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

/**
 * Theme toggle button — switches between light and dark mode.
 * Shows moon in light mode, sun in dark mode.
 * Reads and updates theme via useTheme hook.
 */
const ThemeToggle = () => {
    const { theme, toggle } = useTheme();

    return (
        <button
            onClick={toggle}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="
                p-2 rounded-lg
                text-text-secondary
                hover:bg-accent-subtle hover:text-accent
                transition-colors duration-200
            "
        >
            {theme === "light"
                ? <DarkModeIcon sx={{ fontSize: 20 }} />
                : <LightModeIcon sx={{ fontSize: 20 }} />
            }
        </button>
    );
};

export default ThemeToggle;