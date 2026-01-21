import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { NextdoorConnector } from "../connectors/nextdoor.js";

export async function pollSourceJob(job: Job) {
    const { sourceId } = job.data;

    const source = await db.source.findUnique({ where: { id: sourceId } });
    if (!source) {
        throw new Error(`Source ${sourceId} not found`);
    }

    if (source.type === "NEXTDOOR") {
        const connector = new NextdoorConnector();
        await connector.init();
        // Logic to fetch account from BotAccount pool would go here
        // For now, placeholder
        await connector.close();
    }
}
