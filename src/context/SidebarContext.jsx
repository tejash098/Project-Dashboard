import { createContext, useState } from "react";

export const SidebarContext = createContext()

const SidebarProvider = ({children}) => {
    const [isopen, setIsopen] = useState(window.innerWidth >= 768)

    const toggle = (prev) => !prev;

    return (
        <SidebarContext.Provider value={isopen, toggle}>
            {children}
        </SidebarContext.Provider>
    )
}

export default SidebarProvider