import { useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContext";

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

        // Keep the mobile browser chrome in step with the theme. Read back from
        // the resolved token rather than hardcoding a hex, so this can't drift
        // from tokens.css — the class above is already applied, so the computed
        // value is the incoming theme's page colour.
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            const pageBg = getComputedStyle(document.documentElement)
                .getPropertyValue("--color-page-bg")
                .trim();
            if (pageBg) meta.setAttribute("content", pageBg);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
