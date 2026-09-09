# Project Dashboard — Assistant Reference

<!--
  HAND-WRITTEN. Unlike its neighbour docs.md, this file is NOT generated —
  `npm run generate:docs-md` does not touch it. Edit it directly.

  This is the ONLY source the chatbot may answer from. Anything absent here is
  answered "Out of reference." by design, so adding a fact here is what makes
  the assistant able to discuss it. Keep it under ~6 KB: the whole document is
  sent to the model on every request.

  Served publicly at GET /api/chatbot-context.md.
-->

## About Tejash Kumar Singh

Tejash Kumar Singh is a full-stack developer working across the MERN stack with
an interest in cloud integrations. He builds responsive React interfaces,
reliable Express and MongoDB APIs, and serverless workflows on Azure Functions
that connect third-party applications through OAuth2, message queues, and Redis.
He is a fast learner who writes clean, maintainable code and enjoys turning real
problems into working products.

### Education

- **B.Tech, Computer Science & Engineering** — SMIT, Sikkim (Sikkim Manipal
  University), 2025, 7.5 CGPA
- **Class XII (CBSE)** — The Aryan International School, 2021, 90%
- **Class X (CBSE)** — The Aryan International School, 2019, 89.2%

### Experience

- **Software Engineer Intern, Projetly** (January 2026 – September 2026)
  Built serverless integration backends on Azure Functions with MongoDB,
  developing third-party app connectors that authenticate via OAuth2 and process
  work asynchronously using message queues and Redis. Integrated platforms
  including Salesforce, Zapier, and Make to automate cross-app data flows.

- **Web Development Intern, NBPDCL, Patna** (January 2025 – May 2025)
  Worked on a city-wide survey management system built with React, Express, and
  MongoDB — a dashboard for collecting field survey data and managing
  verification and approval workflows across city zones.

### Certifications

- Internship Completion Certificate — NBPDCL (2025)
- Projetly Internship Certificate (2026)

### Skills

JavaScript, React, React Router, Vite, Tailwind CSS, Node.js, Express, MongoDB
with Mongoose, Redis, REST API design, JWT authentication, Azure Functions,
OAuth2, message queues, Cloudinary, Git and GitHub, and automated testing with
Vitest, Supertest, and Testing Library.

### Contact

- **Email:** jaitej123@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/tejash-singh-892a15233/
- **GitHub:** https://github.com/tejash098
- A phone number and a contact form are available on the dashboard's Contact
  page (`/contact`).

## About This Project

### What it is

Project Dashboard is a full-stack project portfolio dashboard for publishing
projects, tracking GitHub insights, and managing visitor feedback from one
place. Tejash built it, and it doubles as the site you are currently using.
The source is at https://github.com/tejash098/Project-Dashboard.

### Tech stack

**Frontend:** React 19, Vite, React Router 7, Tailwind CSS v4, Material UI icons,
Lucide React, Axios, Recharts, Swagger UI React, the Cloudinary React SDK, and
EmailJS. Tests use Vitest, Testing Library, and jsdom.

**Backend:** Node.js with Express 5, MongoDB via Mongoose, optional Redis caching,
JWT and bcryptjs for admin authentication, Cloudinary and Multer for feedback
image uploads, and Microlink for capturing project preview screenshots. Tests use
Vitest, Supertest, and mongodb-memory-server.

The two applications are independent npm projects in one repository, under
`client/` and `server/`.

### Features

- Dashboard with project metrics and GitHub language statistics
- Public project catalogue and project detail pages
- Stored screenshot of each deployed site on every project card
- Live embedded preview of a deployment on the project detail page
- Admin authentication with JWT-protected management routes
- Create, update, and delete projects; a technology stack catalogue and picker
- Public contact and feedback form with optional Cloudinary image uploads
- Protected feedback reporting and status management
- Interactive Swagger API reference and a Markdown documentation endpoint
- Redis-backed GitHub statistics caching with a direct-fetch fallback
- Per-IP API rate limiting
- Responsive interface with light and dark themes and a collapsible sidebar

### API surface

The API base path is `/api`. Reads are public; writes require an admin bearer
token. Every response uses a consistent envelope: successes carry
`status: "success"` with a `data` payload, and errors carry `status: "error"`
with a human-readable `message`.

Endpoint groups: authentication (`/api/auth`), projects (`/api/projects`),
feedback (`/api/feedback`), technology stacks (`/api/techstacks`), GitHub
language statistics (`/api/github`), this assistant (`/api/chat`), plus a health
check at `/api/status` and Markdown docs at `/api/docs.md`.

Full documentation lives on the dashboard's Docs page (`/docs`), with an
interactive Swagger UI at `/docs/swagger`.

### Application routes

`/` dashboard overview, `/about` about page, `/projects` catalogue,
`/projects/:slug` project details, `/github` GitHub profile and repositories,
`/docs` API documentation, `/docs/swagger` Swagger UI, `/contact` contact and
feedback form, `/projects/new` protected project creation, `/report` protected
feedback report.

### Deployment

The API is deployed on Render and the frontend on Vercel. Both test suites run
in GitHub Actions on every push and pull request, and `main` requires them to
pass before a merge.

## GitHub

Tejash's GitHub account is **tejash098** — https://github.com/tejash098.
Public repositories are listed at https://github.com/tejash098?tab=repositories.

The dashboard's GitHub page shows his profile, public repositories, and a
contribution calendar. The dashboard home page shows a donut chart of total
bytes of code per language, aggregated across all of his public non-fork
repositories through the GitHub API and cached for 24 hours.

His most-used languages reflect the stack above — primarily JavaScript, with
HTML and CSS alongside it.

## Questions This Assistant Can Answer

- What is Tejash's background, and what does he do?
- What technologies and languages does he work with?
- Where has he worked, and what did he build there?
- What did he study, and where?
- How do I get in touch with him?
- What is this dashboard, and what can it do?
- What is it built with, on the frontend and the backend?
- What does the API expose, and how is it documented?
- Where is the source code, and how is it deployed?
- What is on his GitHub profile?
