import { AccountFactory } from '../../packages/shared/src/services/AccountFactory.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const factory = new AccountFactory();

    // 🟢 Configuration for the Test Run
    // You can edit these values directly effectively.

    const TARGET_ADDRESS = "9012 Grand Bayou Ct, Tampa, FL 33635";
    const TARGET_GPS = { lat: 28.0360, lng: -82.6060 }; // Coordinates of the address

    // Using a test proxy (Replace with one from your list if needed)
    // Format: http://user:pass@host:port
    const PROXY = process.env.TEST_PROXY || "http://ResidentialUser:Pass@ip:port";

    const TEXT_VERIFIED_KEY = process.env.TEXT_VERIFIED_API_KEY!;

    if (!TEXT_VERIFIED_KEY) {
        console.error("❌ Missing TEXT_VERIFIED_API_KEY in .env");
        process.exit(1);
    }

    console.log("🚀 Launching Account Factory Test...");
    console.log(`📍 Target: ${TARGET_ADDRESS} (${TARGET_GPS.lat}, ${TARGET_GPS.lng})`);

    try {
        await factory.createBot({
            baseEmail: "roelof818@gmail.com", // Base for alias (roelof818+test1234@gmail.com)
            proxy: PROXY,
            textVerifiedApiKey: TEXT_VERIFIED_KEY,
            firstName: "Roelof", // Optional, random if omitted
            lastName: "Test",
            address: TARGET_ADDRESS,
            latitude: TARGET_GPS.lat,
            longitude: TARGET_GPS.lng
        });

        console.log("✅ Test Run Complete!");
    } catch (error) {
        console.error("❌ Test Run Failed:", error);
    }
}

main();
