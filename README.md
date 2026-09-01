# Instant Mechanic

Instant Mechanic is a full-stack operations dashboard for coordinating roadside vehicle-service bookings. It gives administrators and operations staff a live view of customers, mechanics, services, booking progress, notifications, revenue, and performance.

## Features and technology

- JWT authentication, protected routes, and session restoration
- Live dashboard metrics, booking management, customer and mechanic profiles
- Date-filtered analytics, notifications, Socket.IO updates, and dark mode
- **Frontend:** React, Vite, JavaScript, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Zod, Socket.IO

## Architecture and folders

The React SPA calls the Express REST API through Axios and connects through authenticated Socket.IO. Controllers use Mongoose models backed by MongoDB.

```text
instantMechanic/
├── backend/
│   └── src/
│       ├── config/       # Environment and database setup
│       ├── controllers/  # REST handlers
│       ├── middleware/   # Authentication and errors
│       ├── models/       # Mongoose models
│       ├── routes/       # API routes
│       ├── seed/         # Demo data
│       ├── services/     # Booking side effects
│       └── sockets/      # Real-time events
└── frontend/
    └── src/
        ├── components/   # Shared UI and charts
        ├── context/      # Authentication and theme
        ├── hooks/        # Data and Socket.IO hooks
        ├── layouts/      # Protected app shell
        ├── pages/        # Route pages
        └── services/     # API clients
```

## Local setup

Node.js 20 or newer and a MongoDB database are required.

1. Run `npm install` inside both `backend` and `frontend`.
2. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
3. Configure MongoDB and seed the demo database with `npm run seed` inside `backend`.
4. Start the API with `npm start` inside `backend`.
5. Start Vite with `npm run dev` inside `frontend`.

The API defaults to `http://localhost:5000/api`; Vite defaults to `http://localhost:5173`.

## Environment variables

Backend:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment |
| `PORT` | Express and Socket.IO port |
| `CLIENT_URL` | Allowed frontend origin |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token lifetime, such as `7d` |

Frontend:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, such as `http://localhost:5000/api` |

Never expose backend secrets through `VITE_` variables. Local `.env` files are ignored by Git.

## MongoDB and demo data

Set `MONGODB_URI` to a reachable MongoDB deployment, then run `npm run seed` in `backend`. Seeding resets the application collections and creates demo users, customers, mechanics, services, bookings, and notifications.

## Authentication

The seeded accounts use password `InstantMechanic2026!`:

- Administrator: `admin@instantmechanic.test`
- Operations: `operations@instantmechanic.test`

Passwords are stored as bcrypt hashes. Login returns a JWT used for protected REST requests and the Socket.IO handshake.

## API and Socket.IO overview

Operational endpoints are under `/api` and require JWT authentication, except health and login:

- `/health`, `/auth/login`, `/auth/me`, `/dashboard`
- `/bookings`, `/customers`, `/mechanics`, and `/services`
- `/notifications` and `/analytics`

Socket.IO emits `booking:created`, `booking:updated`, `booking:statusChanged`, and `notification:new`.

## Production notes

- Configure production `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and `VITE_API_URL` values in the hosting platform.
- Build the frontend with `npm run build` and deploy `frontend/dist/` to a static host.
- Run the backend with `npm start` on a Node.js host with WebSocket support.
- Use HTTPS, a strong unique JWT secret, and the exact production frontend origin for `CLIENT_URL`.
- Never commit `.env` files.
