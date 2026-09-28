import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { resolve } from "node:path";
import { openDatabase } from "./db.js";
import { createOwner } from "./owners.js";

let hidden = false;
const output = new Writable({
  write(chunk, encoding, done) {
    if (!hidden) process.stdout.write(chunk, encoding);
    done();
  },
});
const terminal = createInterface({
  input: process.stdin,
  output,
  terminal: Boolean(process.stdin.isTTY),
});
let db;
try {
  console.log(
    "Create a Himalayan Wheels owner account. Password input is hidden.",
  );
  const name = await terminal.question("Owner name: ");
  const email = await terminal.question("Owner email: ");
  process.stdout.write("Password (12–128 characters): ");
  hidden = true;
  const password = await terminal.question("");
  hidden = false;
  process.stdout.write("\nConfirm password: ");
  hidden = true;
  const confirmation = await terminal.question("");
  hidden = false;
  process.stdout.write("\n");
  if (password !== confirmation)
    throw new Error("Passwords do not match. No account was created.");
  db = openDatabase(
    process.env.DB_PATH || resolve("data/himalayan-wheels.sqlite"),
  );
  const owner = createOwner(db, { name, email, password });
  console.log(
    `Owner account created for ${owner.email}. Choose Owner in the website sign-in form.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  terminal.close();
  db?.close();
}
