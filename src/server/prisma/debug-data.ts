
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Ad data...");
    const total = await prisma.ad.count();
    console.log("Total Ads:", total);

    const typeCounts = await prisma.ad.groupBy({
        by: ["type"],
        where: { type: { not: null } },
        _count: { id: true },
    });
    console.log("Type Counts:", typeCounts);

    const listingTypeCounts = await prisma.ad.groupBy({
        by: ["listingType"],
        _count: { id: true },
    });
    console.log("ListingType Counts:", listingTypeCounts);

    const nullTypes = await prisma.ad.findMany({
        where: { type: { isSet: false } as any }, // MongoDB specific check if possible, or just standard
        take: 5
    });
    // Prisma usually handles required fields by assuming they exist.
    // Let's just try to group.
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
