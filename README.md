# Project Dashboard

A full-stack dashboard application for managing projects. 

## Project Structure

This repository contains a full-stack web application separated into a frontend client and a backend server:

- **`client/`**: The frontend application built with React and Vite. It uses Tailwind CSS and Material UI for styling, and Axios for API communication.
- **`server/`**: The backend RESTful API built with Node.js, Express, and MongoDB (via Mongoose).

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

### Backend (Server) Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory for your environment variables (e.g., `PORT`, `MONGO_URI`).
4. Start the server in development mode using nodemon:
   ```bash
   npm run dev
   ```

### Frontend (Client) Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Technologies Used

**Client:**
- React 19
- Vite
- Tailwind CSS
- Material UI
- React Router DOM
- Lucide React
- Axios

**Server:**
- Node.js
- Express
- MongoDB & Mongoose
- CORS
- dotenv
