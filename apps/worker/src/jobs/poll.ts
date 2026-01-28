import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { NextdoorScraper } from "@ghost-scraper/shared";

/**
 * Poll job - now processes ALL sources assigned to a bot in a single session
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
        const scraper = new NextdoorScraper();

        try {
            // Initialize once with bot's details
            await scraper.init({
                sessionData: bot.sessionData,
                proxyUrl: bot.proxyUrl || undefined,
                lat: bot.latitude,
                lng: bot.longitude
            });

            // Login once
            const isLoggedIn = await scraper.login(bot.username, bot.password || "");
            if (!isLoggedIn) {
                console.log(`Bot ${bot.username} login failed`);
                await db.botAccount.update({
                    where: { id: bot.id },
                    data: { status: "NEEDS_REVIEW", loginErrorCount: { increment: 1 } } as any
                });
                return;
            }

            // Save session after successful login
            const newCookies = await scraper.getCookies();
            await db.botAccount.update({
                where: { id: bot.id },
                data: {
                    sessionData: { cookies: newCookies } as any,
                    lastLoginAt: new Date()
                }
            });

            // Process each assigned source
            let totalScraped = 0;
            for (const assignment of bot.assignedSources) {
                const source = assignment.source;
                if (!source.enabled) continue;

                console.log(`🤖 Bot ${bot.username} scraping: ${source.name}`);

                try {
                    const posts = await scraper.scrapeSource(source.config);
                    console.log(`✅ Scraped ${posts.length} posts from ${source.name}`);
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
                            update: {}
                        });
                    }
                } catch (sourceError) {
                    console.error(`❌ Source Error (${source.name}):`, sourceError);
                }
            }

            // Update bot scrape count
            await db.botAccount.update({
                where: { id: bot.id },
                data: { dailyScrapeCount: { increment: totalScraped } }
            });

            console.log(`🏁 Bot ${bot.username} finished. Total posts: ${totalScraped}`);

        } catch (error) {
            console.error(`💥 Bot Job Failed (${botId}):`, error);
        } finally {
            await scraper.close();
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
