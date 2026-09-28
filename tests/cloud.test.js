import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { validateCloudConfig } from "../scripts/cloud-config.js";

test("cloud build refuses missing, private or conflicting credentials", () => {
  const config = {
    VITE_BACKEND: "supabase",
    VITE_SUPABASE_URL: "https://example.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_public_key",
  };
  assert.doesNotThrow(() => validateCloudConfig(config));
  assert.throws(() => validateCloudConfig({ ...config, VITE_PREVIEW: "true" }));
  assert.throws(() =>
    validateCloudConfig({ ...config, VITE_SUPABASE_URL: "" }),
  );
  assert.throws(() =>
    validateCloudConfig({
      ...config,
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_private",
    }),
  );
  assert.throws(() =>
    validateCloudConfig({
      ...config,
      VITE_SUPABASE_PUBLISHABLE_KEY:
        "x." +
        Buffer.from(JSON.stringify({ role: "service_role" })).toString(
          "base64url",
        ) +
        ".x",
    }),
  );
});

test("cloud schema enforces customer privacy, owner role, pricing and reservation rules", async () => {
  const db = new PGlite();
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";
  const owner = "33333333-3333-4333-8333-333333333333";
  async function asUser(id, sql, parameters = []) {
    return db.transaction(async (transaction) => {
      await transaction.exec(
        id ? "set local role authenticated" : "set local role anon",
      );
      await transaction.query(
        "select set_config('request.jwt.claim.sub',$1,true)",
        [id || ""],
      );
      return transaction.query(sql, parameters);
    });
  }
  const call = async (id, sql, parameters) =>
    (await asUser(id, sql, parameters)).rows[0].value;
  try {
    // Emulate only Supabase's JWT identity boundary; run the real application SQL unchanged.
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated;`);
    const setup = readFileSync(
      new URL("../supabase/setup.sql", import.meta.url),
      "utf8",
    );
    await db.exec(setup);
    for (const [id, email] of [
      [a, "a@example.com"],
      [b, "b@example.com"],
      [owner, "owner@example.com"],
    ]) {
      await db.query(
        "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
        [id, email, { name: "Example user", role: "owner" }],
      );
    }
    assert.equal(
      (await asUser(a, "select role from public.profiles")).rows[0].role,
      "customer",
    );
    await assert.rejects(
      asUser(a, "update public.profiles set role='owner' where id=$1", [a]),
      /permission denied/,
    );
    await assert.rejects(
      asUser(a, "select * from auth.users"),
      /permission denied/,
    );
    await assert.rejects(
      asUser(a, "select public.rental_owner_orders()"),
      /Owner access/,
    );
    await assert.rejects(
      asUser(null, "select public.rental_owner_orders()"),
      /permission denied/,
    );
    await db.query("update public.profiles set role='owner' where id=$1", [
      owner,
    ]);
    const today = (
      await db.query(
        "select (now() at time zone 'Asia/Kathmandu')::date::text as day",
      )
    ).rows[0].day;
    const date = (n) =>
      new Date(Date.parse(today) + n * 86400000).toISOString().slice(0, 10);
    const fleet = await call(null, "select public.rental_fleet() as value");
    assert.equal(fleet.cars.length, 6);
    assert.ok(fleet.cars.every((car) => car.available === null));
    const book = "select public.rental_book($1,$2,$3::date,$4::date) as value";
    const params = ["creta", "Kathmandu", date(2), date(5)];
    await assert.rejects(asUser(null, book, params), /permission denied/);
    await assert.rejects(asUser(owner, book, params), /customer account/);
    await assert.rejects(
      asUser(a, book, ["creta", "Invalid", date(2), date(5)]),
      /supported pickup/,
    );
    await assert.rejects(
      asUser(a, book, ["creta", "Kathmandu", date(-1), date(5)]),
      /past/,
    );
    await assert.rejects(
      asUser(a, book, ["creta", "Kathmandu", date(2), date(40)]),
      /1 and 30/,
    );
    await assert.rejects(
      asUser(a, book, ["creta", "Kathmandu", date(2), date(2)]),
      /1 and 30/,
    );
    const reservation = (await call(a, book, params)).booking;
    assert.equal(reservation.user_id, a);
    assert.equal(reservation.total, 19500);
    await assert.rejects(asUser(b, book, params), /reserved/);
    await assert.rejects(
      asUser(b, book, ["creta", "Kathmandu", date(3), date(4)]),
      /reserved/,
    );
    await call(b, book, ["creta", "Pokhara", date(5), date(6)]);
    assert.equal(
      (await asUser(b, "select * from public.bookings")).rows.length,
      1,
    );
    assert.ok(
      (await asUser(b, "select * from public.bookings")).rows.every(
        (row) => row.user_id === b,
      ),
    );
    await assert.rejects(
      asUser(a, "update public.bookings set total=1"),
      /permission denied/,
    );
    await assert.rejects(
      asUser(a, "delete from public.bookings"),
      /permission denied/,
    );
    await assert.rejects(
      asUser(a, "insert into public.bookings default values"),
      /permission denied/,
    );
    const filtered = await call(
      null,
      "select public.rental_fleet($1::date,$2::date) as value",
      [date(2), date(5)],
    );
    assert.equal(
      filtered.cars.find((car) => car.id === "creta").available,
      false,
    );
    assert.ok(!JSON.stringify(filtered).includes("example.com"));
    await assert.rejects(
      asUser(b, "select public.rental_cancel($1::uuid)", [reservation.id]),
      /not found/,
    );
    const orders = await call(
      owner,
      "select public.rental_owner_orders() as value",
    );
    assert.equal(orders.bookings.length, 2);
    assert.deepEqual(
      orders.bookings.map((order) => order.customer_email).sort(),
      ["a@example.com", "b@example.com"],
    );
    await call(a, "select public.rental_cancel($1::uuid) as value", [
      reservation.id,
    ]);
    await call(a, "select public.rental_cancel($1::uuid) as value", [
      reservation.id,
    ]);
    const reopened = await call(
      null,
      "select public.rental_fleet($1::date,$2::date) as value",
      [date(2), date(5)],
    );
    assert.equal(
      reopened.cars.find((car) => car.id === "creta").available,
      true,
    );
    const sameDay = (
      await call(a, book, ["swift", "Kathmandu", date(0), date(1)])
    ).booking;
    await assert.rejects(
      asUser(a, "select public.rental_cancel($1::uuid)", [sameDay.id]),
      /before the pickup/,
    );
    await db.exec(setup);
    assert.equal(
      (await call(owner, "select public.rental_owner_orders() as value"))
        .bookings.length,
      3,
    );
    assert.equal(
      (await asUser(owner, "select role from public.profiles")).rows[0].role,
      "owner",
    );
  } finally {
    await db.close();
  }
});
