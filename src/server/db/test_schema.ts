import * as schema from "./schema";
import { PgTable } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";

async function main() {
    const tableKeys = [];
    for (const [key, value] of Object.entries(schema)) {
        if (value instanceof PgTable) {
            tableKeys.push(key);
        }
    }
    console.log("const INSERT_ORDER = [");
    tableKeys.forEach(k => console.log(`  "${k}",`));
    console.log("];");
}

main().catch(console.error);
