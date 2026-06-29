import { useState } from "react";
import { SidebarContext } from "./SidebarContext";

/**
 * Provides sidebar open/closed state to the component tree.
 * Defaults to open on viewports >= 768px and closed on smaller screens.
 *
 * @param {React.ReactNode} children - Child components.
 */
const SidebarProvider = ({children}) => {
    /** Initialises open state based on viewport width at mount time. */
    const [isOpen, setisOpen] = useState(() => window.innerWidth >= 768)

    /** Toggles the sidebar between open and closed. */
    const toggle = () => setisOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{isOpen, toggle}}>
            {children}
        </SidebarContext.Provider>
    )
}

export default SidebarProvider
