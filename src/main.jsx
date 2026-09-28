import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Mountain,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  CalendarDays,
  Search,
  Users,
  Gauge,
  Fuel,
  Check,
  ShieldCheck,
  KeyRound,
  Leaf,
  X,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
  Menu,
  CarFront,
  Route,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import "./styles.css";
import { previewApi } from "./preview-api.js";
const isPreview = import.meta.env.VITE_PREVIEW === "true";

async function api(path, method = "GET", body) {
  if (isPreview) return previewApi(path, method, body);
  const r = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json", "X-Himalayan-Wheels": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const addDays = (date, n) =>
  new Date(Date.parse(date) + n * 86400000).toISOString().slice(0, 10);
const money = (n) => new Intl.NumberFormat("en-NP").format(n);
const dateLabel = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function Logo() {
  return (
    <span className="logo">
      <span className="logo-icon">
        <Mountain size={28} strokeWidth={1.6} />
      </span>
      <span>
        HIMALAYAN<span>WHEELS</span>
      </span>
    </span>
  );
}
function CarArt({ color = "#bdc5bd", type = "SUV", id = "car", hero = false }) {
  const suv = type === "SUV",
    compact = type === "Hatchback";
  return (
    <svg
      viewBox="0 0 600 300"
      role="img"
      aria-label={`${type} vehicle illustration`}
      className={hero ? "hero-car" : "car-art"}
    >
      <defs>
        <linearGradient id={id + "paint"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset=".65" stopColor={color} />
          <stop offset="1" stopColor="#27332f" />
        </linearGradient>
        <linearGradient id={id + "glass"} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a5b8b5" />
          <stop offset=".4" stopColor="#52645f" />
          <stop offset="1" stopColor="#263c36" />
        </linearGradient>
      </defs>
      <ellipse
        cx="301"
        cy="251"
        rx="239"
        ry="17"
        fill="#10261d"
        opacity=".13"
      />
      <path
        d={
          suv
            ? "M58 189 L90 170 L148 101 Q160 90 188 87 L345 87 Q370 90 414 146 L495 158 Q526 164 538 190 L542 223 Q540 237 510 239 L90 239 Q60 238 55 219Z"
            : `M58 193 L96 172 L166 119 Q183 106 210 104 L329 104 Q355 108 405 154 L${compact ? 460 : 490} 169 Q531 178 540 201 L536 225 Q534 239 506 239 L89 239 Q63 237 55 219Z`
        }
        fill={`url(#${id}paint)`}
        stroke="#344039"
        strokeWidth="2"
      />
      <path
        d={
          suv
            ? "M115 165 L162 108 Q168 102 189 101 L239 101 L239 164Z"
            : "M121 168 L174 126 Q187 115 209 115 L240 115 L240 167Z"
        }
        fill={`url(#${id}glass)`}
        stroke="#2c3d35"
        strokeWidth="5"
      />
      <path
        d={
          suv
            ? "M252 101 L339 101 Q361 102 397 151 L402 162 L252 164Z"
            : "M252 115 L324 115 Q345 116 389 157 L398 166 L252 167Z"
        }
        fill={`url(#${id}glass)`}
        stroke="#2c3d35"
        strokeWidth="5"
      />
      <path
        d="M291 107 L330 163 M172 114 L144 158"
        stroke="#dce9db"
        opacity=".32"
        strokeWidth="8"
      />
      <path
        d="M71 185 L411 177 L507 184"
        fill="none"
        stroke="#fff"
        opacity=".3"
        strokeWidth="3"
      />
      <path
        d="M246 173 L244 226 M410 173 L427 227"
        fill="none"
        stroke="#1d3028"
        opacity=".42"
        strokeWidth="2"
      />
      <rect x="266" y="180" width="29" height="5" rx="2" fill="#293a31" />
      <rect x="126" y="180" width="26" height="5" rx="2" fill="#293a31" />
      <path
        d="M400 163 L412 157 Q428 156 429 168 L424 176 L405 174Z"
        fill={color}
        stroke="#35473a"
        strokeWidth="2"
      />
      <path d="M501 181 L529 191 L534 205 L501 201Z" fill="#eff2d9" />
      <path d="M61 190 L79 184 L78 205 L57 209Z" fill="#b64b33" />
      <path d="M503 210 L538 215 L534 226 L503 227Z" fill="#22372e" />
      <path d="M204 231 L373 231" stroke="#21372b" strokeWidth="12" />
      <g fill="#1b2621" stroke="#34443b" strokeWidth="3">
        <circle cx="153" cy="230" r="42" />
        <circle cx="435" cy="230" r="42" />
      </g>
      {[153, 435].map((x) => (
        <g key={x}>
          <circle cx={x} cy="230" r="27" fill="#afb7aa" />
          <circle cx={x} cy="230" r="21" fill="#394a40" />
          {[0, 60, 120].map((a) => (
            <path
              key={a}
              d={`M${x - 23} 230 H${x + 23}`}
              stroke="#bac3b5"
              strokeWidth="7"
              transform={`rotate(${a} ${x} 230)`}
            />
          ))}
          <circle cx={x} cy="230" r="7" fill="#64756a" />
        </g>
      ))}
      {suv && <path d="M162 82 L343 82" stroke="#3b4d42" strokeWidth="5" />}
    </svg>
  );
}
function Landscape() {
  return (
    <svg
      className="landscape"
      viewBox="0 0 1400 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#bdc9b9" />
          <stop offset="1" stopColor="#e0e1c9" />
        </linearGradient>
        <linearGradient id="hill" x2="0" y2="1">
          <stop stopColor="#6e8571" />
          <stop offset="1" stopColor="#213e31" />
        </linearGradient>
      </defs>
      <rect width="1400" height="640" fill="url(#sky)" />
      <circle cx="1020" cy="126" r="66" fill="#f8efcd" opacity=".7" />
      <path
        d="M0 365 L260 220 L348 260 L590 45 L760 248 L910 89 L1090 274 L1248 177 L1400 330 V640 H0Z"
        fill="#8d9d8c"
      />
      <path
        d="M417 204 L590 45 L699 181 L630 151 L598 184 L567 136 L501 180 L481 164Z M826 178 L910 89 L1009 205 L942 171 L924 190 L888 151Z"
        fill="#e8e9da"
      />
      <path
        d="M0 443 Q257 260 497 349 T1004 344 T1400 314 V640 H0Z"
        fill="#728672"
      />
      <path
        d="M0 469 Q269 344 639 450 Q1020 348 1400 458 V640 H0Z"
        fill="url(#hill)"
      />
      <path
        d="M1130 407 Q932 473 1282 524 Q1380 538 1130 640 H615 Q1250 540 1024 518 Q795 488 1068 407Z"
        fill="#afb3a0"
      />
      <path
        d="M1105 411 Q872 479 1180 523 Q1287 556 893 640"
        fill="none"
        stroke="#f2e7b9"
        strokeWidth="3"
        strokeDasharray="17 24"
      />
      <path d="M0 551 Q369 424 655 610 L570 640 H0Z" fill="#203e30" />
      <g fill="#254532">
        <path d="M1290 218 L1249 347 H1276 L1227 412 H1350 L1313 347 H1338Z" />
        <path d="M1380 241 L1350 344 H1366 L1327 420 H1430 L1399 344 H1410Z" />
      </g>
    </svg>
  );
}
function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      className={wide ? "wide-modal" : ""}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Auth({ onClose, onLogin }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (isPreview)
    return (
      <Modal title="Try the demo workspace" onClose={onClose}>
        <p className="muted">
          Explore booking and cancellation without creating an account. Preview
          reservations stay in this browser and are not shared with other
          visitors.
        </p>
        <p className="muted">No password or payment information is needed.</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary full"
          onClick={async () => {
            try {
              const data = await api("/auth/login", "POST");
              onLogin(data.user);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Continue as demo traveller
          <ArrowRight size={17} />
        </button>
      </Modal>
    );
  return (
    <Modal
      title={register ? "Your next journey starts here" : "Welcome back"}
      onClose={onClose}
    >
      <p className="muted">
        {register
          ? "Create an account to book your next ride."
          : "Sign in to reserve a car and manage your bookings."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const data = await api(
              "/auth/" + (register ? "register" : "login"),
              "POST",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            onLogin(data.user);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              placeholder="Your name"
              autoFocus
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 8 : 1}
            maxLength={128}
            required
            placeholder={register ? "At least 8 characters" : "Your password"}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        {register ? "Already have an account?" : "New around here?"}{" "}
        <button
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "Sign in" : "Create an account"}
        </button>
      </p>
    </Modal>
  );
}
function Booking({ car, trip, user, onClose, onSignIn, onBooked }) {
  const [details, setDetails] = useState(trip),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const days = (Date.parse(details.end) - Date.parse(details.start)) / 86400000;
  const valid =
    Number.isFinite(days) && days > 0 && days <= 30 && details.start >= today();
  return (
    <Modal title="Make this journey yours" onClose={onClose} wide>
      <div className="booking-grid">
        <div className="booking-car">
          <span className="eyebrow">
            {car.category} • {car.transmission}
          </span>
          <h3>{car.name}</h3>
          <CarArt color={car.color} type={car.category} id="booking" />
          <p>{car.description}</p>
          <div className="specs">
            <span>
              <Users size={15} />
              {car.seats} seats
            </span>
            <span>
              <Fuel size={15} />
              {car.fuel}
            </span>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user) {
              onSignIn(details);
              return;
            }
            setBusy(true);
            setError("");
            try {
              await api("/bookings", "POST", {
                car_id: car.id,
                pickup: details.pickup,
                start_date: details.start,
                end_date: details.end,
              });
              await onBooked();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Pickup and return location
            <select
              value={details.pickup}
              onChange={(e) =>
                setDetails({ ...details, pickup: e.target.value })
              }
            >
              {["Kathmandu", "Pokhara", "Chitwan"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Pickup date
              <input
                type="date"
                value={details.start}
                min={today()}
                required
                onChange={(e) =>
                  setDetails({ ...details, start: e.target.value })
                }
              />
            </label>
            <label>
              Return date
              <input
                type="date"
                value={details.end}
                min={details.start ? addDays(details.start, 1) : today()}
                required
                onChange={(e) =>
                  setDetails({ ...details, end: e.target.value })
                }
              />
            </label>
          </div>
          <div className="price-summary">
            <div>
              <span>
                NPR {money(car.price)} × {valid ? days : "—"} day
                {days === 1 ? "" : "s"}
              </span>
              <span>NPR {valid ? money(car.price * days) : "—"}</span>
            </div>
            <div className="total">
              <strong>Total rental</strong>
              <strong>NPR {valid ? money(car.price * days) : "—"}</strong>
            </div>
            <small>Pay at pickup. No online payment is collected.</small>
          </div>
          <p className="terms">
            Rental periods are 1–30 days, with pickup and return at the same
            location. Cancel online before your pickup date. Fuel, charging and
            any deposit are not collected by this demo.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary full" disabled={busy || !valid}>
            {busy
              ? "Reserving…"
              : user
                ? "Confirm reservation"
                : "Sign in to reserve"}
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [cars, setCars] = useState([]),
    [bookings, setBookings] = useState([]),
    [page, setPage] = useState("home"),
    [auth, setAuth] = useState(false),
    [bookingCar, setBookingCar] = useState(null),
    [cancel, setCancel] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [category, setCategory] = useState("All cars"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("featured"),
    [mobile, setMobile] = useState(false),
    [datesApplied, setDatesApplied] = useState(false),
    [trip, setTrip] = useState({
      pickup: "Kathmandu",
      start: addDays(today(), 1),
      end: addDays(today(), 4),
    });
  async function loadCars(dates) {
    const data = await api(
      "/cars" +
        (dates
          ? `?start=${encodeURIComponent(dates.start)}&end=${encodeURIComponent(dates.end)}`
          : ""),
    );
    setCars(data.cars);
  }
  async function loadBookings() {
    const d = await api("/bookings");
    setBookings(d.bookings);
  }
  useEffect(() => {
    loadCars()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user) loadBookings().catch((e) => setError(e.message));
  }, [user]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function nav(where) {
    setMobile(false);
    if (where === "bookings") {
      if (!user) {
        setAuth(true);
        return;
      }
      setPage("bookings");
      loadBookings().catch((e) => setError(e.message));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPage("home");
      setTimeout(
        () =>
          document
            .getElementById(where)
            ?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    }
  }
  const visible = cars
    .filter(
      (c) =>
        (category === "All cars" || category === c.category) &&
        c.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  async function checkAvailability(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loadCars(trip);
      setDatesApplied(true);
      nav("fleet");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function changeTrip(key, value) {
    setTrip((t) => ({ ...t, [key]: value }));
    if (datesApplied) {
      setDatesApplied(false);
      setCars((c) => c.map((x) => ({ ...x, available: null })));
    }
  }
  return (
    <>
      {isPreview && (
        <div className="preview-banner">
          Website preview · Bookings stay in this browser · No real rentals or
          payments{" "}
          <a href="https://github.com/Anish00079/Himalayan-Wheels-">
            Full-stack source <ArrowUpRight size={12} />
          </a>
        </div>
      )}
      <header className="site-header">
        <div className="nav-wrap">
          <button
            className="brand-button"
            aria-label="Himalayan Wheels home"
            onClick={() => nav("home")}
          >
            <Logo />
          </button>
          <nav className={mobile ? "open" : ""}>
            <button
              className={page === "home" ? "selected" : ""}
              onClick={() => nav("home")}
            >
              Home
            </button>
            <button onClick={() => nav("fleet")}>Our fleet</button>
            <button onClick={() => nav("how")}>How it works</button>
            <button
              className={page === "bookings" ? "selected" : ""}
              onClick={() => nav("bookings")}
            >
              My bookings
            </button>
          </nav>
          <div className="account-actions">
            {user ? (
              <>
                <span className="user-name">Hi, {user.name.split(" ")[0]}</span>
                <button
                  className="icon-button"
                  aria-label="Sign out"
                  onClick={async () => {
                    try {
                      await api("/auth/logout", "POST");
                      setUser(null);
                      setBookings([]);
                      setPage("home");
                      setToast("You have signed out.");
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button className="sign-in" onClick={() => setAuth(true)}>
                Sign in
                <ArrowUpRight size={16} />
              </button>
            )}
            <button
              className="mobile-menu icon-button"
              aria-label="Toggle navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>
      {error && (
        <div className="error global-error" role="alert">
          {error}
          <button
            className="icon-button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {page === "home" ? (
        <>
          <section className="hero" id="home">
            <Landscape />
            <div className="hero-shade" />
            <div className="hero-inner">
              <div className="hero-copy">
                <span className="hero-kicker">
                  <span />
                  THE ROAD IS YOURS
                </span>
                <h1>
                  Great journeys.
                  <br />
                  Better <em>wheels.</em>
                </h1>
                <p>
                  From the streets of Kathmandu to the quiet of the hills.
                  <br className="desktop-break" /> Find your ride. Take the
                  scenic route.
                </p>
                <button className="cream-button" onClick={() => nav("fleet")}>
                  Explore our fleet
                  <ArrowUpRight size={18} />
                </button>
                <div className="hero-footnote">
                  <MapPin size={14} /> Made for your Nepal adventures
                </div>
              </div>
              <div className="hero-vehicle">
                <span className="adventure-label">
                  <Route size={17} /> A little further. A little freer.
                </span>
                <CarArt color="#d1d3bd" type="SUV" id="hero" hero />
              </div>
              <span className="hero-location">
                27.7172° N &nbsp; 85.3240° E<span>KATHMANDU, NEPAL</span>
              </span>
            </div>
          </section>
          <div className="search-wrap">
            <form className="trip-search" onSubmit={checkAvailability}>
              <label>
                <span>
                  <MapPin size={16} />
                  PICKUP LOCATION
                </span>
                <select
                  aria-label="Pickup location"
                  value={trip.pickup}
                  onChange={(e) => changeTrip("pickup", e.target.value)}
                >
                  {["Kathmandu", "Pokhara", "Chitwan"].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  <CalendarDays size={16} />
                  PICKUP DATE
                </span>
                <input
                  aria-label="Search pickup date"
                  type="date"
                  min={today()}
                  required
                  value={trip.start}
                  onChange={(e) => changeTrip("start", e.target.value)}
                />
              </label>
              <label>
                <span>
                  <CalendarDays size={16} />
                  RETURN DATE
                </span>
                <input
                  aria-label="Search return date"
                  type="date"
                  min={trip.start ? addDays(trip.start, 1) : today()}
                  required
                  value={trip.end}
                  onChange={(e) => changeTrip("end", e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy}>
                <Search size={17} />
                {busy ? "Checking…" : "Find my ride"}
              </button>
            </form>
          </div>
          <section className="benefits content-width">
            <div>
              <ShieldCheck />
              <span>
                <strong>Clear rental pricing</strong>
                <small>Know your total before you book</small>
              </span>
            </div>
            <div>
              <KeyRound />
              <span>
                <strong>A ride for every plan</strong>
                <small>City cars, SUVs & electric options</small>
              </span>
            </div>
            <div>
              <CalendarDays />
              <span>
                <strong>Plans can change</strong>
                <small>Cancel before your pickup day</small>
              </span>
            </div>
          </section>
          <section className="fleet content-width" id="fleet">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FIND YOUR TRAVEL COMPANION</span>
                <h2>
                  The right ride. <em>For your kind of road.</em>
                </h2>
              </div>
              <span className="fleet-count">
                {cars.length} cars. Endless possibilities.
                <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="fleet-toolbar">
              <div className="tabs">
                {["All cars", "SUV", "Sedan", "Hatchback", "Electric"].map(
                  (c) => (
                    <button
                      className={category === c ? "active" : ""}
                      key={c}
                      onClick={() => setCategory(c)}
                    >
                      {c === "Electric" && <Leaf size={14} />} {c}
                    </button>
                  ),
                )}
              </div>
              <div className="fleet-tools">
                <div className="search-box">
                  <Search size={15} />
                  <input
                    aria-label="Search vehicles"
                    placeholder="Find a model"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Sort vehicles"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
              </div>
            </div>
            {datesApplied && (
              <div className="availability-note">
                <CheckCircle2 size={17} />
                Availability for {dateLabel(trip.start)} – {dateLabel(trip.end)}{" "}
                · {trip.pickup}
                <button
                  onClick={() => {
                    setDatesApplied(false);
                    loadCars().catch((e) => setError(e.message));
                  }}
                >
                  Clear dates
                </button>
              </div>
            )}
            {loading ? (
              <div className="empty" role="status">
                Finding your next ride…
              </div>
            ) : visible.length ? (
              <div className="car-grid">
                {visible.map((car, i) => (
                  <article className="car-card" key={car.id}>
                    <div className={"car-visual visual-" + (i % 3)}>
                      <span className="vehicle-tag">
                        {car.category === "Electric" ? (
                          <>
                            <Leaf size={12} />
                            ALL ELECTRIC
                          </>
                        ) : car.category === "SUV" ? (
                          "ROOM TO EXPLORE"
                        ) : car.category === "Sedan" ? (
                          "COMFORT IN MOTION"
                        ) : (
                          "CITY COMPANION"
                        )}
                      </span>
                      {car.available !== null && (
                        <span
                          className={
                            "availability " + (car.available ? "yes" : "no")
                          }
                        >
                          {car.available ? "Available" : "Reserved"}
                        </span>
                      )}
                      <CarArt
                        color={car.color}
                        type={car.category}
                        id={car.id}
                      />
                      <span className="illustration-label">
                        MODEL ILLUSTRATION
                      </span>
                    </div>
                    <div className="car-body">
                      <div className="car-title">
                        <h3>{car.name}</h3>
                        <span>{car.category}</span>
                      </div>
                      <div className="specs">
                        <span>
                          <Users size={14} />
                          {car.seats} seats
                        </span>
                        <span>
                          <Gauge size={14} />
                          {car.transmission}
                        </span>
                        <span>
                          <Fuel size={14} />
                          {car.fuel}
                        </span>
                      </div>
                      <div className="car-bottom">
                        <div>
                          <small>FROM</small>
                          <strong>
                            <span>NPR</span> {money(car.price)}
                          </strong>
                          <span className="per-day">/ day</span>
                        </div>
                        <button
                          className="book-button"
                          disabled={car.available === false}
                          onClick={() => setBookingCar(car)}
                        >
                          View & book
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <CarFront size={30} />
                <h3>No cars match your search</h3>
                <p>Try a different model name or category.</p>
                <button
                  className="secondary"
                  onClick={() => {
                    setCategory("All cars");
                    setSearch("");
                  }}
                >
                  Show all cars
                </button>
              </div>
            )}
            <p className="fleet-note">
              Your rental total is shown before confirmation. Return to the same
              pickup location.
            </p>
          </section>
          <section className="how-section" id="how">
            <div className="content-width">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    LESS PLANNING. MORE EXPLORING.
                  </span>
                  <h2>
                    A few clicks from <em>your next escape.</em>
                  </h2>
                </div>
                <span className="how-mark">
                  <Mountain size={38} />
                </span>
              </div>
              <div className="steps">
                {[
                  [
                    Search,
                    "01",
                    "Find your fit",
                    "Pick your dates, choose your city, and explore the cars available for your trip.",
                  ],
                  [
                    CalendarDays,
                    "02",
                    "Make it yours",
                    "Sign in, review the rental total, and confirm your reservation in one place.",
                  ],
                  [
                    KeyRound,
                    "03",
                    "Hit the road",
                    "Keep your booking reference handy. Payment and vehicle handover happen at pickup.",
                  ],
                ].map(([Icon, n, title, body]) => (
                  <div className="step" key={n}>
                    <div>
                      <span>
                        <Icon size={23} />
                      </span>
                      <small>{n}</small>
                    </div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="journey-strip content-width">
            <div>
              <span className="eyebrow">TAKE THE LONG WAY HOME</span>
              <h2>
                There’s a whole Nepal <em>waiting for you.</em>
              </h2>
              <p>
                A city break, a lakeside weekend, or a change of scenery. Start
                with the right wheels.
              </p>
            </div>
            <button className="primary" onClick={() => nav("fleet")}>
              Find your ride
              <ArrowUpRight size={18} />
            </button>
          </section>
        </>
      ) : (
        <main className="bookings-page content-width">
          <span className="eyebrow">YOUR JOURNEYS, ALL TOGETHER</span>
          <div className="section-heading">
            <div>
              <h1>My bookings</h1>
              <p className="muted">Your next adventure starts with a plan.</p>
            </div>
            <button className="primary" onClick={() => nav("fleet")}>
              Book another ride
              <ArrowUpRight size={17} />
            </button>
          </div>
          {bookings.length ? (
            bookings.map((b) => (
              <article className="booking-card" key={b.id}>
                <div className="booking-thumbnail">
                  <CarArt color={b.color} type={b.category} id={"b" + b.id} />
                </div>
                <div className="booking-info">
                  <span
                    className={
                      "booking-status " +
                      (b.status === "Cancelled" ? "cancelled" : "")
                    }
                  >
                    {b.status}
                  </span>
                  <h2>{b.name}</h2>
                  <p>
                    <MapPin size={14} />
                    {b.pickup} pickup and return
                  </p>
                  <p>
                    <CalendarDays size={14} />
                    {dateLabel(b.start_date)} → {dateLabel(b.end_date)}
                  </p>
                  <small className="reference">Reference: {b.id}</small>
                </div>
                <div className="booking-price">
                  <strong>NPR {money(b.total)}</strong>
                  <span>
                    {b.days} day{b.days === 1 ? "" : "s"} · Pay at pickup
                  </span>
                  {b.status === "Confirmed" && b.start_date > today() ? (
                    <button
                      className="cancel-button"
                      onClick={() => setCancel(b)}
                    >
                      Cancel booking
                    </button>
                  ) : b.status === "Confirmed" ? (
                    <small>Online cancellation closed</small>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty">
              <Route size={37} />
              <h3>Your next adventure is still unwritten</h3>
              <p>Find a car you love and your reservations will appear here.</p>
              <button className="primary" onClick={() => nav("fleet")}>
                Explore our fleet
                <ArrowUpRight size={17} />
              </button>
            </div>
          )}
        </main>
      )}
      <footer className="site-footer">
        <div className="content-width">
          <div className="footer-top">
            <div>
              <Logo />
              <p>
                Good wheels. Great memories.
                <br />
                Your journey through Nepal starts here.
              </p>
            </div>
            <div>
              <span className="eyebrow">EXPLORE</span>
              <button onClick={() => nav("fleet")}>Our fleet</button>
              <button onClick={() => nav("how")}>How it works</button>
              <button onClick={() => nav("bookings")}>My bookings</button>
            </div>
            <div>
              <span className="eyebrow">PICKUP CITIES</span>
              <p>
                Kathmandu
                <br />
                Pokhara
                <br />
                Chitwan
              </p>
            </div>
            <div>
              <span className="eyebrow">THE PROJECT</span>
              <a
                href="https://github.com/Anish00079/Himalayan-Wheels-"
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub
                <ArrowUpRight size={14} />
              </a>
              <p className="demo-note">
                Academic demonstration.
                <br />
                No real rental or payment is issued.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Himalayan Wheels</span>
            <span>Made for the journey, not just the destination.</span>
          </div>
        </div>
      </footer>
      {bookingCar && !auth && (
        <Booking
          key={bookingCar.id}
          car={bookingCar}
          trip={trip}
          user={user}
          onClose={() => setBookingCar(null)}
          onSignIn={(details) => {
            setTrip(details);
            setDatesApplied(false);
            setCars((cs) => cs.map((c) => ({ ...c, available: null })));
            setAuth(true);
          }}
          onBooked={async () => {
            await loadBookings();
            await loadCars(datesApplied ? trip : null);
            setBookingCar(null);
            setPage("bookings");
            setToast("Reservation confirmed. Your booking is ready.");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
      {auth && (
        <Auth
          onClose={() => setAuth(false)}
          onLogin={(u) => {
            setUser(u);
            setAuth(false);
            setToast("Welcome, " + u.name.split(" ")[0] + ".");
          }}
        />
      )}
      {cancel && (
        <Modal title="Cancel this reservation?" onClose={() => setCancel(null)}>
          <p>
            Your reservation for <strong>{cancel.name}</strong> from{" "}
            {dateLabel(cancel.start_date)} to {dateLabel(cancel.end_date)} will
            be cancelled. The vehicle will become available again.
          </p>
          <p className="muted">
            No payment was collected, so there is no refund to process.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setCancel(null)}>
              Keep my booking
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/bookings/" + cancel.id + "/cancel", "PATCH");
                  await loadBookings();
                  await loadCars(datesApplied ? trip : null);
                  setCancel(null);
                  setToast("Your booking has been cancelled.");
                } catch (e) {
                  setError(e.message);
                  setCancel(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Cancelling…" : "Cancel reservation"}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
