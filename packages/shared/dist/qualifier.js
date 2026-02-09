import { GeminiService } from "./services/GeminiService.js";
const llmService = new GeminiService();
export async function qualifyCandidate(text, profile) {
    const lower = text.toLowerCase();
    const threshold = profile.threshold || 20;
    // 0. LLM Check (if configured)
    if (profile.llmCriteria) {
        // Skip hard reject for now if using LLM, or keep it as a pre-filter?
        // Let's keep exclusion list as a pre-filter to save tokens.
        for (const bad of profile.exclude) {
            if (lower.includes(bad.toLowerCase())) {
                return { score: 0, reasons: [`exclude:${bad}`], isQualified: false };
            }
        }
        const llmResult = await llmService.evaluateMessage(text, profile.llmCriteria);
        return {
            ...llmResult,
            reasons: [llmResult.reason]
        };
    }
    // 1. Exclusion Check (Hard Reject)
    for (const bad of profile.exclude) {
        if (lower.includes(bad.toLowerCase())) {
            return { score: 0, reasons: [`exclude:${bad}`], isQualified: false };
        }
    }
    let score = 0;
    const reasons = [];
    // 2. Keyword Match (Direct Service Match)
    for (const inc of profile.include) {
        if (lower.includes(inc.toLowerCase())) {
            score += 20;
            reasons.push(`keyword:${inc}`);
        }
    }
    // 3. Intent Detection (Seeking service)
    const intentWords = profile.intentKeywords || ["looking for", "need", "recommend", "iso", "suggestion", "anyone know"];
    for (const word of intentWords) {
        if (lower.includes(word)) {
            score += 15;
            reasons.push(`intent:seeking`);
            break;
        }
    }
    // 4. Urgency Detection
    const urgencyWords = profile.urgencyKeywords || ["asap", "emergency", "today", "immediately", "quick"];
    for (const word of urgencyWords) {
        if (lower.includes(word)) {
            score += 10;
            reasons.push(`intent:urgent`);
            break;
        }
    }
    // 5. Semantic "Trimen" Logic (Specific High-Value Patterns)
    // Checking for patterns like "Tree hanging over house" or "Storm damage"
    if (lower.includes("fall") || lower.includes("storm") || lower.includes("damage") || lower.includes("hanging")) {
        score += 10;
        reasons.push(`semantic:high_value_context`);
    }
    return {
        score,
        reasons,
        isQualified: score >= threshold
    };
}
// Pre-defined profiles
export const SERVICE_PROFILES = {
    TRIMEN: {
        include: ["tree", "stump", "arborist", "pruning", "trimming", "palm", "oak", "pine", "removal"],
        exclude: ["free", "giveaway", "fake", "scam"],
        threshold: 25
    },
    GENERAL: {
        include: [],
        exclude: ["scam", "spam"],
        threshold: 20
    }
};
