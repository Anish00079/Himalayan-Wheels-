import { randomUUID } from "node:crypto";
import { hashPassword } from "./passwords.js";

// Run only through the local setup command; never expose owner creation as a public API.
export function createOwner(db, { name, email, password }) {
  name = typeof name === "string" ? name.trim() : "";
  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (
    !name ||
    name.length > 80 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      "Enter a name, valid email, and an owner password of 12–128 characters.",
    );
  }
  if (db.prepare("SELECT id FROM users WHERE email=?").get(email)) {
    throw new Error(
      "That email already has an account. Use a separate owner email; existing accounts are not changed.",
    );
  }
  const user = { id: randomUUID(), name, email, role: "owner" };
  db.prepare(
    "INSERT INTO users (id,name,email,password,role) VALUES(?,?,?,?,?)",
  ).run(user.id, name, email, hashPassword(password), user.role);
  return user;
}
