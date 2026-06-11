import { createContext, useState } from "react";

export const SidebarContext = createContext()

const SidebarProvider = ({children}) => {
    const [isOpen, setisOpen] = useState(() => window.innerWidth >= 768)

    const toggle = () => setisOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{isOpen, toggle}}>
            {children}
        </SidebarContext.Provider>
    )
}

export default SidebarProvider