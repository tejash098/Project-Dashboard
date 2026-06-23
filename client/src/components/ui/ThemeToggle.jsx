import { useTheme } from "../../hooks/useTheme";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

/**
 * Theme toggle button — switches between light and dark mode.
 * Shows moon in light mode, sun in dark mode.
 * Reads and updates theme via useTheme hook.
 *
 * @param {Object} props
 * @param {boolean} [props.compact] - Reserved for tighter layouts (e.g. the
 *   collapsed sidebar); the visual stays icon-only either way.
 */
// eslint-disable-next-line no-unused-vars -- `compact` is part of the public API
const ThemeToggle = ({ compact = false }) => {
    const { theme, toggle } = useTheme();
    // One label drives both the tooltip and the accessible name.
    const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

    return (
        <button
            onClick={toggle}
            title={label}
            aria-label={label}
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