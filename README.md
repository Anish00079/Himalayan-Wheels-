# Himalayan Wheels

A full-stack car rental demonstration built with **React, Vite, Express, and SQLite**. Browse six demo vehicles, search availability, create an account, reserve a car, and manage bookings. Rates are in NPR. No real rental is issued and no online payment is collected.

Repository: https://github.com/Anish00079/Himalayan-Wheels-

Website preview: https://anish00079.github.io/Himalayan-Wheels-/

The GitHub Pages preview uses an explicitly labelled browser-only demo workspace. It does not collect passwords, issue real rentals, or share bookings between visitors. **Continue as demo traveller** to try reservations. The normal local/server build uses the real Express API, authenticated accounts, and SQLite instead. Preview mode is enabled only at build time with `VITE_PREVIEW=true`.

## Quick start

Install **Node.js 24 or newer**, open a terminal in this folder, and run:

```sh
npm ci
npm run build
npm start
```

Open **http://localhost:3001**. Browse without an account. Click **Sign in → Create an account** when ready to book. There is no shared default password or administrator account.

For development, use `npm run dev` and open http://localhost:5173. Stop any existing server on port 3001 first. The frontend forwards `/api` requests to the backend.

## Features

- Public fleet with SUV, sedan, hatchback, and electric categories.
- Search by model, category filters, and price sorting.
- Kathmandu, Pokhara, and Chitwan pickup and return options.
- Date-based availability and rental periods of 1–30 days.
- Registration, login, seven-day sessions, and logout.
- Server-calculated totals and transaction-protected overlap checks.
- Private booking history and cancellation before the pickup date.
- Responsive layouts, labelled forms, and keyboard-accessible dialogs.
- Password hashing, rate limiting, session-token hashing, request-header verification, security headers, and parameterized SQL.

## Booking rules

The end date is exclusive: a booking from October 1 to October 4 costs three daily rates. Return and pickup on the same date can be adjacent reservations. No time-of-day selection or turnaround buffer is modeled. Dates use the Asia/Kathmandu calendar. Pickup and return locations are identical. One record represents one physical vehicle; choosing another city does not create extra inventory. Fleet allocation between cities is an educational simplification.

The server rechecks availability when confirming. Submitted client totals are ignored. Cancelling a future reservation releases its dates, while retaining the booking history. Online cancellation closes on the pickup date. Payment, fuel, charging, deposits, insurance, and license checks are not processed by the application.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Vite and the API together |
| `npm run build` | Build the React frontend into `dist/` |
| `npm start` | Serve frontend and API from port 3001 |
| `npm test` | Test API behavior using a disposable database |

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address; use `0.0.0.0` in a container |
| `DB_PATH` | `data/himalayan-wheels.sqlite` | Persistent SQLite file |
| `NODE_ENV` | unset | `production` enables secure cookies and HTTPS security headers |
| `TRUST_PROXY` | unset | Set `1` only behind exactly one trusted reverse proxy |

These are process environment variables. `.env` files are not automatically loaded. Use HTTPS when `NODE_ENV=production`. Back up the whole data directory while the server is stopped; do not commit databases, sessions, or secrets.

## File organization

```text
src/
  main.jsx              Screens, reusable components, original SVG artwork, API client
  preview-api.js        Browser-only adapter for the labelled Pages preview
  styles.css            Desktop and mobile layouts
shared/fleet.js          Sample fleet shared by the server seed and preview
server/
  app.js                Public fleet, authentication, and protected booking API
  db.js                 Schema, indexes, and demo fleet seed
  index.js              Server startup and shutdown
tests/api.test.js       Rental and authentication integration tests
docs/                   Academic report, editable source, and screenshots
.github/workflows/ci.yml Automated test and build checks
Dockerfile              Container deployment definition
vite.config.js          Frontend build and development proxy
```

## API summary

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| GET | `/api/cars?start=YYYY-MM-DD&end=YYYY-MM-DD` | Public | Fleet and optional availability |
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Start session |
| GET | `/api/auth/me` | Signed in | Current user |
| POST | `/api/auth/logout` | Signed in | End session |
| GET | `/api/bookings` | Signed in | Own booking history |
| POST | `/api/bookings` | Signed in | Reserve vehicle |
| PATCH | `/api/bookings/:id/cancel` | Owner | Cancel future reservation |

Write requests require `Content-Type: application/json` and `X-Himalayan-Wheels: 1`. The browser sends the HttpOnly session cookie automatically. Cross-origin API access is not enabled.

## Publish and host

This repository contains the application source and project report. GitHub Pages hosts the browser-only preview through `.github/workflows/pages.yml`. It cannot run this Express API or SQLite database. Full-stack hosting remains a separate step.

The included Dockerfile supports a future server deployment. Build with `docker build -t himalayan-wheels .`; for a local HTTP smoke test run `docker run --rm -p 3001:3001 -e NODE_ENV=development -v wheels-data:/app/data himalayan-wheels`. For public hosting, use HTTPS, production cookies, persistent storage mounted at `/app/data`, appropriate backups, and monitoring. Only enable `TRUST_PROXY=1` when your deployment actually has one trusted proxy. Multi-instance hosting needs a coordinated external database and revised persistence design. Docker deployment is provided as a starting configuration; only the native Node build and tests have been executed for this delivery.

## Report

See `docs/Himalayan-Wheels-Project-Report.pdf`. Its editable Markdown source is `docs/Project-Report.md`. Replace the author, college, course, supervisor, and roll number fields before academic submission. Screenshots use a demonstration account and illustrative vehicle specifications; listed rates are sample data, not verified market rates.

## Technical references

- [React documentation](https://react.dev/learn)
- [Express documentation](https://expressjs.com/en/starter/installing/)
- [Node SQLite API](https://nodejs.org/api/sqlite.html)
- [Vite documentation](https://vite.dev/guide/)
- [SQLite transactions](https://www.sqlite.org/lang_transaction.html)

Vehicle and landscape illustrations are original SVG artwork included in the source; no external image or font service is required at runtime.
