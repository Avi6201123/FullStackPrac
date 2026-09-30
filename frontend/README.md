# Frontend Setup

Vue 3 dashboard for the Relayboard role-based access control application. The project includes its Axios API service and dependencies in `package.json`.

## Configure and Run

From this directory, create the local environment file, install packages, and start Vite:

npm install
npm run dev

The template sets `VITE_API_URL` to `http://localhost:3000/api`. Change it in `.env` only when the backend uses a different API base URL. Start the backend separately before signing in. The Vite development URL is normally `http://localhost:5173`.

## Included UI Features

- Login and saved authenticated session
- Role-specific dashboard and navigation
- Searchable item list and item forms for permitted roles
- Admin-only people and role management view

See the [project submission report](../README.md) for backend configuration, demonstration credentials, implemented permissions, and testing steps.