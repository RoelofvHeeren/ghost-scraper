
import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { qualifyCandidate, SERVICE_PROFILES } from "@ghost-scraper/shared";

export async function processCandidateJob(job: Job) {
    const { candidateId } = job.data;

    const candidate = await db.leadCandidate.findUnique({
        where: { id: candidateId },
        include: { source: true }
    });

    if (!candidate) return;

    // Determine profile
    const sourceConfig = (candidate.source.config as any) || {};
    const profile = sourceConfig.profile === 'TRIMEN' ? SERVICE_PROFILES.TRIMEN : {
        include: sourceConfig.keywords || [],
        exclude: sourceConfig.exclude || [],
        threshold: sourceConfig.threshold || 20
    };

    const result = qualifyCandidate(candidate.body, profile);

    if (result.isQualified) {
        console.log(`✅ Candidate ${candidateId} qualified. Score: ${result.score}`);

        // Find a client to assign if any
        const client = await db.client.findFirst();

        await db.lead.create({
            data: {
                clientId: client?.id || "default",
                candidateId: candidate.id,
                score: result.score,
                reasons: result.reasons as any,
                status: "NEW"
            }
        });

        // Success logic here (e.g., notify client or trigger auto-reply)
    } else {
        console.log(`ℹ️ Candidate ${candidateId} did not qualify (score: ${result.score})`);
    }
}
