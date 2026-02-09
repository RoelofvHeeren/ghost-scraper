import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../lib/db.js";
import { Redis } from "ioredis";
import { Queue } from "bullmq";
import { QUEUES } from "@ghost-scraper/shared";

export async function adminRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

    // --- Candidates (Raw History) ---
    server.get("/candidates", {
        schema: {
            querystring: z.object({
                limit: z.coerce.number().default(50),
                botId: z.string().optional()
            })
        }
    }, async (req) => {
        const { limit, botId } = req.query;
        // If filtering by botId, currently candidates link to source, and bots link to source.
        // For MVP, we'll just show all candidates, or filter by source if we track it.
        // Candidates have `sourceId`.

        return db.leadCandidate.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { source: true, lead: true }
        });
    });
    // Parse REDIS_URL and extract credentials explicitly
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const parsedUrl = new URL(redisUrl);

    const redisOptions: any = {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port) || 6379,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    };

    if (parsedUrl.username) redisOptions.username = parsedUrl.username;
    if (parsedUrl.password) redisOptions.password = parsedUrl.password;

    const connection = new Redis(redisOptions);
    const pollQueue = new Queue(QUEUES.POLL_SOURCES, { connection: connection as any });


    // --- Clients ---
    server.get("/clients", async () => {
        return db.client.findMany({
            include: { services: true, areas: true },
            orderBy: { createdAt: "desc" }
        });
    });

    server.post("/clients", {
        schema: {
            body: z.object({
                name: z.string().min(1),
                twilioNumber: z.string().optional()
            })
        }
    }, async (req) => {
        return db.client.create({
            data: req.body as any
        });
    });

    // --- Sources ---
    server.get("/sources", async () => {
        return db.source.findMany({
            orderBy: { createdAt: "desc" },
            include: { connectorState: true, assignedBots: { include: { bot: true } } }
        });
    });

    server.post("/sources", {
        schema: {
            body: z.object({
                name: z.string(),
                type: z.enum(["NEXTDOOR", "REDDIT", "FACEBOOK", "CRAIGSLIST"]),
                config: z.any(),
                enabled: z.boolean().default(true)
            })
        }
    }, async (req) => {
        return db.source.create({
            data: req.body as any
        });
    });

    // --- Bot Accounts ---
    server.get("/bot-accounts", async () => {
        return db.botAccount.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                campaign: true,
                assignedSources: {
                    include: { source: true },
                    orderBy: { priority: 'asc' }
                }
            }
        });
    });

    server.post("/bot-accounts", {
        schema: {
            body: z.object({
                platform: z.enum(["NEXTDOOR", "REDDIT", "FACEBOOK", "CRAIGSLIST"]),
                username: z.string(),
                password: z.string().optional(),
                email: z.string().optional(),
                proxyUrl: z.string().optional(),
                cityMatches: z.array(z.string()).default([]),
                campaignId: z.string().optional(),
                sourceIds: z.array(z.string()).optional(),
                maxDailyPosts: z.number().default(10)
            })
        }
    }, async (req) => {
        const { sourceIds, ...botData } = req.body as any;

        const bot = await db.botAccount.create({
            data: botData
        });

        // Create source assignments if provided
        if (sourceIds && sourceIds.length > 0) {
            await db.botSourceAssignment.createMany({
                data: sourceIds.map((sourceId: string, index: number) => ({
                    botId: bot.id,
                    sourceId,
                    priority: index
                }))
            });
        }

        return db.botAccount.findUnique({
            where: { id: bot.id },
            include: { assignedSources: { include: { source: true } } }
        });
    });

    server.post("/bot-accounts/:id/start", {
        schema: {
            params: z.object({ id: z.string() })
        }
    }, async (req, reply) => {
        try {
            const { id } = req.params;

            // Auto-assign source if needed
            const bot = await db.botAccount.findUnique({
                where: { id },
                include: { assignedSources: true }
            });

            if (!bot) {
                return reply.status(404).send({ error: "Bot not found" });
            }

            if (bot.assignedSources.length === 0) {
                let source = await db.source.findFirst({ where: { type: bot.platform } });
                if (!source) {
                    source = await db.source.create({
                        data: {
                            name: `${bot.platform} Feed`,
                            type: bot.platform,
                            config: {}
                        }
                    });
                }
                await db.botSourceAssignment.create({
                    data: { botId: id, sourceId: source.id, priority: 0 }
                });
            }

            await pollQueue.add("manual-trigger", { botId: id });
            return { message: "Monitoring started" };
        } catch (error) {
            console.error("Error starting bot monitoring:", error);
            return reply.status(500).send({ error: "Internal Server Error", details: (error as any).message });
        }
    });

    // Update bot source assignments
    server.put("/bot-accounts/:id/sources", {
        schema: {
            params: z.object({ id: z.string() }),
            body: z.object({
                sourceIds: z.array(z.string())
            })
        }
    }, async (req) => {
        const { id } = req.params as any;
        const { sourceIds } = req.body as any;

        // Delete existing assignments
        await db.botSourceAssignment.deleteMany({ where: { botId: id } });

        // Create new assignments
        if (sourceIds.length > 0) {
            await db.botSourceAssignment.createMany({
                data: sourceIds.map((sourceId: string, index: number) => ({
                    botId: id,
                    sourceId,
                    priority: index
                }))
            });
        }

        return db.botAccount.findUnique({
            where: { id },
            include: { assignedSources: { include: { source: true } } }
        });
    });

    // --- Campaigns ---
    server.get("/campaigns", async () => {
        return db.campaign.findMany({
            orderBy: { createdAt: "desc" },
            include: { steps: { orderBy: { order: "asc" } }, bots: true }
        });
    });

    server.post("/campaigns", {
        schema: {
            body: z.object({
                name: z.string(),
                persona: z.enum(["BUSINESS", "COMMUNITY"]),
                status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
                steps: z.array(z.object({
                    order: z.number(),
                    delayMinutes: z.number(),
                    content: z.string()
                }))
            })
        }
    }, async (req) => {
        const { steps, ...rest } = req.body as any;
        return db.campaign.create({
            data: {
                ...rest,
                steps: {
                    create: steps
                }
            }
        });
    });

    server.put("/campaigns/:id", {
        schema: {
            params: z.object({ id: z.string() }),
            body: z.object({
                name: z.string().optional(),
                persona: z.enum(["BUSINESS", "COMMUNITY"]).optional(),
                status: z.enum(["ACTIVE", "PAUSED"]).optional(),
                steps: z.array(z.object({
                    order: z.number(),
                    delayMinutes: z.number(),
                    content: z.string()
                })).optional()
            })
        }
    }, async (req) => {
        const { id } = req.params as any;
        const { steps, ...rest } = req.body as any;

        if (steps) {
            // Delete existing steps and create new ones for simplicity in MVP
            await db.campaignStep.deleteMany({ where: { campaignId: id } });
            return db.campaign.update({
                where: { id },
                data: {
                    ...rest,
                    steps: {
                        create: steps
                    }
                }
            });
        }

        return db.campaign.update({
            where: { id },
            data: rest
        });
    });

    server.delete("/campaigns/:id", {
        schema: {
            params: z.object({ id: z.string() })
        }
    }, async (req) => {
        const { id } = req.params as any;
        return db.campaign.delete({ where: { id } });
    });
}
