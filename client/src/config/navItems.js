import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import ArticleIcon from "@mui/icons-material/Article";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import AssessmentIcon from "@mui/icons-material/Assessment";

/**
 * Navigation item configuration for the sidebar.
 * Each entry defines a route, display label, and icon component. Items flagged
 * `adminOnly` are rendered only when the current user is an authenticated admin
 * (the Sidebar filters them).
 * Add, remove, or reorder items here without touching any component.
 *
 * @type {Array<{ id: number, label: string, path: string, icon: React.ElementType, end?: boolean, adminOnly?: boolean }>}
 */
const navItems = [
  { id: 1, label: "Dashboard", path: "/", icon: DashboardIcon, end: true },
  { id: 2, label: "Projects", path: "/projects", icon: FolderIcon },
  { id: 3, label: "Docs", path: "/docs", icon: ArticleIcon },
  { id: 4, label: "Contact", path: "/contact", icon: ContactMailIcon },
  { id: 5, label: "Report", path: "/report", icon: AssessmentIcon, end: true, adminOnly: true },
];

export default navItems;
