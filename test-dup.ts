import { db } from "./src/server/db";
import { manufactureYears } from "./src/server/db/schema";
async function main() {
  try {
    await db.insert(manufactureYears).values({ year: "2099" }).returning();
    console.log("Inserted");
  } catch (e: any) {
    console.log("Code:", e.code);
    console.log("Message:", e.message);
    console.log("Keys:", Object.keys(e));
    console.log("Detail:", e.detail);
    console.log("Stringified:", JSON.stringify(e));
  }
}
main();
