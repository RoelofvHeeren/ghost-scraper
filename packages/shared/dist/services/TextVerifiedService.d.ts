interface Verification {
    id: string;
    number: string;
    state: string;
    sms?: {
        code?: string;
        message?: string;
    };
    totalCost?: number;
}
export declare class TextVerifiedService {
    private baseUrl;
    private apiKey;
    private bearerToken;
    constructor(apiKey: string);
    private get headers();
    /**
     * Rent a new number for Nextdoor verification
     */
    createVerification(): Promise<Verification>;
    private getServices;
    getVerification(id: string): Promise<Verification>;
    cancelVerification(id: string): Promise<void>;
}
export {};
