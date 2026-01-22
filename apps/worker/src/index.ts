import dotenv from "dotenv";
import { Worker } from "bullmq";
import { redisConnection, pollQueue } from "./lib/queues.js";
import { QUEUES } from "@ghost-scraper/shared";
import { pollSourceJob } from "./jobs/poll.js";

dotenv.config({ path: "../../.env" });

async function main() {
    console.log("Worker starting...");

    // Worker for Polling Sources
    new Worker(QUEUES.POLL_SOURCES, async (job) => {
        console.log(`Processing Poll Job: ${job.name}`);
        await pollSourceJob(job);
    }, { connection: redisConnection as any });

    // Worker for Processing Candidates
    new Worker(QUEUES.PROCESS_CANDIDATE, async (job) => {
        console.log(`Processing Process Job: ${job.name}`);
    }, { connection: redisConnection as any });

    // Worker for Posting Replies
    new Worker(QUEUES.POST_REPLY, async (job) => {
        console.log(`Processing Reply Job: ${job.name}`);
    }, { connection: redisConnection as any });

    console.log("Workers are listening!");

    // Schedule initial poll jobs if needed or they are scheduled by API/Cron
    // For MVP, we can run a loop here or use repeatable jobs
    // await pollQueue.add("poll-nextdoor", { source: "NEXTDOOR" }, { repeat: { every: 60000 } });
}

main();
