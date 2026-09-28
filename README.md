# Himalayan Wheels

A full-stack car rental demonstration built with **React, Vite, Express, and SQLite**. Browse six demo vehicles, search availability, create an account, reserve a car, and manage bookings. Rates are in NPR. No real rental is issued and no online payment is collected.

Repository: https://github.com/Anish00079/Himalayan-Wheels-

Website preview: https://anish00079.github.io/Himalayan-Wheels-/

The GitHub Pages preview uses an explicitly labelled browser-only demo workspace. It does not collect passwords, issue real rentals, or share bookings between visitors. **Sign in → User → Continue as demo traveller** to try reservations. Sign out, then use **Owner login → Continue as demo owner** to see those orders in the same browser. The owner demo is a role preview, not secure staff authentication. The normal local/server build uses the real Express API, authenticated accounts, and SQLite instead. Preview mode is enabled only at build time with `VITE_PREVIEW=true`.

## Hosted backend (no personal PC required)

The project now includes a Supabase backend integration: hosted authentication, a shared PostgreSQL database, customer booking privacy, and owner order access. **It is not activated yet:** no Supabase project/account is connected. The current GitHub site remains the clearly labelled browser demo.

Follow [Cloud setup](docs/Cloud-Setup.md) to connect a project. Run `supabase/setup.sql` in its SQL Editor, then add the public project URL and publishable key as repository variables. The Pages workflow switches to real online accounts automatically when configured. This mode does not run the Express server or SQLite on your computer.

## Optional local development

Install **Node.js 24 or newer**, open a terminal in this folder, and run:

```sh
npm ci
npm run build
npm start
```

Open **http://localhost:3001**. Browse without an account. Click **Sign in → Create an account** when ready to book. Owner accounts are created with the setup command below. There is no shared default password.

For development, use `npm run dev` and open http://localhost:5173. Stop any existing server on port 3001 first. The frontend forwards `/api` requests to the backend.

## Owner setup for the optional local backend

Run this command in the project folder, using the same `DB_PATH` as the server if you customized it:

```sh
npm run owner:create
```

Enter the owner name, email, and a password of 12–128 characters. Password input is hidden and must be confirmed. Use a separate email from an existing customer account. The command never promotes or overwrites an existing account.

Open the locally running website and choose **Owner login**, then enter the owner credentials. The dashboard displays all customer orders with customer names, emails, car, dates, location, total, and status. Search, filter by status, and use **Refresh orders** after a customer books or cancels. Confirmed booking value is not a record of received payments.

Customers use **Sign in → User → Create an account** and book through the fleet. Only customers create reservations; owners review orders. Public registration always creates a customer, regardless of any submitted role. Owner authorization is enforced by the backend. Older databases automatically gain customer roles while retaining existing accounts and bookings.

## Features

- Public fleet with SUV, sedan, hatchback, and electric categories.
- Four colour photos per car, thumbnail galleries, six specification fields, and vehicle-specific trip notes.
- Search by model, category filters, and price sorting.
- Kathmandu, Pokhara, and Chitwan pickup and return options.
- Date-based availability and rental periods of 1–30 days.
- Customer registration, user/owner login, seven-day sessions, and logout.
- Owner dashboard with all customer orders, status filters, search, and booking totals.
- Destination selection and vehicle-type search, with a compact rental layout inspired by the supplied [Sajilo Rental reference](https://sajilorental.com/).
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
| `npm run owner:create` | Create a local owner account interactively |
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
  main.jsx              Screens, reusable components, vehicle photos, API client
  CarDetails.jsx        Colour photo galleries and vehicle information
  cloud-api.js          Supabase authentication and booking adapter
  OwnerDashboard.jsx    Owner order summary, search, filters and table
  preview-api.js        Browser-only adapter for the labelled Pages preview
  styles.css            Desktop and mobile layouts
shared/fleet.js          Sample fleet shared by the server seed and preview
server/
  app.js                Public fleet, authentication, and protected booking API
  db.js                 Schema, indexes, and demo fleet seed
  owners.js             Local owner account provisioning
  create-owner.js       Interactive setup command
  passwords.js          Shared password hashing and verification
  index.js              Server startup and shutdown
tests/api.test.js       Rental and authentication integration tests
tests/owner.test.js     Role permissions, migration and order access tests
tests/cloud.test.js     Hosted schema, row security and booking rules
supabase/setup.sql     Cloud database, access policies and booking functions
scripts/cloud-config.js Prevent private keys or incomplete cloud builds
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
| GET | `/api/owner/bookings` | Rental owner | All customer booking orders |
| POST | `/api/bookings` | Customer | Reserve vehicle |
| PATCH | `/api/bookings/:id/cancel` | Booking customer | Cancel future reservation |

Write requests require `Content-Type: application/json` and `X-Himalayan-Wheels: 1`. The browser sends the HttpOnly session cookie automatically. Cross-origin API access is not enabled.

## Publish and host

This repository contains the application source and project report. GitHub Pages hosts the browser-only preview through `.github/workflows/pages.yml`. It cannot run this Express API or SQLite database. Supabase cloud mode is supported without a separate Node host; activation requires a Supabase project. See the cloud setup guide.

The included Dockerfile supports a future server deployment. Build with `docker build -t himalayan-wheels .`; for a local HTTP smoke test run `docker run --rm -p 3001:3001 -e NODE_ENV=development -v wheels-data:/app/data himalayan-wheels`. For public hosting, use HTTPS, production cookies, persistent storage mounted at `/app/data`, appropriate backups, and monitoring. Only enable `TRUST_PROXY=1` when your deployment actually has one trusted proxy. Multi-instance hosting needs a coordinated external database and revised persistence design. Docker deployment is provided as a starting configuration; only the native Node build and tests have been executed for this delivery.

## Report

See `docs/Himalayan-Wheels-Project-Report.pdf`. Its editable Markdown source is `docs/Project-Report.md`. Replace the author, college, course, supervisor, and roll number fields before academic submission. Screenshots use a demonstration account and illustrative vehicle specifications; listed rates are sample data, not verified market rates.

## Technical references

- [React documentation](https://react.dev/learn)
- [Express documentation](https://expressjs.com/en/starter/installing/)
- [Node SQLite API](https://nodejs.org/api/sqlite.html)
- [Vite documentation](https://vite.dev/guide/)
- [SQLite transactions](https://www.sqlite.org/lang_transaction.html)

Vehicle photos are sourced from [Meromoto](https://meromoto.com/) at the project owner's request. See `docs/Image-Credits.md` for individual source links. The photos are bundled locally under `public/cars/`; no external image or font service is required at runtime. The interface uses white surfaces, charcoal text and a rust-orange accent, with full-colour vehicle photos. The search form leads directly to the fleet; pickup locations and rental terms follow below. The academic report stays black and white. Six four-photo galleries use images from matching Meromoto listings; rental specifications remain sample configurations.
