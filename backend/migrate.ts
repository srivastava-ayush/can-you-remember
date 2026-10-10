import { readFile } from "node:fs/promises";
import { db } from "./db.ts";

try {
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await db.unsafe(schema);
  console.log("Database schema is ready.");
} finally {
  await db.end();
}
