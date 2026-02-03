
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
    private model: any | null = null;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (key) {
            const genAI = new GoogleGenerativeAI(key);
            this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
        } else {
            console.warn("GeminiService initialized without API Key. LLM features will be disabled.");
        }
    }

    async evaluateMessage(text: string, criteria: string): Promise<{ score: number, reason: string, isQualified: boolean }> {
        if (!this.model) {
            return { score: 0, reason: "LLM not configured (Gemini)", isQualified: false };
        }

        try {
            const prompt = `
            You are a lead qualification expert. Evaluate the following message based on these criteria:
            "${criteria}"

            Message:
            "${text}"

            Return a VALID JSON object (and nothing else) with the following fields:
            - score: number (0-100)
            - reason: string (brief explanation)
            - isQualified: boolean (true if score > 70)
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Sanitize response to ensure valid JSON (Gemini sometimes adds markdown blocks)
            const jsonStr = textResponse.replace(/^```json\n|\n```$/g, "").trim();

            const parsed = JSON.parse(jsonStr);
            return {
                score: parsed.score || 0,
                reason: parsed.reason || "No reason provided",
                isQualified: parsed.isQualified || false
            };
        } catch (error) {
            console.error("Gemini Evaluation failed:", error);
            return { score: 0, reason: "Evaluation failed", isQualified: false };
        }
    }
}
