import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { NextdoorConnector } from "../connectors/nextdoor.js";
import { replyQueue } from "../lib/queues.js";

export async function postReplyJob(job: Job) {
    const { leadId, stepIndex = 0 } = job.data;

    const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: {
            candidate: {
                include: {
                    source: {
                        include: {
                            assignedBots: {
                                where: { bot: { status: "ACTIVE" } },
                                include: { bot: true }
                            } as any
                        }
                    }
                }
            }
        }
    }) as any;

    if (!lead) throw new Error(`Lead ${leadId} not found`);

    // Find the campaign assigned to the bot or source
    const bot = lead.candidate.source.assignedBots[0] || await db.botAccount.findFirst({
        where: { platform: "NEXTDOOR", status: "ACTIVE", campaignId: { not: null } },
        include: { campaign: { include: { steps: { orderBy: { order: "asc" } } } } }
    });

    if (!bot || !bot.campaign) {
        console.error(`No active bot or campaign found for lead ${leadId}`);
        return;
    }

    const campaign = bot.campaign;
    const step = campaign.steps[stepIndex];

    if (!step) {
        console.log(`Campaign ${campaign.name} finished for lead ${leadId}`);
        return;
    }

    console.log(`Executing step ${stepIndex + 1}/${campaign.steps.length} for lead ${leadId}`);

    // Post the reply
    const connector = new NextdoorConnector();
    try {
        await connector.init({
            sessionData: bot.sessionData,
            proxyUrl: bot.proxyUrl || undefined
        });

        const isLoggedIn = await connector.login(bot.username, bot.password || "");
        if (!isLoggedIn) throw new Error("Bot login failed during reply");

        // Navigate to post and reply
        // This is a simplified version of the scraper's target
        if (lead.candidate.url) {
            await connector.postComment(lead.candidate.url, step.content);

            await db.automationLog.create({
                data: {
                    action: "POST_REPLY",
                    leadId: lead.id,
                    status: "SUCCESS",
                    message: `Posted step ${stepIndex + 1}: ${campaign.name}`
                }
            });

            // Schedule next step if available
            const nextStep = campaign.steps[stepIndex + 1];
            if (nextStep) {
                const delayMs = nextStep.delayMinutes * 60 * 1000;
                // Add some jitter (±10%)
                const jitter = delayMs * 0.1;
                const finalDelay = delayMs + (Math.random() * 2 - 1) * jitter;

                await replyQueue.add(`reply-step-${stepIndex + 1}`,
                    { leadId, stepIndex: stepIndex + 1 },
                    { delay: finalDelay }
                );
            }
        }

    } catch (error) {
        console.error(`Reply job failed for lead ${leadId}:`, error);
        await db.automationLog.create({
            data: {
                action: "POST_REPLY",
                leadId: lead.id,
                status: "FAILURE",
                message: error instanceof Error ? error.message : "Unknown error"
            }
        });
    } finally {
        await connector.close();
    }
}
