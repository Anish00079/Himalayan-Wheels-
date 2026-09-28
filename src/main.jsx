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
import OwnerDashboard from "./OwnerDashboard.jsx";
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
function CarPhoto({ carId, name, hero = false }) {
  return (
    <img
      className={hero ? "hero-car" : "car-art"}
      src={`${import.meta.env.BASE_URL}cars/${carId}.webp`}
      alt={name}
      loading={hero ? "eager" : "lazy"}
      decoding="async"
    />
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
function Auth({ onClose, onLogin, initialRole = "customer" }) {
  const [role, setRole] = useState(initialRole);
  const roleOptions = (
    <div className="login-roles" role="group" aria-label="Account type">
      {[
        ["customer", "User"],
        ["owner", "Owner"],
      ].map(([value, label]) => (
        <button
          type="button"
          key={value}
          aria-pressed={role === value}
          className={role === value ? "active" : ""}
          onClick={() => {
            setRole(value);
            setRegister(false);
            setError("");
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (isPreview)
    return (
      <Modal
        title={role === "owner" ? "Owner demo" : "User demo"}
        onClose={onClose}
      >
        {roleOptions}
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
              const data = await api("/auth/login", "POST", { role });
              onLogin(data.user);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          {role === "owner"
            ? "Continue as demo owner"
            : "Continue as demo traveller"}
          <ArrowRight size={17} />
        </button>
      </Modal>
    );
  return (
    <Modal
      title={
        register
          ? "Create an account"
          : role === "owner"
            ? "Owner sign in"
            : "User sign in"
      }
      onClose={onClose}
    >
      {roleOptions}
      <p className="muted">
        {role === "owner"
          ? "Sign in with your owner account to view customer booking orders."
          : register
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
              { ...Object.fromEntries(new FormData(e.currentTarget)), role },
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
      {role === "customer" ? (
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
      ) : (
        <p className="muted owner-setup-note">
          Owner accounts are created by the person running the server. Contact
          them if you need access.
        </p>
      )}
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
    <Modal title="Reserve a vehicle" onClose={onClose} wide>
      <div className="booking-grid">
        <div className="booking-car">
          <span className="eyebrow">
            {car.category} • {car.transmission}
          </span>
          <h3>{car.name}</h3>
          <CarPhoto carId={car.id} name={car.name} />
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
    [tripCategory, setTripCategory] = useState("All cars"),
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
      .then((d) => {
        setUser(d.user);
        if (d.user.role === "owner") setPage("owner");
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user?.role === "customer")
      loadBookings().catch((e) => setError(e.message));
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
      setPage(user.role === "owner" ? "owner" : "bookings");
      if (user.role !== "owner")
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
      setCategory(tripCategory);
      setSearch("");
      setDatesApplied(true);
      nav("fleet");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function ownerAccess() {
    if (user?.role === "owner") nav("bookings");
    else if (user)
      setToast("Sign out, then choose Owner to access booking orders.");
    else setAuth("owner");
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
      <div className="service-bar">
        <div className="content-width">
          <span>
            <MapPin size={13} /> Kathmandu / Pokhara / Chitwan
          </span>
          <button onClick={ownerAccess}>
            {user?.role === "owner" ? "Owner dashboard" : "Owner login"}
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
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
            <button onClick={() => nav("destinations")}>Destinations</button>
            <button onClick={() => nav("how")}>How it works</button>
            <button
              className={
                page === "bookings" || page === "owner" ? "selected" : ""
              }
              onClick={() => nav("bookings")}
            >
              {user?.role === "owner" ? "Owner orders" : "My bookings"}
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
            <div className="hero-inner">
              <div className="hero-copy">
                <span className="hero-kicker">Himalayan Wheels</span>
                <h1>Car rental in Nepal</h1>
                <p>
                  Compare cars, check availability, and book a vehicle for your
                  trip. Pickup options in Kathmandu, Pokhara, and Chitwan.
                </p>
                <button className="cream-button" onClick={() => nav("fleet")}>
                  Explore our fleet
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="hero-vehicle">
                <CarPhoto carId="creta" name="Hyundai Creta" hero />
              </div>
            </div>
          </section>
          <div className="search-wrap rental-search-panel">
            <div className="rental-search-heading">
              <div>
                <span className="eyebrow">Plan your rental</span>
                <h2>Find a car for your trip</h2>
              </div>
              <span>Daily rates in NPR</span>
            </div>
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
                  <CarFront size={16} /> VEHICLE TYPE
                </span>
                <select
                  aria-label="Search vehicle type"
                  value={tripCategory}
                  onChange={(event) => setTripCategory(event.target.value)}
                >
                  {["All cars", "SUV", "Sedan", "Hatchback", "Electric"].map(
                    (type) => (
                      <option key={type}>{type}</option>
                    ),
                  )}
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
                <strong>Vehicle options</strong>
                <small>City cars, SUVs & electric options</small>
              </span>
            </div>
            <div>
              <CalendarDays />
              <span>
                <strong>Cancellation policy</strong>
                <small>Cancel before your pickup day</small>
              </span>
            </div>
          </section>
          <section
            className="destinations-section content-width"
            id="destinations"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">Pickup locations</span>
                <h2>Where does your trip begin?</h2>
                <p className="muted">
                  Choose a city to set your pickup and return location.
                </p>
              </div>
            </div>
            <div className="destination-grid">
              {[
                ["Kathmandu", "Start your rental in the capital."],
                ["Pokhara", "Plan a visit to the lakeside city."],
                ["Chitwan", "Arrange your journey in the Terai."],
              ].map(([city, description]) => (
                <button
                  key={city}
                  className={
                    "destination-card " + (trip.pickup === city ? "chosen" : "")
                  }
                  aria-label={"Choose " + city + " pickup"}
                  aria-pressed={trip.pickup === city}
                  onClick={() => {
                    changeTrip("pickup", city);
                    nav("fleet");
                    setToast("Pickup and return location set to " + city + ".");
                  }}
                >
                  <MapPin size={24} />
                  <strong>{city}</strong>
                  <span>{description}</span>
                  <small>
                    {trip.pickup === city ? "Selected pickup" : "Choose pickup"}
                    <ArrowUpRight size={15} />
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section className="categories-section content-width" id="categories">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Browse by vehicle type</span>
                <h2>A car for your plans</h2>
              </div>
            </div>
            <div className="category-grid">
              {[
                ["SUV", "creta", "Hyundai Creta"],
                ["Sedan", "city", "Honda City"],
                ["Hatchback", "swift", "Suzuki Swift"],
                ["Electric", "nexon", "Tata Nexon EV"],
              ].map(([type, id, name]) => (
                <button
                  className="category-card"
                  key={type}
                  aria-label={"Browse " + type + " cars"}
                  onClick={() => {
                    setCategory(type);
                    setTripCategory(type);
                    setSearch("");
                    nav("fleet");
                  }}
                >
                  <CarPhoto carId={id} name={name} />
                  <span>
                    <strong>{type}</strong>
                    <ArrowUpRight size={18} />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="fleet content-width" id="fleet">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Browse vehicles</span>
                <h2>Available cars</h2>
              </div>
              <span className="fleet-count">
                {cars.length} vehicles
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
                Loading vehicles…
              </div>
            ) : visible.length ? (
              <div className="car-grid">
                {visible.map((car, i) => (
                  <article className="car-card" key={car.id}>
                    <div className={"car-visual visual-" + (i % 3)}>
                      <span className="vehicle-tag">{car.category}</span>
                      {car.available !== null && (
                        <span
                          className={
                            "availability " + (car.available ? "yes" : "no")
                          }
                        >
                          {car.available ? "Available" : "Reserved"}
                        </span>
                      )}
                      <CarPhoto carId={car.id} name={car.name} />
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
                          onClick={() =>
                            user?.role === "owner"
                              ? nav("bookings")
                              : setBookingCar(car)
                          }
                        >
                          {user?.role === "owner"
                            ? "View orders"
                            : "View & book"}
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
                  <span className="eyebrow">Booking information</span>
                  <h2>How to book</h2>
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
                    "Choose a car",
                    "Pick your dates, choose your city, and explore the cars available for your trip.",
                  ],
                  [
                    CalendarDays,
                    "02",
                    "Confirm your booking",
                    "Sign in, review the rental total, and confirm your reservation in one place.",
                  ],
                  [
                    KeyRound,
                    "03",
                    "Collect your vehicle",
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
          <section className="rental-info content-width" id="about">
            <div>
              <span className="eyebrow">About Himalayan Wheels</span>
              <h2>One place to find and reserve a car</h2>
              <p>
                Compare daily prices, choose your rental dates, and keep track
                of your booking. Himalayan Wheels brings vehicle selection and
                reservations together for trips starting in Kathmandu, Pokhara
                or Chitwan.
              </p>
              <p>
                Owners have a separate dashboard to review customer booking
                orders.
              </p>
              <button className="secondary" onClick={ownerAccess}>
                Open owner login
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="rental-faq">
              <h2>Before you book</h2>
              {[
                [
                  "How is the rental price calculated?",
                  "Your total is the daily rate multiplied by the number of rental days. The return date is not charged as an extra day. Rentals can be from 1 to 30 days.",
                ],
                [
                  "Can I cancel my booking?",
                  "Yes. Sign in, open My bookings and cancel before the pickup date. Cancelled bookings remain in your history.",
                ],
                [
                  "Where do I return the car?",
                  "Choose Kathmandu, Pokhara or Chitwan for pickup. This project uses the same city for pickup and return.",
                ],
                [
                  "Do I pay online?",
                  "No online payment is collected. This is an academic rental demonstration; bookings do not issue a real rental.",
                ],
              ].map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : page === "owner" && user?.role === "owner" ? (
        <OwnerDashboard key={user.id} api={api} isPreview={isPreview} />
      ) : (
        <main className="bookings-page content-width">
          <span className="eyebrow">Your account</span>
          <div className="section-heading">
            <div>
              <h1>My bookings</h1>
              <p className="muted">
                View your reservations and manage cancellations.
              </p>
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
                  <CarPhoto carId={b.car_id} name={b.name} />
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
              <h3>No bookings yet</h3>
              <p>
                Your reservations will appear here after you book a vehicle.
              </p>
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
                Car rental in Nepal.
                <br />
                Kathmandu, Pokhara and Chitwan.
              </p>
            </div>
            <div>
              <span className="eyebrow">EXPLORE</span>
              <button onClick={() => nav("fleet")}>Our fleet</button>
              <button onClick={() => nav("how")}>How it works</button>
              <button onClick={() => nav("bookings")}>
                {user?.role === "owner" ? "Owner orders" : "My bookings"}
              </button>
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
            <a href="https://meromoto.com/" target="_blank" rel="noreferrer">
              Vehicle photos: Meromoto
            </a>
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
          initialRole={auth === "owner" ? "owner" : "customer"}
          onClose={() => setAuth(false)}
          onLogin={(u) => {
            setUser(u);
            setAuth(false);
            setBookings([]);
            if (u.role === "owner") {
              setBookingCar(null);
              setPage("owner");
            } else if (!bookingCar) setPage("bookings");
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
