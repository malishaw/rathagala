import { db } from "./src/server/db";
import { ads } from "./src/server/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

async function test() {
  const result = await db.select({ model: ads.model })
    .from(ads)
    .where(and(isNotNull(ads.model)))
    .groupBy(ads.model)
    .limit(10);
  console.log(result);
}
test();
