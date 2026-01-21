import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../lib/db.js";

export async function webhookRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

    // --- Twilio Voice Webhook ---
    // POST /webhooks/twilio/voice
    server.post("/twilio/voice", {
        schema: {
            // Twilio sends form-urlencoded data, validation might be tricky with strict Zod Schema on body if we don't use a specific parser
            // For now we will allow any and parse manually or just look for specific fields
            // Accessing raw body might be needed for signature validation
        }
    }, async (req, reply) => {
        // In a real app, validate X-Twilio-Signature header
        // const signature = req.headers['x-twilio-signature'];

        const body = req.body as any; // Fastify parses form body if content-type is correct

        const { CallSid, From, To, CallDuration, RecordingUrl, Caller } = body || {};

        // We assume 'To' is our tracking number. 
        // We need to find the Lead associated with this number calling us? 
        // Or the number matches a Client?
        // In MVP: One number per client.

        // Logic: Find client by 'To' number. Then find open lead for 'From' number?
        // Or if we use unique number per lead, we find lead directly.

        // For this MVP, we will just log the event if we can find a lead that matches the 'From' number 
        // (assuming the lead provided their phone number in the post body? No, we don't have lead phone usually).

        // Actually, Ghost Scraper spec says: "We'll comment this phone number on the platform". 
        // So the LEAD calls US.
        // We attribute the call to the Lead based on who we replied to recently in that area?
        // Or we just log it as an "Inbound Call" for a Client.

        // Let's find the Client with this twilioNumber
        if (To) {
            const client = await db.client.findFirst({
                where: { twilioNumber: To }
            });

            if (client) {
                // Create a CallEvent attached to... a lead? 
                // If we don't know the lead, we might need a "General Inquiry" lead or look up by caller ID history.
                // For now, let's just log it.
                console.log(`Call from ${From} to Client ${client.name}`);
            }
        }

        // Twilio needs TwiML response
        reply.type('text/xml');
        return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial>${process.env.TWILIO_FORWARD_TO || "+15555555555"}</Dial></Response>`;
    });
}
