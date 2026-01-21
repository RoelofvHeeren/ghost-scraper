import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../lib/db.js";

export async function leadsRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

    // --- Leads List ---
    server.get("/leads", {
        schema: {
            querystring: z.object({
                limit: z.coerce.number().optional().default(50),
                offset: z.coerce.number().optional().default(0),
                status: z.enum(["NEW", "NOTIFIED", "CONTACTED", "CALLED", "BOOKED", "WON", "LOST", "NOT_A_FIT"]).optional(),
                city: z.string().optional()
            })
        }
    }, async (req) => {
        const { limit, offset, status, city } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (city) {
            where.candidate = {
                OR: [
                    { cityHint: { contains: city, mode: 'insensitive' } },
                    { body: { contains: city, mode: 'insensitive' } }
                ]
            };
        }

        const leads = await db.lead.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            include: {
                candidate: true,
                client: true,
                callEvents: true
            }
        });

        const total = await db.lead.count({ where });

        return { data: leads, pagination: { total, limit, offset } };
    });

    // --- Lead Detail ---
    server.get("/leads/:id", {
        schema: {
            params: z.object({ id: z.string() })
        }
    }, async (req, reply) => {
        const lead = await db.lead.findUnique({
            where: { id: req.params.id },
            include: {
                candidate: true,
                client: true,
                callEvents: true
            }
        });

        if (!lead) return reply.status(404).send({ error: "Lead not found" });
        return lead;
    });

    // --- Update Status ---
    server.post("/leads/:id/status", {
        schema: {
            params: z.object({ id: z.string() }),
            body: z.object({
                status: z.enum(["NEW", "NOTIFIED", "CONTACTED", "CALLED", "BOOKED", "WON", "LOST", "NOT_A_FIT"])
            })
        }
    }, async (req, reply) => {
        const lead = await db.lead.update({
            where: { id: req.params.id },
            data: { status: req.body.status }
        });
        return lead;
    });
}
