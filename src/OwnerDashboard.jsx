import React, { useEffect, useState } from "react";

const money = (value) => new Intl.NumberFormat("en-NP").format(value);
const date = (value) =>
  new Date(value + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function OwnerDashboard({ api, isPreview }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api("/owner/bookings")
      .then((data) => {
        if (active) setOrders(data.bookings);
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
          setOrders([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, refresh]);
  const confirmed = orders.filter((order) => order.status === "Confirmed");
  const filtered = orders.filter(
    (order) =>
      (status === "All" || order.status === status) &&
      [
        order.name,
        order.customer_name,
        order.customer_email,
        order.id,
        order.pickup,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  return (
    <main className="owner-page content-width">
      <span className="eyebrow">Owner account</span>
      <div className="section-heading">
        <div>
          <h1>Booking orders</h1>
          <p className="muted">
            View customer reservations and their current status.
          </p>
        </div>
        <button
          className="secondary"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          {loading ? "Loading…" : "Refresh orders"}
        </button>
      </div>
      {isPreview && (
        <p className="owner-demo-note">
          Demo owner view: only bookings made in this browser appear here. Sign
          out and choose User to create a demo booking.
        </p>
      )}
      {error ? (
        <div className="error" role="alert">
          {error} Use Refresh orders to try again.
        </div>
      ) : loading ? (
        <p className="empty" role="status">
          Loading booking orders…
        </p>
      ) : (
        <>
          <dl className="order-summary">
            <div>
              <dt>Total orders</dt>
              <dd>{orders.length}</dd>
            </div>
            <div>
              <dt>Confirmed</dt>
              <dd>{confirmed.length}</dd>
            </div>
            <div>
              <dt>Cancelled</dt>
              <dd>{orders.length - confirmed.length}</dd>
            </div>
            <div>
              <dt>Confirmed booking value</dt>
              <dd>
                NPR{" "}
                {money(confirmed.reduce((sum, order) => sum + order.total, 0))}
              </dd>
              <small>Booked value, not payments received</small>
            </div>
          </dl>
          <div className="order-filters">
            <label>
              Search orders
              <input
                type="search"
                value={search}
                placeholder="Customer, email, car or reference"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              Booking status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option>Confirmed</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>
          {!orders.length ? (
            <div className="empty">
              <h2>No orders yet</h2>
              <p>
                Customer bookings will appear here after a reservation is
                confirmed.
              </p>
            </div>
          ) : !filtered.length ? (
            <div className="empty">
              <h2>No matching orders</h2>
              <p>Try another customer, reference or status.</p>
              <button
                className="secondary"
                onClick={() => {
                  setStatus("All");
                  setSearch("");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="muted" aria-live="polite">
                {filtered.length} of {orders.length} orders
              </p>
              <div
                className="order-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Booking orders table"
              >
                <table className="order-table">
                  <caption>Customer bookings · amounts in NPR</caption>
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col">Vehicle / reference</th>
                      <th scope="col">Rental dates</th>
                      <th scope="col">Pickup / return</th>
                      <th scope="col">Total</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.customer_name}</strong>
                          <span>{order.customer_email}</span>
                        </td>
                        <td>
                          <strong>{order.name}</strong>
                          <small className="order-reference">{order.id}</small>
                        </td>
                        <td>
                          <span>{date(order.start_date)}</span>
                          <span>to {date(order.end_date)}</span>
                          <small>
                            {order.days} day{order.days === 1 ? "" : "s"}
                          </small>
                        </td>
                        <td>{order.pickup}</td>
                        <td className="order-total">
                          <strong>{money(order.total)}</strong>
                          <small>NPR {money(order.daily_rate)} / day</small>
                        </td>
                        <td>
                          <span
                            className={
                              "booking-status " +
                              (order.status === "Cancelled" ? "cancelled" : "")
                            }
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
