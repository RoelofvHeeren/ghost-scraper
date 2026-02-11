import dotenv from "dotenv"; // Force deploy: v4.3 - verification detection fix
import { Worker } from "bullmq";
import { redisConnection } from "./lib/queues.js";
import { QUEUES } from "@ghost-scraper/shared";
import { pollSourceJob } from "./jobs/poll.js";
import { processCandidateJob } from "./jobs/process.js";
import { postReplyJob } from "./jobs/reply.js";

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
        await processCandidateJob(job);
    }, { connection: redisConnection as any });

    // Worker for Posting Replies
    new Worker(QUEUES.POST_REPLY, async (job) => {
        console.log(`Processing Reply Job: ${job.name}`);
        await postReplyJob(job);
    }, { connection: redisConnection as any });

    console.log("Workers are listening!");
}

main();
// v4.3 deploy trigger
