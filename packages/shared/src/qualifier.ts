export type ScoringResult = {
    score: number;
    reasons: string[];
};

export function scoreCandidate(text: string, include: string[], exclude: string[]): ScoringResult {
    const lower = text.toLowerCase();

    // 1. Exclusion Check
    for (const bad of exclude) {
        if (lower.includes(bad.toLowerCase())) {
            return { score: 0, reasons: [`exclude:${bad}`] };
        }
    }

    let score = 0;
    const reasons: string[] = [];

    // 2. Keyword Match
    for (const inc of include) {
        if (lower.includes(inc.toLowerCase())) {
            score += 15;
            reasons.push(`include:${inc}`);
        }
    }

    // 3. Intent Detection
    if (lower.includes("looking for") || lower.includes("need") || lower.includes("recommend") || lower.includes("iso")) {
        score += 25;
        reasons.push("intent:seeking_service");
    }

    // 4. Urgency Detection
    if (lower.includes("asap") || lower.includes("emergency") || lower.includes("today") || lower.includes("immediately")) {
        score += 15;
        reasons.push("intent:urgent");
    }

    // 5. Question Detection
    if (text.includes("?")) {
        score += 5;
        reasons.push("structure:question");
    }

    return { score, reasons };
}
