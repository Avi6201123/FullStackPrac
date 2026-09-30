# Backend Setup

Express and MongoDB API for the Relayboard role-based access control dashboard.

## Requirements

- Node.js 20.19 or newer and npm
- MongoDB Atlas or a local MongoDB server

## Configure

Copy `.env.example` to `.env`. Set `MONGODB_URI` to your MongoDB connection string and replace `JWT_SECRET` with a long, private random value. `PORT` defaults to `3000`; `FRONTEND_URL` defaults to the Vite development origin. Keep `.env` and any credential files private and out of source control.

For Atlas, configure a database user with access to the target database and allow your development IP address in Network Access. URL-encode special characters in the URI username or password.

## Install and Run

From this directory:

```powershell
npm install
npm run dev
```

Use `npm start` to start without nodemon. The health endpoint is `http://localhost:3000/api/health`.

## API and Access

- Authentication: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Items: `GET /api/items`, `GET /api/items/:id`, `POST /api/items`, `PUT /api/items/:id`, `DELETE /api/items/:id`
- Admin user management: `GET /api/users`, `PUT /api/users/:id/role`

Editors and admins may create items; editors may edit only their own items; only admins may delete items or manage user roles. Viewers have read access only. The API seeds the development accounts and sample items only when the users collection is empty.

See the [project submission report](../README.md) for demo credentials, the complete role test procedure, and frontend setup.