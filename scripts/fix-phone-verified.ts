import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting phoneVerified field migration...");

  try {
    // First, let's use MongoDB native update to fix the field type
    const result = await prisma.$runCommandRaw({
      update: "user",
      updates: [
        {
          q: {},  // Match all documents
          u: [
            {
              $set: {
                phoneVerified: {
                  $switch: {
                    branches: [
                      // If phoneVerified is a string, keep it
                      { case: { $eq: [{ $type: "$phoneVerified" }, "string"] }, then: "$phoneVerified" },
                      // If it's a boolean, convert to string
                      { case: { $eq: [{ $type: "$phoneVerified" }, "bool"] }, then: "not_verified" },
                    ],
                    // Default case for null or missing
                    default: null
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });

    console.log("Migration result:", result);
    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
