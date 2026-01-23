import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { adminRoutes } from "./routes/admin.js";
import { leadsRoutes } from "./routes/leads.js";
import { webhookRoutes } from "./routes/webhooks.js";

export async function buildApp() {
    const app = Fastify({
        logger: true,
    }).withTypeProvider<ZodTypeProvider>();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(cors, {
        origin: true, // Allow all origins (simpler for now) or specify ["https://web-production-a3b7e.up.railway.app"]
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    await app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Ghost Scraper API",
                version: "1.0.0",
            },
        },
    });

    await app.register(fastifySwaggerUi, {
        routePrefix: "/docs",
    });

    await app.register(adminRoutes, { prefix: "/admin" });
    await app.register(leadsRoutes);
    await app.register(webhookRoutes, { prefix: "/webhooks" });

    app.get("/", async () => {
        return { message: "Ghost Scraper API is running", documentation: "/docs", status: "ok" };
    });

    app.get("/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
    });

    return app;
}
