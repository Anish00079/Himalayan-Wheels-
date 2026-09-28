import { fleetRows } from "../shared/fleet.js";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function openDatabase(filename) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cars(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,seats INTEGER NOT NULL,transmission TEXT NOT NULL,fuel TEXT NOT NULL,price INTEGER NOT NULL,color TEXT NOT NULL,description TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),car_id TEXT NOT NULL REFERENCES cars(id),pickup TEXT NOT NULL,start_date TEXT NOT NULL,end_date TEXT NOT NULL,days INTEGER NOT NULL,daily_rate INTEGER NOT NULL,total INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN ('Confirmed','Cancelled')),created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS booking_owner ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS booking_availability ON bookings(car_id,status,start_date,end_date);`);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO cars VALUES(?,?,?,?,?,?,?,?,?)",
  );
  for (const car of fleetRows) insert.run(...car);
  return db;
}
