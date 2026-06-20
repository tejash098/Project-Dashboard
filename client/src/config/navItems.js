import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import ArticleIcon from "@mui/icons-material/Article";

/**
 * Navigation item configuration for the sidebar.
 * Each entry defines a route, display label, and icon component.
 * Add, remove, or reorder items here without touching any component.
 *
 * @type {Array<{ id: number, label: string, path: string, icon: React.ElementType }>}
 */
const navItems = [
  { id: 1, label: "Dashboard", path: "/", icon: DashboardIcon, end: true },
  { id: 2, label: "Projects", path: "/projects", icon: FolderIcon },
  { id: 3, label: "Docs", path: "/docs", icon: ArticleIcon },
];

export default navItems;
