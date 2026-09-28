import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64, options).toString("hex");
}
export function matches(password, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64, options),
    Buffer.from(hash, "hex"),
  );
}
