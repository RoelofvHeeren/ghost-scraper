import { Job } from "bullmq";
import { db } from "../lib/db.js";

export async function processCandidateJob(job: Job) {
    const { candidateId } = job.data;

    const candidate = await db.leadCandidate.findUnique({
        where: { id: candidateId },
        include: { source: true }
    });

    if (!candidate) {
        throw new Error(`Candidate ${candidateId} not found`);
    }

    // scoring logic
    const body = candidate.body.toLowerCase();
    const config = candidate.source.config as any;
    const keywords = config.keywords || [];

    let score = 0;
    const matchedKeywords: string[] = [];

    for (const kw of keywords) {
        if (body.includes(kw.toLowerCase())) {
            score += 20;
            matchedKeywords.push(kw);
        }
    }

    // If score meets threshold, create a lead
    if (score >= 20) {
        console.log(`Candidate ${candidateId} qualified with score ${score}. Matched: ${matchedKeywords.join(", ")}`);

        // Find a client to assign if any
        const client = await db.client.findFirst();

        await db.lead.create({
            data: {
                clientId: client?.id || "default",
                candidateId: candidate.id,
                score,
                reasons: { matchedKeywords },
                status: "NEW"
            }
        });

        // Next: Trigger the start of a campaign reply sequence
    } else {
        console.log(`Candidate ${candidateId} did not qualify (score: ${score})`);
    }
}
