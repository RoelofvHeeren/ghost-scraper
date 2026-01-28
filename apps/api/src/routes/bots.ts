
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
}
