
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AccountFactory } from "@ghost-scraper/shared"; // Relative path to worker logic

export async function botRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

    server.post("/create-batch", {
        schema: {
            body: z.object({
                proxies: z.array(z.string()),
                baseEmail: z.string().email(),
                textVerifiedApiKey: z.string(),
                firstName: z.string().optional(),
                lastName: z.string().optional()
            })
        }
    }, async (req, reply) => {
        const factory = new AccountFactory();
        const { proxies, baseEmail, textVerifiedApiKey, firstName, lastName } = req.body;

        // Process sequentially to be safe with RAM/IP limits
        const results = [];
        for (const proxy of proxies) {
            try {
                await factory.createBot({
                    proxy,
                    baseEmail,
                    textVerifiedApiKey,
                    firstName,
                    lastName
                });
                results.push({ proxy, status: "SUCCESS" });
            } catch (e: any) {
                console.error(e);
                results.push({ proxy, status: "FAILED", error: e.message });
            }
        }

        return {
            message: "Batch processing completed",
            results
        };
    });

    server.post("/factory", {
        schema: {
            body: z.object({
                proxy: z.string(),
                baseEmail: z.string().email(),
                address: z.string(),
                lat: z.number(),
                lng: z.number(),
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                password: z.string().optional(),
                textVerifiedApiKey: z.string().optional()
            })
        }
    }, async (req, reply) => {
        const factory = new AccountFactory();
        const data = req.body;

        const apiKey = data.textVerifiedApiKey || process.env.TEXT_VERIFIED_API_KEY;
        if (!apiKey) {
            return reply.status(400).send({ error: "Missing TEXT_VERIFIED_API_KEY (Env or Body)" });
        }

        // Trigger Async? Or wait? 
        // For UI feedback, waiting is better, but might timeout (factory takes ~2-3 mins).
        // Let's run it async but return success immediately, or simple wait if short.
        // Given Puppeteer, let's just await it for now so we see the error/success in the UI directly.
        // Railway has timeout limits (variable). If it times out, we might move to background job later.

        try {
            await factory.createBot({
                ...data,
                textVerifiedApiKey: apiKey
            });
            return { status: "SUCCESS", message: "Bot created successfully" };
        } catch (e: any) {
            server.log.error(e);
            return reply.status(500).send({ status: "FAILED", error: e.message });
        }
    });
}
