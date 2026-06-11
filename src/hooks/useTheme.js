import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Returns the current theme and toggle function from ThemeContext.
 *
 * @returns {{ theme: string, toggle: function }} Theme state and toggler.
 */
export const useTheme = () => {
    return useContext(ThemeContext);
};
