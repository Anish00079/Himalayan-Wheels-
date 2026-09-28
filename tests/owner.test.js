import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, nepalToday } from "../server/app.js";
import { openDatabase } from "../server/db.js";
import { createOwner } from "../server/owners.js";

test("legacy accounts migrate to customer without losing their data", () => {
  const directory = mkdtempSync(join(tmpdir(), "wheels-migration-"));
  const file = join(directory, "legacy.sqlite");
  let db = new DatabaseSync(file);
  try {
    db.exec(
      "CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL)",
    );
    db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
      "legacy",
      "Existing customer",
      "legacy@example.com",
      "existing-hash",
    );
    db.close();
    db = openDatabase(file);
    assert.deepEqual(
      { ...db.prepare("SELECT * FROM users").get() },
      {
        id: "legacy",
        name: "Existing customer",
        email: "legacy@example.com",
        password: "existing-hash",
        role: "customer",
      },
    );
    db.close();
    db = openDatabase(file);
    assert.equal(db.prepare("SELECT count(*) AS n FROM users").get().n, 1);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("owner authentication, protected order visibility and customer isolation", async () => {
  const directory = mkdtempSync(join(tmpdir(), "wheels-owner-"));
  const file = join(directory, "test.sqlite");
  let instance = createApp({ dbPath: file, secure: false });
  let server = instance.app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  let base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, method = "GET", body, cookie = "") => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Himalayan-Wheels": "1",
        cookie,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };
  const password = "OwnerTestPassword!123";
  try {
    assert.throws(() =>
      createOwner(instance.db, {
        name: "Owner",
        email: "owner@example.com",
        password: "short",
      }),
    );
    const owner = createOwner(instance.db, {
      name: "Owner",
      email: "OWNER@example.com",
      password,
    });
    assert.equal(owner.role, "owner");
    assert.notEqual(
      instance.db.prepare("SELECT password FROM users WHERE id=?").get(owner.id)
        .password,
      password,
    );
    assert.throws(
      () =>
        createOwner(instance.db, {
          name: "Other",
          email: owner.email,
          password,
        }),
      /already has an account/,
    );
    const a = await request("/auth/register", "POST", {
      name: "Customer A",
      email: "a@example.com",
      password,
      role: "owner",
    });
    const b = await request("/auth/register", "POST", {
      name: "Customer B",
      email: "b@example.com",
      password,
    });
    assert.equal(a.data.user.role, "customer");
    assert.equal(
      (await request("/auth/me", "GET", undefined, a.cookie)).data.user.role,
      "customer",
    );
    assert.equal((await request("/owner/bookings")).status, 401);
    assert.equal(
      (await request("/owner/bookings", "GET", undefined, a.cookie)).status,
      403,
    );
    const denied = await request("/auth/login", "POST", {
      email: "a@example.com",
      password,
      role: "owner",
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.cookie, undefined);
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: owner.email,
          password: "wrong",
          role: "owner",
        })
      ).status,
      401,
    );
    const login = await request("/auth/login", "POST", {
      email: owner.email,
      password,
      role: "owner",
    });
    assert.equal(login.status, 200);
    assert.equal(login.data.user.role, "owner");
    assert.deepEqual(
      (await request("/owner/bookings", "GET", undefined, login.cookie)).data
        .bookings,
      [],
    );
    const date = (n) =>
      new Date(Date.parse(nepalToday()) + n * 86400000)
        .toISOString()
        .slice(0, 10);
    const details = {
      car_id: "swift",
      pickup: "Kathmandu",
      start_date: date(2),
      end_date: date(5),
    };
    assert.equal(
      (await request("/bookings", "POST", details, login.cookie)).status,
      403,
    );
    const booking = await request("/bookings", "POST", details, a.cookie);
    assert.equal(booking.status, 201);
    assert.equal(
      (
        await request(
          "/bookings",
          "POST",
          { ...details, car_id: "creta" },
          b.cookie,
        )
      ).status,
      201,
    );
    const orders = (
      await request("/owner/bookings", "GET", undefined, login.cookie)
    ).data.bookings;
    assert.equal(orders.length, 2);
    assert.deepEqual(orders.map((order) => order.customer_email).sort(), [
      "a@example.com",
      "b@example.com",
    ]);
    assert.equal(
      orders.find((order) => order.id === booking.data.booking.id).total,
      10500,
    );
    assert.ok(
      orders.every(
        (order) =>
          !Object.hasOwn(order, "password") && !Object.hasOwn(order, "token"),
      ),
    );
    const privateOrders = (
      await request("/bookings", "GET", undefined, a.cookie)
    ).data.bookings;
    assert.equal(privateOrders.length, 1);
    assert.equal(privateOrders[0].user_id, a.data.user.id);
    assert.equal(
      (
        await request(
          `/bookings/${booking.data.booking.id}/cancel`,
          "PATCH",
          undefined,
          b.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await request(
          `/bookings/${booking.data.booking.id}/cancel`,
          "PATCH",
          undefined,
          a.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/owner/bookings", "GET", undefined, login.cookie)
      ).data.bookings.find((order) => order.id === booking.data.booking.id)
        .status,
      "Cancelled",
    );
    await new Promise((resolve) => server.close(resolve));
    instance.db.close();
    instance = createApp({ dbPath: file, secure: false });
    server = instance.app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
    assert.equal(
      (await request("/auth/me", "GET", undefined, login.cookie)).data.user
        .role,
      "owner",
    );
    assert.equal(
      (await request("/owner/bookings", "GET", undefined, login.cookie)).data
        .bookings.length,
      2,
    );
    await request("/auth/logout", "POST", undefined, login.cookie);
    assert.equal(
      (await request("/owner/bookings", "GET", undefined, login.cookie)).status,
      401,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    instance.db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
