import { createContext, useState, useEffect } from "react";

/**
 * Context object for theme state.
 * Consumed via the useTheme hook.
 */
export const ThemeContext = createContext();

/**
 * Provides light/dark theme state to the component tree.
 * Persists the selected theme in localStorage and applies
 * the "dark" class to <html> to activate Tailwind dark mode.
 *
 * @param {React.ReactNode} children - Child components.
 */
const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(
        () => localStorage.getItem("theme") || "light"
    );

    /** Toggles between "light" and "dark". */
    const toggle = () => setTheme(
        prev => prev === "light" ? "dark" : "light"
    );

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
