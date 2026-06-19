import { useContext } from "react";
import { SidebarContext } from "../context/SidebarContext";

/**
 * Returns the sidebar open state and toggle function from SidebarContext.
 *
 * @returns {{ isOpen: boolean, toggle: function }} Sidebar state and toggler.
 */
export const useSidebar = () => {
    return useContext(SidebarContext)
}
