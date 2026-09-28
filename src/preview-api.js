import { fleetRows } from "../shared/fleet.js";

// This adapter is included only in the explicitly labelled GitHub Pages preview.
// It never collects passwords and does not represent shared server reservations.
const key = "himalayan-wheels-preview-v1";
const locations = ["Kathmandu", "Pokhara", "Chitwan"];
const user = {
  id: "preview-traveller",
  name: "Demo traveller",
  email: "demo@example.com",
  role: "customer",
};
const owner = {
  id: "preview-owner",
  name: "Demo owner",
  email: "owner@example.com",
  role: "owner",
};
const identity = (state) => (state.role === "owner" ? owner : user);
const fields = [
  "id",
  "name",
  "category",
  "seats",
  "transmission",
  "fuel",
  "price",
  "color",
  "description",
];
const cars = fleetRows.map((row) =>
  Object.fromEntries(fields.map((field, i) => [field, row[i]])),
);
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
function read() {
  try {
    return JSON.parse(
      localStorage.getItem(key) || '{"signedIn":false,"bookings":[]}',
    );
  } catch {
    return { signedIn: false, bookings: [] };
  }
}
function save(state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    throw new Error(
      "Browser storage is unavailable. Allow local storage to try the preview.",
    );
  }
}
function validate(start, end) {
  const date = (d) =>
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    Number.isFinite(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d;
  const days = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (!date(start) || !date(end) || start < today() || days < 1 || days > 30)
    throw new Error(
      "Choose valid dates for a rental of 1–30 days, starting today or later.",
    );
  return days;
}
const overlaps = (state, id, start, end) =>
  state.bookings.some(
    (b) =>
      b.car_id === id &&
      b.status === "Confirmed" &&
      b.start_date < end &&
      b.end_date > start,
  );
export async function previewApi(path, method = "GET", body) {
  const state = read(),
    url = new URL(path, "https://preview.invalid");
  if (url.pathname === "/cars") {
    const start = url.searchParams.get("start"),
      end = url.searchParams.get("end");
    if (start || end) validate(start, end);
    return {
      cars: cars.map((c) => ({
        ...c,
        available: start ? !overlaps(state, c.id, start, end) : null,
      })),
      locations,
    };
  }
  if (path === "/auth/login" && method === "POST") {
    state.signedIn = true;
    state.role = body?.role === "owner" ? "owner" : "customer";
    save(state);
    return { user: identity(state) };
  }
  if (path === "/auth/me") {
    if (!state.signedIn)
      throw new Error("Open the demo workspace to continue.");
    return { user: identity(state) };
  }
  if (path === "/auth/logout") {
    state.signedIn = false;
    save(state);
    return { ok: true };
  }
  if (!state.signedIn) throw new Error("Open the demo workspace to continue.");
  if (path === "/owner/bookings" && method === "GET") {
    if (identity(state).role !== "owner")
      throw new Error("Owner access is required.");
    return {
      bookings: state.bookings
        .map((booking) => ({
          ...cars.find((car) => car.id === booking.car_id),
          ...booking,
          customer_name: user.name,
          customer_email: user.email,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  }
  if (path === "/bookings" && method === "GET")
    return {
      bookings: state.bookings
        .filter((booking) => booking.user_id === identity(state).id)
        .map((b) => ({ ...cars.find((c) => c.id === b.car_id), ...b }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  if (path === "/bookings" && method === "POST") {
    if (identity(state).role !== "customer")
      throw new Error("Use a customer account to book a vehicle.");
    const days = validate(body.start_date, body.end_date),
      car = cars.find((c) => c.id === body.car_id);
    if (!car || !locations.includes(body.pickup))
      throw new Error("Choose a valid car and pickup location.");
    if (overlaps(state, car.id, body.start_date, body.end_date))
      throw new Error(
        "This car is reserved in your browser for those dates. Try another car or date range.",
      );
    const booking = {
      id: crypto.randomUUID(),
      user_id: user.id,
      car_id: car.id,
      pickup: body.pickup,
      start_date: body.start_date,
      end_date: body.end_date,
      days,
      daily_rate: car.price,
      total: days * car.price,
      status: "Confirmed",
      created_at: new Date().toISOString(),
    };
    state.bookings.push(booking);
    save(state);
    return { booking };
  }
  if (/^\/bookings\/[^/]+\/cancel$/.test(path) && method === "PATCH") {
    const booking = state.bookings.find(
      (b) => b.id === path.split("/")[2] && b.user_id === identity(state).id,
    );
    if (!booking) throw new Error("Booking not found.");
    if (booking.start_date <= today() && booking.status !== "Cancelled")
      throw new Error("Online cancellation closes on the pickup date.");
    booking.status = "Cancelled";
    save(state);
    return { ok: true };
  }
  throw new Error("This action is unavailable in the preview.");
}
