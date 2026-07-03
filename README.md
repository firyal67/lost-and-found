# Lost & Found Tunisia

A web platform to help people in Tunisia declare and find lost or found items — CIN, passports, phones, keys, and more.

## Overview

Lost & Found Tunisia connects people who have lost objects with those who have found them. Key features include:

- **User registration & authentication** — secure accounts with JWT + refresh tokens
- **Post announcements** — declare a lost or found item with location, date, and description
- **Search & filters** — browse announcements by type, city, object type, and date range
- **Privacy protection** — CIN and passport numbers are never stored in full
- **Matching engine** — automatic suggestions when a lost item matches a found one
- **Secure contact** — contact requests with approval flow, no direct data exposure
- **Admin dashboard** — moderation, reports management, user banning
- **Role-based access control** — guest, user, and admin roles

## Tech Stack

### Frontend
- **Next.js 14** (App Router) + **TypeScript**
- **TailwindCSS** + **Shadcn UI**
- **Redux Toolkit** — global state management
- **React Hook Form** + **Zod** — form validation
- **Fetch API** — native HTTP client (no external dependency)

### Backend
- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** + **bcryptjs** — authentication & password hashing
- **express-validator** — input validation & sanitization

## Runtime Versions

| Tool | Version |
|---|---|
| Node.js | >= 18.x |
| npm | >= 9.x |
| MongoDB | >= 6.x |

## Project Structure

```
lost-found-tunisia/
├── backend/          # Node.js REST API
├── frontend/         # Next.js application
└── docs/
    └── conception/   # Architecture and design documents
```

## Frontend Setup

```bash
cd frontend
npm install
```

Copy the environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Backend Setup

```bash
cd backend
npm install
```

Copy the environment file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lostandfound
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create a user account | — |
| POST | `/login` | Sign in | — |
| POST | `/logout` | Sign out | ✓ |
| POST | `/refresh` | Renew access token | Cookie |
| POST | `/forgot-password` | Request password reset | — |
| POST | `/reset-password` | Reset password | Token |

### Posts — `/api/posts`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | List announcements (paginated + filters) | — |
| GET | `/:id` | Get announcement detail | — |
| POST | `/` | Create an announcement | ✓ |
| PUT | `/:id` | Update an announcement | ✓ owner |
| PATCH | `/:id/status` | Change status | ✓ owner |
| DELETE | `/:id` | Delete an announcement | ✓ owner/admin |
| GET | `/:id/matches` | Get matching suggestions | ✓ |

### Contacts — `/api/contacts`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Send a contact request | ✓ |
| GET | `/` | Get my contact requests | ✓ |
| PATCH | `/:id` | Approve or reject a request | ✓ owner |

### Reports — `/api/reports`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Report an announcement | ✓ |
| GET | `/` | List reports (admin) | ✓ admin |
| PATCH | `/:id` | Handle a report | ✓ admin |

### Admin — `/api/admin`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users` | List users | ✓ admin |
| PATCH | `/users/:id/ban` | Ban a user | ✓ admin |
| PATCH | `/users/:id/unban` | Unban a user | ✓ admin |
| GET | `/stats` | Platform metrics | ✓ admin |
| GET | `/audit` | Audit log | ✓ admin |

### Response format

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "errors": [...] }
```

## Known Limitations

- Email verification (US-05) is not yet implemented — accounts are active immediately after registration
- Password reset flow (US-06) is scaffolded but not fully implemented
- Photo upload (US-14) storage strategy is not yet decided (local vs Cloudinary)
- The matching engine (US-24) algorithm is planned for Sprint 3
- Email notifications are not yet implemented

## Suggested Next Improvements

- Add email verification on registration
- Implement the matching score algorithm with weighted fields (type, city, date, keywords)
- Add real-time notifications using WebSockets or Server-Sent Events
- Integrate Cloudinary for photo uploads
- Add end-to-end tests (Cypress or Playwright)
- Set up CI/CD pipeline (GitHub Actions)

## Security Notes

- Never commit `.env` files — use `.env.example` as a template
- JWT secrets must be strong random strings in production
- Refresh tokens are stored as httpOnly cookies — not accessible via JavaScript
- All user inputs are validated and sanitized before reaching the database
- CIN and passport numbers are never stored in full — only masked versions (e.g. `****5678`)

## License

MIT
