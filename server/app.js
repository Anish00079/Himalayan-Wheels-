import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  randomUUID,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { openDatabase } from "./db.js";
const digest = (s) => createHash("sha256").update(s).digest("hex");
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const locations = ["Kathmandu", "Pokhara", "Chitwan"];
export const nepalToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return (
    salt +
    ":" +
    scryptSync(password, salt, 64, {
      N: 131072,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    }).toString("hex")
  );
}
function matches(password, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64, {
      N: 131072,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    }),
    Buffer.from(hash, "hex"),
  );
}
const validDate = (d) =>
  typeof d === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  Number.isFinite(Date.parse(d)) &&
  new Date(d).toISOString().slice(0, 10) === d;
function dateError(start, end) {
  if (!validDate(start) || !validDate(end))
    return "Choose valid pickup and return dates.";
  const days = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (start < nepalToday()) return "Pickup cannot be in the past.";
  if (days < 1 || days > 30) return "Rentals must be between 1 and 30 days.";
  return null;
}
export function createApp({
  dbPath = resolve("data/himalayan-wheels.sqlite"),
  staticDir = resolve("dist"),
  secure = process.env.NODE_ENV === "production",
} = {}) {
  const db = openDatabase(dbPath),
    app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "upgrade-insecure-requests": secure ? [] : null,
        },
      },
      strictTransportSecurity: secure ? undefined : false,
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("x-himalayan-wheels") !== "1"
    )
      return res.status(403).json({ error: "Request verification failed." });
    next();
  });
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again in 15 minutes." },
  });
  function session(res, user) {
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      digest(token),
      user.id,
      Date.now() + 7 * 86400000,
    );
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure,
      path: "/",
      maxAge: 7 * 86400000,
    });
    return { id: user.id, name: user.name, email: user.email };
  }
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/cars", (req, res) => {
    const { start, end } = req.query;
    if (start !== undefined || end !== undefined) {
      const error = dateError(start, end);
      if (error) return res.status(400).json({ error });
    }
    const cars = db.prepare("SELECT * FROM cars ORDER BY rowid").all();
    const overlap = db.prepare(
      "SELECT 1 FROM bookings WHERE car_id=? AND status='Confirmed' AND start_date<? AND end_date>? LIMIT 1",
    );
    res.json({
      cars: cars.map((c) => ({
        ...c,
        available: start ? !overlap.get(c.id, end, start) : null,
      })),
      locations,
    });
  });
  app.post("/api/auth/register", limiter, (req, res) => {
    const name = clean(req.body.name, 80),
      email = clean(req.body.email, 254).toLowerCase(),
      password = req.body.password;
    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    )
      return res.status(400).json({
        error:
          "Enter your name, a valid email, and a password of 8–128 characters.",
      });
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email))
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    const user = { id: randomUUID(), name, email };
    db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
      user.id,
      name,
      email,
      hashPassword(password),
    );
    res.status(201).json({ user: session(res, user) });
  });
  app.post("/api/auth/login", limiter, (req, res) => {
    const user = db
        .prepare("SELECT * FROM users WHERE email=?")
        .get(clean(req.body.email, 254).toLowerCase()),
      password = req.body.password;
    if (
      typeof password !== "string" ||
      password.length > 128 ||
      !user ||
      !matches(password, user.password)
    )
      return res.status(401).json({ error: "Email or password is incorrect." });
    res.json({ user: session(res, user) });
  });
  app.use("/api", (req, res, next) => {
    const token =
      (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("session="))
        ?.slice(8) || "";
    req.token = digest(token);
    req.user = db
      .prepare(
        "SELECT users.id,users.name,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>?",
      )
      .get(req.token, Date.now());
    if (!req.user)
      return res.status(401).json({ error: "Please sign in to continue." });
    next();
  });
  app.get("/api/auth/me", (req, res) => res.json({ user: req.user }));
  app.post("/api/auth/logout", (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(req.token);
    res.clearCookie("session", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure,
    });
    res.json({ ok: true });
  });
  app.get("/api/bookings", (req, res) => {
    const bookings = db
      .prepare(
        "SELECT bookings.*,cars.name,cars.category,cars.color,cars.transmission,cars.fuel,cars.seats FROM bookings JOIN cars ON cars.id=bookings.car_id WHERE user_id=? ORDER BY created_at DESC",
      )
      .all(req.user.id);
    res.json({ bookings });
  });
  app.post("/api/bookings", (req, res) => {
    const { car_id, pickup, start_date, end_date } = req.body,
      error = dateError(start_date, end_date);
    if (error) return res.status(400).json({ error });
    if (!locations.includes(pickup))
      return res
        .status(400)
        .json({ error: "Choose a supported pickup location." });
    if (typeof car_id !== "string")
      return res.status(400).json({ error: "Choose a vehicle." });
    const car = db.prepare("SELECT * FROM cars WHERE id=?").get(car_id);
    if (!car) return res.status(404).json({ error: "Vehicle not found." });
    db.exec("BEGIN IMMEDIATE");
    try {
      if (
        db
          .prepare(
            "SELECT 1 FROM bookings WHERE car_id=? AND status='Confirmed' AND start_date<? AND end_date>? LIMIT 1",
          )
          .get(car_id, end_date, start_date)
      ) {
        db.exec("ROLLBACK");
        return res.status(409).json({
          error:
            "This vehicle was reserved for those dates. Please choose another vehicle or change your dates.",
        });
      }
      const days = (Date.parse(end_date) - Date.parse(start_date)) / 86400000,
        id = randomUUID(),
        total = days * car.price;
      db.prepare(
        "INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,'Confirmed',?)",
      ).run(
        id,
        req.user.id,
        car_id,
        pickup,
        start_date,
        end_date,
        days,
        car.price,
        total,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
      res.status(201).json({
        booking: db.prepare("SELECT * FROM bookings WHERE id=?").get(id),
      });
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  });
  app.patch("/api/bookings/:id/cancel", (req, res) => {
    const booking = db
      .prepare("SELECT * FROM bookings WHERE id=? AND user_id=?")
      .get(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.status === "Cancelled") return res.json({ ok: true });
    if (booking.start_date <= nepalToday())
      return res.status(400).json({
        error: "Online cancellation is available only before the pickup date.",
      });
    db.prepare("UPDATE bookings SET status='Cancelled' WHERE id=?").run(
      booking.id,
    );
    res.json({ ok: true });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get("/{*path}", (req, res) =>
      res.sendFile(resolve(staticDir, "index.html")),
    );
  }
  app.use((err, req, res, next) => {
    console.error(err.message);
    const status = err.status === 400 || err.status === 413 ? err.status : 500;
    res.status(status).json({
      error:
        status === 400
          ? "Invalid JSON request."
          : status === 413
            ? "Request is too large."
            : "The request could not be completed.",
    });
  });
  return { app, db };
}
