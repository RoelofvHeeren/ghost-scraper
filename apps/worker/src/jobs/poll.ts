import { Job } from "bullmq";
import { db } from "../lib/db.js";
import { NextdoorScraper } from "@ghost-scraper/shared";
import { processQueue, publishBotLog } from "../lib/queues.js";


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
        await publishBotLog(botId, `⚠️ No sources assigned, stopping.`, 'warning');
        console.log(`Bot ${botId} has no assigned sources`);
        return;
    }


    if (bot.platform === "NEXTDOOR") {
        const scraper = new NextdoorScraper();

        try {
            await scraper.init({
                sessionData: bot.sessionData,
                proxyUrl: bot.proxyUrl || undefined,
                lat: bot.latitude,
                lng: bot.longitude
            });

            await publishBotLog(botId, `🔄 Initializing scraper...`);

            // Login once
            const isLoggedIn = await scraper.login(bot.username, bot.password || "");
            if (!isLoggedIn) {
                await publishBotLog(botId, `❌ Login failed for ${bot.username}`, 'error');
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
                await publishBotLog(botId, `🔎 Scraping source: ${source.name}`);

                try {
                    const posts = await scraper.scrapeSource(source.config);
                    console.log(`✅ Scraped ${posts.length} posts from ${source.name}`);
                    await publishBotLog(botId, `✅ Found ${posts.length} posts in ${source.name}`, 'success');
                    totalScraped += posts.length;

                    for (const post of posts) {
                        const dedupHash = `${post.externalId}-${source.id}`;

                        // Check if exists first to avoid redundant processing jobs
                        const existing = await db.leadCandidate.findUnique({ where: { dedupHash } });
                        if (existing) continue;

                        const candidate = await db.leadCandidate.create({
                            data: {
                                ...post,
                                sourceId: source.id,
                                dedupHash
                            }
                        });

                        await processQueue.add("process-candidate", { candidateId: candidate.id });
                    }
                } catch (sourceError: any) {
                    console.error(`❌ Source Error (${source.name}):`, sourceError);
                    await publishBotLog(botId, `❌ Error scraping ${source.name}: ${sourceError.message}`, 'error');
                }
            }

            // Update bot scrape count
            await db.botAccount.update({
                where: { id: bot.id },
                data: { dailyScrapeCount: { increment: totalScraped } }
            });

            console.log(`🏁 Bot ${bot.username} finished. Total posts: ${totalScraped}`);
            await publishBotLog(botId, `🏁 Job finished. Total scraped: ${totalScraped}`, 'success');

        } catch (error: any) {
            console.error(`💥 Bot Job Failed (${botId}):`, error);
            await publishBotLog(botId, `💥 Critical Job Error: ${error.message}`, 'error');
        } finally {
            await scraper.close();
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
