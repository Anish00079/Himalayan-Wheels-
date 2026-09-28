import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, nepalToday } from "../server/app.js";
test("rental lifecycle, isolation, authoritative price, overlap, cancellation and persistence", async () => {
  const dir = mkdtempSync(join(tmpdir(), "himalayan-wheels-test-")),
    dbPath = join(dir, "test.sqlite");
  let instance = createApp({ dbPath, secure: false }),
    server = instance.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  let base = `http://127.0.0.1:${server.address().port}`;
  async function req(path, method = "GET", body, cookie = "", verified = true) {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(verified ? { "X-Himalayan-Wheels": "1" } : {}),
        cookie,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const date = (n) =>
    new Date(Date.parse(nepalToday()) + n * 86400000)
      .toISOString()
      .slice(0, 10);
  try {
    const fleet = await req("/cars");
    assert.equal(fleet.status, 200);
    assert.equal(fleet.data.cars.length, 6);
    assert.equal((await req("/bookings")).status, 401);
    assert.equal(
      (
        await req("/auth/register", "POST", {
          name: "A",
          email: "a@example.com",
          password: "short",
        })
      ).status,
      400,
    );
    const a = await req("/auth/register", "POST", {
      name: "Anish",
      email: "a@example.com",
      password: "TestingPass123!",
    });
    assert.equal(a.status, 201);
    assert.equal(
      (await req("/auth/me", "GET", undefined, a.cookie)).data.user.name,
      "Anish",
    );
    assert.equal(
      (
        await req("/auth/register", "POST", {
          name: "A",
          email: "a@example.com",
          password: "TestingPass123!",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await req("/auth/login", "POST", {
          email: "a@example.com",
          password: "WrongPass123",
        })
      ).status,
      401,
    );
    const b = await req("/auth/register", "POST", {
      name: "B",
      email: "b@example.com",
      password: "TestingPass123!",
    });
    const body = {
      car_id: "creta",
      pickup: "Kathmandu",
      start_date: date(5),
      end_date: date(8),
      total: 1,
    };
    assert.equal(
      (await req("/bookings", "POST", body, a.cookie, false)).status,
      403,
    );
    assert.equal(
      (
        await req(
          "/bookings",
          "POST",
          { ...body, start_date: "2026-02-31" },
          a.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await req(
          "/bookings",
          "POST",
          { ...body, start_date: date(-1) },
          a.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (await req("/bookings", "POST", { ...body, end_date: date(5) }, a.cookie))
        .status,
      400,
    );
    assert.equal(
      (
        await req(
          "/bookings",
          "POST",
          { ...body, end_date: date(40) },
          a.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (await req("/bookings", "POST", { ...body, pickup: "Invalid" }, a.cookie))
        .status,
      400,
    );
    const reservation = await req("/bookings", "POST", body, a.cookie);
    assert.equal(reservation.status, 201);
    const id = reservation.data.booking.id;
    assert.equal(reservation.data.booking.days, 3);
    assert.equal(reservation.data.booking.total, 19500);
    assert.equal((await req("/bookings", "POST", body, b.cookie)).status, 409);
    assert.equal(
      (
        await req(
          "/bookings",
          "POST",
          { ...body, start_date: date(6), end_date: date(7) },
          b.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await req(
          "/bookings",
          "POST",
          { ...body, start_date: date(4), end_date: date(9) },
          b.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await req(
          "/bookings",
          "POST",
          { ...body, start_date: date(8), end_date: date(9) },
          b.cookie,
        )
      ).status,
      201,
    );
    const available = await req("/cars?start=" + date(5) + "&end=" + date(8));
    assert.equal(
      available.data.cars.find((c) => c.id === "creta").available,
      false,
    );
    assert.equal(
      (await req("/bookings/" + id + "/cancel", "PATCH", undefined, b.cookie))
        .status,
      404,
    );
    assert.equal(
      (await req("/bookings", "GET", undefined, b.cookie)).data.bookings.some(
        (x) => x.id === id,
      ),
      false,
    );
    await new Promise((r) => server.close(r));
    instance.db.close();
    instance = createApp({ dbPath, secure: false });
    server = instance.app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${server.address().port}`;
    assert.equal(
      (await req("/bookings", "GET", undefined, a.cookie)).data.bookings[0]
        .total,
      19500,
    );
    assert.equal(
      (await req("/bookings/" + id + "/cancel", "PATCH", undefined, a.cookie))
        .status,
      200,
    );
    assert.equal(
      (await req("/bookings/" + id + "/cancel", "PATCH", undefined, a.cookie))
        .status,
      200,
    );
    const again = await req("/cars?start=" + date(5) + "&end=" + date(8));
    assert.equal(again.data.cars.find((c) => c.id === "creta").available, true);
    const concurrent = await Promise.all([
      req("/bookings", "POST", { ...body, car_id: "swift" }, a.cookie),
      req("/bookings", "POST", { ...body, car_id: "swift" }, b.cookie),
    ]);
    assert.deepEqual(concurrent.map((x) => x.status).sort(), [201, 409]);
    const sameDay = await req(
      "/bookings",
      "POST",
      { ...body, car_id: "city", start_date: date(0), end_date: date(1) },
      a.cookie,
    );
    assert.equal(sameDay.status, 201);
    assert.equal(
      (
        await req(
          "/bookings/" + sameDay.data.booking.id + "/cancel",
          "PATCH",
          undefined,
          a.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (await req("/auth/logout", "POST", undefined, a.cookie)).status,
      200,
    );
    assert.equal(
      (await req("/auth/me", "GET", undefined, a.cookie)).status,
      401,
    );
    assert.equal(
      (
        await req("/auth/login", "POST", {
          email: "a@example.com",
          password: "TestingPass123!",
        })
      ).status,
      200,
    );
  } finally {
    await new Promise((r) => server.close(r));
    instance.db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
