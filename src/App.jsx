import { useTheme } from "./hooks/useTheme"
import { useSidebar } from "./hooks/useSidebar"

function App() {
  const { theme, toggle } = useTheme()
  return (
    <>
      <div className="bg-page-bg min-h-screen text-text-primary p-8 font-bold">
        <p className="m-2">{theme}</p>
        <button onClick={toggle} className="px-4 py-1 cursor-pointer rounded-2xl bg-accent text-text-primary">Change Theme</button>
      </div>
    </>
  )
}

export default App
