export declare class GeminiService {
    private model;
    constructor(apiKey?: string);
    evaluateMessage(text: string, criteria: string): Promise<{
        score: number;
        reason: string;
        isQualified: boolean;
    }>;
}
