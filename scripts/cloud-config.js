export function validateCloudConfig(env) {
  if (env.VITE_BACKEND !== "supabase") return;
  if (env.VITE_PREVIEW === "true")
    throw new Error("Cloud mode cannot also enable the browser demo.");
  let url;
  try {
    url = new URL(env.VITE_SUPABASE_URL);
  } catch {
    throw new Error(
      "Set a valid Supabase Project URL before building cloud mode.",
    );
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".supabase.co") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "Use the HTTPS Project URL from your Supabase Connect panel.",
    );
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (key.startsWith("sb_publishable_") && key.length > 25) return;
  try {
    const claims = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString(),
    );
    if (claims.role === "anon") return;
  } catch {
    /* Reject missing or private keys without printing their values. */
  }
  throw new Error(
    "Use a Supabase publishable key or legacy anon key. Private/service-role keys must never be included in the website.",
  );
}
