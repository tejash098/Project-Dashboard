/**
 * @typedef {Object} Project
 * @property {string}   id          - Unique slug used in URLs and as React key.
 * @property {string}   title       - Display name.
 * @property {string}   description - Short summary for cards and detail.
 * @property {"active"|"completed"} status - Current project state.
 * @property {string[]} techStack   - Technologies used.
 * @property {string|null} liveUrl  - Live demo URL, or null if none.
 * @property {string}   repoUrl     - Source repository URL.
 * @property {string}   createdAt   - ISO date string.
 * @property {string}   updatedAt   - ISO date string.
 * @property {boolean}  featured    - Whether to highlight this project.
 * @property {string}   imageUrl    - Thumbnail path.
 * @property {string[]} tags        - Freeform category tags.
 */
const projects = [
  {
    id: "todo-app",
    title: "Todo App",
    description:
      "A minimal task manager with drag-and-drop ordering, keyboard shortcuts, and localStorage persistence so lists survive a refresh.",
    status: "completed",
    techStack: ["React", "Tailwind CSS", "localStorage"],
    liveUrl: "https://todo-app-tejash.vercel.app",
    repoUrl: "https://tejash-reactprojects.vercel.app/",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-02",
    featured: false,
    imageUrl: "/images/projects/todo-app.png",
    tags: ["productivity"],
  },
  {
    id: "expense-manager",
    title: "Expense Manager",
    description:
      "Track income and spending with category breakdowns, monthly trends, and interactive charts. Data syncs across devices via Firebase.",
    status: "active",
    techStack: ["React", "Chart.js", "Firebase", "Tailwind CSS"],
    liveUrl: "https://expense-manager-mocha-phi.vercel.app/",
    repoUrl: "https://github.com/tejash098/expense-manager",
    createdAt: "2025-09-10",
    updatedAt: "2026-05-20",
    featured: true,
    imageUrl: "/images/projects/expense-manager.png",
    tags: ["finance", "charts"],
  },
  {
    id: "password-generator",
    title: "Password Generator",
    description:
      "Generate strong, configurable passwords using the Web Crypto API, with a live strength meter and one-click copy to clipboard.",
    status: "completed",
    techStack: ["React", "Web Crypto API", "Tailwind CSS"],
    liveUrl: "https://tejash-reactprojects.vercel.app/",
    repoUrl: "https://github.com/tejash098/password-generator",
    createdAt: "2024-06-22",
    updatedAt: "2024-07-04",
    featured: false,
    imageUrl: "/images/projects/password-generator.png",
    tags: ["security", "tools"],
  },
  {
    id: "weather-dashboard",
    title: "Weather Dashboard",
    description:
      "Search any city for current conditions and a five-day forecast, backed by the OpenWeather API with geolocation support.",
    status: "completed",
    techStack: ["React", "OpenWeather API", "Tailwind CSS"],
    liveUrl: "https://tejash-reactprojects.vercel.app/",
    repoUrl: "https://github.com/tejash098/weather-dashboard",
    createdAt: "2025-02-14",
    updatedAt: "2025-03-08",
    featured: false,
    imageUrl: "/images/projects/weather-dashboard.png",
    tags: ["weather", "api"],
  },
  {
    id: "markdown-notes",
    title: "Markdown Notes",
    description:
      "A distraction-free note editor with live Markdown preview, full-text search, and offline storage powered by IndexedDB.",
    status: "active",
    techStack: ["React", "Marked", "IndexedDB", "Tailwind CSS"],
    liveUrl: "https://tejash-reactprojects.vercel.app/",
    repoUrl: "https://github.com/tejash098/markdown-notes",
    createdAt: "2026-01-08",
    updatedAt: "2026-06-01",
    featured: false,
    imageUrl: "/images/projects/markdown-notes.png",
    tags: ["productivity", "markdown"],
  },
  {
    id: "project-dashboard",
    title: "Project Dashboard",
    description:
      "A portfolio dashboard for showcasing and managing projects, with dark mode, a responsive sidebar, and filterable project views.",
    status: "active",
    techStack: ["React 19", "Vite", "Tailwind CSS v4", "MUI"],
    liveUrl: "https://tejash-reactprojects.vercel.app/",
    repoUrl: "https://github.com/tejash098/project-dashboard",
    createdAt: "2026-06-01",
    updatedAt: "2026-06-14",
    featured: true,
    imageUrl: "/images/projects/project-dashboard.png",
    tags: ["portfolio", "dashboard"],
  },
];

export default projects;
