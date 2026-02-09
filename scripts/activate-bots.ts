import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Activating all NEXTDOOR bot accounts...");

    const result = await prisma.botAccount.updateMany({
        where: { platform: "NEXTDOOR" },
        data: { status: "ACTIVE" }
    });

    console.log(`✅ Updated ${result.count} bot accounts to ACTIVE.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
