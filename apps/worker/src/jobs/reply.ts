
import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { NextdoorScraper } from "@ghost-scraper/shared";
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
                            }
                        }
                    }
                }
            }
        }
    }) as any;

    if (!lead) throw new Error(`Lead ${leadId} not found`);

    // Find the campaign assigned to the bot or source
    const bot = lead.candidate.source.assignedBots[0]?.bot || await db.botAccount.findFirst({
        where: { platform: "NEXTDOOR", status: "ACTIVE", campaignId: { not: null } },
        include: { campaign: { include: { steps: { orderBy: { order: "asc" } } } } }
    }) as any;

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

    const scraper = new NextdoorScraper();
    try {
        await scraper.init({
            sessionData: bot.sessionData,
            proxyUrl: bot.proxyUrl || undefined,
            lat: bot.latitude,
            lng: bot.longitude
        });

        const isLoggedIn = await scraper.login(bot.username, bot.password || "");
        if (!isLoggedIn) throw new Error("Bot login failed during reply");

        // Navigate to post and reply
        if (lead.candidate.url) {
            const success = await scraper.postComment(lead.candidate.url, step.content);
            if (!success) throw new Error("Failed to post comment");

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
        await scraper.close();
    }
}
