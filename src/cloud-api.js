import { createClient } from "@supabase/supabase-js";

let client;
function cloud() {
  if (!client)
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );
  return client;
}
function result(response) {
  if (response.error) throw new Error(response.error.message);
  return response.data;
}
async function currentUser() {
  const { user } = result(await cloud().auth.getUser());
  if (!user) throw new Error("Please sign in to continue.");
  const profile = result(
    await cloud()
      .from("profiles")
      .select("name,role")
      .eq("id", user.id)
      .single(),
  );
  return {
    id: user.id,
    name: profile.name,
    email: user.email,
    role: profile.role,
  };
}
export async function cloudApi(path, method = "GET", body) {
  const service = cloud();
  const url = new URL(path, "https://api.invalid");
  if (url.pathname === "/cars")
    return result(
      await service.rpc("rental_fleet", {
        p_start: url.searchParams.get("start"),
        p_end: url.searchParams.get("end"),
      }),
    );
  if (path === "/auth/register" && method === "POST") {
    const data = result(
      await service.auth.signUp({
        email: body.email.trim().toLowerCase(),
        password: body.password,
        options: {
          data: { name: body.name.trim() },
          emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
        },
      }),
    );
    if (!data.session)
      return {
        user: null,
        message:
          "Check your email to confirm your account, then sign in to book a car.",
      };
    return { user: await currentUser() };
  }
  if (path === "/auth/login" && method === "POST") {
    result(
      await service.auth.signInWithPassword({
        email: body.email.trim().toLowerCase(),
        password: body.password,
      }),
    );
    const user = await currentUser();
    if (body.role === "owner" && user.role !== "owner") {
      result(await service.auth.signOut({ scope: "local" }));
      throw new Error(
        "This account does not have owner access. Choose User to sign in.",
      );
    }
    return { user };
  }
  if (path === "/auth/me") return { user: await currentUser() };
  if (path === "/auth/logout") {
    result(await service.auth.signOut({ scope: "local" }));
    return { ok: true };
  }
  if (path === "/owner/bookings")
    return result(await service.rpc("rental_owner_orders"));
  if (path === "/bookings" && method === "GET") {
    await currentUser();
    const data = result(
      await service
        .from("bookings")
        .select("*,cars(name,category,transmission,fuel,seats,color)")
        .order("created_at", { ascending: false }),
    );
    return {
      bookings: data.map(({ cars, ...booking }) => ({ ...cars, ...booking })),
    };
  }
  if (path === "/bookings" && method === "POST")
    return result(
      await service.rpc("rental_book", {
        p_car_id: body.car_id,
        p_pickup: body.pickup,
        p_start: body.start_date,
        p_end: body.end_date,
      }),
    );
  if (/^\/bookings\/[^/]+\/cancel$/.test(path) && method === "PATCH")
    return result(
      await service.rpc("rental_cancel", { p_booking_id: path.split("/")[2] }),
    );
  throw new Error("This action is unavailable.");
}
