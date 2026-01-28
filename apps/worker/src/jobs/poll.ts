import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { NextdoorConnector } from "../connectors/nextdoor.js";

/**
 * Poll job - now processes ALL sources assigned to a bot in a single session
 * This is more efficient than opening/closing browser for each source
 */
export async function pollBotJob(job: Job) {
    const { botId } = job.data;

    const bot = await db.botAccount.findUnique({
        where: { id: botId },
        include: {
            assignedSources: {
                include: { source: true },
                orderBy: { priority: 'asc' }
            }
        }
    }) as any;

    if (!bot || bot.status !== "ACTIVE") {
        console.log(`Bot ${botId} not found or not active`);
        return;
    }

    if (!bot.assignedSources || bot.assignedSources.length === 0) {
        console.log(`Bot ${botId} has no assigned sources`);
        return;
    }

    if (bot.platform === "NEXTDOOR") {
        const connector = new NextdoorConnector();

        try {
            // Initialize browser once with bot's proxy and session
            await connector.init({
                sessionData: bot.sessionData,
                proxyUrl: bot.proxyUrl || undefined
            });

            // Login once
            const isLoggedIn = await connector.login(bot.username, bot.password || "");
            if (!isLoggedIn) {
                await db.botAccount.update({
                    where: { id: bot.id },
                    data: { status: "NEEDS_REVIEW", loginErrorCount: { increment: 1 } } as any
                });
                return;
            }

            // Save session after successful login
            const newSession = await connector.getSessionData();
            await db.botAccount.update({
                where: { id: bot.id },
                data: { sessionData: newSession, lastLoginAt: new Date() }
            });

            // Process each assigned source in sequence
            let totalScraped = 0;
            for (const assignment of bot.assignedSources) {
                const source = assignment.source;

                if (!source.enabled) {
                    console.log(`Source ${source.id} is disabled, skipping`);
                    continue;
                }

                console.log(`Bot ${bot.username} scraping source: ${source.name}`);

                try {
                    const posts = await connector.getFeed();
                    console.log(`Scraped ${posts.length} posts from ${source.name}`);
                    totalScraped += posts.length;

                    for (const post of posts) {
                        const dedupHash = `${post.externalId}-${source.id}`;

                        await db.leadCandidate.upsert({
                            where: { dedupHash },
                            create: {
                                ...post,
                                sourceId: source.id,
                                dedupHash
                            },
                            update: {} // Skip if already exists
                        });
                    }

                    // Small delay between sources to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

                } catch (sourceError) {
                    console.error(`Error scraping source ${source.name}:`, sourceError);
                    // Continue to next source even if one fails
                }
            }

            // Update bot scrape count
            await db.botAccount.update({
                where: { id: bot.id },
                data: { dailyScrapeCount: { increment: totalScraped } }
            });

            console.log(`Bot ${bot.username} completed scraping ${bot.assignedSources.length} sources, total posts: ${totalScraped}`);

        } catch (error) {
            console.error(`Poll job failed for bot ${botId}:`, error);
            await db.botAccount.update({
                where: { id: bot.id },
                data: { status: "NEEDS_REVIEW" } as any
            });
        } finally {
            await connector.close();
        }
    }
}

// Legacy function for backward compatibility - will be deprecated
export async function pollSourceJob(job: Job) {
    console.warn("pollSourceJob is deprecated, use pollBotJob instead");
    const { sourceId } = job.data;

    // Find a bot assigned to this source
    const assignment = await db.botSourceAssignment.findFirst({
        where: { sourceId },
        include: { bot: true }
    }) as any;

    if (assignment) {
        return pollBotJob({ ...job, data: { botId: assignment.bot.id } } as any);
    }
}
