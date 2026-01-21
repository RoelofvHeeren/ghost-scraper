import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../lib/db.js";

export async function adminRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

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
            data: req.body
        });
    });

    // --- Sources ---
    server.get("/sources", async () => {
        return db.source.findMany({
            orderBy: { createdAt: "desc" },
            include: { connectorState: true }
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
            data: req.body
        });
    });

    // --- Bot Accounts ---
    server.get("/bot-accounts", async () => {
        return db.botAccount.findMany({
            orderBy: { createdAt: "desc" }
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
                cityMatches: z.array(z.string()).default([])
            })
        }
    }, async (req) => {
        return db.botAccount.create({
            data: req.body
        });
    });
}
