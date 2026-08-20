# Project Dashboard

[![Client version](https://img.shields.io/badge/client-v1.0.1-blue.svg)](https://github.com/tejash098/Project-Dashboard) [![Server version](https://img.shields.io/badge/server-v1.0.0-green.svg)](https://github.com/tejash098/Project-Dashboard) [![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)](https://github.com/tejash098/Project-Dashboard)

A full-stack dashboard application for managing projects.

Maintainers: tejash098


## Architecture Overview

This repository is a full-stack web application split into two main parts:

- A single-page frontend application (client/) built with React and Vite that provides the UI, charts, and interactions.
- A RESTful backend API (server/) built with Express and MongoDB that stores projects, tech stacks, and user/auth data.

High-level architecture:

- Browser (React) ↔ HTTP ↔ Express API
- Express persists data in MongoDB (Mongoose models)
- Redis is used optionally as a cache for GitHub language stats
- Cloudinary stores uploaded images (feedback/contact)
- JWT-based authentication for protected endpoints

This separation keeps UI and API concerns independent so the frontend can be deployed to a static host (Vercel, Netlify) while the API runs on a Node host.

## Project Structure (detailed)

- client/ — React + Vite frontend
  - src/ — application source
  - public/ — static assets
  - package.json — frontend scripts & deps
  - .env.example — example client env variables (SERVER_BASE_URL, VITE_EMAILJS_*)

- server/ — Express API
  - src/ — server source code
    - config/ — env, db, redis, and seeding helpers
    - controllers/ — request handlers (API logic)
    - models/ — Mongoose schemas
    - routes/ — Express route definitions
    - scripts/ — one-off scripts (seeds)
    - server.js — app entrypoint
  - package.json — server scripts & deps
  - .env.example — example server env variables (MONGODB_URI, JWT_SECRET, CLOUDINARY_*)

- README.md — this file

## Development setup and run instructions

These steps explain how to run the project locally for development.

Prerequisites
- Node.js (18+) and npm installed
- A MongoDB instance or Atlas cluster (mongodb:// or mongodb+srv:// URI)
- (Optional) Redis credentials if you want caching
- Cloudinary account for image uploads (required values are listed below)

1) Backend (server)

- Copy the example env and fill real values:
  - Windows / mac / Linux:
    cp server\.env.example server\.env
  - Edit server\.env and set at minimum:
    - MONGODB_URI (required)
    - JWT_SECRET (required)
    - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (required for uploads)
  - Optional: ADMIN_USERNAME / ADMIN_PASSWORD to auto-seed a bootstrap admin on first run

- Install dependencies and start in dev mode (nodemon):
  cd server
  npm install
  npm run dev

- Server listens on PORT (default 5000). Example base API URL: http://localhost:5000/api

- Seed sample data:
  The repo includes scripts to seed domain data (e.g., tech stacks):
  cd server
  npm run seed:techstacks

2) Frontend (client)

- Copy client env example and set the API base URL if needed:
  cp client\.env.example client\.env
  Edit client\.env and ensure SERVER_BASE_URL points to your running API, e.g.:
  SERVER_BASE_URL="http://localhost:5000/api"

- Install and start the dev server:
  cd client
  npm install
  npm run dev

- Vite dev server runs on port 5173 by default. Open http://localhost:5173

3) Running both together

Open two terminals and run the server and client dev commands described above. Alternatively, use your own tooling (tmux, terminals, or an npm script that spawns both processes).

4) Build for production (client)

- Build client assets:
  cd client
  npm run build

- The built files are in `client/dist`. Serve them with any static host (Vercel/Netlify) or integrate into the server to serve static files.

## Environment variables (summary)

See `server/.env.example` and `client/.env.example` for full lists. Important values:

Server (server/.env)
- MONGODB_URI — MongoDB connection string (required)
- JWT_SECRET — secret for signing JWTs (required)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — used for image uploads
- ADMIN_USERNAME, ADMIN_PASSWORD — optional bootstrap admin credentials
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD — optional Redis cache

Client (client/.env)
- SERVER_BASE_URL — URL of the backend API the frontend will call
- VITE_EMAILJS_* — public EmailJS keys if using client-side EmailJS

## Troubleshooting & tips

- If the server exits immediately, verify `server/.env` exists and MONGODB_URI + JWT_SECRET are set.
- If GitHub language stats appear missing or 500s, check Redis connectivity or GITHUB_USERNAME in the envs.
- For Cloudinary uploads, ensure the API secret is only set in the server `.env` (never expose secrets in the client).

--- 
