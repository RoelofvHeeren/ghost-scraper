export type ScoringResult = {
    score: number;
    reasons: string[];
    isQualified: boolean;
};
export interface QualifierProfile {
    include: string[];
    exclude: string[];
    intentKeywords?: string[];
    urgencyKeywords?: string[];
    threshold?: number;
    llmCriteria?: string;
}
export declare function qualifyCandidate(text: string, profile: QualifierProfile): Promise<ScoringResult>;
export declare const SERVICE_PROFILES: Record<string, QualifierProfile>;
