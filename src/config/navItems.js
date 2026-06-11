import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";

/**
 * Navigation item configuration for the sidebar.
 * Each entry defines a route, display label, and icon component.
 * Add, remove, or reorder items here without touching any component.
 *
 * @type {Array<{ id: number, label: string, path: string, icon: React.ElementType }>}
 */
const navItems = [
    { id: 1, label: "Dashboard",  path: "/",           icon: DashboardIcon },
    { id: 2, label: "Analytics",  path: "/analytics",  icon: BarChartIcon  },
    { id: 3, label: "Settings",   path: "/settings",   icon: SettingsIcon  },
];

export default navItems;