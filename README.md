# Role-Based Access Control Dashboard

## Practical Submission Report

**Application:** Relayboard Dashboard  
**Stack:** Vue 3, Node.js, Express, MongoDB  
**Objective:** Demonstrate authentication and role-based authorization in a full-stack application.

## Project Contents

- `backend/` contains the Express server, authentication and authorization middleware, API routes, MongoDB models, connection setup, environment template, and backend setup guide.
- `frontend/` contains the Vue application, Axios API service, frontend environment template, and package manifest.
- This document describes the application, setup, features, and role testing.

## Features Implemented

- JWT login and authenticated current-user lookup
- bcryptjs password hashing for seeded demonstration accounts
- MongoDB persistence for users and items
- Admin, editor, and viewer roles with server-enforced permissions
- Role-aware dashboard and navigation
- Item listing, detail retrieval, creation, editing, deletion, and search
- Admin-only user listing and role changes
- Responsive Vue interface and user-facing request errors
- Environment-variable templates for both application parts

## Role Access

| Capability | Admin | Editor | Viewer |
| --- | :---: | :---: | :---: |
| Read all items | Yes | Yes | Yes |
| Dashboard statistics | Full | Limited | Limited |
| Create items | Yes | Yes | No |
| Edit items | Any item | Own items only | No |
| Delete items | Yes | No | No |
| List users or change roles | Yes | No | No |

The UI hides unavailable controls, and the API independently rejects unauthorized requests. User roles are reloaded from MongoDB for protected requests so role changes take effect without waiting for a JWT to expire.

## Database

The `users` collection stores a unique username, bcrypt password hash, role (`admin`, `editor`, or `viewer`), and creation timestamp. The `items` collection stores a title, description, creator reference, and creation timestamp. The API seeds demo users and sample items only when the users collection is empty.

## Setup and Run

Requirements: Node.js 20.19 or newer, npm, and MongoDB Atlas or a local MongoDB server.

### 1. Configure and start the backend

In PowerShell, open the backend folder and create a local environment file from the template:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` locally. Set `MONGODB_URI` to your Atlas connection string and replace `JWT_SECRET` with a long random secret. Keep real credentials private. For Atlas, ensure the database user has access and the client IP is allowed in Network Access. Then run:

```powershell
npm install
npm run dev
```

The API listens on port `3000` by default. Confirm it is responding at `http://localhost:3000/api/health`.

### 2. Configure and start the frontend

Open a second PowerShell terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend uses `VITE_API_URL`, defaulting to `http://localhost:3000/api`. Open the Vite URL printed in the terminal, usually `http://localhost:5173`. Keep both servers running. See [frontend setup](frontend/README.md) for details.

Backend-specific setup is also documented in [backend setup](backend/README.md).

## Demo Credentials

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Editor | `editor` | `editor123` |
| Viewer | `viewer` | `viewer123` |

These are development-only credentials. They are created only when the connected users collection has no users. If the collection already contains users and the demo accounts are missing, sign in using an existing account or prepare an empty development database.

## Testing Instructions

1. Start MongoDB, the backend, and the frontend. Confirm the backend reports a database connection and `/api/health` returns `ok`.
2. Sign in as Admin. Confirm full statistics, all item actions, the People view, and the ability to change user roles.
3. Sign in as Editor. Confirm all items are readable, new items can be created, and only items created by that editor can be edited. Confirm delete and People controls are unavailable.
4. Sign in as Viewer. Confirm items are readable and all item-write and user-management controls are unavailable.
5. Verify API enforcement: forbidden authenticated actions return HTTP `403`; unauthenticated protected requests return HTTP `401`.
6. Sign out and sign in as another role. Refresh after signing in to check restoration of a valid saved session.

### API Routes

All routes use the `/api` prefix. Authentication routes are `POST /auth/login`, `POST /auth/logout`, and `GET /auth/me`. Item routes are `GET /items`, `GET /items/:id`, `POST /items`, `PUT /items/:id`, and `DELETE /items/:id`. Admin user routes are `GET /users` and `PUT /users/:id/role`. The health route is `GET /health`.

## Demo Evidence

No screenshot or recording is currently included. Before submission, capture the running application and add the evidence to the submission folder. Suggested screenshots are the sign-in page, the admin dashboard and People view, the editor view showing own-item edit access, and the viewer read-only view. A short recording may be submitted instead, showing sign-in and the different role permissions. Do not include environment files or database credentials in screenshots or recordings.

## Security Note

This is a learning project, not a production authentication system. The sample credentials are public. Use a private JWT secret and database URI, and do not use demo credentials with real data. The frontend stores its JWT in local storage; logout clears it client-side and the API does not implement token revocation.