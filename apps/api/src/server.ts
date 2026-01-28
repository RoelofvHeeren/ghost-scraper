import dotenv from "dotenv"; // Force deploy: Headless fix verification
import { buildApp } from "./app.js";

dotenv.config({ path: "../../.env" });

const PORT = parseInt(process.env.API_PORT || "8080", 10);

async function main() {
    const app = await buildApp();

    try {
        await app.listen({ port: PORT, host: "0.0.0.0" });
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Docs available at http://localhost:${PORT}/docs`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();
